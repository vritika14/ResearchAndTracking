import { useState, type DragEvent } from "react";
import { ArrowDown, ArrowUp, GripVertical, Plus, RotateCcw, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface StageOption {
  id: string;
  value: string;
}

interface StageListBuilderProps {
  availableStages: readonly StageOption[];
  selectedStages: readonly string[];
  onChange: (stages: string[]) => void;
  entityLabel: "project" | "module";
}

const DRAG_TYPE = "application/x-research-stage";

export function StageListBuilder({
  availableStages,
  selectedStages,
  onChange,
  entityLabel,
}: StageListBuilderProps) {
  const [customStage, setCustomStage] = useState("");
  const selectedSet = new Set(selectedStages);
  const pool = availableStages.filter((stage) => !selectedSet.has(stage.value));

  function dragValue(event: DragEvent, value: string) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(DRAG_TYPE, value);
    event.dataTransfer.setData("text/plain", value);
  }

  function droppedValue(event: DragEvent) {
    return event.dataTransfer.getData(DRAG_TYPE) || event.dataTransfer.getData("text/plain");
  }

  function addStage(value: string, atIndex = selectedStages.length) {
    const normalized = value.trim();
    if (!normalized) return;
    const withoutStage = selectedStages.filter((stage) => stage !== normalized);
    const next = [...withoutStage];
    next.splice(Math.min(atIndex, next.length), 0, normalized);
    onChange(next);
  }

  function moveStage(value: string, offset: -1 | 1) {
    const currentIndex = selectedStages.indexOf(value);
    const nextIndex = currentIndex + offset;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= selectedStages.length) return;
    const next = [...selectedStages];
    [next[currentIndex], next[nextIndex]] = [next[nextIndex], next[currentIndex]];
    onChange(next);
  }

  function addCustomStage() {
    const normalized = customStage.trim();
    if (!normalized || selectedSet.has(normalized)) return;
    addStage(normalized);
    setCustomStage("");
  }

  return (
    <section className="rounded-xl border border-border bg-muted/20 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Build the {entityLabel} pipeline</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Drag stages into the ordered list, or use the buttons on touch devices.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange(availableStages.map((stage) => stage.value))}
        >
          <RotateCcw />
          Reset preset
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div
          className="min-h-36 rounded-lg border border-dashed border-border bg-card/70 p-3"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const value = droppedValue(event);
            if (value) onChange(selectedStages.filter((stage) => stage !== value));
          }}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Stages pool
            </span>
            <Badge variant="secondary">{pool.length} available</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {pool.length ? pool.map((stage) => (
              <button
                key={stage.id}
                type="button"
                draggable
                onDragStart={(event) => dragValue(event, stage.value)}
                onClick={() => addStage(stage.value)}
                className="inline-flex cursor-grab items-center gap-1.5 rounded-lg border bg-background px-2.5 py-2 text-left text-xs font-medium shadow-sm transition-colors hover:border-primary/40 hover:bg-accent active:cursor-grabbing"
                aria-label={`Add ${stage.value} to ${entityLabel} stages`}
              >
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                {stage.value}
                <Plus className="h-3.5 w-3.5 text-primary" />
              </button>
            )) : (
              <p className="py-3 text-xs text-muted-foreground">
                All preset stages are in this {entityLabel}'s pipeline.
              </p>
            )}
          </div>
        </div>

        <div
          className="min-h-36 rounded-lg border border-primary/20 bg-primary/[0.035] p-3"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const value = droppedValue(event);
            if (value) addStage(value);
          }}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              This {entityLabel}'s stages
            </span>
            <Badge>{selectedStages.length} selected</Badge>
          </div>
          <div className="grid gap-2">
            {selectedStages.map((stage, index) => (
              <div
                key={stage}
                draggable
                onDragStart={(event) => dragValue(event, stage)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  const value = droppedValue(event);
                  if (value) addStage(value, index);
                }}
                className="flex cursor-grab items-center gap-2 rounded-lg border bg-card px-2.5 py-2 shadow-sm active:cursor-grabbing"
              >
                <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{stage}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={index === 0}
                  onClick={() => moveStage(stage, -1)}
                  aria-label={`Move ${stage} up`}
                >
                  <ArrowUp />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={index === selectedStages.length - 1}
                  onClick={() => moveStage(stage, 1)}
                  aria-label={`Move ${stage} down`}
                >
                  <ArrowDown />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => onChange(selectedStages.filter((item) => item !== stage))}
                  aria-label={`Remove ${stage}`}
                >
                  <X />
                </Button>
              </div>
            ))}
            {!selectedStages.length ? (
              <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                Add at least one stage from the pool or create a custom stage.
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Input
          value={customStage}
          onChange={(event) => setCustomStage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addCustomStage();
            }
          }}
          placeholder="Create a custom stage"
          aria-label="Custom pipeline stage"
          maxLength={100}
        />
        <Button type="button" variant="outline" onClick={addCustomStage} disabled={!customStage.trim()}>
          <Plus />
          Add stage
        </Button>
      </div>
    </section>
  );
}
