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
import { PIPELINE_STAGES } from "@/data/pipeline-projects";
import type { ProjectPriority, ProjectRole, ProjectStatus } from "@/data/projects";

const PROJECT_ROLES: ProjectRole[] = ["Owner", "Lead", "Collaborator", "Supervisor"];
const PROJECT_PRIORITIES: ProjectPriority[] = ["Medium", "High", "Critical"];
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
  dueDate: string;
  budgetTotal: number;
  targetJournal: string;
}

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (project: NewProjectInput) => void;
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

export function NewProjectDialog({ open, onOpenChange, onCreate }: NewProjectDialogProps) {
  const [form, setForm] = useState<NewProjectInput>(INITIAL_FORM);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setForm(INITIAL_FORM);
    onOpenChange(nextOpen);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onCreate({
      ...form,
      title: form.title.trim(),
      pi: form.pi.trim(),
      funder: form.funder.trim() || "Not specified",
      collaborators: form.collaborators.trim() || "None listed",
      targetJournal: form.targetJournal.trim() || "Not specified",
    });
    setForm(INITIAL_FORM);
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
              <Input
                id="project-pi"
                value={form.pi}
                onChange={(event) => setForm((prev) => ({ ...prev, pi: event.target.value }))}
                placeholder="e.g. Dr. Maria Chen"
                required
              />
            </FormField>

            <FormField label="Funder" htmlFor="project-funder">
              <Input
                id="project-funder"
                value={form.funder}
                onChange={(event) => setForm((prev) => ({ ...prev, funder: event.target.value }))}
                placeholder="e.g. NHMRC"
              />
            </FormField>

            <FormField label="Collaborators" htmlFor="project-collaborators">
              <Input
                id="project-collaborators"
                value={form.collaborators}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, collaborators: event.target.value }))
                }
                placeholder="Names separated by commas"
              />
            </FormField>

            <FormField label="My role" htmlFor="project-role">
              <Select
                value={form.myRole}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, myRole: value as ProjectRole }))
                }
              >
                <SelectTrigger id="project-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROJECT_ROLES.map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>

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

            <FormField label="Due date" htmlFor="project-due-date" required>
              <Input
                id="project-due-date"
                type="date"
                value={form.dueDate}
                onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                required
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
