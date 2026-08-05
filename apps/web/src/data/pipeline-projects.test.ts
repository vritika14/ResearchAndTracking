import { describe, expect, it } from "vitest";

import { PIPELINE_STAGES } from "@/data/pipeline-projects";

describe("project pipeline stages", () => {
  it("contains the complete research workflow in order", () => {
    expect(PIPELINE_STAGES).toEqual([
      "Concept & Ideation",
      "Literature Review",
      "Study Design & Protocol",
      "Ethics and other approvals",
      "Data Collection",
      "Data Analysis",
      "Drafting, writing and revising",
      "Under Review",
      "Revise & Resubmit",
      "Published",
    ]);
  });
});
