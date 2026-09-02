import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DashboardPage from "@/pages/dashboard";
import { PreferencesContext } from "@/preferences/preferences-context";

vi.mock("@/api/hooks", () => ({
  useCurrentWorkspace: () => ({
    data: {
      id: "workspace-1",
      name: "Research Operations",
      membershipRole: "owner",
    },
  }),
  usePipelineStages: () => ({
    data: [
      { value: "Concept & Ideation", sortOrder: 1 },
      { value: "Consolidation & Review", sortOrder: 2 },
    ],
  }),
  useProjects: () => ({ data: [] }),
  useTasks: () => ({ data: [] }),
}));

vi.mock("@/components/dashboard/priority-tasks-table", () => ({
  PriorityTasksTable: () => <div data-testid="dashboard-table-tasks">Tasks table</div>,
}));
vi.mock("@/components/dashboard/pipeline-overview-table", () => ({
  PipelineOverviewTable: () => <div data-testid="dashboard-table-pipeline">Pipeline table</div>,
}));
vi.mock("@/components/dashboard/conference-submissions-table", () => ({
  ConferenceSubmissionsTable: () => (
    <div data-testid="dashboard-table-conferences">Conferences table</div>
  ),
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows live pipeline and task-health insight charts", () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Pipeline distribution" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Task health" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Priority workload" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Project progress" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /tasks completed/ })).toBeInTheDocument();
  });

  it("customizes insights and tables and preserves the layout", () => {
    const view = render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Customize dashboard" }));
    expect(screen.getByRole("heading", { name: "Insights" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tables" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: /Task health/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Tasks to be done/ }));
    fireEvent.click(
      screen.getByRole("button", { name: "Move Pipeline project overview up" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Done" }));

    expect(screen.getByRole("heading", { name: "Task health" }).closest("div.hidden")).not.toBeNull();
    expect(screen.queryByTestId("dashboard-table-tasks")).not.toBeInTheDocument();
    expect(screen.getAllByTestId(/dashboard-table-/).map((table) => table.textContent)).toEqual([
      "Pipeline table",
      "Conferences table",
    ]);

    view.unmount();
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Task health" }).closest("div.hidden")).not.toBeNull();
    expect(screen.queryByTestId("dashboard-table-tasks")).not.toBeInTheDocument();
    expect(screen.getAllByTestId(/dashboard-table-/).map((table) => table.textContent)).toEqual([
      "Pipeline table",
      "Conferences table",
    ]);
  });

  it("saves the first dashboard change after hydrating a default server layout", async () => {
    const updateDashboardLayout = vi.fn();
    render(
      <MemoryRouter>
        <PreferencesContext.Provider
          value={{
            workspaceId: "workspace-1",
            workspacePreferences: {
              dashboardLayout: {
                order: [
                  "pipeline-distribution",
                  "task-health",
                  "priority-workload",
                  "project-progress",
                  "tasks",
                  "pipeline",
                  "conferences",
                ],
                hidden: [],
              },
            },
            updateDashboardLayout,
            updateTableColumns: vi.fn(),
            updatePipelineHiddenStages: vi.fn(),
          }}
        >
          <DashboardPage />
        </PreferencesContext.Provider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Customize dashboard" }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Task health/ }));

    await waitFor(() => expect(updateDashboardLayout).toHaveBeenCalledTimes(1));
    expect(updateDashboardLayout.mock.calls[0]?.[0].hidden).toContain("task-health");
  });
});
