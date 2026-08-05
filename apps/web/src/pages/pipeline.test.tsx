import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import PipelinePage from "@/pages/pipeline";

describe("PipelinePage", () => {
  it("provides project edit actions in flow and column views", () => {
    render(
      <MemoryRouter>
        <PipelinePage />
      </MemoryRouter>,
    );

    const editLinkName =
      "Edit Enzyme Kinetics Inhibition Study Across Temperature Gradients";

    expect(screen.getByRole("link", { name: editLinkName })).toHaveAttribute(
      "href",
      "/projects/PRJ-101?edit=true&from=pipeline",
    );

    fireEvent.click(screen.getByRole("button", { name: "Columns" }));

    expect(screen.getByRole("link", { name: editLinkName })).toHaveAttribute(
      "href",
      "/projects/PRJ-101?edit=true&from=pipeline",
    );
  });
});
