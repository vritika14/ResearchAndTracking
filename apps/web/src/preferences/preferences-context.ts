import { createContext, useContext } from "react";

import type {
  DashboardLayoutPreference,
  WorkspacePreferences,
} from "@/api/hooks";

export interface PreferencesContextValue {
  workspaceId: string;
  workspacePreferences: WorkspacePreferences | null | undefined;
  updateDashboardLayout: (layout: DashboardLayoutPreference) => void;
  updateTableColumns: (table: string, columns: string[]) => void;
}

export const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function usePreferences() {
  return useContext(PreferencesContext);
}
