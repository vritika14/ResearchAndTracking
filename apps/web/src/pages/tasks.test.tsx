import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import TasksPage from "@/pages/tasks";

describe("TasksPage", () => {
  it("shows scheduled dates in the table and new-task form", () => {
    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: "Sort by Scheduled For" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "New Task" }));

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

  it("edits an existing task from its table row", () => {
    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Edit Submit interim safety report to IRB" }),
    );

    expect(screen.getByRole("heading", { name: "Edit task" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Scheduled for/)).toHaveValue("30/07/2026");
    expect(screen.getByLabelText(/Due date/)).toHaveValue("01/08/2026");

    fireEvent.change(screen.getByRole("textbox", { name: /Task title/ }), {
      target: { value: "Submit revised interim safety report" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(screen.getByText("Submit revised interim safety report")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Edit task" })).not.toBeInTheDocument();
  });
});
