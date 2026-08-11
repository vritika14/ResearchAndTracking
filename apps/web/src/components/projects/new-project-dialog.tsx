import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { LockKeyhole, Search, UserRound, X } from "lucide-react";

import type { Membership } from "@/api/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PIPELINE_STAGES } from "@/data/pipeline-projects";
import type { ProjectPriority, ProjectRole, ProjectStatus } from "@/data/projects";

const PROJECT_PRIORITIES: ProjectPriority[] = ["Low", "Medium", "High", "Critical"];
const PROJECT_STATUSES: ProjectStatus[] = ["Active", "Review", "Stalled", "Complete"];

export interface NewProjectInput {
  title: string;
  pi: string;
  funder: string;
  collaborators: string;
  myRole: ProjectRole;
  priority: ProjectPriority;
  status: ProjectStatus;
  stageIndex: number;
  scheduledFor: string;
  dueDate: string;
  budgetTotal: number;
  targetJournal: string;
}

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (project: NewProjectInput) => void;
  principalInvestigator: string;
  currentUserId: string;
  members: Membership[];
  membersLoading: boolean;
}

const INITIAL_FORM: NewProjectInput = {
  title: "",
  pi: "",
  funder: "",
  collaborators: "",
  myRole: "Owner",
  priority: "Medium",
  status: "Active",
  stageIndex: 0,
  scheduledFor: "",
  dueDate: "",
  budgetTotal: 0,
  targetJournal: "",
};

function FormField({ label, htmlFor, required, children }: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </label>
      {children}
    </div>
  );
}

export function NewProjectDialog({
  open,
  onOpenChange,
  onCreate,
  principalInvestigator,
  currentUserId,
  members,
  membersLoading,
}: NewProjectDialogProps) {
  const [form, setForm] = useState<NewProjectInput>(INITIAL_FORM);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberPickerOpen, setMemberPickerOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<Membership[]>([]);

  const matchingMembers = useMemo(() => {
    const query = memberSearch.trim().toLowerCase();
    const selectedIds = new Set(selectedMembers.map((member) => member.userId));

    return members
      .filter(
        (member) =>
          member.userId !== currentUserId && !selectedIds.has(member.userId),
      )
      .filter(
        (member) =>
          !query ||
          member.displayName.toLowerCase().includes(query) ||
          member.email.toLowerCase().includes(query),
      )
      .slice(0, 8);
  }, [currentUserId, memberSearch, members, selectedMembers]);

  function resetForm() {
    setForm(INITIAL_FORM);
    setMemberSearch("");
    setMemberPickerOpen(false);
    setSelectedMembers([]);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onCreate({
      ...form,
      title: form.title.trim(),
      pi: principalInvestigator,
      funder: form.funder.trim() || "Not specified",
      collaborators:
        selectedMembers.map((member) => member.displayName).join(", ") ||
        "None listed",
      myRole: "Owner",
      targetJournal: form.targetJournal.trim() || "Not specified",
    });
    resetForm();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create a new project</DialogTitle>
          <DialogDescription>
            Add the core project details now. Progress, notes and task counts start at zero.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Project title" htmlFor="project-title" required>
              <Input
                id="project-title"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="e.g. Genome sequencing validation"
                autoFocus
                required
              />
            </FormField>

            <FormField label="Principal investigator" htmlFor="project-pi" required>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="project-pi"
                  value={principalInvestigator}
                  readOnly
                  required
                  className="bg-muted/60 pl-9 pr-9"
                />
                <LockKeyhole className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </FormField>

            <FormField label="Funder" htmlFor="project-funder">
              <Input
                id="project-funder"
                value={form.funder}
                onChange={(event) => setForm((prev) => ({ ...prev, funder: event.target.value }))}
                placeholder="e.g. NHMRC"
              />
            </FormField>

            <FormField label="My role" htmlFor="project-role">
              <div className="relative">
                <Input
                  id="project-role"
                  value="Owner"
                  readOnly
                  className="bg-muted/60 pr-9"
                />
                <LockKeyhole className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </FormField>

            <div className="sm:col-span-2">
              <FormField label="With whom" htmlFor="project-members">
                <div
                  className="relative"
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                      setMemberPickerOpen(false);
                    }
                  }}
                >
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="project-members"
                    role="combobox"
                    aria-expanded={memberPickerOpen}
                    aria-controls="project-member-options"
                    aria-autocomplete="list"
                    value={memberSearch}
                    onFocus={() => setMemberPickerOpen(true)}
                    onChange={(event) => {
                      setMemberSearch(event.target.value);
                      setMemberPickerOpen(true);
                    }}
                    placeholder="Type a workspace member's name or email"
                    className="pl-9"
                    autoComplete="off"
                  />
                  {memberPickerOpen ? (
                    <div
                      id="project-member-options"
                      role="listbox"
                      className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-lg"
                    >
                      {membersLoading ? (
                        <p className="px-3 py-2 text-sm text-muted-foreground">
                          Loading workspace members…
                        </p>
                      ) : matchingMembers.length ? (
                        matchingMembers.map((member) => (
                          <button
                            key={member.id}
                            type="button"
                            role="option"
                            aria-selected="false"
                            className="flex w-full items-center justify-between gap-3 rounded-sm px-3 py-2 text-left hover:bg-accent focus:bg-accent focus:outline-none"
                            onClick={() => {
                              setSelectedMembers((current) => [
                                ...current,
                                member,
                              ]);
                              setMemberSearch("");
                            }}
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium">
                                {member.displayName}
                              </span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {member.email}
                              </span>
                            </span>
                            <Badge variant="outline" className="shrink-0 capitalize">
                              {member.role.replace("_", " ")}
                            </Badge>
                          </button>
                        ))
                      ) : (
                        <p className="px-3 py-2 text-sm text-muted-foreground">
                          No matching workspace members.
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
                {selectedMembers.length ? (
                  <div className="mt-2 flex flex-wrap gap-2" aria-label="Selected project members">
                    {selectedMembers.map((member) => (
                      <Badge key={member.id} variant="secondary" className="gap-1.5 py-1">
                        {member.displayName}
                        <button
                          type="button"
                          aria-label={`Remove ${member.displayName}`}
                          onClick={() =>
                            setSelectedMembers((current) =>
                              current.filter((item) => item.id !== member.id),
                            )
                          }
                          className="rounded-full hover:text-destructive focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : null}
                <p className="mt-1 text-xs text-muted-foreground">
                  Search active members of the current workspace.
                </p>
              </FormField>
            </div>

            <FormField label="Importance" htmlFor="project-priority">
              <Select
                value={form.priority}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, priority: value as ProjectPriority }))
                }
              >
                <SelectTrigger id="project-priority"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROJECT_PRIORITIES.map((priority) => (
                    <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Status" htmlFor="project-status">
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, status: value as ProjectStatus }))
                }
              >
                <SelectTrigger id="project-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Pipeline stage" htmlFor="project-stage">
              <Select
                value={String(form.stageIndex)}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, stageIndex: Number(value) }))
                }
              >
                <SelectTrigger id="project-stage"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PIPELINE_STAGES.map((stage, index) => (
                    <SelectItem key={stage} value={String(index)}>{stage}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Scheduled for" htmlFor="project-scheduled-for">
              <DatePickerInput
                id="project-scheduled-for"
                label="Scheduled for date"
                value={form.scheduledFor}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, scheduledFor: value }))
                }
              />
            </FormField>

            <FormField label="Due date" htmlFor="project-due-date">
              <DatePickerInput
                id="project-due-date"
                label="Due date"
                value={form.dueDate}
                onChange={(value) => setForm((prev) => ({ ...prev, dueDate: value }))}
              />
            </FormField>

            <FormField label="Total budget" htmlFor="project-budget">
              <Input
                id="project-budget"
                type="number"
                min="0"
                step="100"
                value={form.budgetTotal}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, budgetTotal: Number(event.target.value) }))
                }
              />
            </FormField>

            <div className="sm:col-span-2">
              <FormField label="Target journal or output" htmlFor="project-journal">
                <Input
                  id="project-journal"
                  value={form.targetJournal}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, targetJournal: event.target.value }))
                  }
                  placeholder="e.g. Nature Communications"
                />
              </FormField>
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit">Create Project</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
