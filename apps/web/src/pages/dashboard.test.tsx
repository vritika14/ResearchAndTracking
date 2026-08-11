import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import DashboardPage from "@/pages/dashboard";

vi.mock("@/api/hooks", () => ({
  useCurrentWorkspace: () => ({
    data: {
      id: "workspace-1",
      name: "Research Operations",
      membershipRole: "owner",
    },
  }),
}));

vi.mock("@/components/dashboard/priority-tasks-table", () => ({
  PriorityTasksTable: () => null,
}));
vi.mock("@/components/dashboard/pipeline-overview-table", () => ({
  PipelineOverviewTable: () => null,
}));
vi.mock("@/components/dashboard/conference-submissions-table", () => ({
  ConferenceSubmissionsTable: () => null,
}));

describe("DashboardPage", () => {
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
});
