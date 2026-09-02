import { useEffect, useState, type FormEvent, type ReactNode } from "react";

import {
  useEnumValues,
  useModulePipelineStages,
  type ApiModule,
  type ApiProject,
  type Membership,
} from "@/api/hooks";
import { ModuleCollaboratorsManager } from "@/components/modules/module-collaborators";
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
  pipelineStage: string;
  pipelineStages: string[];
  tag: string;
  dueDate: string;
  assignedToUserId: string | null;
}

interface ModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  projects: ApiProject[];
  members: Membership[];
  module?: ApiModule | null;
  onSave: (input: ModuleFormInput) => Promise<void> | void;
}

const INITIAL_FORM: ModuleFormInput = {
  title: "",
  description: "",
  projectId: null,
  status: "Active",
  pipelineStage: "",
  pipelineStages: [],
  tag: "",
  dueDate: "",
  assignedToUserId: null,
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
  module,
  onSave,
}: ModuleDialogProps) {
  const tagValuesQuery = useEnumValues("module_type", open);
  const stageValuesQuery = useEnumValues("module_pipeline_stage", open);
  const [form, setForm] = useState<ModuleFormInput>(INITIAL_FORM);
  const [isIndependent, setIsIndependent] = useState(true);
  const [stagesInitialized, setStagesInitialized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const isEditing = Boolean(module);
  const moduleStageValuesQuery = useModulePipelineStages(
    module?.tenantId ?? tenantId,
    module?.id ?? "",
    open && isEditing,
  );

  useEffect(() => {
    if (!open) return;
    setSaveError(null);
    if (module) {
      setForm({
        title: module.title,
        description: module.description ?? "",
        projectId: module.projectId,
        status: module.status ?? "Active",
        pipelineStage: module.pipelineStage ?? "",
        pipelineStages: [],
        tag: module.tag ?? "",
        dueDate: module.dueDate ?? "",
        assignedToUserId: module.assignedToUserId,
      });
      setIsIndependent(module.projectId === null);
    } else {
      setForm(INITIAL_FORM);
      setIsIndependent(true);
      setStagesInitialized(false);
    }
  }, [open, module]);

  useEffect(() => {
    if (!open || module || stagesInitialized || !stageValuesQuery.data?.length) return;
    const stages = [...stageValuesQuery.data]
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((stage) => stage.value);
    setForm((current) => ({
      ...current,
      pipelineStages: stages,
      pipelineStage: current.pipelineStage || stages[0] || "",
    }));
    setStagesInitialized(true);
  }, [open, module, stageValuesQuery.data, stagesInitialized]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isIndependent && !form.projectId) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave({
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        projectId: isIndependent ? null : form.projectId,
        pipelineStage: form.pipelineStage || form.pipelineStages[0] || "",
      });
      onOpenChange(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "The module could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit module" : "Create a new module"}</DialogTitle>
          <DialogDescription>
            Add an independent module or connect it to an existing project.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(event) => void handleSubmit(event)} className="grid gap-5">
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

            <FormField label="Due date" htmlFor="module-due-date">
              <DatePickerInput
                id="module-due-date"
                label="Due date"
                value={form.dueDate}
                onChange={(value) =>
                  setForm((current) => ({ ...current, dueDate: value }))
                }
              />
            </FormField>

            {isEditing ? (
            <FormField label="Pipeline stage" htmlFor="module-pipeline-stage" required>
              <Select
                value={form.pipelineStage}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, pipelineStage: value }))
                }
                required
              >
                <SelectTrigger id="module-pipeline-stage">
                  <SelectValue placeholder="Select a stage" />
                </SelectTrigger>
                <SelectContent>
                  {(moduleStageValuesQuery.data ?? stageValuesQuery.data ?? []).map((stageValue) => (
                    <SelectItem key={stageValue.id} value={stageValue.value}>
                      {stageValue.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            ) : null}

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

          {!isEditing ? (
            <>
              <StageListBuilder
                availableStages={stageValuesQuery.data ?? []}
                selectedStages={form.pipelineStages}
                entityLabel="module"
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
              <FormField label="Starting stage" htmlFor="module-pipeline-stage" required>
                <Select
                  value={form.pipelineStage || form.pipelineStages[0] || ""}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, pipelineStage: value }))
                  }
                  required
                >
                  <SelectTrigger id="module-pipeline-stage">
                    <SelectValue placeholder="Select a stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {form.pipelineStages.map((stage) => (
                      <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </>
          ) : null}

          {isEditing && module && module.tenantId === tenantId ? (
            <div className="flex flex-col gap-2 border-t border-border pt-4">
              <span className="text-sm font-medium">Collaborators</span>
              <ModuleCollaboratorsManager
                tenantId={tenantId}
                moduleId={module.id}
                moduleTitle={module.title}
                members={members}
              />
            </div>
          ) : isEditing && module ? (
            <div className="flex flex-col gap-2 border-t border-border pt-4">
              <span className="text-sm font-medium">Collaborators</span>
              <p className="text-sm text-muted-foreground">
                This module was shared with you from another workspace. Only members of that
                workspace can manage who has access.
              </p>
            </div>
          ) : null}

          {!isEditing ? (
            <p className="rounded-lg border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
              After creating the module, open it to invite collaborators by email using a secure acceptance link.
            </p>
          ) : null}

          {saveError ? (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {saveError}
            </p>
          ) : null}

          <DialogFooter className="border-t pt-4">
            <DialogClose asChild><Button type="button" variant="outline" disabled={isSaving}>Cancel</Button></DialogClose>
            <Button type="submit" disabled={isSaving || (!isEditing && !form.pipelineStages.length)}>
              {isSaving ? "Saving…" : isEditing ? "Save Changes" : "Create Module"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
