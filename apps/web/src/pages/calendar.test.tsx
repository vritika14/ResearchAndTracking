import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import CalendarPage from "@/pages/calendar";

const fixtures = vi.hoisted(() => {
  const today = new Date();
  const dueDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-15`;
  return {
    dueDate,
    projects: [
      {
        id: "project-1",
        title: "Research launch",
        dueDate,
        status: "Active",
      },
    ],
    modules: [
      {
        id: "module-1",
        title: "Analysis module",
        dueDate,
        projectId: "project-1",
      },
    ],
    conferences: [
      {
        id: "conference-1",
        acronym: "CONF",
        name: "Research Conference",
        location: "Sydney, Australia",
        submissionDue: dueDate,
        startDate: dueDate,
        endDate: dueDate,
      },
    ],
    tasks: [
      {
        id: "task-1",
        title: "Submit ethics application",
        dueDate,
        projectId: "project-1",
      },
    ],
  };
});

vi.mock("@/api/hooks", () => ({
  useCurrentWorkspace: () => ({ data: { id: "workspace-1" }, isPending: false }),
  useProjects: () => ({
    data: fixtures.projects,
    isPending: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useModules: () => ({
    data: fixtures.modules,
    isPending: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useTasks: () => ({
    data: fixtures.tasks,
    isPending: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useConferences: () => ({
    data: fixtures.conferences,
    isPending: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

describe("CalendarPage", () => {
  it("shows project and task due dates and filters each type", () => {
    render(
      <MemoryRouter>
        <CalendarPage />
      </MemoryRouter>,
    );

    expect(screen.getAllByRole("link", { name: "Research launch" })).not.toHaveLength(0);
    expect(screen.getAllByRole("link", { name: "Analysis module" })).not.toHaveLength(0);
    expect(screen.getAllByRole("link", { name: "Submit ethics application" })).not.toHaveLength(0);
    expect(screen.getAllByRole("link", { name: "Research Conference — submission deadline" })).not.toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: /Projects/ }));

    expect(screen.queryByRole("link", { name: "Research launch" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Submit ethics application" })).not.toHaveLength(0);
  });

  it("filters module due dates independently", () => {
    render(
      <MemoryRouter>
        <CalendarPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Modules/ }));
    expect(screen.queryByRole("link", { name: "Analysis module" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Research launch" })).not.toHaveLength(0);
  });

  it("shows and filters conference submission and event dates", () => {
    render(
      <MemoryRouter>
        <CalendarPage />
      </MemoryRouter>,
    );

    expect(screen.getAllByRole("link", { name: "Research Conference" })).not.toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: /Conferences/ }));
    expect(screen.queryByRole("link", { name: "Research Conference — submission deadline" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Research Conference" })).not.toBeInTheDocument();
  });

  it("supports month navigation and returning to today", () => {
    render(
      <MemoryRouter>
        <CalendarPage />
      </MemoryRouter>,
    );

    const initialMonth = screen.getByRole("heading", { level: 2 }).textContent;
    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByRole("heading", { level: 2 })).not.toHaveTextContent(initialMonth ?? "");
    fireEvent.click(screen.getByRole("button", { name: "Today" }));
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(initialMonth ?? "");
  });
});
