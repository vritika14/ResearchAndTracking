import { Columns3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-2">
          <Columns3 className="h-4 w-4" />
          {triggerLabel}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        {columns.map((column) => {
          const isVisible = visibleColumns.has(column.id);
          const isLastVisible = isVisible && visibleColumns.size === 1;

          return (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={isVisible}
              disabled={isLastVisible}
              onSelect={(event) => event.preventDefault()}
              onCheckedChange={() => onToggle(column.id)}
            >
              {column.label}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
