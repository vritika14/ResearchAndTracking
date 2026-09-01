import { useEffect, useRef, useState } from "react";

import { usePreferences } from "@/preferences/preferences-context";

export function useColumnVisibility<T extends string>(
  columns: readonly T[],
  preferenceKey?: string,
) {
  const preferences = usePreferences();
  const hydratedWorkspace = useRef("");
  const [visibleColumns, setVisibleColumns] = useState<Set<T>>(
    () => {
      if (!preferenceKey) return new Set(columns);
      try {
        const hidden = JSON.parse(
          window.localStorage.getItem(`flow-table-columns:${preferenceKey}`) ?? "[]",
        ) as unknown;
        const hiddenSet = new Set(Array.isArray(hidden) ? hidden : []);
        return new Set(columns.filter((column) => !hiddenSet.has(column)));
      } catch {
        return new Set(columns);
      }
    },
  );

  useEffect(() => {
    if (
      !preferenceKey ||
      !preferences?.workspaceId ||
      preferences.workspacePreferences === undefined ||
      hydratedWorkspace.current === preferences.workspaceId
    ) return;
    hydratedWorkspace.current = preferences.workspaceId;
    const remoteHidden = preferences.workspacePreferences?.tableColumns?.[preferenceKey];
    if (remoteHidden) {
      const hiddenSet = new Set(remoteHidden);
      setVisibleColumns(new Set(columns.filter((column) => !hiddenSet.has(column))));
    } else {
      let hidden = columns.filter((column) => !visibleColumns.has(column));
      try {
        const scoped = window.localStorage.getItem(
          `flow-table-columns:${preferences.workspaceId}:${preferenceKey}`,
        );
        if (scoped) {
          const parsed = JSON.parse(scoped) as unknown;
          if (Array.isArray(parsed)) hidden = columns.filter((column) => parsed.includes(column));
        }
      } catch {
        // Fall back to the current in-memory selection.
      }
      setVisibleColumns(new Set(columns.filter((column) => !hidden.includes(column))));
      preferences.updateTableColumns(preferenceKey, hidden);
    }
    // Hydrate once for this table/workspace; user changes are saved by toggleColumn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferenceKey, preferences?.workspaceId, preferences?.workspacePreferences]);

  function toggleColumn(column: T) {
    const next = new Set(visibleColumns);
    if (next.has(column)) {
      if (next.size === 1) return;
      next.delete(column);
    } else {
      next.add(column);
    }
    setVisibleColumns(next);
    if (preferenceKey) {
      const hidden = columns.filter((candidate) => !next.has(candidate));
      try {
        window.localStorage.setItem(
          preferences?.workspaceId
            ? `flow-table-columns:${preferences.workspaceId}:${preferenceKey}`
            : `flow-table-columns:${preferenceKey}`,
          JSON.stringify(hidden),
        );
      } catch {
        // The selection still applies for this session when storage is unavailable.
      }
      if (hydratedWorkspace.current === preferences?.workspaceId) {
        preferences.updateTableColumns(preferenceKey, hidden);
      }
    }
  }

  return {
    visibleColumns,
    isColumnVisible: (column: T) => visibleColumns.has(column),
    toggleColumn,
  };
}
