import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StageListBuilder } from "@/components/pipeline/stage-list-builder";

const availableStages = [
  { id: "stage-1", value: "Concept" },
  { id: "stage-2", value: "Analysis" },
  { id: "stage-3", value: "Publication" },
];

function BuilderFixture() {
  const [stages, setStages] = useState(["Concept", "Analysis"]);
  return (
    <StageListBuilder
      availableStages={availableStages}
      selectedStages={stages}
      onChange={setStages}
      entityLabel="project"
    />
  );
}

describe("StageListBuilder", () => {
  it("adds, reorders, removes, and creates stages without requiring drag support", () => {
    render(<BuilderFixture />);

    fireEvent.click(screen.getByRole("button", { name: "Add Publication to project stages" }));
    expect(screen.getByText("3 selected")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Move Publication up" }));
    const orderedStages = screen.getAllByText(/Concept|Analysis|Publication/)
      .filter((element) => element.tagName === "SPAN" && element.className.includes("truncate"));
    expect(orderedStages.map((element) => element.textContent)).toEqual([
      "Concept",
      "Publication",
      "Analysis",
    ]);

    fireEvent.click(screen.getByRole("button", { name: "Remove Concept" }));
    expect(screen.getByRole("button", { name: "Add Concept to project stages" })).toBeInTheDocument();

    fireEvent.change(screen.getByRole("textbox", { name: "Custom pipeline stage" }), {
      target: { value: "Peer Review" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add stage" }));
    expect(screen.getByText("Peer Review")).toBeInTheDocument();
  });
});
