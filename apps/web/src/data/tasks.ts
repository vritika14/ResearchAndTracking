export type TaskStatus = "To do" | "Underway" | "Complete" | "Waiting";
export type TaskPriority = "Low" | "Medium" | "High" | "Critical";

export interface TaskItem {
  code: string;
  title: string;
  /** Dependency shown as a secondary line under the title, e.g. "Waiting: Dr Thornton". */
  waitingOn?: string;
  projectName: string;
  status: TaskStatus;
  priority: TaskPriority;
  /** ISO yyyy-mm-dd — sorts correctly as a plain string. */
  dueDate: string;
  estimatedHours: number;
}

/** Placeholder rows until the tasks API lands — shapes the task list for the UI pass. */
export const tasks: TaskItem[] = [
  {
    code: "TSK-0441",
    title: "Submit interim safety report to IRB",
    projectName: "Clinical Trial Phase II — Cardiac Biomarker Response",
    status: "To do",
    priority: "Critical",
    dueDate: "2026-08-01",
    estimatedHours: 3,
  },
  {
    code: "TSK-0442",
    title: "Resolve calibration drift on HPLC unit 3",
    projectName: "Biosafety Level 2 Lab Compliance Audit",
    status: "Underway",
    priority: "High",
    dueDate: "2026-08-03",
    estimatedHours: 4,
  },
  {
    code: "TSK-0443",
    title: "Review adverse event log for Cohort B",
    waitingOn: "Dr Thornton",
    projectName: "Cohort B Longitudinal Recruitment Program",
    status: "Waiting",
    priority: "Critical",
    dueDate: "2026-08-05",
    estimatedHours: 2,
  },
  {
    code: "TSK-0444",
    title: "Finalize budget justification narrative",
    projectName: "NSF Grant Renewal — Structural Biology Core",
    status: "To do",
    priority: "Medium",
    dueDate: "2026-08-10",
    estimatedHours: 6,
  },
  {
    code: "TSK-0445",
    title: "Fix sample tracking barcode mismatch",
    projectName: "Legacy Sample Data Migration to New LIMS",
    status: "Underway",
    priority: "High",
    dueDate: "2026-08-02",
    estimatedHours: 5,
  },
  {
    code: "TSK-0446",
    title: "Re-consent participants under amendment v3",
    waitingOn: "Ethics office",
    projectName: "Clinical Trial Phase II — Cardiac Biomarker Response",
    status: "Waiting",
    priority: "Critical",
    dueDate: "2026-08-08",
    estimatedHours: 8,
  },
  {
    code: "TSK-0447",
    title: "Prepare quarterly compliance summary draft",
    projectName: "Quarterly Regulatory Compliance Summary",
    status: "Complete",
    priority: "Medium",
    dueDate: "2026-07-20",
    estimatedHours: 4,
  },
  {
    code: "TSK-0448",
    title: "Close out corrective action from last inspection",
    projectName: "Biosafety Level 2 Lab Compliance Audit",
    status: "Complete",
    priority: "High",
    dueDate: "2026-07-26",
    estimatedHours: 3,
  },
  {
    code: "TSK-0449",
    title: "Order sequencing reagents",
    projectName: "Enzyme Kinetics Inhibition Study Across Temperature Gradients",
    status: "To do",
    priority: "Low",
    dueDate: "2026-08-12",
    estimatedHours: 1,
  },
  {
    code: "TSK-0450",
    title: "Draft cryo-EM service contract quote request",
    projectName: "NSF Grant Renewal — Structural Biology Core",
    status: "Underway",
    priority: "Medium",
    dueDate: "2026-08-06",
    estimatedHours: 2,
  },
  {
    code: "TSK-0451",
    title: "Validate RNA extraction protocol",
    projectName: "Genome Sequencing Pipeline v3",
    status: "To do",
    priority: "Critical",
    dueDate: "2026-07-29",
    estimatedHours: 3,
  },
  {
    code: "TSK-0452",
    title: "Archive validation records for mass spec calibration",
    projectName: "Mass Spectrometry Calibration Standardization",
    status: "Complete",
    priority: "Low",
    dueDate: "2026-07-18",
    estimatedHours: 2,
  },
];
