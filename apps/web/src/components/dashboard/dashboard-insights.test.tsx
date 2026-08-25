import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashboardInsights } from "@/components/dashboard/dashboard-insights";

function dateOffset(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

describe("DashboardInsights", () => {
  it("summarizes pipeline, deadline, priority, and project progress data", () => {
    render(
      <DashboardInsights
        stages={[
          { value: "Discovery", sortOrder: 1 },
          { value: "Review", sortOrder: 2 },
        ]}
        projects={[
          { id: "project-1", title: "Evidence review", pipelineStage: "Discovery" },
          { id: "project-2", title: "Field study", pipelineStage: "Review" },
        ]}
        tasks={[
          { id: "task-1", status: "Complete", dueDate: null, priority: "High", projectId: "project-1" },
          { id: "task-2", status: "Active", dueDate: dateOffset(-1), priority: "Critical", projectId: "project-1" },
          { id: "task-3", status: "Active", dueDate: dateOffset(3), priority: "Low", projectId: "project-2" },
        ]}
      />,
    );

    expect(screen.getByRole("img", { name: /33% of tasks completed; 1 overdue; 1 due/ })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Open task count by priority" })).toBeInTheDocument();

    const evidenceRow = screen.getByRole("row", { name: /Evidence review/ });
    expect(within(evidenceRow).getByText("1/2")).toBeInTheDocument();
    expect(within(evidenceRow).getByText("50%")).toBeInTheDocument();
  });
});
