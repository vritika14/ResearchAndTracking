import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ModuleCollaboratorsManager } from "@/components/modules/module-collaborators";
import type { ApiCollaborator, Membership } from "@/api/hooks";

const timestamps = { createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" };

const collaborators: ApiCollaborator[] = [
  { id: "collab-1", tenantId: "tenant-1", userId: "user-owner", role: "Owner", displayName: "Owner Person", email: "owner@example.com", ...timestamps },
  { id: "collab-2", tenantId: "tenant-1", userId: "user-alice", role: "Editor", displayName: "Alice Anders", email: "alice@example.com", ...timestamps },
  { id: "collab-3", tenantId: "tenant-1", userId: "user-bob", role: "Viewer", displayName: "Bob Baker", email: "bob@example.com", ...timestamps },
];

const removeCollaboratorMutate = vi.fn();

vi.mock("@/api/hooks", async () => {
  const actual = await vi.importActual<typeof import("@/api/hooks")>("@/api/hooks");
  return {
    ...actual,
    useModuleCollaborators: () => ({ data: collaborators, isPending: false }),
    useRemoveModuleCollaborator: () => ({ mutate: removeCollaboratorMutate }),
    useMe: () => ({ data: { id: "user-owner" }, isPending: false }),
    useEnumValues: () => ({ data: [], isPending: false }),
  };
});

vi.mock("@/components/sharing/invitation-panel", () => ({
  InvitationPanel: () => <div data-testid="invitation-panel" />,
}));

const members: Membership[] = [];

describe("ModuleCollaboratorsManager", () => {
  it("filters the collaborator list by name as you type", () => {
    render(
      <ModuleCollaboratorsManager
        tenantId="tenant-1"
        moduleId="module-1"
        moduleTitle="Sequencing pipeline"
        members={members}
      />,
    );

    expect(screen.getByText("Alice Anders")).toBeInTheDocument();
    expect(screen.getByText("Bob Baker")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Search collaborators by name"), {
      target: { value: "bob" },
    });

    expect(screen.getByText("Bob Baker")).toBeInTheDocument();
    expect(screen.queryByText("Alice Anders")).not.toBeInTheDocument();
  });

  it("shows a no-match message when the search finds nobody", () => {
    render(
      <ModuleCollaboratorsManager
        tenantId="tenant-1"
        moduleId="module-1"
        moduleTitle="Sequencing pipeline"
        members={members}
      />,
    );

    fireEvent.change(screen.getByLabelText("Search collaborators by name"), {
      target: { value: "zzz" },
    });

    expect(screen.getByText('No collaborators match "zzz".')).toBeInTheDocument();
  });
});
