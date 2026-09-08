import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import TaskDetailPage from "@/pages/task-detail";

const fixtures = vi.hoisted(() => ({
  updateTask: vi.fn(),
  task: {
    id: "task-1",
    displayId: "TSK-001",
    tenantId: "workspace-1",
    projectId: null as string | null,
    moduleId: null as string | null,
    title: "Draft literature review",
    description: null,
    status: "To do",
    priority: "Medium",
    dueDate: null,
    estimatedHours: null,
    visibility: "Private",
    workingWith: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  projects: [{ id: "project-1", title: "Genome Sequencing Study" }],
  modules: [{ id: "module-1", title: "Assay optimization" }],
}));

vi.mock("@/api/hooks", () => ({
  useCurrentWorkspace: () => ({ data: { id: "workspace-1" }, isPending: false }),
  useMyTask: () => ({
    data: fixtures.task,
    isPending: false,
    isError: false,
    error: undefined,
    refetch: vi.fn(),
  }),
  useProjects: () => ({
    data: { data: fixtures.projects, meta: { page: 1, pageSize: 20, totalItems: fixtures.projects.length, totalPages: 1 } },
  }),
  useModules: () => ({ data: fixtures.modules }),
  useUpdateMyTask: () => ({ mutateAsync: fixtures.updateTask, isPending: false }),
  useTrackEvent: () => vi.fn(),
  useProject: () => ({ data: undefined, isError: false }),
}));

describe("TaskDetailPage", () => {
  beforeEach(() => {
    fixtures.task.projectId = null;
    fixtures.task.moduleId = null;
    fixtures.updateTask.mockReset();
    fixtures.updateTask.mockResolvedValue(fixtures.task);
  });

  it("returns to whatever page linked into edit mode when editing is cancelled", () => {
    render(
      <MemoryRouter
        initialEntries={["/tasks", "/tasks/task-1?edit=true"]}
        initialIndex={1}
      >
        <Routes>
          <Route path="tasks/:taskId" element={<TaskDetailPage />} />
          <Route path="tasks" element={<h1>Tasks</h1>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel Editing" }));

    expect(screen.getByRole("heading", { name: "Tasks" })).toBeInTheDocument();
  });

  it("falls back to the read-only task view when there is no previous page to return to", () => {
    render(
      <MemoryRouter initialEntries={["/tasks/task-1?edit=true"]}>
        <Routes>
          <Route path="tasks/:taskId" element={<TaskDetailPage />} />
          <Route path="tasks" element={<h1>Tasks</h1>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel Editing" }));

    expect(
      screen.getByRole("button", { name: "Edit Task" }),
    ).toBeInTheDocument();
  });

  it("unlinks a task from its project via the Unlink button", async () => {
    fixtures.task.projectId = "project-1";
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(
      <MemoryRouter initialEntries={["/tasks/task-1"]}>
        <Routes>
          <Route path="tasks/:taskId" element={<TaskDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Unlink" }));

    await waitFor(() =>
      expect(fixtures.updateTask).toHaveBeenCalledWith({
        taskId: "task-1",
        input: { projectId: null, moduleId: null },
      }),
    );
  });

  it("blocks saving a new link until a project is actually picked", () => {
    render(
      <MemoryRouter initialEntries={["/tasks/task-1"]}>
        <Routes>
          <Route path="tasks/:taskId" element={<TaskDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Change link" }));
    fireEvent.click(screen.getByRole("button", { name: "Project" }));

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });
});
