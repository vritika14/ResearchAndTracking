import { useEffect, useState, type FormEvent, type ReactNode } from "react";

import { type ApiPipelineStage } from "@/api/hooks";
import { StageListBuilder } from "@/components/pipeline/stage-list-builder";
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
  pipelineStages: string[];
  scheduledFor: string;
  dueDate: string;
  totalBudget: string;
  targetJournals: string;
}

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (project: NewProjectInput) => void;
  pipelineStages: ApiPipelineStage[];
}

const INITIAL_FORM: NewProjectInput = {
  title: "",
  description: "",
  researchArea: "",
  status: "Active",
  priority: "Medium",
  pipelineStage: "",
  pipelineStages: [],
  scheduledFor: "",
  dueDate: "",
  totalBudget: "",
  targetJournals: "",
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
  pipelineStages,
}: NewProjectDialogProps) {
  const [form, setForm] = useState<NewProjectInput>(INITIAL_FORM);
  const [stagesInitialized, setStagesInitialized] = useState(false);

  useEffect(() => {
    if (!open || stagesInitialized || !pipelineStages.length) return;
    const stages = [...pipelineStages]
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((stage) => stage.value);
    setForm((current) => ({
      ...current,
      pipelineStages: stages,
      pipelineStage: current.pipelineStage || stages[0] || "",
    }));
    setStagesInitialized(true);
  }, [open, pipelineStages, stagesInitialized]);

  function resetForm() {
    setForm(INITIAL_FORM);
    setStagesInitialized(false);
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
      pipelineStage: form.pipelineStage || form.pipelineStages[0] || "",
    });
    resetForm();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl">
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

            <div className="sm:col-span-2">
              <StageListBuilder
                availableStages={pipelineStages}
                selectedStages={form.pipelineStages}
                entityLabel="project"
                onChange={(stages) =>
                  setForm((current) => ({
                    ...current,
                    pipelineStages: stages,
                    pipelineStage: stages.includes(current.pipelineStage)
                      ? current.pipelineStage
                      : stages[0] ?? "",
                  }))
                }
              />
            </div>

            <FormField label="Starting stage" htmlFor="project-stage" required>
              <Select
                value={form.pipelineStage || form.pipelineStages[0] || ""}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, pipelineStage: value }))
                }
              >
                <SelectTrigger id="project-stage"><SelectValue placeholder="Select a stage" /></SelectTrigger>
                <SelectContent>
                  {form.pipelineStages.map((stage) => (
                    <SelectItem key={stage} value={stage}>{stage}</SelectItem>
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

          <p className="rounded-lg border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
            After creating the project, open it to invite collaborators by email using a secure acceptance link.
          </p>

          <DialogFooter className="border-t pt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" disabled={!form.pipelineStages.length}>Create Project</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
