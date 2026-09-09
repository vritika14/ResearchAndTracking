// apps/api/src/modules/enum/constants/paper-pipeline-stages.ts

/**
 * The fixed, ordered catalog of paper (module) pipeline stages. This list is
 * never extended at runtime — a workspace can only reorder or hide/show
 * these 15 values (see enum.repository.ts's tenant-scoped module stage
 * methods), never add or rename one. Keep this in sync with the seed data in
 * database/migrations/sql/0043_reset_pipeline_stage_data.sql.
 */
export const PAPER_PIPELINE_STAGE_VALUES = [
  'Concept, Ideation',
  'Lit Review',
  'Study Design, Protocol',
  'Ethics, Other Approvals',
  'Preparation, Setup',
  'Data Collection',
  'Data Preparation',
  'Data Analysis',
  'Interpretation & Synthesis',
  'Drafting & Writing',
  'Submitted, Under Review',
  'Revisions',
  'Accepted',
  'Dissemination',
  'Complete',
] as const;
