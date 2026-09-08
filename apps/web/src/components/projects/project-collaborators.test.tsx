import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProjectCollaborators } from "@/components/projects/project-collaborators";
import type { ApiCollaborator, Membership } from "@/api/hooks";

const timestamps = { createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" };

const collaborators: ApiCollaborator[] = [
  { id: "collab-1", tenantId: "tenant-1", userId: "user-alice", role: "Editor", displayName: "Alice Anders", email: "alice@example.com", ...timestamps },
  { id: "collab-2", tenantId: "tenant-1", userId: "user-bob", role: "Viewer", displayName: "Bob Baker", email: "bob@example.com", ...timestamps },
];

const removeCollaboratorMutate = vi.fn();

vi.mock("@/api/hooks", async () => {
  const actual = await vi.importActual<typeof import("@/api/hooks")>("@/api/hooks");
  return {
    ...actual,
    useProjectCollaborators: () => ({ data: collaborators, isPending: false }),
    useRemoveProjectCollaborator: () => ({ mutate: removeCollaboratorMutate }),
  };
});

vi.mock("@/components/sharing/invitation-panel", () => ({
  InvitationPanel: () => <div data-testid="invitation-panel" />,
}));

const members: Membership[] = [];

describe("ProjectCollaborators", () => {
  it("filters the collaborator list by name as you type", () => {
    render(
      <ProjectCollaborators
        tenantId="tenant-1"
        projectId="project-1"
        ownerUserId="user-owner"
        members={members}
        entityTitle="Genome Project"
        canManage
      />,
    );

    expect(screen.getByText("Alice Anders")).toBeInTheDocument();
    expect(screen.getByText("Bob Baker")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Search collaborators by name"), {
      target: { value: "ali" },
    });

    expect(screen.getByText("Alice Anders")).toBeInTheDocument();
    expect(screen.queryByText("Bob Baker")).not.toBeInTheDocument();
  });

  it("shows a no-match message when the search finds nobody", () => {
    render(
      <ProjectCollaborators
        tenantId="tenant-1"
        projectId="project-1"
        ownerUserId="user-owner"
        members={members}
        entityTitle="Genome Project"
        canManage
      />,
    );

    fireEvent.change(screen.getByLabelText("Search collaborators by name"), {
      target: { value: "zzz" },
    });

    expect(screen.getByText('No collaborators match "zzz".')).toBeInTheDocument();
  });
});
