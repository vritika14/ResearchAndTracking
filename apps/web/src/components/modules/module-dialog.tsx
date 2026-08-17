import { useEffect, useState, type FormEvent, type ReactNode } from "react";

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
import type { ModuleImportance, ModuleStatus, ResearchModule } from "@/data/modules";
import { usePipelineStages } from "@/hooks/use-pipeline-stages";

export type ModuleInput = Omit<ResearchModule, "id">;

interface ProjectOption {
  id: string;
  title: string;
}

interface ModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: ProjectOption[];
  module?: ResearchModule | null;
  onSave: (module: ModuleInput) => void;
}

const MODULE_STATUSES: ModuleStatus[] = ["Active", "Review", "Stalled", "Complete", "Archived"];
const MODULE_IMPORTANCE: ModuleImportance[] = ["Critical", "High", "Medium", "Low"];
const INITIAL_FORM: ModuleInput = {
  title: "",
  description: "",
  projectId: null,
  status: "Active",
  stageIndex: 0,
  dueDate: "",
  importance: "Medium",
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

export function ModuleDialog({ open, onOpenChange, projects, module, onSave }: ModuleDialogProps) {
  const { pipelineStages } = usePipelineStages();
  const [form, setForm] = useState<ModuleInput>(INITIAL_FORM);
  const [isIndependent, setIsIndependent] = useState(true);
  const isEditing = Boolean(module);

  useEffect(() => {
    if (!open) return;
    if (module) {
      setForm({
        title: module.title,
        description: module.description,
        projectId: module.projectId,
        status: module.status,
        stageIndex: module.stageIndex,
        dueDate: module.dueDate,
        importance: module.importance,
      });
      setIsIndependent(module.projectId === null);
    } else {
      setForm(INITIAL_FORM);
      setIsIndependent(true);
    }
  }, [open, module]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isIndependent && !form.projectId) return;
    onSave({
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      projectId: isIndependent ? null : form.projectId,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
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
                Create this module without linking it to a project.
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
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, status: value as ModuleStatus }))
                }
              >
                <SelectTrigger id="module-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MODULE_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Importance" htmlFor="module-importance">
              <Select
                value={form.importance}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, importance: value as ModuleImportance }))
                }
              >
                <SelectTrigger id="module-importance"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MODULE_IMPORTANCE.map((importance) => (
                    <SelectItem key={importance} value={importance}>{importance}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Pipeline stage" htmlFor="module-stage">
              <Select
                value={String(form.stageIndex)}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, stageIndex: Number(value) }))
                }
              >
                <SelectTrigger id="module-stage"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {pipelineStages.map((stage, index) => (
                    <SelectItem key={stage.name} value={String(index)}>{stage.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Due date" htmlFor="module-due-date">
              <DatePickerInput
                id="module-due-date"
                label="Module due date"
                value={form.dueDate}
                onChange={(value) => setForm((current) => ({ ...current, dueDate: value }))}
              />
            </FormField>
          </div>

          <DialogFooter className="border-t pt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit">{isEditing ? "Save Changes" : "Create Module"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
