-- project_pipeline_selections: visible to anyone who can see the project
-- (mirrors project_collaborators-style visibility), writable only by the
-- project owner (same rule as creating/deleting custom pipeline stages).

ALTER TABLE project_pipeline_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY project_pipeline_selections_visibility ON project_pipeline_selections
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_pipeline_selections.project_id
        AND (
          projects.user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
          OR is_project_collaborator(projects.id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
        )
    )
  );

ALTER POLICY project_pipeline_selections_visibility ON project_pipeline_selections
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_pipeline_selections.project_id
        AND projects.user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
    )
  );

-- module_pipeline_selections: same pattern, mirrors module visibility/ownership.

CREATE POLICY module_pipeline_selections_visibility ON module_pipeline_selections
  USING (
    EXISTS (
      SELECT 1 FROM modules
      WHERE modules.id = module_pipeline_selections.module_id
        AND (
          (
            modules.project_id IS NOT NULL
            AND (
              EXISTS (
                SELECT 1 FROM projects
                WHERE projects.id = modules.project_id
                  AND projects.user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
              )
              OR is_project_collaborator(modules.project_id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
            )
          )
          OR is_module_collaborator(modules.id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
        )
    )
  );

ALTER POLICY module_pipeline_selections_visibility ON module_pipeline_selections
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM modules
      WHERE modules.id = module_pipeline_selections.module_id
        AND EXISTS (
          SELECT 1 FROM module_collaborators
          WHERE module_collaborators.module_id = modules.id
            AND module_collaborators.user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
            AND module_collaborators.role_id = (SELECT id FROM "enum" WHERE category = 'project_role' AND value = 'Owner')
        )
    )
  );
  