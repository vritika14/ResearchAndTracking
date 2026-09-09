import { ChevronDown, ChevronUp, GripVertical, RotateCcw, Workflow } from "lucide-react";
import { useMemo, useState, type DragEvent } from "react";

import {
  useModulePipelineStagePool,
  useReorderModulePipelineStages,
  useResetModulePipelineStages,
  useUpdateModulePipelineStage,
  type ApiPipelineStage,
} from "@/api/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { cn } from "@/lib/utils";

export function PaperStageSettings({ tenantId }: { tenantId: string }) {
  const stagesQuery = useModulePipelineStagePool(tenantId);
  const updateVisibility = useUpdateModulePipelineStage(tenantId);
  const reorderStages = useReorderModulePipelineStages(tenantId);
  const resetStages = useResetModulePipelineStages(tenantId);
  const [draggedValue, setDraggedValue] = useState<string | null>(null);
  const [dragOverValue, setDragOverValue] = useState<string | null>(null);

  const stages = useMemo(
    () => [...(stagesQuery.data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [stagesQuery.data],
  );
  const visibleCount = stages.filter((stage) => !stage.hidden).length;

  function reorderTo(order: string[]) {
    reorderStages.mutate(order);
  }

  function moveStage(stage: ApiPipelineStage, direction: "up" | "down") {
    const index = stages.findIndex((item) => item.value === stage.value);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (index === -1 || targetIndex < 0 || targetIndex >= stages.length) return;
    const order = stages.map((item) => item.value);
    [order[index], order[targetIndex]] = [order[targetIndex]!, order[index]!];
    reorderTo(order);
  }

  function toggleHidden(stage: ApiPipelineStage) {
    if (!stage.hidden && visibleCount <= 1) return;
    updateVisibility.mutate({ value: stage.value, hidden: !stage.hidden });
  }

  function handleDragStart(event: DragEvent<HTMLDivElement>, value: string) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", value);
    setDraggedValue(value);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>, value: string) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (value !== draggedValue) setDragOverValue(value);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>, value: string) {
    event.preventDefault();
    const sourceValue = draggedValue ?? event.dataTransfer.getData("text/plain");
    if (sourceValue && sourceValue !== value) {
      const order = stages.map((item) => item.value);
      const from = order.indexOf(sourceValue);
      const to = order.indexOf(value);
      if (from !== -1 && to !== -1) {
        order.splice(from, 1);
        order.splice(to, 0, sourceValue);
        reorderTo(order);
      }
    }
    setDraggedValue(null);
    setDragOverValue(null);
  }

  function handleDragEnd() {
    setDraggedValue(null);
    setDragOverValue(null);
  }

  return (
    <Card id="paper-pipeline-stages">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Workflow className="h-5 w-5 text-primary" />
          Paper pipeline stages
        </CardTitle>
        <CardDescription>
          Reorder or hide any of the 15 workspace stages. Stage names are fixed and shared by
          everyone in this workspace.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {stagesQuery.isPending ? (
          <LoadingState title="Loading pipeline stages" className="min-h-32" />
        ) : stagesQuery.isError ? (
          <ErrorState
            title="Pipeline stages could not be loaded"
            description={stagesQuery.error.message}
            onRetry={() => void stagesQuery.refetch()}
          />
        ) : (
          <>
            <div className="grid gap-2">
              {stages.map((stage, index) => (
                <div
                  key={stage.id}
                  draggable
                  onDragStart={(event) => handleDragStart(event, stage.value)}
                  onDragOver={(event) => handleDragOver(event, stage.value)}
                  onDrop={(event) => handleDrop(event, stage.value)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "flex cursor-grab items-center gap-3 rounded-lg border border-border bg-muted/20 p-3 transition-colors active:cursor-grabbing",
                    draggedValue === stage.value && "opacity-45",
                    dragOverValue === stage.value && "border-primary bg-primary/5 ring-2 ring-primary/30",
                  )}
                >
                  <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={!stage.hidden}
                      onChange={() => toggleHidden(stage)}
                      disabled={!stage.hidden && visibleCount <= 1}
                      aria-label={`Show ${stage.value} on the pipeline board`}
                      className="h-4 w-4 shrink-0 accent-primary"
                    />
                    <span className="truncate text-sm font-medium">{stage.value}</span>
                  </label>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={index === 0}
                      aria-label={`Move ${stage.value} up`}
                      onClick={() => moveStage(stage, "up")}
                    >
                      <ChevronUp />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={index === stages.length - 1}
                      aria-label={`Move ${stage.value} down`}
                      onClick={() => moveStage(stage, "down")}
                    >
                      <ChevronDown />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end border-t pt-4">
              <Button type="button" variant="ghost" onClick={() => resetStages.mutate()}>
                <RotateCcw />
                Reset to default order
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
