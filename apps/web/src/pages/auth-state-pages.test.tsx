import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AccessDeniedPage from "@/pages/access-denied";
import MembershipStatusPage from "@/pages/membership-status";
import SessionExpiredPage from "@/pages/session-expired";

const mockUseAuth = vi.fn();
const removeUser = vi.fn();
const signinRedirect = vi.fn();

vi.mock("react-oidc-context", () => ({
  useAuth: () => mockUseAuth(),
}));

beforeEach(() => {
  removeUser.mockReset().mockResolvedValue(undefined);
  signinRedirect.mockReset().mockResolvedValue(undefined);
  mockUseAuth.mockReturnValue({
    error: undefined,
    isAuthenticated: true,
    removeUser,
    signinRedirect,
  });
});

describe("SessionExpiredPage", () => {
  it("signs in again and preserves a safe return path", async () => {
    render(
      <MemoryRouter initialEntries={["/session-expired?returnTo=%2Fprojects%2Fresearch"]}>
        <SessionExpiredPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Sign In Again" }));

    await waitFor(() => expect(removeUser).toHaveBeenCalledOnce());
    expect(signinRedirect).toHaveBeenCalledWith({
      state: { returnTo: "/projects/research" },
    });
  });

  it("rejects an external return URL", async () => {
    render(
      <MemoryRouter initialEntries={["/session-expired?returnTo=https%3A%2F%2Fexample.com"]}>
        <SessionExpiredPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Sign In Again" }));

    await waitFor(() =>
      expect(signinRedirect).toHaveBeenCalledWith({ state: { returnTo: "/" } }),
    );
  });
});

describe("AccessDeniedPage", () => {
  it("returns an authenticated user to the workspace", () => {
    render(
      <MemoryRouter initialEntries={["/access-denied"]}>
        <Routes>
          <Route path="access-denied" element={<AccessDeniedPage />} />
          <Route index element={<p>Workspace home</p>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Return to Workspace" }));

    expect(screen.getByText("Workspace home")).toBeInTheDocument();
  });
});

describe("MembershipStatusPage", () => {
  it.each([
    ["pending", "Your workspace access is being prepared"],
    ["suspended", "Your workspace access is paused"],
    ["inactive", "You are no longer an active member"],
  ])("shows the %s membership state", (status, heading) => {
    render(
      <MemoryRouter initialEntries={[`/membership-status/${status}?workspace=Research%20Operations`]}>
        <Routes>
          <Route path="membership-status/:status" element={<MembershipStatusPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    expect(screen.getByText("Workspace: Research Operations")).toBeInTheDocument();
  });

  it("redirects an unknown membership state to access denied", () => {
    render(
      <MemoryRouter initialEntries={["/membership-status/unknown"]}>
        <Routes>
          <Route path="membership-status/:status" element={<MembershipStatusPage />} />
          <Route path="access-denied" element={<p>Access denied route</p>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Access denied route")).toBeInTheDocument();
  });
});
