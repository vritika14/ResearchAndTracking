import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ManageStagesDialog } from "@/components/pipeline/manage-stages-dialog";

const stages = [
  { id: "stage-1", value: "Concept & Ideation", sortOrder: 1, tenantId: null, projectId: null, moduleId: null } as never,
];

describe("ManageStagesDialog", () => {
  it("shows an error and keeps the typed name when adding a stage fails", async () => {
    const onAdd = vi.fn().mockRejectedValue(new Error("A stage with that name already exists"));

    render(
      <ManageStagesDialog
        open
        onOpenChange={vi.fn()}
        stages={stages}
        visibleStages={new Set(["Concept & Ideation"])}
        onToggleVisibility={vi.fn()}
        onAdd={onAdd}
        onDelete={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("New stage name"), {
      target: { value: "Fieldwork" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add Stage" }));

    await waitFor(() => expect(onAdd).toHaveBeenCalledOnce());
    expect(
      await screen.findByText("A stage with that name already exists"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("New stage name")).toHaveValue("Fieldwork");
  });

  it("clears the input after successfully adding a stage", async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);

    render(
      <ManageStagesDialog
        open
        onOpenChange={vi.fn()}
        stages={stages}
        visibleStages={new Set(["Concept & Ideation"])}
        onToggleVisibility={vi.fn()}
        onAdd={onAdd}
        onDelete={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("New stage name"), {
      target: { value: "Fieldwork" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add Stage" }));

    await waitFor(() => expect(screen.getByLabelText("New stage name")).toHaveValue(""));
  });

  it("shows an error when deleting a stage fails", async () => {
    const onDelete = vi.fn().mockRejectedValue(new Error("The stage could not be deleted."));
    const twoStages = [
      ...stages,
      { id: "stage-2", value: "Fieldwork", sortOrder: 2, tenantId: "tenant-1", projectId: null, moduleId: null } as never,
    ];

    render(
      <ManageStagesDialog
        open
        onOpenChange={vi.fn()}
        stages={twoStages}
        visibleStages={new Set(["Concept & Ideation", "Fieldwork"])}
        onToggleVisibility={vi.fn()}
        onAdd={vi.fn()}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete Fieldwork" }));

    await waitFor(() => expect(onDelete).toHaveBeenCalledOnce());
    expect(
      await screen.findByText("The stage could not be deleted."),
    ).toBeInTheDocument();
  });
});
