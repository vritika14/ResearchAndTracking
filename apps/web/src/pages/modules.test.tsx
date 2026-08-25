import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ModulesPage from "@/pages/modules";

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

// A minimal reactive store standing in for react-query's cache subscription:
// mutating fixtures.modules in the real app always yields a fresh array from
// a refetch, which react-query then pushes to every subscribed component.
// Plain mock functions can't replicate that push, so components here
// subscribe via useSyncExternalStore and get notified on every mutation.
const store = vi.hoisted(() => {
  let modules: ModuleFixture[] = [];
  const listeners = new Set<() => void>();
  return {
    getModules: () => modules,
    setModules: (next: ModuleFixture[]) => {
      modules = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
});

const fixtures = vi.hoisted(() => ({
  tenantId: "workspace-1",
  projects: [] as Array<{ id: string; title: string }>,
  members: [
    {
      id: "membership-owner",
      userId: "user-owner",
      displayName: "Avi Researcher",
      email: "owner@example.com",
      role: "owner",
    },
  ],
  tagValues: [
    { id: "tag-1", tenantId: null, category: "module_type", value: "Research Paper", sortOrder: 1, createdAt: "", updatedAt: "" },
  ],
  stageValues: [
    { id: "stage-1", tenantId: null, category: "module_pipeline_stage", value: "Concept & Ideation", sortOrder: 1, createdAt: "", updatedAt: "" },
    { id: "stage-2", tenantId: null, category: "module_pipeline_stage", value: "Literature Review", sortOrder: 2, createdAt: "", updatedAt: "" },
  ],
  // Proves the "Collaborators" search hits the platform-wide user-search
  // endpoint, not a workspace-member list.
  allUsers: [
    { id: "user-outside-workspace", displayName: "Jamie Outsider", email: "jamie@example.com" },
  ],
}));

vi.mock("@/api/client", () => ({
  apiClient: {
    POST: vi.fn().mockResolvedValue({ data: {}, error: undefined, response: new Response() }),
  },
}));

vi.mock("@/api/hooks", async () => {
  const { useSyncExternalStore: useStore } = await import("react");
  return {
    useCurrentWorkspace: () => ({ data: { id: fixtures.tenantId }, isPending: false }),
    useMembers: () => ({ data: fixtures.members, isPending: false }),
    useProjects: () => ({ data: fixtures.projects, isPending: false, isError: false }),
    useUserSearch: (query: string) => ({
      data: query.trim()
        ? fixtures.allUsers.filter((user) =>
            user.displayName.toLowerCase().includes(query.trim().toLowerCase()),
          )
        : [],
      isPending: false,
    }),
    useMyModules: () => ({
      data: useStore(store.subscribe, store.getModules),
      isPending: false,
      isError: false,
      error: undefined,
      refetch: vi.fn(),
    }),
    useEnumValues: (category: string) => ({
      data: category === "module_pipeline_stage" ? fixtures.stageValues : fixtures.tagValues,
    }),
    useModulePipelineStages: () => ({ data: fixtures.stageValues }),
    useCreateModule: () => ({
      mutateAsync: vi.fn(async (input: Record<string, unknown>) => {
        const modules = store.getModules();
        const module: ModuleFixture = {
          id: `module-${modules.length + 1}`,
          displayId: `MOD-${String(modules.length + 1).padStart(3, "0")}`,
          tenantId: fixtures.tenantId,
          projectId: (input.projectId as string | undefined) ?? null,
          title: input.title as string,
          description: (input.description as string | undefined) ?? null,
          tag: (input.tag as string | undefined) ?? null,
          status: (input.status as string | undefined) ?? "Active",
          pipelineStage: (input.pipelineStage as string | undefined) ?? null,
          assignedToUserId: (input.assignedToUserId as string | undefined) ?? null,
          archivedAt: null,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        };
        store.setModules([...modules, module]);
        return module;
      }),
    }),
    useUpdateMyModule: () => ({
      mutateAsync: vi.fn(
        async ({ moduleId, input }: { moduleId: string; input: Record<string, unknown> }) => {
          const updated = store.getModules().map((item) =>
            item.id === moduleId ? { ...item, ...input } : item,
          );
          store.setModules(updated);
          return updated.find((item) => item.id === moduleId);
        },
      ),
    }),
    useArchiveMyModule: () => ({
      mutateAsync: vi.fn(async (moduleId: string) => {
        store.setModules(store.getModules().filter((item) => item.id !== moduleId));
      }),
    }),
    useModuleCollaborators: () => ({ data: [], isPending: false }),
    useAddModuleCollaborator: () => ({ mutate: vi.fn() }),
    useRemoveModuleCollaborator: () => ({ mutate: vi.fn() }),
  };
});

describe("ModulesPage", () => {
  beforeEach(() => {
    store.setModules([
      {
        id: "module-1",
        displayId: "MOD-001",
        tenantId: fixtures.tenantId,
        projectId: null,
        title: "Literature synthesis",
        description: "",
        tag: null,
        status: "Active",
        pipelineStage: "Concept & Ideation",
        assignedToUserId: null,
        archivedAt: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ]);
    fixtures.projects = [];
  });

  it("creates an independent module and shows it in the table", async () => {
    render(
      <MemoryRouter>
        <ModulesPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "New Module" }));
    expect(screen.getByRole("textbox", { name: /Description/ })).not.toBeRequired();
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: /Starting stage/ })).toHaveTextContent(
        "Concept & Ideation",
      ),
    );
    fireEvent.change(screen.getByRole("textbox", { name: /Module title/ }), {
      target: { value: "Independent literature synthesis" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Module" }));

    await waitFor(() =>
      expect(screen.getByText("Independent literature synthesis")).toBeInTheDocument(),
    );
    expect(screen.getAllByText("Independent module").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Concept & Ideation").length).toBeGreaterThan(0);
  });

  it("edits an existing module", async () => {
    render(
      <MemoryRouter>
        <ModulesPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit Literature synthesis" }));
    fireEvent.change(screen.getByRole("textbox", { name: /Module title/ }), {
      target: { value: "Updated literature synthesis" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() =>
      expect(screen.getByText("Updated literature synthesis")).toBeInTheDocument(),
    );
  });

  it("archives a module", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(
      <MemoryRouter>
        <ModulesPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Archive Literature synthesis" }));
    expect(confirm).toHaveBeenCalled();

    await waitFor(() =>
      expect(screen.queryByText("Literature synthesis")).not.toBeInTheDocument(),
    );
  });

  it("allows a module to be linked to a project", () => {
    fixtures.projects = [{ id: "project-1", title: "Genome Project" }];
    render(
      <MemoryRouter>
        <ModulesPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "New Module" }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Independent module/ }));

    expect(screen.getByRole("combobox", { name: /Project/ })).toBeInTheDocument();
  });

  it("searches all platform users, not just workspace members, when sharing a new independent module", () => {
    render(
      <MemoryRouter>
        <ModulesPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "New Module" }));
    const collaboratorSearch = screen.getByRole("combobox", { name: "Collaborators" });
    fireEvent.change(collaboratorSearch, { target: { value: "Jamie" } });

    expect(screen.getByText("jamie@example.com")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: /Jamie Outsider/ }));
    expect(screen.getByLabelText("Selected module members")).toHaveTextContent(
      "Jamie Outsider",
    );
  });
});
