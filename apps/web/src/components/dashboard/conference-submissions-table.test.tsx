import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ConferenceSubmissionsTable } from "@/components/dashboard/conference-submissions-table";

describe("ConferenceSubmissionsTable", () => {
  it("creates, edits, and deletes a conference", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<ConferenceSubmissionsTable />);

    fireEvent.click(screen.getByRole("button", { name: "New Conference" }));
    fireEvent.change(screen.getByRole("textbox", { name: /Acronym/ }), {
      target: { value: "Test" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /Conference name/ }), {
      target: { value: "Test Research Conference 2027" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /Location/ }), {
      target: { value: "Sydney, Australia" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /Submission due/ }), {
      target: { value: "Dec 1, 2026" },
    });
    fireEvent.change(screen.getByRole("spinbutton", { name: /Days remaining/ }), {
      target: { value: "90" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /Conference dates/ }), {
      target: { value: "Mar 4–6, 2027" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /Linked papers/ }), {
      target: { value: "PRJ-200, PRJ-201" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add Conference" }));

    expect(screen.getByText("Test Research Conference 2027")).toBeInTheDocument();
    expect(screen.getByText("PRJ-200")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Edit Test Research Conference 2027" }),
    );
    fireEvent.change(screen.getByRole("textbox", { name: /Conference name/ }), {
      target: { value: "Updated Research Conference 2027" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(screen.getByText("Updated Research Conference 2027")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Delete Updated Research Conference 2027" }),
    );

    expect(confirm).toHaveBeenCalledWith(
      'Delete "Updated Research Conference 2027"? This action cannot be undone.',
    );
    expect(screen.queryByText("Updated Research Conference 2027")).not.toBeInTheDocument();
  });
});
