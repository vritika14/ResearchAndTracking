import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { NavTree } from "@/components/layout/nav-tree";

describe("NavTree", () => {
  it("does not list Settings (moved to the account menu at the bottom of the sidebar)", () => {
    render(
      <MemoryRouter>
        <NavTree />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("link", { name: /Settings/ })).not.toBeInTheDocument();
  });

  it("lists Account Audit under Potential Future Features", () => {
    render(
      <MemoryRouter>
        <NavTree />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /Account Audit/ })).toHaveAttribute(
      "href",
      "/settings/account-audit",
    );
  });
});
