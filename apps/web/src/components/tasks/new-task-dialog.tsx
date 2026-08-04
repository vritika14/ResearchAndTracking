import { useState, type FormEvent, type ReactNode } from "react";

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
import type { TaskPriority, TaskStatus } from "@/data/tasks";

const TASK_STATUSES: TaskStatus[] = ["To do", "Underway", "Waiting", "Complete"];
const TASK_PRIORITIES: TaskPriority[] = ["Low", "Medium", "High", "Critical"];

export interface NewTaskInput {
  title: string;
  projectId: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  estimatedHours: number;
  waitingOn?: string;
}

interface ProjectOption {
  id: string;
  title: string;
}

interface NewTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: ProjectOption[];
  onCreate: (task: NewTaskInput) => void;
}

const INITIAL_FORM: NewTaskInput = {
  title: "",
  projectId: "",
  status: "To do",
  priority: "Medium",
  dueDate: "",
  estimatedHours: 1,
  waitingOn: "",
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

export function NewTaskDialog({ open, onOpenChange, projects, onCreate }: NewTaskDialogProps) {
  const [form, setForm] = useState<NewTaskInput>(INITIAL_FORM);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setForm(INITIAL_FORM);
    onOpenChange(nextOpen);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onCreate({
      ...form,
      title: form.title.trim(),
      waitingOn: form.status === "Waiting" ? form.waitingOn?.trim() || undefined : undefined,
    });
    setForm(INITIAL_FORM);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new task</DialogTitle>
          <DialogDescription>
            Add a task to a project and set its current priority and due date.
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

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Status" htmlFor="task-status">
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, status: value as TaskStatus }))
                }
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
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, priority: value as TaskPriority }))
                }
              >
                <SelectTrigger id="task-priority"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((priority) => (
                    <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Due date" htmlFor="task-due-date" required>
              <Input
                id="task-due-date"
                type="date"
                value={form.dueDate}
                onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                required
              />
            </FormField>

            <FormField label="Estimated hours" htmlFor="task-hours" required>
              <Input
                id="task-hours"
                type="number"
                min="0.5"
                step="0.5"
                value={form.estimatedHours}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, estimatedHours: Number(event.target.value) }))
                }
                required
              />
            </FormField>
          </div>

          {form.status === "Waiting" ? (
            <FormField label="Waiting on" htmlFor="task-waiting-on">
              <Input
                id="task-waiting-on"
                value={form.waitingOn ?? ""}
                onChange={(event) => setForm((prev) => ({ ...prev, waitingOn: event.target.value }))}
                placeholder="Person, team or external dependency"
              />
            </FormField>
          ) : null}

          <DialogFooter className="border-t pt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit">Create Task</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
