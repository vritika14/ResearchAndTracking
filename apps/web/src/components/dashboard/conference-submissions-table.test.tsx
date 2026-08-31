import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import { ConferenceSubmissionsTable } from "@/components/dashboard/conference-submissions-table";

type ConferenceFixture = {
  id: string;
  tenantId: string;
  ownerUserId: string;
  acronym: string;
  name: string;
  location: string;
  submissionDue: string;
  startDate: string;
  endDate: string;
  submissionType: string | null;
  daysRemaining: number;
  projects: Array<{ id: string; displayId: string; title: string }>;
  createdAt: string;
  updatedAt: string;
};

const store = vi.hoisted(() => {
  let conferences: ConferenceFixture[] = [];
  const listeners = new Set<() => void>();
  return {
    get: () => conferences,
    set: (next: ConferenceFixture[]) => {
      conferences = next;
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
  userId: "user-1",
  project: {
    id: "project-1",
    displayId: "PRJ-001",
    title: "Genome Project",
    userId: "user-1",
    role: "owner",
  },
}));

vi.mock("@/api/hooks", async () => {
  const { useSyncExternalStore } = await import("react");
  return {
    useCurrentWorkspace: () => ({ data: { id: fixtures.tenantId }, isPending: false }),
    useMe: () => ({ data: { id: fixtures.userId }, isPending: false }),
    useProjects: () => ({ data: [fixtures.project], isPending: false }),
    useConferences: () => ({
      data: useSyncExternalStore(store.subscribe, store.get),
      isPending: false,
      isError: false,
      error: null,
    }),
    useCreateConference: () => ({
      mutateAsync: vi.fn(async (input: Record<string, unknown>) => {
        const row: ConferenceFixture = {
          id: "conference-new",
          tenantId: fixtures.tenantId,
          ownerUserId: fixtures.userId,
          acronym: input.acronym as string,
          name: input.name as string,
          location: input.location as string,
          submissionDue: input.submissionDue as string,
          startDate: input.startDate as string,
          endDate: input.endDate as string,
          submissionType: input.submissionType as string,
          daysRemaining: 90,
          projects: [{
            id: fixtures.project.id,
            displayId: fixtures.project.displayId,
            title: fixtures.project.title,
          }],
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        };
        store.set([...store.get(), row]);
        return row;
      }),
    }),
    useUpdateConference: () => ({
      mutateAsync: vi.fn(async ({ conferenceId, input }: {
        conferenceId: string;
        input: Record<string, unknown>;
      }) => {
        store.set(store.get().map((row) => row.id === conferenceId ? {
          ...row,
          ...input,
          projects: row.projects,
        } : row));
      }),
    }),
    useDeleteConference: () => ({
      mutateAsync: vi.fn(async (conferenceId: string) => {
        store.set(store.get().filter((row) => row.id !== conferenceId));
      }),
    }),
  };
});

describe("ConferenceSubmissionsTable", () => {
  beforeEach(() => store.set([]));

  it("creates, edits, and deletes a conference through the API hooks", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<MemoryRouter><ConferenceSubmissionsTable showPast /></MemoryRouter>);

    fireEvent.click(screen.getByRole("button", { name: "New Conference" }));
    fireEvent.change(screen.getByRole("textbox", { name: /Acronym/ }), { target: { value: "Test" } });
    fireEvent.change(screen.getByRole("textbox", { name: /Conference name/ }), { target: { value: "Test Research Conference 2027" } });
    fireEvent.change(screen.getByRole("textbox", { name: /Location/ }), { target: { value: "Sydney, Australia" } });

    const dateInputs = document.querySelectorAll<HTMLInputElement>('input[type="date"]');
    fireEvent.change(dateInputs[0], { target: { value: "2026-12-01" } });
    fireEvent.change(dateInputs[1], { target: { value: "2027-03-04" } });
    fireEvent.change(dateInputs[2], { target: { value: "2027-03-06" } });
    fireEvent.click(screen.getByRole("checkbox", { name: /Genome Project/ }));
    fireEvent.click(screen.getByRole("button", { name: "Add Conference" }));

    await waitFor(() => expect(screen.getByText("Test Research Conference 2027")).toBeInTheDocument());
    expect(screen.getByText("PRJ-001")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Edit Test Research Conference 2027" }));
    fireEvent.change(screen.getByRole("textbox", { name: /Conference name/ }), { target: { value: "Updated Research Conference 2027" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(screen.getByText("Updated Research Conference 2027")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Delete Updated Research Conference 2027" }));

    expect(confirm).toHaveBeenCalledWith('Delete "Updated Research Conference 2027"? This action cannot be undone.');
    await waitFor(() => expect(screen.queryByText("Updated Research Conference 2027")).not.toBeInTheDocument());
  });
});
