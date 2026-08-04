import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import InvitationAcceptancePage from "@/pages/invitation-acceptance";

const mockUseAuth = vi.fn();

vi.mock("react-oidc-context", () => ({
  useAuth: () => mockUseAuth(),
}));

function renderInvitation(path = "/invitations/demo-token") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/invitations/:token" element={<InvitationAcceptancePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("InvitationAcceptancePage", () => {
  it("lets an authenticated user accept a pending invitation", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { profile: { email: "test@example.com" } },
    });

    renderInvitation();
    fireEvent.click(screen.getByRole("button", { name: "Accept Invitation" }));

    expect(screen.getByRole("heading", { name: "Invitation accepted" })).toBeInTheDocument();
  });

  it("preserves the invitation route when sending a signed-out user to Cognito", () => {
    const signinRedirect = vi.fn();
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      signinRedirect,
    });

    renderInvitation();
    fireEvent.click(screen.getByRole("button", { name: "Sign In to Accept" }));

    expect(signinRedirect).toHaveBeenCalledWith({
      state: { returnTo: "/invitations/demo-token" },
    });
  });

  it("shows an expired invitation state", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });

    renderInvitation("/invitations/demo-token?status=expired");

    expect(screen.getByRole("heading", { name: "This invitation has expired" })).toBeInTheDocument();
  });
});
