import { ChevronDown, ChevronUp, GripVertical, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useState, type DragEvent } from "react";

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
import { cn } from "@/lib/utils";

export interface DashboardTableOption<T extends string> {
  id: T;
  label: string;
  description: string;
}

interface CustomizeDashboardDialogProps<T extends string> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tables: readonly DashboardTableOption<T>[];
  visibleTables: ReadonlySet<T>;
  onToggle: (table: T) => void;
  onMove: (table: T, direction: "up" | "down") => void;
  onReorder: (draggedTable: T, targetTable: T) => void;
  onReset: () => void;
}

export function CustomizeDashboardDialog<T extends string>({
  open,
  onOpenChange,
  tables,
  visibleTables,
  onToggle,
  onMove,
  onReorder,
  onReset,
}: CustomizeDashboardDialogProps<T>) {
  const [draggedId, setDraggedId] = useState<T | null>(null);
  const [dragOverId, setDragOverId] = useState<T | null>(null);

  function handleDragStart(event: DragEvent<HTMLDivElement>, id: T) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
    setDraggedId(id);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>, id: T) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (id !== draggedId) setDragOverId(id);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>, id: T) {
    event.preventDefault();
    const sourceId = draggedId ?? (event.dataTransfer.getData("text/plain") as T);
    if (sourceId && sourceId !== id) onReorder(sourceId, id);
    setDraggedId(null);
    setDragOverId(null);
  }

  function handleDragEnd() {
    setDraggedId(null);
    setDragOverId(null);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" />
            Customize dashboard
          </DialogTitle>
          <DialogDescription>
            Choose which tables are visible and arrange the order they appear in.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          {tables.map((table, index) => (
            <div
              key={table.id}
              draggable
              onDragStart={(event) => handleDragStart(event, table.id)}
              onDragOver={(event) => handleDragOver(event, table.id)}
              onDrop={(event) => handleDrop(event, table.id)}
              onDragEnd={handleDragEnd}
              className={cn(
                "flex cursor-grab items-center gap-3 rounded-lg border border-border bg-muted/20 p-3 transition-colors active:cursor-grabbing",
                draggedId === table.id && "opacity-45",
                dragOverId === table.id && "border-primary bg-primary/5 ring-2 ring-primary/30",
              )}
            >
              <GripVertical
                className="h-4 w-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={visibleTables.has(table.id)}
                  onChange={() => onToggle(table.id)}
                  className="mt-1 h-4 w-4 shrink-0 accent-primary"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{table.label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {table.description}
                  </span>
                </span>
              </label>
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={index === 0}
                  aria-label={`Move ${table.label} up`}
                  onClick={() => onMove(table.id, "up")}
                >
                  <ChevronUp />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={index === tables.length - 1}
                  aria-label={`Move ${table.label} down`}
                  onClick={() => onMove(table.id, "down")}
                >
                  <ChevronDown />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="border-t pt-4 sm:justify-between">
          <Button type="button" variant="ghost" onClick={onReset}>
            <RotateCcw />
            Reset layout
          </Button>
          <DialogClose asChild>
            <Button type="button">Done</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
