import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Search, X } from "lucide-react";

import { useEnumValues, type ApiModule, type ApiProject, type Membership } from "@/api/hooks";
import { ModuleCollaboratorsManager } from "@/components/modules/module-collaborators";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";

const MODULE_STATUSES = ["Active", "Review", "Stalled", "Complete"] as const;
const UNASSIGNED = "__unassigned__";

export interface ModuleFormInput {
  title: string;
  description: string;
  projectId: string | null;
  status: string;
  tag: string;
  assignedToUserId: string | null;
  /** Applied by the caller after creation, since a brand-new module has no id yet. */
  collaboratorUserIds: string[];
}

interface ModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  projects: ApiProject[];
  members: Membership[];
  membersLoading: boolean;
  module?: ApiModule | null;
  onSave: (input: ModuleFormInput) => void;
}

const INITIAL_FORM: ModuleFormInput = {
  title: "",
  description: "",
  projectId: null,
  status: "Active",
  tag: "",
  assignedToUserId: null,
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

export function ModuleDialog({
  open,
  onOpenChange,
  tenantId,
  projects,
  members,
  membersLoading,
  module,
  onSave,
}: ModuleDialogProps) {
  const tagValuesQuery = useEnumValues("module_type", open);
  const [form, setForm] = useState<ModuleFormInput>(INITIAL_FORM);
  const [isIndependent, setIsIndependent] = useState(true);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberPickerOpen, setMemberPickerOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<Membership[]>([]);
  const isEditing = Boolean(module);

  useEffect(() => {
    if (!open) return;
    if (module) {
      setForm({
        title: module.title,
        description: module.description ?? "",
        projectId: module.projectId,
        status: module.status ?? "Active",
        tag: module.tag ?? "",
        assignedToUserId: module.assignedToUserId,
        collaboratorUserIds: [],
      });
      setIsIndependent(module.projectId === null);
    } else {
      setForm(INITIAL_FORM);
      setIsIndependent(true);
    }
    setMemberSearch("");
    setMemberPickerOpen(false);
    setSelectedMembers([]);
  }, [open, module]);

  const matchingMembers = useMemo(() => {
    const query = memberSearch.trim().toLowerCase();
    const selectedIds = new Set(selectedMembers.map((member) => member.userId));

    return members
      .filter((member) => !selectedIds.has(member.userId))
      .filter(
        (member) =>
          !query ||
          member.displayName.toLowerCase().includes(query) ||
          member.email.toLowerCase().includes(query),
      )
      .slice(0, 8);
  }, [memberSearch, members, selectedMembers]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isIndependent && !form.projectId) return;
    onSave({
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      projectId: isIndependent ? null : form.projectId,
      collaboratorUserIds: selectedMembers.map((member) => member.userId),
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit module" : "Create a new module"}</DialogTitle>
          <DialogDescription>
            Add an independent module or connect it to an existing project.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-5">
          <FormField label="Module title" htmlFor="module-title" required>
            <Input
              id="module-title"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="What area of work does this module cover?"
              autoFocus
              required
            />
          </FormField>

          <FormField label="Description" htmlFor="module-description">
            <Textarea
              id="module-description"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="Add an optional description"
              rows={3}
            />
          </FormField>

          <label className="flex items-start gap-3 rounded-md border border-border bg-muted/30 p-3">
            <input
              type="checkbox"
              checked={isIndependent}
              onChange={(event) => {
                setIsIndependent(event.target.checked);
                if (event.target.checked) {
                  setForm((current) => ({ ...current, projectId: null }));
                }
              }}
              className="mt-0.5 h-4 w-4 accent-primary"
            />
            <span>
              <span className="block text-sm font-medium">Independent module</span>
              <span className="block text-xs text-muted-foreground">
                Only explicitly added collaborators can see an independent module. Project-linked
                modules are visible to anyone who can see the project.
              </span>
            </span>
          </label>

          {!isIndependent ? (
            <FormField label="Project" htmlFor="module-project" required>
              <Select
                value={form.projectId ?? ""}
                onValueChange={(value) => setForm((current) => ({ ...current, projectId: value }))}
                required
              >
                <SelectTrigger id="module-project"><SelectValue placeholder="Select a project" /></SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>{project.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Status" htmlFor="module-status">
              <Select
                value={form.status}
                onValueChange={(value) => setForm((current) => ({ ...current, status: value }))}
              >
                <SelectTrigger id="module-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MODULE_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Type" htmlFor="module-tag">
              <Select
                value={form.tag}
                onValueChange={(value) => setForm((current) => ({ ...current, tag: value }))}
              >
                <SelectTrigger id="module-tag"><SelectValue placeholder="Select a type" /></SelectTrigger>
                <SelectContent>
                  {(tagValuesQuery.data ?? []).map((tagValue) => (
                    <SelectItem key={tagValue.id} value={tagValue.value}>{tagValue.value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Assigned to" htmlFor="module-assignee">
              <Select
                value={form.assignedToUserId ?? UNASSIGNED}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    assignedToUserId: value === UNASSIGNED ? null : value,
                  }))
                }
              >
                <SelectTrigger id="module-assignee"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.userId} value={member.userId}>
                      {member.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          {isIndependent && isEditing && module ? (
            <div className="flex flex-col gap-2 border-t border-border pt-4">
              <span className="text-sm font-medium">Collaborators</span>
              <ModuleCollaboratorsManager
                tenantId={tenantId}
                moduleId={module.id}
                members={members}
                membersLoading={membersLoading}
              />
            </div>
          ) : null}

          {isIndependent && !isEditing ? (
            <FormField label="Collaborators" htmlFor="module-members">
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
                  id="module-members"
                  role="combobox"
                  aria-expanded={memberPickerOpen}
                  aria-controls="module-member-options"
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
                    id="module-member-options"
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
                            setSelectedMembers((current) => [...current, member]);
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
                <div className="mt-2 flex flex-wrap gap-2" aria-label="Selected module members">
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
                You're automatically added as a collaborator once this module is created.
              </p>
            </FormField>
          ) : null}

          <DialogFooter className="border-t pt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit">{isEditing ? "Save Changes" : "Create Module"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
