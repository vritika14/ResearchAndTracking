import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Search, X } from "lucide-react";

import type { ApiModule, ApiProject, ApiTask, Membership } from "@/api/hooks";
import { TaskMembersManager } from "@/components/tasks/task-members";
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
import { Textarea } from "@/components/ui/textarea";
import { resolveLinkTargetType, type LinkTargetType } from "@/lib/link-target";
import { cn } from "@/lib/utils";

const TASK_STATUSES = ["To do", "Underway", "Waiting", "Complete"] as const;
const TASK_PRIORITIES = ["Low", "Medium", "High", "Critical"] as const;
const VISIBILITY_OPTIONS = ["Private", "Shared"] as const;
const LINK_TARGET_OPTIONS: { value: LinkTargetType; label: string }[] = [
  { value: "project", label: "Project" },
  { value: "module", label: "Module" },
  { value: "none", label: "General" },
];

export interface TaskFormInput {
  title: string;
  description: string;
  linkTarget: LinkTargetType;
  projectId: string;
  moduleId: string;
  status: string;
  priority: string;
  dueDate: string;
  estimatedHours: string;
  visibility: string;
  workingWith: string;
  /** Applied by the caller after creation, since a brand-new task has no id yet. */
  collaboratorUserIds: string[];
}

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  projects: ApiProject[];
  modules: ApiModule[];
  members: Membership[];
  membersLoading: boolean;
  task?: ApiTask | null;
  onSave: (input: TaskFormInput) => void;
}

const INITIAL_FORM: TaskFormInput = {
  title: "",
  description: "",
  linkTarget: "none",
  projectId: "",
  moduleId: "",
  status: "To do",
  priority: "Medium",
  dueDate: "",
  estimatedHours: "",
  visibility: "Private",
  workingWith: "",
  collaboratorUserIds: [],
};

function formFromTask(task: ApiTask): TaskFormInput {
  return {
    title: task.title,
    description: task.description ?? "",
    linkTarget: resolveLinkTargetType(task),
    projectId: task.projectId ?? "",
    moduleId: task.moduleId ?? "",
    status: task.status ?? "To do",
    priority: task.priority ?? "Medium",
    dueDate: task.dueDate ?? "",
    estimatedHours: task.estimatedHours ?? "",
    visibility: task.visibility ?? "Private",
    workingWith: task.workingWith ?? "",
    collaboratorUserIds: [],
  };
}

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

function linkTargetPillClass(selected: boolean) {
  return cn(
    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
    selected
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground",
  );
}

export function TaskDialog({
  open,
  onOpenChange,
  tenantId,
  projects,
  modules,
  members,
  membersLoading,
  task,
  onSave,
}: TaskDialogProps) {
  const [form, setForm] = useState<TaskFormInput>(INITIAL_FORM);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberPickerOpen, setMemberPickerOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<Membership[]>([]);
  const isEditing = Boolean(task);

  useEffect(() => {
    if (!open) return;
    setForm(task ? formFromTask(task) : INITIAL_FORM);
    setMemberSearch("");
    setMemberPickerOpen(false);
    setSelectedMembers([]);
  }, [open, task]);

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

  function setLinkTarget(linkTarget: LinkTargetType) {
    setForm((prev) => ({
      ...prev,
      linkTarget,
      projectId: linkTarget === "project" ? prev.projectId : "",
      moduleId: linkTarget === "module" ? prev.moduleId : "",
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.linkTarget === "project" && !form.projectId) return;
    if (form.linkTarget === "module" && !form.moduleId) return;
    onSave({
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      workingWith: form.visibility === "Shared" ? form.workingWith.trim() : "",
      collaboratorUserIds: selectedMembers.map((member) => member.userId),
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit task" : "Create a new task"}</DialogTitle>
          <DialogDescription>
            Link this task to a project or module, or keep it general, then set its priority and
            visibility.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-5">
          <FormField label="Task title" htmlFor="task-title" required>
            <Input
              id="task-title"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="What needs to be done?"
              autoFocus
              required
            />
          </FormField>

          <FormField label="Description" htmlFor="task-description">
            <Textarea
              id="task-description"
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="Add a short description of the work"
              rows={3}
            />
          </FormField>

          <FormField label="Link to" htmlFor="task-link-target">
            <div className="flex flex-wrap gap-2" id="task-link-target">
              {LINK_TARGET_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setLinkTarget(option.value)}
                  aria-pressed={form.linkTarget === option.value}
                  className={linkTargetPillClass(form.linkTarget === option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </FormField>

          {form.linkTarget === "project" ? (
            <FormField label="Project" htmlFor="task-project" required>
              <Select
                value={form.projectId}
                onValueChange={(value) => setForm((prev) => ({ ...prev, projectId: value }))}
                required
              >
                <SelectTrigger id="task-project"><SelectValue placeholder="Select a project" /></SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>{project.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          ) : null}

          {form.linkTarget === "module" ? (
            <FormField label="Module" htmlFor="task-module" required>
              <Select
                value={form.moduleId}
                onValueChange={(value) => setForm((prev) => ({ ...prev, moduleId: value }))}
                required
              >
                <SelectTrigger id="task-module"><SelectValue placeholder="Select a module" /></SelectTrigger>
                <SelectContent>
                  {modules.map((module) => (
                    <SelectItem key={module.id} value={module.id}>{module.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Status" htmlFor="task-status">
              <Select
                value={form.status}
                onValueChange={(value) => setForm((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger id="task-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Priority" htmlFor="task-priority">
              <Select
                value={form.priority}
                onValueChange={(value) => setForm((prev) => ({ ...prev, priority: value }))}
              >
                <SelectTrigger id="task-priority"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((priority) => (
                    <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Due date" htmlFor="task-due-date">
              <DatePickerInput
                id="task-due-date"
                label="Due date"
                value={form.dueDate}
                onChange={(value) => setForm((prev) => ({ ...prev, dueDate: value }))}
              />
            </FormField>

            <FormField label="Estimated hours" htmlFor="task-hours">
              <Input
                id="task-hours"
                type="number"
                min="0"
                step="0.5"
                value={form.estimatedHours}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, estimatedHours: event.target.value }))
                }
              />
            </FormField>

            <FormField label="Visibility" htmlFor="task-visibility">
              <Select
                value={form.visibility}
                onValueChange={(value) => setForm((prev) => ({ ...prev, visibility: value }))}
              >
                <SelectTrigger id="task-visibility"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VISIBILITY_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            {form.visibility === "Shared" ? (
              <FormField label="Working with" htmlFor="task-working-with">
                <Input
                  id="task-working-with"
                  value={form.workingWith}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, workingWith: event.target.value }))
                  }
                  placeholder="Person, team or external dependency"
                />
              </FormField>
            ) : null}
          </div>

          {form.visibility === "Shared" && isEditing && task ? (
            <div className="flex flex-col gap-2 border-t border-border pt-4">
              <span className="text-sm font-medium">Members</span>
              <TaskMembersManager
                tenantId={tenantId}
                taskId={task.id}
                members={members}
                membersLoading={membersLoading}
              />
            </div>
          ) : null}

          {form.visibility === "Shared" && !isEditing ? (
            <FormField label="Share with" htmlFor="task-members">
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
                  id="task-members"
                  role="combobox"
                  aria-expanded={memberPickerOpen}
                  aria-controls="task-new-member-options"
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
                    id="task-new-member-options"
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
                <div className="mt-2 flex flex-wrap gap-2" aria-label="Selected task members">
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
            </FormField>
          ) : null}

          <DialogFooter className="border-t pt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit">{isEditing ? "Save Changes" : "Create Task"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
