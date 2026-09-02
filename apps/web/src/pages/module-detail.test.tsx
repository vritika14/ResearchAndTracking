import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ModuleDetailPage from "@/pages/module-detail";

const fixtures = vi.hoisted(() => ({
  updateModule: vi.fn(),
  module: {
    id: "module-1",
    displayId: "MOD-001",
    tenantId: "workspace-1",
    projectId: null,
    title: "Literature synthesis",
    description: null,
    tag: "Research Paper",
    status: "Active",
    pipelineStage: "Concept",
    dueDate: "2026-09-15",
    assignedToUserId: null,
    archivedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  stages: [
    {
      id: "stage-1",
      tenantId: null,
      category: "module_pipeline_stage",
      value: "Concept",
      sortOrder: 1,
      createdAt: "",
      updatedAt: "",
    },
    {
      id: "stage-2",
      tenantId: null,
      category: "module_pipeline_stage",
      value: "Publication",
      sortOrder: 2,
      createdAt: "",
      updatedAt: "",
    },
  ],
}));

vi.mock("@/api/hooks", () => ({
  useCurrentWorkspace: () => ({
    data: { id: "workspace-1" },
    isPending: false,
  }),
  useMyModule: () => ({
    data: fixtures.module,
    isPending: false,
    isError: false,
    error: undefined,
    refetch: vi.fn(),
  }),
  useMyModulePipelineStages: () => ({
    data: fixtures.stages,
    isPending: false,
    isError: false,
  }),
  useUpdateMyModule: () => ({
    mutateAsync: fixtures.updateModule,
    isPending: false,
  }),
  useTasks: () => ({ data: [] }),
  useNotes: () => ({ data: [] }),
  useMembers: () => ({ data: [], isPending: false }),
  useEnumValues: () => ({ data: [] }),
  useProject: () => ({ data: undefined, isError: false }),
  useModuleCollaborators: () => ({ data: [], isPending: false }),
  useRemoveModuleCollaborator: () => ({ mutate: vi.fn() }),
  useCollaboratorInvitations: () => ({
    data: [],
    isPending: false,
    isError: false,
  }),
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

describe("ModuleDetailPage", () => {
  beforeEach(() => {
    fixtures.module.pipelineStage = "Concept";
    fixtures.updateModule.mockReset();
    fixtures.updateModule.mockImplementation(
      async ({ input }: { input: Record<string, unknown> }) => {
        Object.assign(fixtures.module, input);
        return fixtures.module;
      },
    );
  });

  function renderPage() {
    render(
      <MemoryRouter initialEntries={["/modules/module-1"]}>
        <Routes>
          <Route path="modules/:moduleId" element={<ModuleDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it("shows only the module's selected stages in its bottom pipeline", () => {
    renderPage();

    const pipeline = screen.getByRole("region", { name: "Module pipeline" });
    expect(pipeline).toHaveTextContent("Concept");
    expect(pipeline).toHaveTextContent("Publication");
    expect(pipeline).not.toHaveTextContent("Analysis");
    expect(
      screen.getByRole("group", { name: "Concept stage, current stage" }),
    ).toContainElement(screen.getByLabelText(`Drag ${fixtures.module.title}`));
  });

  it("moves the module card when it is dropped onto another stage", async () => {
    renderPage();

    const dataTransfer = {
      effectAllowed: "none",
      dropEffect: "none",
      setData: vi.fn(),
      getData: vi.fn(() => fixtures.module.id),
    } as unknown as DataTransfer;
    const moduleCard = screen.getByLabelText(`Drag ${fixtures.module.title}`);
    const targetStage = screen.getByRole("group", {
      name: "Publication stage",
    });

    fireEvent.dragStart(moduleCard, { dataTransfer });
    fireEvent.dragOver(targetStage, { dataTransfer });
    fireEvent.drop(targetStage, { dataTransfer });

    await waitFor(() =>
      expect(fixtures.updateModule).toHaveBeenCalledWith({
        moduleId: "module-1",
        input: { pipelineStage: "Publication" },
      }),
    );
  });
});
