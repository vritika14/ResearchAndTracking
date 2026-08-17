import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PipelineBar } from "@/components/dashboard/pipeline-bar";

describe("PipelineBar", () => {
  it("aligns its endpoint with the project's stage", () => {
    render(<PipelineBar stageIndex={4} stageCount={10} />);

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "5");
    expect(screen.getByTestId("pipeline-stage-fill")).toHaveStyle({
      clipPath: "inset(0 55.55555555555556% 0 0)",
    });
  });

  it("uses the customized stage count", () => {
    render(<PipelineBar stageIndex={10} stageCount={11} />);

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "11");
    expect(screen.getByTestId("pipeline-stage-fill")).toHaveStyle({
      clipPath: "inset(0 0% 0 0)",
    });
  });
});
