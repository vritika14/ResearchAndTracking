import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import SiteMapPage from "@/pages/site-map";
import { navGroups } from "@/config/nav-items";

describe("SiteMapPage", () => {
  it("links to every section from every nav group", () => {
    render(
      <MemoryRouter initialEntries={["/site-map"]}>
        <SiteMapPage />
      </MemoryRouter>,
    );

    for (const group of navGroups) {
      for (const item of group.items) {
        const link = screen.getByRole("link", { name: new RegExp(item.label) });
        expect(link).toHaveAttribute("href", item.to);
      }
    }
  });
});
