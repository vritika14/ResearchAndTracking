import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProjectDetailPage from "@/pages/project-detail";

const fixtures = vi.hoisted(() => ({
  project: {
    id: "PRJ-101",
    displayId: "PRJ-101",
    userId: "user-owner",
    tenantId: "workspace-1",
    title: "Enzyme Kinetics Inhibition Study",
    description: null,
    researchArea: "Biochemistry",
    status: "Active",
    pipelineStage: "Data Collection",
    importance: "Medium",
    scheduledFor: "2026-08-06",
    dueDate: "2026-08-15",
    totalBudget: "5000",
    targetJournals: null,
    archivedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    role: null as string | null,
  },
  pipelineStages: [
    {
      id: "stage-1",
      tenantId: null,
      category: "pipeline_stage",
      value: "Data Collection",
      sortOrder: 1,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ],
}));

vi.mock("@/api/hooks", () => ({
  useMe: () => ({
    data: { id: "user-owner", email: "owner@example.com", displayName: "Avi Researcher" },
  }),
  useCurrentWorkspace: () => ({ data: { id: "workspace-1" }, isPending: false }),
  useMembers: () => ({
    data: [
      {
        id: "membership-owner",
        userId: "user-owner",
        displayName: "Avi Researcher",
        email: "owner@example.com",
        role: "owner",
      },
    ],
    isPending: false,
  }),
  useProject: () => ({
    data: fixtures.project,
    isPending: false,
    isError: false,
    error: undefined,
    refetch: vi.fn(),
  }),
  useUpdateProject: () => ({
    mutateAsync: vi.fn(async ({ input }: { input: Record<string, unknown> }) => {
      Object.assign(fixtures.project, input);
      return fixtures.project;
    }),
    isPending: false,
  }),
  useModules: () => ({ data: [] }),
  useTasks: () => ({ data: [] }),
  useNotes: () => ({ data: [] }),
  usePipelineStages: () => ({ data: fixtures.pipelineStages }),
  useProjectCollaborators: () => ({ data: [], isPending: false }),
  useAddProjectCollaborator: () => ({ mutate: vi.fn() }),
  useRemoveProjectCollaborator: () => ({ mutate: vi.fn() }),
}));

describe("ProjectDetailPage", () => {
  beforeEach(() => {
    fixtures.project.title = "Enzyme Kinetics Inhibition Study";
    fixtures.project.researchArea = "Biochemistry";
    fixtures.project.scheduledFor = "2026-08-06";
    fixtures.project.dueDate = "2026-08-15";
  });

  it("edits project details in place", async () => {
    render(
      <MemoryRouter initialEntries={["/projects/PRJ-101"]}>
        <Routes>
          <Route path="projects/:projectId" element={<ProjectDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit Project" }));

    const scheduledFor = screen.getByLabelText(/Scheduled for/);
    const dueDate = screen.getByLabelText(/Due date/);
    expect(scheduledFor).toHaveValue("06/08/2026");
    expect(scheduledFor).not.toBeRequired();
    expect(dueDate).toHaveValue("15/08/2026");
    expect(dueDate).not.toBeRequired();

    fireEvent.change(screen.getByRole("textbox", { name: /Project title/ }), {
      target: { value: "Updated research project" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Research area" }), {
      target: { value: "Updated research area" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Updated research project" }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText("Updated research area")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit Project" })).toBeInTheDocument();
  });

  it("opens directly in edit mode from a project-table edit link", () => {
    render(
      <MemoryRouter initialEntries={["/projects/PRJ-101?edit=true"]}>
        <Routes>
          <Route path="projects/:projectId" element={<ProjectDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Edit project details" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeInTheDocument();
  });

  it("returns to the pipeline when pipeline editing is cancelled", () => {
    render(
      <MemoryRouter initialEntries={["/projects/PRJ-101?edit=true&from=pipeline"]}>
        <Routes>
          <Route path="projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="pipeline" element={<h1>Pipeline</h1>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel Editing" }));

    expect(screen.getByRole("heading", { name: "Pipeline" })).toBeInTheDocument();
  });
});
