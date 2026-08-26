import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProjectsPage from "@/pages/projects";

const fixtures = vi.hoisted(() => ({
  tenantId: "workspace-1",
  project: {
    id: "PRJ-101",
    displayId: "PRJ-101",
    userId: "user-owner",
    tenantId: "workspace-1",
    title: "Enzyme Kinetics Inhibition Study Across Temperature Gradients",
    description: "A study of enzyme kinetics under varying temperature.",
    researchArea: "Biochemistry",
    status: "Active",
    pipelineStage: "Data Collection",
    importance: "Low",
    scheduledFor: "2026-07-01",
    dueDate: "2026-08-01",
    totalBudget: "5000",
    targetJournals: "Nature Communications",
    archivedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    role: "owner",
  },
  module: {
    id: "module-1",
    displayId: "MOD-1",
    tenantId: "workspace-1",
    projectId: "PRJ-101",
    title: "Assay setup",
    description: null,
    tag: null,
    status: "Active",
    assignedToUserId: null,
    archivedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  task: {
    id: "task-1",
    displayId: "TSK-1",
    tenantId: "workspace-1",
    projectId: "PRJ-101",
    moduleId: null,
    createdBy: "user-owner",
    title: "Calibrate spectrophotometer",
    description: null,
    status: "In Progress",
    priority: "Medium",
    visibility: "Shared",
    workingWith: null,
    estimatedHours: null,
    dueDate: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  note: {
    id: "note-1",
    displayId: "NTE-1",
    tenantId: "workspace-1",
    projectId: "PRJ-101",
    moduleId: null,
    createdBy: "user-owner",
    title: "Initial observations",
    content: null,
    visibility: "Shared",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
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
      value: "Analysis",
      sortOrder: 2,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ],
}));

vi.mock("@/api/client", () => ({
  apiClient: {
    POST: vi.fn().mockResolvedValue({ data: {}, error: undefined, response: new Response() }),
  },
}));

vi.mock("@/api/hooks", () => ({
  apiKeys: {
    projectCollaborators: (tenantId: string, projectId: string) => [
      "api",
      "tenant",
      tenantId,
      "projects",
      projectId,
      "collaborators",
    ],
  },
  useMe: () => ({
    data: {
      id: "user-owner",
      email: "owner@example.com",
      displayName: "Avi Researcher",
    },
  }),
  useCurrentWorkspace: () => ({ data: { id: fixtures.tenantId }, isPending: false }),
  useMembers: () => ({ data: [], isPending: false }),
  useMyProjects: () => ({ data: [fixtures.project], isPending: false, isError: false }),
  useCreateProject: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useArchiveMyProject: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useModules: () => ({ data: [fixtures.module] }),
  useTasks: () => ({ data: [fixtures.task] }),
  useNotes: () => ({ data: [fixtures.note] }),
  usePipelineStages: () => ({ data: fixtures.pipelineStages }),
}));

vi.mock("@/components/projects/project-collaborators", () => ({
  ProjectCollaborators: ({ entityTitle }: { entityTitle: string }) => (
    <div>Collaborators for {entityTitle}</div>
  ),
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ProjectsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ProjectsPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("provides a direct edit action for each project row", () => {
    renderPage();

    const editLink = screen.getByRole("link", {
      name: "Edit Enzyme Kinetics Inhibition Study Across Temperature Gradients",
    });

    expect(editLink).toHaveAttribute("href", "/projects/PRJ-101?edit=true");
    expect(screen.getByText("Low")).toBeInTheDocument();
  });

  it("opens collaborator management directly from the project row", () => {
    renderPage();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Manage collaborators for Enzyme Kinetics Inhibition Study Across Temperature Gradients",
      }),
    );

    expect(screen.getByRole("heading", { name: "Project collaborators" })).toBeInTheDocument();
    expect(
      screen.getByText("Collaborators for Enzyme Kinetics Inhibition Study Across Temperature Gradients"),
    ).toBeInTheDocument();
  });

  it("shows scheduled dates in the table and new-project form", () => {
    renderPage();

    expect(screen.getAllByText("Scheduled For").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "New Project" }));

    const scheduledFor = screen.getByLabelText(/Scheduled for/);
    const dueDate = screen.getByLabelText(/Due date/);

    expect(scheduledFor).toHaveAttribute("placeholder", "DD/MM/YYYY");
    expect(scheduledFor).not.toBeRequired();
    expect(dueDate).toHaveAttribute("placeholder", "DD/MM/YYYY");
    expect(dueDate).not.toBeRequired();
    expect(
      screen.getByRole("button", { name: "Choose scheduled for date" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Choose due date" })).toBeInTheDocument();
  });

  it("directs project sharing to the post-creation invitation flow", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "New Project" }));
    expect(screen.queryByRole("combobox", { name: "Collaborators" })).not.toBeInTheDocument();
    expect(screen.getByText(/After creating the project, open it to invite collaborators by email/i)).toBeInTheDocument();
  });

  it("shows linked module/task/note counts and a link to the full project page when expanded", () => {
    renderPage();

    const projectLink = screen.getByRole("link", {
      name: "Enzyme Kinetics Inhibition Study Across Temperature Gradients",
    });
    const projectRow = projectLink.closest('[role="button"]');
    expect(projectRow).not.toBeNull();
    fireEvent.click(projectRow!);

    const overview = screen.getByText("Overview").parentElement!;
    expect(within(overview).getByText("Modules").nextElementSibling).toHaveTextContent("1");
    expect(within(overview).getByText("Tasks").nextElementSibling).toHaveTextContent("1");
    expect(within(overview).getByText("Notes").nextElementSibling).toHaveTextContent("1");

    expect(screen.getByRole("link", { name: "View full project details" })).toHaveAttribute(
      "href",
      "/projects/PRJ-101",
    );
  });

  it("shows a project's pipeline stage in the table", () => {
    renderPage();

    const projectLink = screen.getByRole("link", {
      name: "Enzyme Kinetics Inhibition Study Across Temperature Gradients",
    });
    const projectRow = projectLink.closest('[role="button"]');
    expect(projectRow).toHaveTextContent("Data Collection");
  });
});
