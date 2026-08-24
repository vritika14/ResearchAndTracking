import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WorkspaceMembers } from "@/components/settings/workspace-members";

vi.mock("@/api/hooks", () => ({
  useMe: () => ({ data: { id: "owner-1", displayName: "Avi Researcher" } }),
  useCurrentWorkspace: () => ({
    data: { id: "tenant-1", name: "Research Lab", ownerUserId: "owner-1" },
  }),
}));

describe("WorkspaceMembers", () => {
  it("confirms the caller is the sole owner, with no invite or sharing UI", () => {
    render(<WorkspaceMembers />);

    expect(screen.getByText(/You are the sole owner of/)).toBeInTheDocument();
    expect(screen.getByText("Research Lab")).toBeInTheDocument();
    expect(screen.getByText("Avi Researcher")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Send invitation/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Remove/ })).toBeNull();
    expect(screen.queryByLabelText(/Invitee email/i)).toBeNull();
  });
});
