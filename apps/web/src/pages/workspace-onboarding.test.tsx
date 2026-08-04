import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import WorkspaceOnboardingPage from "@/pages/workspace-onboarding";

vi.mock("react-oidc-context", () => ({
  useAuth: () => ({
    user: { profile: { name: "Dr. Test Researcher", email: "test@example.com" } },
  }),
}));

describe("WorkspaceOnboardingPage", () => {
  it("creates a workspace from the first-run form", () => {
    render(
      <MemoryRouter>
        <WorkspaceOnboardingPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/workspace name/i), {
      target: { value: "Translational Research Lab" },
    });

    expect(screen.getByLabelText(/workspace identifier/i)).toHaveValue(
      "translational-research-lab",
    );

    fireEvent.click(screen.getByRole("button", { name: "Create Workspace" }));

    expect(screen.getByRole("heading", { name: "Your workspace is ready" })).toBeInTheDocument();
    expect(screen.getByText("Translational Research Lab")).toBeInTheDocument();
  });
});
