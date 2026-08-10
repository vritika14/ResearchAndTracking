import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import WorkspaceOnboardingPage from "@/pages/workspace-onboarding";

const mutateAsync = vi.fn().mockResolvedValue({ id: "workspace-1", name: "Translational Research Lab" });

vi.mock("@/api/hooks", () => ({
  useCreateWorkspace: () => ({ mutateAsync, isPending: false, isError: false }),
}));

describe("WorkspaceOnboardingPage", () => {
  it("creates a workspace through the API mutation", async () => {
    render(<MemoryRouter><WorkspaceOnboardingPage /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText(/workspace name/i), { target: { value: "Translational Research Lab" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Workspace" }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith("Translational Research Lab"));
  });

  it("validates the workspace name before calling the API", async () => {
    mutateAsync.mockClear();
    render(<MemoryRouter><WorkspaceOnboardingPage /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText(/workspace name/i), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Workspace" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Use at least 2 characters");
    expect(mutateAsync).not.toHaveBeenCalled();
  });
});
