import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import ProjectDetailPage from "@/pages/project-detail";

describe("ProjectDetailPage", () => {
  it("edits project details in place", () => {
    render(
      <MemoryRouter initialEntries={["/projects/PRJ-101"]}>
        <Routes>
          <Route path="projects/:projectId" element={<ProjectDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit Project" }));

    const scheduledFor = screen.getByLabelText(/Scheduled for/);
    const dueDate = screen.getByLabelText(/Due date/);
    expect(scheduledFor).toHaveValue("06/08/2026");
    expect(scheduledFor).not.toBeRequired();
    expect(dueDate).toHaveValue("15/08/2026");
    expect(dueDate).not.toBeRequired();

    fireEvent.change(screen.getByRole("textbox", { name: /Project title/ }), {
      target: { value: "Updated research project" },
    });
    fireEvent.change(screen.getByLabelText("Funder"), {
      target: { value: "Updated funding body" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(screen.getByRole("heading", { name: "Updated research project" })).toBeInTheDocument();
    expect(screen.getByText("Updated funding body")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit Project" })).toBeInTheDocument();
  });

  it("opens directly in edit mode from a project-table edit link", () => {
    render(
      <MemoryRouter initialEntries={["/projects/PRJ-101?edit=true"]}>
        <Routes>
          <Route path="projects/:projectId" element={<ProjectDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Edit project details" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeInTheDocument();
  });

  it("returns to the pipeline when pipeline editing is cancelled", () => {
    render(
      <MemoryRouter initialEntries={["/projects/PRJ-101?edit=true&from=pipeline"]}>
        <Routes>
          <Route path="projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="pipeline" element={<h1>Pipeline</h1>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel Editing" }));

    expect(screen.getByRole("heading", { name: "Pipeline" })).toBeInTheDocument();
  });
});
