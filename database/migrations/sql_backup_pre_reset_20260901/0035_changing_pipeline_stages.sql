-- database/migrations/sql/0027_split_pipeline_stage_categories.sql

-- Retire the old, generic pipeline_stage category — replaced by
-- project_pipeline_stage and module_pipeline_stage, each with its own
-- purpose-built set of values.
DELETE FROM "enum" WHERE category = 'pipeline_stage';

-- Seed project_pipeline_stage (6 values)
INSERT INTO "enum" (category, value, sort_order) VALUES
('project_pipeline_stage', 'Concept', 1),
('project_pipeline_stage', 'Planning', 2),
('project_pipeline_stage', 'Active Research', 3),
('project_pipeline_stage', 'Consolidation & Review', 4),
('project_pipeline_stage', 'Dissemination', 5),
('project_pipeline_stage', 'Completed', 6);

-- Seed module_pipeline_stage (14 values)
INSERT INTO "enum" (category, value, sort_order) VALUES
('module_pipeline_stage', 'Concept & Ideation', 1),
('module_pipeline_stage', 'Literature Review', 2),
('module_pipeline_stage', 'Study Design & Protocol', 3),
('module_pipeline_stage', 'Ethics & Other Approvals', 4),
('module_pipeline_stage', 'Preparation & Setup', 5),
('module_pipeline_stage', 'Data Collection', 6),
('module_pipeline_stage', 'Data Preparation', 7),
('module_pipeline_stage', 'Data Analysis', 8),
('module_pipeline_stage', 'Interpretation & Synthesis', 9),
('module_pipeline_stage', 'Drafting & Writing', 10),
('module_pipeline_stage', 'Internal Review', 11),
('module_pipeline_stage', 'Under External Review', 12),
('module_pipeline_stage', 'Revision & Resubmission', 13),
('module_pipeline_stage', 'Published / Complete', 14);

-- Reassign existing projects from the old pipeline_stage category to the new project_pipeline_stage equivalent
UPDATE projects
SET pipeline_stage_id = (SELECT id FROM "enum" WHERE category = 'project_pipeline_stage' AND value = 'Concept')
WHERE pipeline_stage_id IN (SELECT id FROM "enum" WHERE category = 'pipeline_stage' AND value = 'Concept & Ideation');

UPDATE projects
SET pipeline_stage_id = (SELECT id FROM "enum" WHERE category = 'project_pipeline_stage' AND value = 'Active Research')
WHERE pipeline_stage_id IN (SELECT id FROM "enum" WHERE category = 'pipeline_stage' AND value = 'Data Collection');

UPDATE projects
SET pipeline_stage_id = (SELECT id FROM "enum" WHERE category = 'project_pipeline_stage' AND value = 'Consolidation & Review')
WHERE pipeline_stage_id IN (SELECT id FROM "enum" WHERE category = 'pipeline_stage' AND value = 'Under review');

