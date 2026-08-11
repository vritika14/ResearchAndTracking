import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import WorkspacesPage from "@/pages/workspaces";

const switchWorkspace = vi.fn();
const createWorkspace = vi.fn();

vi.mock("@/api/hooks", () => ({
  useWorkspaces: () => ({
    data: [
      {
        id: "workspace-1",
        name: "Owned Lab",
        slug: "owned-lab",
        membershipRole: "owner",
      },
      {
        id: "workspace-2",
        name: "Shared Study",
        slug: "shared-study",
        membershipRole: "limited_member",
      },
    ],
    isPending: false,
    isError: false,
  }),
  useCurrentWorkspace: () => ({
    data: { id: "workspace-1" },
    isPending: false,
  }),
  useSwitchWorkspace: () => ({
    mutateAsync: switchWorkspace,
    isPending: false,
    isError: false,
  }),
  useCreateWorkspace: () => ({
    mutateAsync: createWorkspace,
    isPending: false,
    isError: false,
  }),
}));

describe("WorkspacesPage", () => {
  beforeEach(() => {
    switchWorkspace.mockReset().mockResolvedValue({ id: "workspace-2" });
    createWorkspace.mockReset().mockResolvedValue({ id: "workspace-3" });
  });

  it("shows available workspaces and switches to a non-current workspace", async () => {
    render(
      <MemoryRouter>
        <WorkspacesPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Owned Lab")).toBeInTheDocument();
    expect(screen.getByText("Shared Study")).toBeInTheDocument();
    expect(screen.getByText("Limited member")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Switch workspace" }));
    expect(switchWorkspace).toHaveBeenCalledWith("workspace-2");
  });
});
