import { useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";

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
import type { PipelineStageInfo } from "@/data/pipeline-rows";

interface ManageStagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stages: readonly PipelineStageInfo[];
  visibleStages: ReadonlySet<string>;
  onToggleVisibility: (stageName: string) => void;
  onAdd: (name: string, description: string) => void;
  onDelete: (index: number) => void;
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
  const [description, setDescription] = useState("");
  const normalizedName = name.trim();
  const isDuplicate = stages.some(
    (stage) => stage.name.toLowerCase() === normalizedName.toLowerCase(),
  );

  function addStage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!normalizedName || isDuplicate) return;
    onAdd(normalizedName, description.trim() || "Custom research workflow stage.");
    setName("");
    setDescription("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage pipeline stages</DialogTitle>
          <DialogDescription>
            Show or hide stages in this view, add custom stages, or remove stages you no longer need.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          {stages.map((stage, index) => {
            const isVisible = visibleStages.has(stage.name);
            const isLastVisible = isVisible && visibleStages.size === 1;
            return (
              <div key={stage.name} className="flex items-start gap-3 rounded-lg border p-3">
                <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isVisible}
                    disabled={isLastVisible}
                    onChange={() => onToggleVisibility(stage.name)}
                    className="mt-1 h-4 w-4 shrink-0 accent-primary"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{stage.name}</span>
                    <span className="block text-xs text-muted-foreground">{stage.description}</span>
                  </span>
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={stages.length === 1}
                  className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Delete ${stage.name}`}
                  onClick={() => onDelete(index)}
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
          <Input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            aria-label="New stage description"
            placeholder="Short description (optional)"
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
