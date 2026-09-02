import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useColumnVisibility } from "@/hooks/use-column-visibility";
import {
  PreferencesContext,
  type PreferencesContextValue,
} from "@/preferences/preferences-context";

const COLUMNS = ["project", "status", "due"] as const;

function ColumnHarness() {
  const columns = useColumnVisibility(COLUMNS, "projects");
  return (
    <div>
      <span>{[...columns.visibleColumns].join(",")}</span>
      <button onClick={() => columns.toggleColumn("status")}>Toggle status</button>
    </div>
  );
}

function renderWithPreferences(value: PreferencesContextValue) {
  return render(
    <PreferencesContext.Provider value={value}>
      <ColumnHarness />
    </PreferencesContext.Provider>,
  );
}

describe("useColumnVisibility", () => {
  beforeEach(() => window.localStorage.clear());

  it("hydrates hidden columns from the workspace account and saves changes", async () => {
    const updateTableColumns = vi.fn();
    renderWithPreferences({
      workspaceId: "workspace-1",
      workspacePreferences: { tableColumns: { projects: ["due"] } },
      updateDashboardLayout: vi.fn(),
      updateTableColumns,
      updatePipelineHiddenStages: vi.fn(),
    });

    await waitFor(() => expect(screen.getByText("project,status")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Toggle status" }));

    expect(screen.getByText("project")).toBeInTheDocument();
    expect(updateTableColumns).toHaveBeenCalledWith("projects", ["status", "due"]);
  });

  it("migrates the browser selection when no server preference exists", async () => {
    window.localStorage.setItem(
      "flow-table-columns:projects",
      JSON.stringify(["due"]),
    );
    const updateTableColumns = vi.fn();
    renderWithPreferences({
      workspaceId: "workspace-1",
      workspacePreferences: null,
      updateDashboardLayout: vi.fn(),
      updateTableColumns,
      updatePipelineHiddenStages: vi.fn(),
    });

    await waitFor(() =>
      expect(updateTableColumns).toHaveBeenCalledWith("projects", ["due"]),
    );
  });

  it("restores workspace-scoped columns immediately on remount", () => {
    window.localStorage.setItem(
      "flow-table-columns:workspace-1:projects",
      JSON.stringify(["status"]),
    );
    renderWithPreferences({
      workspaceId: "workspace-1",
      workspacePreferences: undefined,
      updateDashboardLayout: vi.fn(),
      updateTableColumns: vi.fn(),
      updatePipelineHiddenStages: vi.fn(),
    });

    expect(screen.getByText("project,due")).toBeInTheDocument();
  });
});
