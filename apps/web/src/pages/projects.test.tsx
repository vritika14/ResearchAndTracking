import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import ProjectsPage from "@/pages/projects";

vi.mock("@/api/hooks", () => ({
  useMe: () => ({
    data: {
      id: "user-owner",
      email: "owner@example.com",
      displayName: "Avi Researcher",
    },
  }),
  useCurrentWorkspace: () => ({ data: { id: "workspace-1" } }),
  useMembers: () => ({
    data: [
      {
        id: "membership-owner",
        userId: "user-owner",
        displayName: "Avi Researcher",
        email: "owner@example.com",
        role: "owner",
      },
      {
        id: "membership-collaborator",
        userId: "user-collaborator",
        displayName: "Jamie Collaborator",
        email: "jamie@example.com",
        role: "limited_member",
      },
    ],
    isPending: false,
  }),
}));

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
    expect(screen.getByLabelText(/Principal investigator/)).toHaveValue(
      "Avi Researcher",
    );
    expect(screen.getByLabelText(/Principal investigator/)).toHaveAttribute(
      "readonly",
    );
    expect(screen.getByLabelText("My role")).toHaveValue("Owner");
    expect(screen.getByLabelText("My role")).toHaveAttribute("readonly");
  });

  it("searches database-backed workspace members for the project", () => {
    render(
      <MemoryRouter>
        <ProjectsPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "New Project" }));
    const memberSearch = screen.getByRole("combobox", { name: "With whom" });
    fireEvent.change(memberSearch, { target: { value: "Jamie" } });

    expect(screen.getByText("jamie@example.com")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("option", { name: /Jamie Collaborator/ }),
    );
    expect(screen.getByLabelText("Selected project members")).toHaveTextContent(
      "Jamie Collaborator",
    );
  });
});
