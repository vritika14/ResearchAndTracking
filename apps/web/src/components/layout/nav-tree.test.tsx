import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { NavTree } from "@/components/layout/nav-tree";

vi.mock("@/api/hooks", () => ({
  useMe: () => ({ data: { profileComplete: false } }),
}));

describe("NavTree", () => {
  it("marks Settings when the user's profile is incomplete", () => {
    render(
      <MemoryRouter>
        <NavTree />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText("Profile incomplete")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Settings/ })).toHaveAttribute(
      "href",
      "/settings",
    );
  });
});
