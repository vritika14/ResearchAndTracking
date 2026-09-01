-- Custom SQL migration file, put your code below! --
ALTER TABLE conferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE conference_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY conferences_visibility ON conferences
  USING (
    owner_user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
    OR EXISTS (
      SELECT 1 FROM conference_projects
      JOIN project_collaborators
        ON project_collaborators.project_id = conference_projects.project_id
      WHERE conference_projects.conference_id = conferences.id
        AND project_collaborators.user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
    )
  )
  WITH CHECK (
    owner_user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
  );
--> statement-breakpoint
CREATE POLICY conference_projects_visibility ON conference_projects
  USING (
    EXISTS (
      SELECT 1 FROM conferences
      WHERE conferences.id = conference_projects.conference_id
        AND (
          conferences.owner_user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
          OR EXISTS (
            SELECT 1 FROM project_collaborators
            WHERE project_collaborators.project_id = conference_projects.project_id
              AND project_collaborators.user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conferences
      WHERE conferences.id = conference_projects.conference_id
        AND conferences.owner_user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
    )
  );
--> statement-breakpoint
CREATE POLICY feedback_visibility ON feedback
  USING (
    user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
  )
  WITH CHECK (
    user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
  );
  