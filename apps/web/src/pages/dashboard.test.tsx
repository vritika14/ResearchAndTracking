import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DashboardPage from "@/pages/dashboard";

vi.mock("@/api/hooks", () => ({
  useCurrentWorkspace: () => ({
    data: {
      id: "workspace-1",
      name: "Research Operations",
      membershipRole: "owner",
    },
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

  it("identifies the workspace whose data is displayed", () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Current workspace")).toBeInTheDocument();
    expect(screen.getByText("Research Operations")).toBeInTheDocument();
    expect(screen.getByText("Owner access")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Switch workspace" }),
    ).toHaveAttribute("href", "/workspaces");
  });

  it("hides and reorders dashboard tables and preserves the layout", () => {
    const view = render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Customize dashboard" }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Tasks to be done/ }));
    fireEvent.click(
      screen.getByRole("button", { name: "Move Pipeline project overview up" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Done" }));

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

    expect(screen.queryByTestId("dashboard-table-tasks")).not.toBeInTheDocument();
    expect(screen.getAllByTestId(/dashboard-table-/).map((table) => table.textContent)).toEqual([
      "Pipeline table",
      "Conferences table",
    ]);
  });
});
