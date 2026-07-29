import { pipelineProjects, type ProjectPriority } from "./pipeline-projects";
import { projects, type ProjectRole, type ProjectStatus } from "./projects";

export interface PipelineStageInfo {
  name: string;
  description: string;
}

/**
 * A more granular research pipeline than the 6-stage PIPELINE_STAGES used on
 * the Dashboard/Projects/Tasks pages — see OLD_TO_NEW_STAGE_INDEX below for
 * how the two map together.
 */
export const RESEARCH_PIPELINE_STAGES: PipelineStageInfo[] = [
  {
    name: "Concept & Ideation",
    description: "Early framing of the research question and initial feasibility.",
  },
  {
    name: "Literature Review",
    description: "Surveying prior work and identifying open gaps.",
  },
  {
    name: "Study Design & Protocol",
    description: "Defining methodology, sample size, and experimental protocol.",
  },
  {
    name: "Ethics and other approvals",
    description: "IRB, biosafety, and other regulatory sign-off.",
  },
  {
    name: "Data Collection",
    description: "Running experiments, trials, or recruitment in the field.",
  },
  {
    name: "Data Analysis",
    description: "Processing results and testing hypotheses against the data.",
  },
  {
    name: "Drafting, writing and revising",
    description: "Producing the manuscript and incorporating co-author feedback.",
  },
  {
    name: "Under Review",
    description: "Submitted for peer review or internal sign-off.",
  },
  {
    name: "Published",
    description: "Publicly released, presented, or archived.",
  },
];

/** Old 6-stage PIPELINE_STAGES index (pipeline-projects.ts) -> new 9-stage index above. */
const OLD_TO_NEW_STAGE_INDEX = [0, 2, 4, 5, 6, 8];

export interface PipelineRow {
  id: string;
  title: string;
  priority: ProjectPriority;
  status: ProjectStatus;
  completion: number;
  outstanding: number;
  myRole: ProjectRole;
  stageIndex: number;
}

/** Joins projects.ts (role/tasks/stage) with pipeline-projects.ts (priority/completion) by id. */
export const pipelineRows: PipelineRow[] = projects.map((project) => {
  const priorityInfo = pipelineProjects.find((row) => row.id === project.id);
  return {
    id: project.id,
    title: project.title,
    priority: priorityInfo?.priority ?? "Medium",
    status: project.status,
    completion: priorityInfo?.completion ?? 0,
    outstanding: project.tasksTotal - project.tasksCompleted,
    myRole: project.myRole,
    stageIndex: OLD_TO_NEW_STAGE_INDEX[project.stageIndex] ?? 0,
  };
});
