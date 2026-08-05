import { PIPELINE_STAGES, pipelineProjects } from "./pipeline-projects";
import {
  projects,
  type ProjectPriority,
  type ProjectRole,
  type ProjectStatus,
} from "./projects";

export interface PipelineStageInfo {
  name: string;
  description: string;
}

/**
 * The shared research workflow used across Pipeline, Projects and Dashboard views.
 */
export const RESEARCH_PIPELINE_STAGES: PipelineStageInfo[] = [
  {
    name: PIPELINE_STAGES[0],
    description:
      "Early framing of the research question and initial feasibility.",
  },
  {
    name: PIPELINE_STAGES[1],
    description: "Surveying prior work and identifying open gaps.",
  },
  {
    name: PIPELINE_STAGES[2],
    description:
      "Defining methodology, sample size, and experimental protocol.",
  },
  {
    name: PIPELINE_STAGES[3],
    description: "IRB, biosafety, and other regulatory sign-off.",
  },
  {
    name: PIPELINE_STAGES[4],
    description: "Running experiments, trials, or recruitment in the field.",
  },
  {
    name: PIPELINE_STAGES[5],
    description: "Processing results and testing hypotheses against the data.",
  },
  {
    name: PIPELINE_STAGES[6],
    description:
      "Producing the manuscript and incorporating co-author feedback.",
  },
  {
    name: PIPELINE_STAGES[7],
    description: "Submitted for peer review or internal sign-off.",
  },
  {
    name: PIPELINE_STAGES[8],
    description:
      "Addressing reviewer feedback and preparing the final resubmission.",
  },
  {
    name: PIPELINE_STAGES[9],
    description: "Publicly released, presented, or archived.",
  },
];

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

/** Joins projects.ts (role/priority/tasks/stage) with pipeline-projects.ts (completion) by id. */
export const pipelineRows: PipelineRow[] = projects.map((project) => {
  const completionInfo = pipelineProjects.find((row) => row.id === project.id);
  return {
    id: project.id,
    title: project.title,
    priority: project.priority,
    status: project.status,
    completion: completionInfo?.completion ?? 0,
    outstanding: project.tasksTotal - project.tasksCompleted,
    myRole: project.myRole,
    stageIndex: project.stageIndex,
  };
});
