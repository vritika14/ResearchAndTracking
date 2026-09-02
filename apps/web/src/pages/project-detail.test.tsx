import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProjectDetailPage from "@/pages/project-detail";

const fixtures = vi.hoisted(() => ({
  updateProject: vi.fn(),
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
    {
      id: "stage-2",
      tenantId: null,
      category: "pipeline_stage",
      value: "Publication",
      sortOrder: 2,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ],
}));

vi.mock("@/api/hooks", () => ({
  useMe: () => ({
    data: {
      id: "user-owner",
      email: "owner@example.com",
      displayName: "Avi Researcher",
    },
  }),
  useCurrentWorkspace: () => ({
    data: { id: "workspace-1" },
    isPending: false,
  }),
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
  useMyProject: () => ({
    data: fixtures.project,
    isPending: false,
    isError: false,
    error: undefined,
    refetch: vi.fn(),
  }),
  useUpdateMyProject: () => ({
    mutateAsync: fixtures.updateProject,
    isPending: false,
  }),
  useArchiveMyProject: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useModules: () => ({ data: [] }),
  useTasks: () => ({ data: [] }),
  useNotes: () => ({ data: [] }),
  useMyProjectPipelineStages: () => ({
    data: fixtures.pipelineStages,
    isPending: false,
    isError: false,
  }),
  useProjectCollaborators: () => ({ data: [], isPending: false }),
  useRemoveProjectCollaborator: () => ({ mutate: vi.fn() }),
  useCollaboratorInvitations: () => ({ data: [], isPending: false }),
  useInviteCollaborator: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
  }),
  useRevokeCollaboratorInvitation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useUserSearch: () => ({ data: [], isPending: false, isError: false }),
}));

describe("ProjectDetailPage", () => {
  beforeEach(() => {
    fixtures.project.title = "Enzyme Kinetics Inhibition Study";
    fixtures.project.researchArea = "Biochemistry";
    fixtures.project.scheduledFor = "2026-08-06";
    fixtures.project.dueDate = "2026-08-15";
    fixtures.project.pipelineStage = "Data Collection";
    fixtures.updateProject.mockReset();
    fixtures.updateProject.mockImplementation(
      async ({ input }: { input: Record<string, unknown> }) => {
        Object.assign(fixtures.project, input);
        return fixtures.project;
      },
    );
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
    expect(
      screen.getByRole("button", { name: "Edit Project" }),
    ).toBeInTheDocument();
  });

  it("opens directly in edit mode from a project-table edit link", () => {
    render(
      <MemoryRouter initialEntries={["/projects/PRJ-101?edit=true"]}>
        <Routes>
          <Route path="projects/:projectId" element={<ProjectDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Edit project details" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save Changes" }),
    ).toBeInTheDocument();
  });

  it("returns to the pipeline when pipeline editing is cancelled", () => {
    render(
      <MemoryRouter
        initialEntries={["/projects/PRJ-101?edit=true&from=pipeline"]}
      >
        <Routes>
          <Route path="projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="pipeline" element={<h1>Pipeline</h1>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel Editing" }));

    expect(
      screen.getByRole("heading", { name: "Pipeline" }),
    ).toBeInTheDocument();
  });

  it("shows collaborators only when expanded, without hiding linked work", () => {
    render(
      <MemoryRouter initialEntries={["/projects/PRJ-101"]}>
        <Routes>
          <Route path="projects/:projectId" element={<ProjectDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole("heading", { name: "Project collaborators" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Modules (0)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Show collaborators" }),
    ).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(screen.getByRole("button", { name: "Show collaborators" }));

    expect(
      screen.getByRole("heading", { name: "Project collaborators" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Modules (0)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Hide collaborators" }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("shows the project's selected stages in its pipeline at the bottom", () => {
    render(
      <MemoryRouter initialEntries={["/projects/PRJ-101"]}>
        <Routes>
          <Route path="projects/:projectId" element={<ProjectDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const pipeline = screen.getByRole("region", { name: "Project pipeline" });
    expect(pipeline).toHaveTextContent("Data Collection");
    expect(pipeline).toHaveTextContent("Publication");
    expect(
      screen.getByRole("group", {
        name: "Data Collection stage, current stage",
      }),
    ).toContainElement(screen.getByLabelText(`Drag ${fixtures.project.title}`));
  });

  it("moves the project card when it is dropped onto another stage", async () => {
    render(
      <MemoryRouter initialEntries={["/projects/PRJ-101"]}>
        <Routes>
          <Route path="projects/:projectId" element={<ProjectDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const dataTransfer = {
      effectAllowed: "none",
      dropEffect: "none",
      setData: vi.fn(),
      getData: vi.fn(() => fixtures.project.id),
    } as unknown as DataTransfer;
    const projectCard = screen.getByLabelText(`Drag ${fixtures.project.title}`);
    const targetStage = screen.getByRole("group", {
      name: "Publication stage",
    });

    fireEvent.dragStart(projectCard, { dataTransfer });
    fireEvent.dragOver(targetStage, { dataTransfer });
    fireEvent.drop(targetStage, { dataTransfer });

    await waitFor(() =>
      expect(fixtures.updateProject).toHaveBeenCalledWith({
        projectId: "PRJ-101",
        input: { pipelineStage: "Publication" },
      }),
    );
  });
});
