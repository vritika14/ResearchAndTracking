import { useState } from "react";

export function useColumnVisibility<T extends string>(columns: readonly T[]) {
  const [visibleColumns, setVisibleColumns] = useState<Set<T>>(
    () => new Set(columns),
  );

  function toggleColumn(column: T) {
    setVisibleColumns((current) => {
      const next = new Set(current);
      if (next.has(column)) {
        if (next.size === 1) return current;
        next.delete(column);
      } else {
        next.add(column);
      }
      return next;
    });
  }

  return {
    visibleColumns,
    isColumnVisible: (column: T) => visibleColumns.has(column),
    toggleColumn,
  };
}
