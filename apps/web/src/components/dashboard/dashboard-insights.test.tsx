import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import {
  PriorityWorkloadCard,
  ProjectProgressCard,
  TaskHealthCard,
} from "@/components/dashboard/dashboard-insights";

function dateOffset(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const fixtures = vi.hoisted(() => ({
  tenantId: "workspace-1",
  projects: [
    { id: "project-1", title: "Evidence review", pipelineStage: "Discovery" },
    { id: "project-2", title: "Field study", pipelineStage: "Review" },
  ],
  tasks: [
    { id: "task-1", status: "Complete", dueDate: null, priority: "High", projectId: "project-1" },
    { id: "task-2", status: "Active", dueDate: dateOffset(-1), priority: "Critical", projectId: "project-1" },
    { id: "task-3", status: "Active", dueDate: dateOffset(3), priority: "Low", projectId: "project-2" },
  ],
  stages: [
    { value: "Discovery", sortOrder: 1 },
    { value: "Review", sortOrder: 2 },
  ],
}));

vi.mock("@/api/hooks", () => ({
  useCurrentWorkspace: () => ({ data: { id: fixtures.tenantId }, isPending: false }),
  useProjects: () => ({
    data: { data: fixtures.projects, meta: { page: 1, pageSize: 20, totalItems: fixtures.projects.length, totalPages: 1 } },
    isPending: false,
  }),
  useTasks: () => ({
    data: { data: fixtures.tasks, meta: { page: 1, pageSize: 20, totalItems: fixtures.tasks.length, totalPages: 1 } },
    isPending: false,
  }),
  usePipelineStages: () => ({ data: fixtures.stages, isPending: false }),
}));

describe("dashboard insight cards", () => {
  it("summarizes deadline and priority risk on the task health and priority workload cards", () => {
    render(
      <MemoryRouter>
        <TaskHealthCard />
        <PriorityWorkloadCard />
      </MemoryRouter>,
    );

    expect(screen.getByRole("img", { name: /33% of tasks completed; 1 overdue; 1 due/ })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Open task count by priority" })).toBeInTheDocument();
  });

  it("shows per-project task completion on the project progress card", () => {
    render(
      <MemoryRouter>
        <ProjectProgressCard />
      </MemoryRouter>,
    );

    const evidenceRow = screen.getByRole("row", { name: /Evidence review/ });
    expect(within(evidenceRow).getByText("1/2")).toBeInTheDocument();
    expect(within(evidenceRow).getByText("50%")).toBeInTheDocument();
  });
});
