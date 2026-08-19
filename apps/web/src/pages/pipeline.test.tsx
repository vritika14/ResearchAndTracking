import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PipelinePage from "@/pages/pipeline";

type StageFixture = {
  id: string;
  tenantId: string | null;
  category: string;
  value: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type ProjectFixture = {
  id: string;
  displayId: string | null;
  userId: string;
  tenantId: string;
  title: string;
  description: string | null;
  researchArea: string | null;
  status: string | null;
  pipelineStage: string | null;
  importance: string | null;
  scheduledFor: string | null;
  dueDate: string | null;
  totalBudget: string | null;
  targetJournals: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  role: string | null;
};

// Mirrors react-query's cache-subscription behaviour so hand-written mocks
// still trigger a re-render when the underlying fixture data changes.
const projects = vi.hoisted(() => {
  let items: ProjectFixture[] = [];
  const listeners = new Set<() => void>();
  return {
    get: () => items,
    set: (next: ProjectFixture[]) => {
      items = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
});

const stages = vi.hoisted(() => {
  let items: StageFixture[] = [];
  const listeners = new Set<() => void>();
  return {
    get: () => items,
    set: (next: StageFixture[]) => {
      items = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
});

const fixtures = vi.hoisted(() => ({ tenantId: "workspace-1" }));

vi.mock("@/api/hooks", async () => {
  const { useSyncExternalStore } = await import("react");
  return {
    useCurrentWorkspace: () => ({ data: { id: fixtures.tenantId }, isPending: false }),
    useMe: () => ({ data: { id: "user-owner", email: "owner@example.com", displayName: "Avi Researcher" } }),
    useProjects: () => ({
      data: useSyncExternalStore(projects.subscribe, projects.get),
      isPending: false,
      isError: false,
      error: undefined,
      refetch: vi.fn(),
    }),
    useTasks: () => ({ data: [] }),
    usePipelineStages: () => ({
      data: useSyncExternalStore(stages.subscribe, stages.get),
      isPending: false,
    }),
    useUpdateProject: () => ({
      mutateAsync: vi.fn(
        async ({ projectId, input }: { projectId: string; input: Record<string, unknown> }) => {
          projects.set(
            projects.get().map((item) => (item.id === projectId ? { ...item, ...input } : item)),
          );
        },
      ),
    }),
    useCreatePipelineStage: () => ({
      mutateAsync: vi.fn(async (input: { value: string; sortOrder?: number }) => {
        const current = stages.get();
        const stage: StageFixture = {
          id: `stage-${current.length + 1}`,
          tenantId: fixtures.tenantId,
          category: "pipeline_stage",
          value: input.value,
          sortOrder: input.sortOrder ?? current.length + 1,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        };
        stages.set([...current, stage]);
        return stage;
      }),
    }),
    useDeletePipelineStage: () => ({
      mutateAsync: vi.fn(async (id: string) => {
        stages.set(stages.get().filter((item) => item.id !== id));
      }),
    }),
  };
});

function baseStages(): StageFixture[] {
  return [
    {
      id: "stage-1",
      tenantId: "workspace-1",
      category: "pipeline_stage",
      value: "Literature Review",
      sortOrder: 1,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "stage-2",
      tenantId: "workspace-1",
      category: "pipeline_stage",
      value: "Study Design & Protocol",
      sortOrder: 2,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "stage-3",
      tenantId: "workspace-1",
      category: "pipeline_stage",
      value: "Data Collection",
      sortOrder: 3,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ];
}

function baseProjects(): ProjectFixture[] {
  return [
    {
      id: "PRJ-101",
      displayId: "PRJ-101",
      userId: "user-owner",
      tenantId: "workspace-1",
      title: "Enzyme Kinetics Inhibition Study Across Temperature Gradients",
      description: null,
      researchArea: null,
      status: "Active",
      pipelineStage: "Study Design & Protocol",
      importance: "Critical",
      scheduledFor: null,
      dueDate: null,
      totalBudget: null,
      targetJournals: null,
      archivedAt: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      role: null,
    },
  ];
}

describe("PipelinePage", () => {
  beforeEach(() => {
    projects.set(baseProjects());
    stages.set(baseStages());
  });

  it("provides project edit actions in flow and column views", () => {
    render(
      <MemoryRouter>
        <PipelinePage />
      </MemoryRouter>,
    );

    const editLinkName =
      "Edit Enzyme Kinetics Inhibition Study Across Temperature Gradients";

    expect(screen.getByRole("link", { name: editLinkName })).toHaveAttribute(
      "href",
      "/projects/PRJ-101?edit=true&from=pipeline",
    );

    fireEvent.click(screen.getByRole("button", { name: "Columns" }));

    expect(screen.getByRole("link", { name: editLinkName })).toHaveAttribute(
      "href",
      "/projects/PRJ-101?edit=true&from=pipeline",
    );
  });

  it("moves a project to another stage with drag and drop", async () => {
    render(
      <MemoryRouter>
        <PipelinePage />
      </MemoryRouter>,
    );

    const projectTitle = "Enzyme Kinetics Inhibition Study Across Temperature Gradients";
    const projectCard = screen.getByText(projectTitle).closest('[draggable="true"]');
    const targetStage = screen.getByRole("group", {
      name: "Data Collection stage drop zone",
    });
    const data = new Map<string, string>();
    const dataTransfer = {
      effectAllowed: "none",
      dropEffect: "none",
      setData: (type: string, value: string) => data.set(type, value),
      getData: (type: string) => data.get(type) ?? "",
    };

    expect(projectCard).not.toBeNull();
    fireEvent.dragStart(projectCard!, { dataTransfer });
    fireEvent.dragOver(targetStage, { dataTransfer });
    fireEvent.drop(targetStage, { dataTransfer });

    await waitFor(() =>
      expect(within(targetStage).getByText(projectTitle)).toBeInTheDocument(),
    );
  });

  it("also allows a project stage to be changed without dragging", async () => {
    render(
      <MemoryRouter>
        <PipelinePage />
      </MemoryRouter>,
    );

    const projectTitle = "Enzyme Kinetics Inhibition Study Across Temperature Gradients";
    fireEvent.change(
      screen.getByRole("combobox", { name: `Move ${projectTitle} to stage` }),
      { target: { value: "2" } },
    );

    const targetStage = screen.getByRole("group", {
      name: "Data Collection stage drop zone",
    });
    await waitFor(() =>
      expect(within(targetStage).getByText(projectTitle)).toBeInTheDocument(),
    );
  });

  it("adds a custom pipeline stage", async () => {
    render(
      <MemoryRouter>
        <PipelinePage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Manage stages" }));
    fireEvent.change(screen.getByRole("textbox", { name: "New stage name" }), {
      target: { value: "Knowledge Translation" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add Stage" }));
    fireEvent.click(screen.getByRole("button", { name: "Done" }));

    await waitFor(() =>
      expect(
        screen.getByRole("group", { name: "Knowledge Translation stage drop zone" }),
      ).toBeInTheDocument(),
    );
  });

  it("deletes a custom pipeline stage", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(
      <MemoryRouter>
        <PipelinePage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Manage stages" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete Study Design & Protocol" }));
    fireEvent.click(screen.getByRole("button", { name: "Done" }));

    await waitFor(() =>
      expect(
        screen.queryByRole("group", { name: "Study Design & Protocol stage drop zone" }),
      ).not.toBeInTheDocument(),
    );
    expect(
      screen.getByText(/project without a pipeline stage/),
    ).toBeInTheDocument();
  });
});
