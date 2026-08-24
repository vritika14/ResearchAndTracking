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
        name: "Second Lab",
        slug: "second-lab",
        membershipRole: "owner",
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
    expect(screen.getByText("Second Lab")).toBeInTheDocument();
    expect(screen.getAllByText("Owner")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Switch workspace" }));
    expect(switchWorkspace).toHaveBeenCalledWith("workspace-2");
  });
});
