import { useEffect, useRef, useState } from "react";

import { usePreferences } from "@/preferences/preferences-context";

export function useColumnVisibility<T extends string>(
  columns: readonly T[],
  preferenceKey?: string,
) {
  const preferences = usePreferences();
  const hydratedWorkspace = useRef("");
  const readLocalHidden = (workspaceId?: string) => {
    if (!preferenceKey) return [] as string[];
    try {
      const scoped = workspaceId
        ? window.localStorage.getItem(`flow-table-columns:${workspaceId}:${preferenceKey}`)
        : null;
      const parsed = JSON.parse(
        scoped ?? window.localStorage.getItem(`flow-table-columns:${preferenceKey}`) ?? "[]",
      ) as unknown;
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === "string")
        : [];
    } catch {
      return [];
    }
  };
  const [visibleColumns, setVisibleColumns] = useState<Set<T>>(
    () => {
      if (!preferenceKey) return new Set(columns);
      const hiddenSet = new Set(readLocalHidden(preferences?.workspaceId));
      return new Set(columns.filter((column) => !hiddenSet.has(column)));
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
      const localHidden = new Set(readLocalHidden(preferences.workspaceId));
      const hidden = columns.filter((column) => localHidden.has(column));
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
