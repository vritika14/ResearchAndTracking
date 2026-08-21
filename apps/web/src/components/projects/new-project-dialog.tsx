import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Search, X } from "lucide-react";

import type { ApiPipelineStage, Membership } from "@/api/hooks";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PROJECT_PRIORITIES = ["Low", "Medium", "High", "Critical"] as const;
const PROJECT_STATUSES = ["Active", "Review", "Stalled", "Complete"] as const;

export interface NewProjectInput {
  title: string;
  description: string;
  researchArea: string;
  status: string;
  priority: string;
  pipelineStage: string;
  scheduledFor: string;
  dueDate: string;
  totalBudget: string;
  targetJournals: string;
  collaboratorUserIds: string[];
}

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (project: NewProjectInput) => void;
  currentUserId: string;
  members: Membership[];
  membersLoading: boolean;
  pipelineStages: ApiPipelineStage[];
}

const INITIAL_FORM: NewProjectInput = {
  title: "",
  description: "",
  researchArea: "",
  status: "Active",
  priority: "Medium",
  pipelineStage: "",
  scheduledFor: "",
  dueDate: "",
  totalBudget: "",
  targetJournals: "",
  collaboratorUserIds: [],
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
  currentUserId,
  members,
  membersLoading,
  pipelineStages,
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
      description: form.description.trim(),
      researchArea: form.researchArea.trim(),
      targetJournals: form.targetJournals.trim(),
      collaboratorUserIds: selectedMembers.map((member) => member.userId),
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
            Add the core project details now. You'll automatically be the owner.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
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
            </div>

            <div className="sm:col-span-2">
              <FormField label="Description" htmlFor="project-description">
                <Textarea
                  id="project-description"
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                  placeholder="Add a short description of the project"
                  rows={3}
                />
              </FormField>
            </div>

            <FormField label="Research area" htmlFor="project-research-area">
              <Input
                id="project-research-area"
                value={form.researchArea}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, researchArea: event.target.value }))
                }
                placeholder="e.g. Structural biology"
              />
            </FormField>

            <div className="sm:col-span-2">
              <FormField label="Collaborators" htmlFor="project-members">
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
                  Added as collaborators once the project is created. You're automatically the owner.
                </p>
              </FormField>
            </div>

            <FormField label="Importance" htmlFor="project-priority">
              <Select
                value={form.priority}
                onValueChange={(value) => setForm((prev) => ({ ...prev, priority: value }))}
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
                onValueChange={(value) => setForm((prev) => ({ ...prev, status: value }))}
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
                value={form.pipelineStage}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, pipelineStage: value }))
                }
              >
                <SelectTrigger id="project-stage"><SelectValue placeholder="Select a stage" /></SelectTrigger>
                <SelectContent>
                  {pipelineStages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.value}>{stage.value}</SelectItem>
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
                value={form.totalBudget}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, totalBudget: event.target.value }))
                }
              />
            </FormField>

            <div className="sm:col-span-2">
              <FormField label="Target journal(s) or output" htmlFor="project-journal">
                <Input
                  id="project-journal"
                  value={form.targetJournals}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, targetJournals: event.target.value }))
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
