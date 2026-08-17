import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ModulesPage from "@/pages/modules";

describe("ModulesPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("creates, edits, and deletes an independent module", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(
      <MemoryRouter>
        <ModulesPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "New Module" }));
    expect(screen.getByRole("textbox", { name: /Description/ })).not.toBeRequired();
    fireEvent.change(screen.getByRole("textbox", { name: /Module title/ }), {
      target: { value: "Independent literature synthesis" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Module" }));

    expect(screen.getByText("Independent literature synthesis")).toBeInTheDocument();
    expect(screen.getAllByText("Independent module").length).toBeGreaterThan(0);

    fireEvent.click(
      screen.getByRole("button", { name: "Edit Independent literature synthesis" }),
    );
    fireEvent.change(screen.getByRole("textbox", { name: /Module title/ }), {
      target: { value: "Updated literature synthesis" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(screen.getByText("Updated literature synthesis")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Delete Updated literature synthesis" }),
    );
    expect(confirm).toHaveBeenCalled();
    expect(screen.queryByText("Updated literature synthesis")).not.toBeInTheDocument();
  });

  it("allows a module to be linked to a project", () => {
    render(
      <MemoryRouter>
        <ModulesPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "New Module" }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Independent module/ }));

    expect(screen.getByRole("combobox", { name: /Project/ })).toBeInTheDocument();
  });
});
