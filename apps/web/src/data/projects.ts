import type { ProjectPriority } from "./pipeline-projects";

export type { ProjectPriority };
export type ProjectStatus = "Active" | "Review" | "Stalled" | "Complete";
export type ProjectRole = "Owner" | "Lead" | "Collaborator" | "Supervisor";

export interface Project {
  id: string;
  title: string;
  pi: string;
  funder: string;
  collaborators: string;
  myRole: ProjectRole;
  priority: ProjectPriority;
  status: ProjectStatus;
  /** Index into PIPELINE_STAGES (see data/pipeline-projects.ts). */
  stageIndex: number;
  tasksCompleted: number;
  tasksTotal: number;
  budgetUsed: number;
  budgetTotal: number;
  notes: number;
  wordCount: number;
  /** ISO yyyy-mm-dd — sorts correctly as a plain string. */
  dueDate: string;
  overdue?: boolean;
  targetJournal: string;
}

/** Placeholder rows until the projects API lands — shapes the projects list for the UI pass. */
export const projects: Project[] = [
  {
    id: "PRJ-101",
    title: "Enzyme Kinetics Inhibition Study Across Temperature Gradients",
    pi: "Dr. Maria Chen",
    funder: "NIH R01",
    collaborators: "J. Alvarez, T. Okafor",
    myRole: "Lead",
    priority: "High",
    status: "Active",
    stageIndex: 1,
    tasksCompleted: 5,
    tasksTotal: 12,
    budgetUsed: 18200,
    budgetTotal: 120000,
    notes: 9,
    wordCount: 2400,
    dueDate: "2026-08-15",
    targetJournal: "Journal of Biological Chemistry",
  },
  {
    id: "PRJ-102",
    title: "Clinical Trial Phase II — Cardiac Biomarker Response",
    pi: "Dr. Raymond Kessler",
    funder: "American Heart Association",
    collaborators: "L. Whitfield, S. Banerjee, M. O'Connell",
    myRole: "Owner",
    priority: "Critical",
    status: "Active",
    stageIndex: 3,
    tasksCompleted: 11,
    tasksTotal: 20,
    budgetUsed: 210000,
    budgetTotal: 350000,
    notes: 24,
    wordCount: 6150,
    dueDate: "2026-08-05",
    targetJournal: "Circulation",
  },
  {
    id: "PRJ-103",
    title: "Biosafety Level 2 Lab Compliance Audit",
    pi: "Dr. Priya Natarajan",
    funder: "Internal",
    collaborators: "EHS Office",
    myRole: "Supervisor",
    priority: "High",
    status: "Review",
    stageIndex: 4,
    tasksCompleted: 8,
    tasksTotal: 9,
    budgetUsed: 4000,
    budgetTotal: 5000,
    notes: 6,
    wordCount: 3800,
    dueDate: "2026-08-12",
    targetJournal: "N/A — Internal Report",
  },
  {
    id: "PRJ-104",
    title: "Cohort B Longitudinal Recruitment Program",
    pi: "Dr. Aisha Bello",
    funder: "CDC",
    collaborators: "R. Fischer, D. Nakamura",
    myRole: "Collaborator",
    priority: "Critical",
    status: "Stalled",
    stageIndex: 2,
    tasksCompleted: 5,
    tasksTotal: 15,
    budgetUsed: 76500,
    budgetTotal: 150000,
    notes: 14,
    wordCount: 1200,
    dueDate: "2026-07-24",
    overdue: true,
    targetJournal: "Epidemiology",
  },
  {
    id: "PRJ-105",
    title: "Legacy Sample Data Migration to New LIMS",
    pi: "Dr. Victor Huang",
    funder: "Internal",
    collaborators: "Research Systems IT",
    myRole: "Owner",
    priority: "Medium",
    status: "Active",
    stageIndex: 2,
    tasksCompleted: 13,
    tasksTotal: 18,
    budgetUsed: 22000,
    budgetTotal: 40000,
    notes: 11,
    wordCount: 900,
    dueDate: "2026-09-03",
    targetJournal: "N/A — Internal Report",
  },
  {
    id: "PRJ-106",
    title: "NSF Grant Renewal — Structural Biology Core",
    pi: "Dr. Elena Kowalski",
    funder: "NSF",
    collaborators: "F. Dubois, K. Osei",
    myRole: "Lead",
    priority: "Medium",
    status: "Active",
    stageIndex: 0,
    tasksCompleted: 4,
    tasksTotal: 10,
    budgetUsed: 5400,
    budgetTotal: 25000,
    notes: 4,
    wordCount: 1650,
    dueDate: "2026-09-20",
    targetJournal: "N/A — Grant Proposal",
  },
  {
    id: "PRJ-107",
    title: "Quarterly Regulatory Compliance Summary",
    pi: "Dr. Priya Natarajan",
    funder: "Internal",
    collaborators: "Compliance Team",
    myRole: "Supervisor",
    priority: "Medium",
    status: "Complete",
    stageIndex: 5,
    tasksCompleted: 10,
    tasksTotal: 10,
    budgetUsed: 2000,
    budgetTotal: 2000,
    notes: 5,
    wordCount: 4300,
    dueDate: "2026-07-20",
    targetJournal: "N/A — Internal Report",
  },
  {
    id: "PRJ-108",
    title: "Mass Spectrometry Calibration Standardization",
    pi: "Dr. Marcus Webb",
    funder: "Department of Energy",
    collaborators: "N. Petrov",
    myRole: "Collaborator",
    priority: "High",
    status: "Complete",
    stageIndex: 5,
    tasksCompleted: 7,
    tasksTotal: 7,
    budgetUsed: 31000,
    budgetTotal: 31000,
    notes: 8,
    wordCount: 2900,
    dueDate: "2026-07-18",
    targetJournal: "Analytical Chemistry",
  },
];
