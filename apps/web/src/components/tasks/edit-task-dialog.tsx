import { useState, type FormEvent, type ReactNode } from "react";

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
import type { TaskItem, TaskPriority, TaskStatus } from "@/data/tasks";

const TASK_STATUSES: TaskStatus[] = ["To do", "Underway", "Waiting", "Complete"];
const TASK_PRIORITIES: TaskPriority[] = ["Low", "Medium", "High", "Critical"];

interface ProjectOption {
  id: string;
  title: string;
}

export interface EditTaskInput {
  title: string;
  projectId: string;
  status: TaskStatus;
  priority: TaskPriority;
  scheduledFor: string;
  dueDate: string;
  estimatedHours: number;
  waitingOn?: string;
}

interface EditTaskDialogProps {
  open: boolean;
  task: TaskItem;
  projects: ProjectOption[];
  onOpenChange: (open: boolean) => void;
  onSave: (task: EditTaskInput) => void;
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

export function EditTaskDialog({
  open,
  task,
  projects,
  onOpenChange,
  onSave,
}: EditTaskDialogProps) {
  const [form, setForm] = useState<EditTaskInput>(() => ({
    title: task.title,
    projectId: projects.find((project) => project.title === task.projectName)?.id ?? "",
    status: task.status,
    priority: task.priority,
    scheduledFor: task.scheduledFor,
    dueDate: task.dueDate,
    estimatedHours: task.estimatedHours,
    waitingOn: task.waitingOn ?? "",
  }));

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave({
      ...form,
      title: form.title.trim(),
      waitingOn: form.status === "Waiting" ? form.waitingOn?.trim() || undefined : undefined,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
          <DialogDescription>
            Update the task details, schedule and current progress.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-5">
          <FormField label="Task title" htmlFor="edit-task-title" required>
            <Input
              id="edit-task-title"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              required
              autoFocus
            />
          </FormField>

          <FormField label="Project" htmlFor="edit-task-project" required>
            <Select
              value={form.projectId}
              onValueChange={(value) => setForm((current) => ({ ...current, projectId: value }))}
              required
            >
              <SelectTrigger id="edit-task-project">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>{project.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Status" htmlFor="edit-task-status">
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, status: value as TaskStatus }))
                }
              >
                <SelectTrigger id="edit-task-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Priority" htmlFor="edit-task-priority">
              <Select
                value={form.priority}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, priority: value as TaskPriority }))
                }
              >
                <SelectTrigger id="edit-task-priority"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((priority) => (
                    <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Scheduled for" htmlFor="edit-task-scheduled-for">
              <DatePickerInput
                id="edit-task-scheduled-for"
                label="Scheduled for date"
                value={form.scheduledFor}
                onChange={(value) => setForm((current) => ({ ...current, scheduledFor: value }))}
              />
            </FormField>

            <FormField label="Due date" htmlFor="edit-task-due-date">
              <DatePickerInput
                id="edit-task-due-date"
                label="Due date"
                value={form.dueDate}
                onChange={(value) => setForm((current) => ({ ...current, dueDate: value }))}
              />
            </FormField>

            <FormField label="Estimated hours" htmlFor="edit-task-hours" required>
              <Input
                id="edit-task-hours"
                type="number"
                min="0.5"
                step="0.5"
                value={form.estimatedHours}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    estimatedHours: Number(event.target.value),
                  }))
                }
                required
              />
            </FormField>
          </div>

          {form.status === "Waiting" ? (
            <FormField label="Waiting on" htmlFor="edit-task-waiting-on">
              <Input
                id="edit-task-waiting-on"
                value={form.waitingOn ?? ""}
                onChange={(event) =>
                  setForm((current) => ({ ...current, waitingOn: event.target.value }))
                }
              />
            </FormField>
          ) : null}

          <DialogFooter className="border-t pt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
