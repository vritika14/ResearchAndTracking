export type TaskPriority = "Critical" | "High";
export type TaskStatus = "Open" | "In Progress" | "Blocked" | "Done";

export interface PriorityTask {
  id: string;
  project: string;
  task: string;
  due: string;
  overdue?: boolean;
  priority: TaskPriority;
  status: TaskStatus;
}

/** Placeholder rows until the tasks API lands — shapes the dashboard table for the UI pass. */
export const priorityTasks: PriorityTask[] = [
  {
    id: "t1",
    project: "Clinical Trial Phase II",
    task: "Submit interim safety report to IRB",
    due: "Jul 28, 2026",
    overdue: true,
    priority: "Critical",
    status: "Open",
  },
  {
    id: "t2",
    project: "Biosafety Audit",
    task: "Resolve calibration drift on HPLC unit 3",
    due: "Jul 30, 2026",
    priority: "Critical",
    status: "In Progress",
  },
  {
    id: "t3",
    project: "Cohort Recruitment",
    task: "Review adverse event log for Cohort B",
    due: "Jul 29, 2026",
    priority: "Critical",
    status: "Blocked",
  },
  {
    id: "t4",
    project: "Clinical Trial Phase II",
    task: "Re-consent participants under amendment v3",
    due: "Aug 1, 2026",
    priority: "Critical",
    status: "Open",
  },
  {
    id: "t5",
    project: "Grant Renewal — NSF",
    task: "Finalize budget justification narrative",
    due: "Aug 2, 2026",
    priority: "High",
    status: "Open",
  },
  {
    id: "t6",
    project: "Data Migration",
    task: "Fix sample tracking barcode mismatch",
    due: "Aug 5, 2026",
    priority: "High",
    status: "In Progress",
  },
  {
    id: "t7",
    project: "Enzyme Kinetics Study",
    task: "Prepare quarterly compliance summary",
    due: "Jul 31, 2026",
    priority: "High",
    status: "Open",
  },
  {
    id: "t8",
    project: "Biosafety Audit",
    task: "Close out corrective action from last inspection",
    due: "Jul 26, 2026",
    overdue: true,
    priority: "High",
    status: "Done",
  },
];
