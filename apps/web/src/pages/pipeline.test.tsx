import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PipelinePage from "@/pages/pipeline";

describe("PipelinePage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

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

  it("moves a project to another stage with drag and drop", () => {
    render(
      <MemoryRouter>
        <PipelinePage />
      </MemoryRouter>,
    );

    const projectTitle = "Enzyme Kinetics Inhibition Study Across Temperature Gradients";
    const projectCard = screen.getByText(projectTitle).closest('[draggable="true"]');
    const targetStage = screen.getByRole("group", {
      name: "Data Collection stage drop zone",
    });
    const data = new Map<string, string>();
    const dataTransfer = {
      effectAllowed: "none",
      dropEffect: "none",
      setData: (type: string, value: string) => data.set(type, value),
      getData: (type: string) => data.get(type) ?? "",
    };

    expect(projectCard).not.toBeNull();
    fireEvent.dragStart(projectCard!, { dataTransfer });
    fireEvent.dragOver(targetStage, { dataTransfer });
    fireEvent.drop(targetStage, { dataTransfer });

    expect(within(targetStage).getByText(projectTitle)).toBeInTheDocument();
  });

  it("also allows a project stage to be changed without dragging", () => {
    render(
      <MemoryRouter>
        <PipelinePage />
      </MemoryRouter>,
    );

    const projectTitle = "Enzyme Kinetics Inhibition Study Across Temperature Gradients";
    fireEvent.change(
      screen.getByRole("combobox", { name: `Move ${projectTitle} to stage` }),
      { target: { value: "4" } },
    );

    const targetStage = screen.getByRole("group", {
      name: "Data Collection stage drop zone",
    });
    expect(within(targetStage).getByText(projectTitle)).toBeInTheDocument();
  });

  it("adds a custom pipeline stage", () => {
    render(
      <MemoryRouter>
        <PipelinePage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Manage stages" }));
    fireEvent.change(screen.getByRole("textbox", { name: "New stage name" }), {
      target: { value: "Knowledge Translation" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "New stage description" }), {
      target: { value: "Prepare findings for adoption and impact." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add Stage" }));
    fireEvent.click(screen.getByRole("button", { name: "Done" }));

    expect(
      screen.getByRole("group", { name: "Knowledge Translation stage drop zone" }),
    ).toBeInTheDocument();
  });

  it("deletes a stage and reassigns its projects", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(
      <MemoryRouter>
        <PipelinePage />
      </MemoryRouter>,
    );

    const projectTitle = "Enzyme Kinetics Inhibition Study Across Temperature Gradients";
    fireEvent.click(screen.getByRole("button", { name: "Manage stages" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete Study Design & Protocol" }));
    fireEvent.click(screen.getByRole("button", { name: "Done" }));

    expect(
      screen.queryByRole("group", { name: "Study Design & Protocol stage drop zone" }),
    ).not.toBeInTheDocument();
    const previousStage = screen.getByRole("group", {
      name: "Literature Review stage drop zone",
    });
    expect(within(previousStage).getByText(projectTitle)).toBeInTheDocument();
  });
});
