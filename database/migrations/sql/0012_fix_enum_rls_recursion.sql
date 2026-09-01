-- Custom SQL migration file, put your code below! --
CREATE OR REPLACE FUNCTION get_owner_role_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM "enum" WHERE category = 'project_role' AND value = 'Owner';
$$;
--> statement-breakpoint
ALTER POLICY enum_visibility ON "enum"
  WITH CHECK (
    (tenant_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM tenant_memberships
      WHERE tenant_memberships.tenant_id = "enum".tenant_id
        AND tenant_memberships.user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
        AND tenant_memberships.status = 'active'
    ))
    OR (project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = "enum".project_id
        AND projects.user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
    ))
    OR (module_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM module_collaborators
      WHERE module_collaborators.module_id = "enum".module_id
        AND module_collaborators.user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
        AND module_collaborators.role_id = get_owner_role_id()
    ))
  );
  