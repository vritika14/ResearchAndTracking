import { Columns3 } from "lucide-react";

interface ColumnOption<T extends string> {
  id: T;
  label: string;
}

interface ColumnVisibilityMenuProps<T extends string> {
  columns: readonly ColumnOption<T>[];
  visibleColumns: ReadonlySet<T>;
  onToggle: (column: T) => void;
  triggerLabel?: string;
}

export function ColumnVisibilityMenu<T extends string>({
  columns,
  visibleColumns,
  onToggle,
  triggerLabel = "Columns",
}: ColumnVisibilityMenuProps<T>) {
  return (
    <details className="relative">
      <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground [&::-webkit-details-marker]:hidden">
        <Columns3 className="h-4 w-4" />
        {triggerLabel}
      </summary>
      <fieldset className="absolute right-0 z-20 mt-2 min-w-48 rounded-md border border-border bg-popover p-2 text-popover-foreground shadow-md">
        <legend className="sr-only">Visible {triggerLabel.toLowerCase()}</legend>
        {columns.map((column) => {
          const isVisible = visibleColumns.has(column.id);
          const isLastVisible = isVisible && visibleColumns.size === 1;

          return (
            <label
              key={column.id}
              className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            >
              <input
                type="checkbox"
                checked={isVisible}
                disabled={isLastVisible}
                onChange={() => onToggle(column.id)}
                className="h-4 w-4 accent-primary"
              />
              {column.label}
            </label>
          );
        })}
      </fieldset>
    </details>
  );
}
