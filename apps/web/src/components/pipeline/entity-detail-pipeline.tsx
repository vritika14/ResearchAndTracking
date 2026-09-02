import { useState, type DragEvent } from "react";
import { Check, GripVertical, Workflow } from "lucide-react";

import type { ApiPipelineStage } from "@/api/hooks";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PipelineEntity {
  id: string;
  displayId: string | null;
  title: string;
  status: string | null;
  secondaryStatus?: string | null;
  pipelineStage: string | null;
}

interface EntityDetailPipelineProps {
  entityLabel: "project" | "module";
  entity: PipelineEntity;
  stages: ApiPipelineStage[];
  isPending: boolean;
  isError: boolean;
  isUpdating: boolean;
  onStageChange: (stage: string) => void;
}

export function EntityDetailPipeline({
  entityLabel,
  entity,
  stages,
  isPending,
  isError,
  isUpdating,
  onStageChange,
}: EntityDetailPipelineProps) {
  const orderedStages = [...stages].sort((a, b) => a.sortOrder - b.sortOrder);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const label = `${entityLabel[0]!.toUpperCase()}${entityLabel.slice(1)}`;

  function handleDragStart(event: DragEvent<HTMLDivElement>) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", entity.id);
    setIsDragging(true);
  }

  function finishDragging() {
    setIsDragging(false);
    setDragOverStage(null);
  }

  function handleDragOver(event: DragEvent<HTMLLIElement>, stageValue: string) {
    if (isUpdating || stageValue === entity.pipelineStage) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverStage(stageValue);
  }

  function handleDrop(event: DragEvent<HTMLLIElement>, stageValue: string) {
    event.preventDefault();
    const draggedEntityId = event.dataTransfer.getData("text/plain");
    if (
      !isUpdating &&
      draggedEntityId === entity.id &&
      stageValue !== entity.pipelineStage
    ) {
      onStageChange(stageValue);
    }
    finishDragging();
  }

  return (
    <Card role="region" aria-labelledby={`${entityLabel}-pipeline-heading`}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Workflow className="h-5 w-5" />
          </span>
          <div>
            <CardTitle id={`${entityLabel}-pipeline-heading`}>
              {label} pipeline
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Drag the {entityLabel} card between the stages selected when this{" "}
              {entityLabel} was created.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <p className="text-sm text-muted-foreground">
            Loading {entityLabel} pipeline…
          </p>
        ) : isError ? (
          <p className="text-sm text-destructive">
            The {entityLabel} pipeline could not be loaded.
          </p>
        ) : orderedStages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No pipeline stages are configured for this {entityLabel}.
          </p>
        ) : (
          <ol
            className="grid gap-4 overflow-x-auto pb-2 md:grid-flow-col md:auto-cols-[minmax(14rem,1fr)]"
            aria-label={`${label} pipeline stages`}
          >
            {orderedStages.map((stage, index) => {
              const isCurrent = stage.value === entity.pipelineStage;
              const isDragTarget = dragOverStage === stage.value;
              return (
                <li
                  key={stage.id}
                  role="group"
                  aria-label={`${stage.value} stage${isCurrent ? ", current stage" : ""}`}
                  onDragOver={(event) => handleDragOver(event, stage.value)}
                  onDrop={(event) => handleDrop(event, stage.value)}
                  className={`relative flex min-h-44 min-w-56 flex-col rounded-xl border p-3 transition-colors ${
                    isDragTarget
                      ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                      : isCurrent
                        ? "border-primary/50 bg-primary/5"
                        : "border-border bg-muted/20"
                  }`}
                >
                  {index > 0 ? (
                    <span
                      className="absolute -left-4 top-8 hidden h-0.5 w-4 bg-border md:block"
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className="mb-3 flex items-center gap-2 border-b border-border/70 pb-3">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        isCurrent
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isCurrent ? <Check className="h-4 w-4" /> : index + 1}
                    </span>
                    <span className="min-w-0 text-sm font-semibold leading-snug">
                      {stage.value}
                    </span>
                  </div>

                  {isCurrent ? (
                    <div
                      draggable={!isUpdating}
                      aria-label={`Drag ${entity.title}`}
                      onDragStart={handleDragStart}
                      onDragEnd={finishDragging}
                      className={`mt-auto flex cursor-grab flex-col gap-2 rounded-lg border border-primary/30 bg-card p-3 shadow-sm active:cursor-grabbing ${
                        isDragging ? "opacity-50" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical
                          className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <span className="block font-mono text-[10px] text-muted-foreground">
                            {entity.displayId ?? entity.id}
                          </span>
                          <span className="block text-sm font-semibold leading-snug">
                            {entity.title}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <StatusBadge status={entity.status ?? "—"} />
                        {entity.secondaryStatus ? (
                          <StatusBadge status={entity.secondaryStatus} />
                        ) : null}
                      </div>
                      <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                        Move to stage
                        <select
                          aria-label={`Move ${entityLabel} to stage`}
                          value={entity.pipelineStage ?? ""}
                          disabled={isUpdating}
                          onMouseDown={(event) => event.stopPropagation()}
                          onChange={(event) =>
                            onStageChange(event.target.value)
                          }
                          className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          {orderedStages.map((option) => (
                            <option key={option.id} value={option.value}>
                              {option.value}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  ) : (
                    <div
                      className={`flex flex-1 items-center justify-center rounded-lg border border-dashed p-4 text-center text-xs ${
                        isDragTarget
                          ? "border-primary text-primary"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      Drop {entityLabel} here
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
