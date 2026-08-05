import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import ProjectsPage from "@/pages/projects";

describe("ProjectsPage", () => {
  it("provides a direct edit action for each project row", () => {
    render(
      <MemoryRouter>
        <ProjectsPage />
      </MemoryRouter>,
    );

    const editLink = screen.getByRole("link", {
      name: "Edit Enzyme Kinetics Inhibition Study Across Temperature Gradients",
    });

    expect(editLink).toHaveAttribute("href", "/projects/PRJ-101?edit=true");
    expect(screen.getByText("Low")).toBeInTheDocument();
  });

  it("shows scheduled dates in the table and new-project form", () => {
    render(
      <MemoryRouter>
        <ProjectsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Scheduled For")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "New Project" }));

    const scheduledFor = screen.getByLabelText(/Scheduled for/);
    const dueDate = screen.getByLabelText(/Due date/);

    expect(scheduledFor).toHaveAttribute("placeholder", "DD/MM/YYYY");
    expect(scheduledFor).not.toBeRequired();
    expect(dueDate).toHaveAttribute("placeholder", "DD/MM/YYYY");
    expect(dueDate).not.toBeRequired();
    expect(
      screen.getByRole("button", { name: "Choose scheduled for date" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Choose due date" })).toBeInTheDocument();
  });
});
