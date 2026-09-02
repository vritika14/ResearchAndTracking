-- NestJS guards run before RequestContextInterceptor sets the RLS session
-- variables. Keep the guard's lookup narrow and explicit while allowing it to
-- verify direct module access and inherited project access.
CREATE OR REPLACE FUNCTION check_module_access(
  check_tenant_id uuid,
  check_module_id uuid,
  check_user_id uuid
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM modules
    WHERE modules.id = check_module_id
      AND modules.tenant_id = check_tenant_id
      AND (
        EXISTS (
          SELECT 1
          FROM module_collaborators
          WHERE module_collaborators.module_id = modules.id
            AND module_collaborators.user_id = check_user_id
        )
        OR EXISTS (
          SELECT 1
          FROM projects
          WHERE projects.id = modules.project_id
            AND (
              projects.user_id = check_user_id
              OR EXISTS (
                SELECT 1
                FROM project_collaborators
                WHERE project_collaborators.project_id = projects.id
                  AND project_collaborators.user_id = check_user_id
              )
            )
        )
      )
  );
$$;
