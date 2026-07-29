export type ProjectPriority = "Critical" | "High" | "Medium";
export type ProjectStatus = "Active" | "Review" | "Complete" | "Stalled";

/** Ordered research pipeline stages — position drives both the ruler header and each row's marker. */
export const PIPELINE_STAGES = [
  "Concept",
  "Proposal",
  "Data Collection",
  "Analysis",
  "Writing",
  "Published",
] as const;

export interface PipelineProject {
  id: string;
  name: string;
  /** Index into PIPELINE_STAGES for the current stage marker. */
  stageIndex: number;
  /** Overall completion, 0-100 — drives the coloured fill length independently of stage. */
  completion: number;
  priority: ProjectPriority;
  status: ProjectStatus;
}

/** Placeholder rows until the projects API lands — shapes the dashboard pipeline table for the UI pass. */
export const pipelineProjects: PipelineProject[] = [
  {
    id: "PRJ-101",
    name: "Enzyme Kinetics Inhibition Study Across Temperature Gradients",
    stageIndex: 1,
    completion: 18,
    priority: "High",
    status: "Active",
  },
  {
    id: "PRJ-102",
    name: "Clinical Trial Phase II — Cardiac Biomarker Response",
    stageIndex: 3,
    completion: 55,
    priority: "Critical",
    status: "Active",
  },
  {
    id: "PRJ-103",
    name: "Biosafety Level 2 Lab Compliance Audit",
    stageIndex: 4,
    completion: 78,
    priority: "High",
    status: "Review",
  },
  {
    id: "PRJ-104",
    name: "Cohort B Longitudinal Recruitment Program",
    stageIndex: 2,
    completion: 40,
    priority: "Critical",
    status: "Stalled",
  },
  {
    id: "PRJ-105",
    name: "Legacy Sample Data Migration to New LIMS",
    stageIndex: 3,
    completion: 62,
    priority: "Medium",
    status: "Active",
  },
  {
    id: "PRJ-106",
    name: "NSF Grant Renewal — Structural Biology Core",
    stageIndex: 0,
    completion: 8,
    priority: "Medium",
    status: "Active",
  },
  {
    id: "PRJ-107",
    name: "Quarterly Regulatory Compliance Summary",
    stageIndex: 5,
    completion: 100,
    priority: "Medium",
    status: "Complete",
  },
  {
    id: "PRJ-108",
    name: "Mass Spectrometry Calibration Standardization",
    stageIndex: 5,
    completion: 100,
    priority: "High",
    status: "Complete",
  },
];
