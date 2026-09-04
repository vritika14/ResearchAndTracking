import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PipelinePage from "@/pages/pipeline";
import { PreferencesContext } from "@/preferences/preferences-context";

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

type ModuleFixture = {
  id: string;
  displayId: string | null;
  tenantId: string;
  projectId: string | null;
  title: string;
  description: string | null;
  tag: string | null;
  status: string | null;
  pipelineStage: string | null;
  assignedToUserId: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
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

const modules = vi.hoisted(() => {
  let items: ModuleFixture[] = [];
  const listeners = new Set<() => void>();
  return {
    get: () => items,
    set: (next: ModuleFixture[]) => {
      items = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
});

const moduleStages = vi.hoisted(() => {
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
    useProjects: () => {
      const items = useSyncExternalStore(projects.subscribe, projects.get);
      return {
        data: { data: items, meta: { page: 1, pageSize: 20, totalItems: items.length, totalPages: 1 } },
        isPending: false,
        isError: false,
        error: undefined,
        refetch: vi.fn(),
      };
    },
    useTasks: () => ({ data: [] }),
    useMembers: () => ({ data: [] }),
    useModules: () => ({
      data: useSyncExternalStore(modules.subscribe, modules.get),
      isPending: false,
      isError: false,
      error: undefined,
      refetch: vi.fn(),
    }),
    usePipelineStages: () => ({
      data: useSyncExternalStore(stages.subscribe, stages.get),
      isPending: false,
    }),
    useModulePipelineStagePool: () => ({
      data: useSyncExternalStore(moduleStages.subscribe, moduleStages.get),
      isPending: false,
    }),
    useProjectPipelineStages: (_tenantId: string, projectId: string, enabled: boolean) => ({
      data: enabled
        ? stages.get().filter((stage) => (stage as StageFixture & { projectId?: string }).projectId === projectId)
        : undefined,
      isPending: false,
    }),
    useModulePipelineStages: (_tenantId: string, moduleId: string, enabled: boolean) => ({
      data: enabled
        ? moduleStages
            .get()
            .filter((stage) => (stage as StageFixture & { moduleId?: string }).moduleId === moduleId)
        : undefined,
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
    useUpdateModule: () => ({
      mutateAsync: vi.fn(
        async ({ moduleId, input }: { moduleId: string; input: Record<string, unknown> }) => {
          modules.set(
            modules.get().map((item) => (item.id === moduleId ? { ...item, ...input } : item)),
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
    useCreateModulePipelineStage: () => ({
      mutateAsync: vi.fn(async (input: { value: string; sortOrder?: number }) => {
        const current = moduleStages.get();
        const stage: StageFixture = {
          id: `mstage-${current.length + 1}`,
          tenantId: fixtures.tenantId,
          category: "module_pipeline_stage",
          value: input.value,
          sortOrder: input.sortOrder ?? current.length + 1,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        };
        moduleStages.set([...current, stage]);
        return stage;
      }),
    }),
    useDeleteModulePipelineStage: () => ({
      mutateAsync: vi.fn(async (id: string) => {
        moduleStages.set(moduleStages.get().filter((item) => item.id !== id));
      }),
    }),
    useCreateProjectPipelineStage: () => ({ mutateAsync: vi.fn() }),
    useDeleteProjectPipelineStage: () => ({ mutateAsync: vi.fn() }),
    useCreateModuleOwnPipelineStage: () => ({ mutateAsync: vi.fn() }),
    useDeleteModuleOwnPipelineStage: () => ({ mutateAsync: vi.fn() }),
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

function baseModules(): ModuleFixture[] {
  return [
    {
      id: "MOD-201",
      displayId: "MOD-201",
      tenantId: "workspace-1",
      projectId: null,
      title: "Sample Preparation Protocol",
      description: null,
      tag: null,
      status: "Active",
      pipelineStage: "Backlog",
      assignedToUserId: null,
      archivedAt: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ];
}

function baseModuleStages(): StageFixture[] {
  return [
    {
      id: "mstage-1",
      tenantId: "workspace-1",
      category: "module_pipeline_stage",
      value: "Backlog",
      sortOrder: 1,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "mstage-2",
      tenantId: "workspace-1",
      category: "module_pipeline_stage",
      value: "In progress",
      sortOrder: 2,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ];
}

describe("PipelinePage", () => {
  beforeEach(() => {
    projects.set(baseProjects());
    stages.set(baseStages());
    modules.set(baseModules());
    moduleStages.set(baseModuleStages());
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

  it("hydrates and saves pipeline stage visibility for the workspace", async () => {
    const updatePipelineHiddenStages = vi.fn();
    render(
      <MemoryRouter>
        <PreferencesContext.Provider
          value={{
            workspaceId: "workspace-1",
            workspacePreferences: {
              pipelineHiddenStages: { "project:all": ["Data Collection"] },
            },
            updateDashboardLayout: vi.fn(),
            updateTableColumns: vi.fn(),
            updatePipelineHiddenStages,
          }}
        >
          <PipelinePage />
        </PreferencesContext.Provider>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(
        screen.queryByRole("group", { name: "Data Collection stage drop zone" }),
      ).not.toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Manage stages" }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Data Collection/ }));

    expect(updatePipelineHiddenStages).toHaveBeenCalledWith("project:all", []);
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

  it("switches to the module pipeline and shows modules grouped by the module stage pool", () => {
    render(
      <MemoryRouter>
        <PipelinePage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Module pipeline" }));

    expect(
      screen.getByRole("group", { name: "Backlog stage drop zone" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Sample Preparation Protocol")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Edit Sample Preparation Protocol" }),
    ).toHaveAttribute("href", "/modules/MOD-201?edit=true&from=pipeline");
  });

  it("filtering to one project shows only that project, positioned in its own stage list", () => {
    stages.set([
      ...baseStages(),
      {
        id: "stage-own-1",
        tenantId: null,
        projectId: "PRJ-101",
        category: "project_pipeline_stage",
        value: "Custom Kickoff",
        sortOrder: 1,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ] as StageFixture[]);

    render(
      <MemoryRouter>
        <PipelinePage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("combobox", { name: "Filter by project" }));
    fireEvent.click(
      screen.getByRole("option", {
        name: "Enzyme Kinetics Inhibition Study Across Temperature Gradients",
      }),
    );

    expect(
      screen.getByRole("group", { name: "Custom Kickoff stage drop zone" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("group", { name: "Literature Review stage drop zone" }),
    ).not.toBeInTheDocument();
  });

  it("filtering the module pipeline by project shows only modules linked to that project", () => {
    modules.set([
      ...baseModules(),
      {
        id: "MOD-202",
        displayId: "MOD-202",
        tenantId: "workspace-1",
        projectId: "PRJ-101",
        title: "Reagent Calibration",
        description: null,
        tag: null,
        status: "Active",
        pipelineStage: "Backlog",
        assignedToUserId: null,
        archivedAt: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ]);

    render(
      <MemoryRouter>
        <PipelinePage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Module pipeline" }));

    expect(screen.getByText("Sample Preparation Protocol")).toBeInTheDocument();
    expect(screen.getByText("Reagent Calibration")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("combobox", { name: "Filter by project" }));
    fireEvent.click(
      screen.getByRole("option", {
        name: "Enzyme Kinetics Inhibition Study Across Temperature Gradients",
      }),
    );

    expect(screen.getByText("Reagent Calibration")).toBeInTheDocument();
    expect(
      screen.queryByText("Sample Preparation Protocol"),
    ).not.toBeInTheDocument();
  });
});
