import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WorkspaceMembers } from "@/components/settings/workspace-members";

vi.mock("@/api/hooks", () => ({
  useMe: () => ({ data: { id: "owner-1" } }),
  useCurrentWorkspace: () => ({
    data: { id: "tenant-1", name: "Research Lab", ownerUserId: "owner-1" },
  }),
  useMembers: () => ({ data: [], isPending: false, isError: false }),
  useCreateInvitation: () => ({
    data: {
      emailSent: true,
      invitation: { email: "member@example.com" },
    },
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
  }),
  useRevokeMember: () => ({ mutate: vi.fn(), isPending: false, isError: false }),
}));

describe("WorkspaceMembers", () => {
  it("shows server-confirmed email delivery without a mail-client link", () => {
    render(<WorkspaceMembers />);

    expect(
      screen.getByRole("button", { name: "Send invitation" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Invitation sent")).toBeInTheDocument();
    expect(screen.getByText(/member@example.com/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Email invitation/ })).toBeNull();
  });
});
