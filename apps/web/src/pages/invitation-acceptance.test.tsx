import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/client";
import InvitationAcceptancePage from "@/pages/invitation-acceptance";

const mockUseAuth = vi.fn();
const accept = vi.fn();
let previewResult: Record<string, unknown>;

vi.mock("react-oidc-context", () => ({ useAuth: () => mockUseAuth() }));
vi.mock("@/api/hooks", () => ({
  useInvitationPreview: () => previewResult,
  useAcceptInvitation: () => ({ mutate: accept, isPending: false, isSuccess: false }),
}));

function renderInvitation(path = "/invitations/demo-token") {
  return render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/invitations/:token" element={<InvitationAcceptancePage />} /></Routes></MemoryRouter>);
}

describe("InvitationAcceptancePage", () => {
  beforeEach(() => {
    accept.mockClear();
    previewResult = { isPending: false, isError: false, data: { workspaceName: "Research Operations", invitedEmail: "te**@example.com", role: "limited_member", expiresAt: "2026-08-17T00:00:00Z" } };
  });

  it("calls the real acceptance mutation for an authenticated user", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false, user: { profile: { email: "test@example.com" } } });
    renderInvitation();
    fireEvent.click(screen.getByRole("button", { name: "Accept Invitation" }));
    expect(accept).toHaveBeenCalledOnce();
  });

  it("preserves the invitation route when sending a signed-out user to Cognito", () => {
    const signinRedirect = vi.fn();
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false, signinRedirect });
    renderInvitation();
    fireEvent.click(screen.getByRole("button", { name: "Sign In to Accept" }));
    expect(signinRedirect).toHaveBeenCalledWith({ state: { returnTo: "/invitations/demo-token" } });
  });

  it("shows an expired invitation returned by the API", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });
    previewResult = { isPending: false, isError: true, error: new ApiError(410, "Expired"), refetch: vi.fn() };
    renderInvitation();
    expect(screen.getByRole("heading", { name: "This invitation has expired" })).toBeInTheDocument();
  });
});
