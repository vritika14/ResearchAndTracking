import { useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";

import type { ApiPipelineStage } from "@/api/hooks";
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

interface ManageStagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stages: readonly ApiPipelineStage[];
  visibleStages: ReadonlySet<string>;
  onToggleVisibility: (stageValue: string) => void;
  onAdd: (value: string) => void;
  onDelete: (stage: ApiPipelineStage) => void;
}

export function ManageStagesDialog({
  open,
  onOpenChange,
  stages,
  visibleStages,
  onToggleVisibility,
  onAdd,
  onDelete,
}: ManageStagesDialogProps) {
  const [name, setName] = useState("");
  const normalizedName = name.trim();
  const isDuplicate = stages.some(
    (stage) => stage.value.toLowerCase() === normalizedName.toLowerCase(),
  );

  function addStage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!normalizedName || isDuplicate) return;
    onAdd(normalizedName);
    setName("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage pipeline stages</DialogTitle>
          <DialogDescription>
            Show or hide stages in this view, or add and remove your workspace's custom stages.
            Default stages shared across all workspaces can't be edited or removed.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          {stages.map((stage) => {
            const isVisible = visibleStages.has(stage.value);
            const isLastVisible = isVisible && visibleStages.size === 1;
            const isCustom = stage.tenantId !== null || Boolean(stage.projectId) || Boolean(stage.moduleId);
            return (
              <div key={stage.id} className="flex items-start gap-3 rounded-lg border p-3">
                <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isVisible}
                    disabled={isLastVisible}
                    onChange={() => onToggleVisibility(stage.value)}
                    className="mt-1 h-4 w-4 shrink-0 accent-primary"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{stage.value}</span>
                    {!isCustom ? (
                      <span className="block text-xs text-muted-foreground">Default stage</span>
                    ) : null}
                  </span>
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={!isCustom}
                  className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive disabled:text-muted-foreground"
                  aria-label={`Delete ${stage.value}`}
                  onClick={() => onDelete(stage)}
                >
                  <Trash2 />
                </Button>
              </div>
            );
          })}
        </div>

        <form onSubmit={addStage} className="grid gap-3 rounded-lg border border-dashed p-4">
          <span className="text-sm font-semibold">Add a new stage</span>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-label="New stage name"
            placeholder="Stage name"
            required
          />
          {isDuplicate ? <p className="text-xs text-destructive">That stage already exists.</p> : null}
          <Button type="submit" variant="outline" disabled={!normalizedName || isDuplicate}>
            <Plus />
            Add Stage
          </Button>
        </form>

        <DialogFooter>
          <DialogClose asChild><Button type="button">Done</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
