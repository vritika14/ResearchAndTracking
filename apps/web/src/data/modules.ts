export type ModuleStatus = "Active" | "Review" | "Stalled" | "Complete" | "Archived";
export type ModuleImportance = "Critical" | "High" | "Medium" | "Low";

export interface ResearchModule {
  id: string;
  title: string;
  description: string;
  projectId: string | null;
  status: ModuleStatus;
  /** Index into PIPELINE_STAGES. */
  stageIndex: number;
  /** ISO yyyy-mm-dd. */
  dueDate: string;
  importance: ModuleImportance;
}

/** Placeholder rows until the modules API supports the full UI model. */
export const modules: ResearchModule[] = [
  {
    id: "MOD-001",
    title: "Temperature-response assay design",
    description: "Define assay conditions, controls, and the analysis plan.",
    projectId: "PRJ-101",
    status: "Active",
    stageIndex: 2,
    dueDate: "2026-08-22",
    importance: "High",
  },
  {
    id: "MOD-002",
    title: "Cardiac biomarker data review",
    description: "Review the interim dataset before the analysis lock.",
    projectId: "PRJ-102",
    status: "Review",
    stageIndex: 5,
    dueDate: "2026-08-12",
    importance: "Critical",
  },
  {
    id: "MOD-003",
    title: "Research methods handbook",
    description: "Create a reusable methods reference for the wider team.",
    projectId: null,
    status: "Active",
    stageIndex: 1,
    dueDate: "2026-09-15",
    importance: "Medium",
  },
];
