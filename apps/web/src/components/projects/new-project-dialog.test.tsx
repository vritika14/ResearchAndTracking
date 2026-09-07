import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { NewProjectDialog } from "@/components/projects/new-project-dialog";

const pipelineStages = [
  { id: "stage-1", value: "Concept & Ideation", sortOrder: 1 } as never,
];

describe("NewProjectDialog", () => {
  it("shows an error and keeps the dialog open when creation fails", async () => {
    const onCreate = vi.fn().mockRejectedValue(new Error("Title already in use"));
    const onOpenChange = vi.fn();

    render(
      <NewProjectDialog
        open
        onOpenChange={onOpenChange}
        onCreate={onCreate}
        pipelineStages={pipelineStages}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Project title/), {
      target: { value: "Genome sequencing" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Project" }));

    await waitFor(() => expect(onCreate).toHaveBeenCalledOnce());
    expect(await screen.findByText("Title already in use")).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(screen.getByLabelText(/Project title/)).toHaveValue("Genome sequencing");
  });

  it("closes and resets after a successful creation", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    const onOpenChange = vi.fn();

    render(
      <NewProjectDialog
        open
        onOpenChange={onOpenChange}
        onCreate={onCreate}
        pipelineStages={pipelineStages}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Project title/), {
      target: { value: "Genome sequencing" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Project" }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });
});
