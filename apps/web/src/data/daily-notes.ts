export interface DailyNote {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  /** ISO datetime. */
  createdAt: string;
  tags: string[];
  content: string;
}

/** Placeholder rows until the daily notes API lands — shapes the workspace for the UI pass. */
export const dailyNotes: DailyNote[] = [
  {
    id: "n1",
    title: "HPLC Calibration Drift Observed",
    projectId: "PRJ-103",
    projectName: "Biosafety Level 2 Lab Compliance Audit",
    createdAt: "2026-07-28T09:14:00",
    tags: ["calibration", "hplc"],
    content:
      "Noticed a 0.3% drift in retention time on unit 3 during this morning's QC run. Flagged to EHS for recalibration before Thursday's audit walkthrough. Logged raw traces in the shared drive under /qc/hplc3.",
  },
  {
    id: "n2",
    title: "IRB Amendment Feedback Received",
    projectId: "PRJ-102",
    projectName: "Clinical Trial Phase II — Cardiac Biomarker Response",
    createdAt: "2026-07-27T16:02:00",
    tags: ["irb", "compliance"],
    content:
      "IRB returned amendment v3 with two minor clarifications on the consent language for the biomarker sub-study. Both are easy fixes — updating the participant-facing summary and re-submitting by Friday.",
  },
  {
    id: "n3",
    title: "Cohort B Recruitment Blocked",
    projectId: "PRJ-104",
    projectName: "Cohort B Longitudinal Recruitment Program",
    createdAt: "2026-07-26T11:30:00",
    tags: ["recruitment", "blocked"],
    content:
      "Recruitment is paused pending EHS sign-off on the updated sample-handling protocol. Reached out to R. Fischer for a status update; no response yet. Will escalate if we don't hear back by Wednesday.",
  },
  {
    id: "n4",
    title: "Budget Justification Draft Notes",
    projectId: "PRJ-106",
    projectName: "NSF Grant Renewal — Structural Biology Core",
    createdAt: "2026-07-25T14:15:00",
    tags: ["budget", "nsf"],
    content:
      "Drafted the first pass on the equipment justification section. Need updated quotes from F. Dubois for the cryo-EM service contract before this can go to the PI for review.",
  },
  {
    id: "n5",
    title: "LIMS Migration — Barcode Mismatch Root Cause",
    projectId: "PRJ-105",
    projectName: "Legacy Sample Data Migration to New LIMS",
    createdAt: "2026-07-24T10:05:00",
    tags: ["lims", "migration"],
    content:
      "Traced the barcode mismatch to a truncated prefix in the legacy export script. Fix is scoped and should resolve roughly 40% of the flagged records automatically once re-run.",
  },
  {
    id: "n6",
    title: "Enzyme Kinetics Run 12 Observations",
    projectId: "PRJ-101",
    projectName: "Enzyme Kinetics Inhibition Study Across Temperature Gradients",
    createdAt: "2026-07-23T15:47:00",
    tags: ["enzyme", "kinetics"],
    content:
      "Run 12 shows a clearer inhibition curve than runs 9–11 at the 37°C condition. Worth repeating at 42°C to see if the trend holds before we commit to it in the abstract.",
  },
  {
    id: "n7",
    title: "Compliance Summary Review Comments",
    projectId: "PRJ-107",
    projectName: "Quarterly Regulatory Compliance Summary",
    createdAt: "2026-07-22T09:00:00",
    tags: ["compliance"],
    content:
      "Reviewed the draft summary with the compliance team. A few numbers need reconciling against the June access log before this is ready to submit.",
  },
  {
    id: "n8",
    title: "Mass Spec Calibration Wrap-Up",
    projectId: "PRJ-108",
    projectName: "Mass Spectrometry Calibration Standardization",
    createdAt: "2026-07-20T13:20:00",
    tags: ["massspec", "calibration"],
    content:
      "Standardization protocol is finalized and signed off. Archived the validation records and closed out the remaining checklist items.",
  },
];
