import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DailyNotesPage from "@/pages/daily-notes";

type NoteFixture = {
  id: string;
  displayId: string | null;
  tenantId: string;
  projectId: string | null;
  moduleId: string | null;
  createdBy: string;
  title: string;
  content: string | null;
  visibility: string | null;
  createdAt: string;
  updatedAt: string;
};

// Mirrors react-query's cache-subscription behaviour so hand-written mocks
// still trigger a re-render when the underlying fixture data changes.
const store = vi.hoisted(() => {
  let notes: NoteFixture[] = [];
  const listeners = new Set<() => void>();
  return {
    getNotes: () => notes,
    setNotes: (next: NoteFixture[]) => {
      notes = next;
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
  projects: [{ id: "project-1", title: "Genome Project" }],
  members: [
    {
      id: "membership-owner",
      userId: "user-owner",
      displayName: "Avi Researcher",
      email: "owner@example.com",
      role: "owner",
    },
    {
      id: "membership-collaborator",
      userId: "user-collaborator",
      displayName: "Jamie Collaborator",
      email: "jamie@example.com",
      role: "limited_member",
    },
  ],
}));

vi.mock("@/api/client", () => ({
  apiClient: {
    POST: vi.fn().mockResolvedValue({ data: {}, error: undefined, response: new Response() }),
  },
}));

vi.mock("@/api/hooks", async () => {
  const { useSyncExternalStore } = await import("react");
  return {
    useCurrentWorkspace: () => ({ data: { id: fixtures.tenantId }, isPending: false }),
    useMembers: () => ({ data: fixtures.members, isPending: false }),
    useProjects: () => ({ data: fixtures.projects, isPending: false, isError: false }),
    useModules: () => ({ data: [] }),
    useNotes: () => ({
      data: useSyncExternalStore(store.subscribe, store.getNotes),
      isPending: false,
      isError: false,
      error: undefined,
      refetch: vi.fn(),
    }),
    useCreateNote: () => ({
      mutateAsync: vi.fn(async (input: Record<string, unknown>) => {
        const notes = store.getNotes();
        const note: NoteFixture = {
          id: `note-${notes.length + 1}`,
          displayId: `NTE-${String(notes.length + 1).padStart(3, "0")}`,
          tenantId: fixtures.tenantId,
          projectId: (input.projectId as string | undefined) ?? null,
          moduleId: (input.moduleId as string | undefined) ?? null,
          createdBy: "user-owner",
          title: input.title as string,
          content: (input.content as string | undefined) ?? null,
          visibility: (input.visibility as string | undefined) ?? "Private",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        };
        store.setNotes([note, ...notes]);
        return note;
      }),
    }),
    useUpdateNote: () => ({
      mutateAsync: vi.fn(
        async ({ noteId, input }: { noteId: string; input: Record<string, unknown> }) => {
          const updated = store.getNotes().map((item) =>
            item.id === noteId
              ? {
                  ...item,
                  ...input,
                  projectId:
                    input.projectId === "" ? null : (input.projectId as string | undefined) ?? item.projectId,
                  moduleId:
                    input.moduleId === "" ? null : (input.moduleId as string | undefined) ?? item.moduleId,
                }
              : item,
          );
          store.setNotes(updated);
          return updated.find((item) => item.id === noteId);
        },
      ),
    }),
    useDeleteNote: () => ({
      mutateAsync: vi.fn(async (noteId: string) => {
        store.setNotes(store.getNotes().filter((item) => item.id !== noteId));
      }),
    }),
    useNoteMembers: () => ({ data: [], isPending: false }),
    useAddNoteMember: () => ({ mutate: vi.fn() }),
    useRemoveNoteMember: () => ({ mutate: vi.fn() }),
  };
});

describe("DailyNotesPage", () => {
  beforeEach(() => {
    store.setNotes([
      {
        id: "note-1",
        displayId: "NTE-001",
        tenantId: fixtures.tenantId,
        projectId: null,
        moduleId: null,
        createdBy: "user-owner",
        title: "Initial observations",
        content: "Baseline readings look consistent.",
        visibility: "Private",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ]);
  });

  it("creates a general note", async () => {
    render(
      <MemoryRouter>
        <DailyNotesPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add note" }));
    fireEvent.change(screen.getByLabelText("Note title"), {
      target: { value: "Reagent calibration notes" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save note" }));

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Reagent calibration notes" }),
      ).toBeInTheDocument(),
    );
  });

  it("shows a project-select field when the Project link target is chosen", () => {
    render(
      <MemoryRouter>
        <DailyNotesPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add note" }));
    fireEvent.click(screen.getByRole("button", { name: "Project" }));

    expect(screen.getByText("Select a project")).toBeInTheDocument();
  });

  it("edits an existing note's title and content", async () => {
    render(
      <MemoryRouter>
        <DailyNotesPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit note" }));
    fireEvent.change(screen.getByLabelText("Note title"), {
      target: { value: "Updated observations" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save note" }));

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Updated observations" })).toBeInTheDocument(),
    );
  });

  it("deletes the selected note", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(
      <MemoryRouter>
        <DailyNotesPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Initial observations" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete note" }));

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "No note selected" })).toBeInTheDocument(),
    );
  });
});
