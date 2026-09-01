-- Custom SQL migration file, put your code below! --
CREATE OR REPLACE FUNCTION is_tenant_member(check_tenant_id uuid, check_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM tenant_memberships
    WHERE tenant_memberships.tenant_id = check_tenant_id
      AND tenant_memberships.user_id = check_user_id
      AND tenant_memberships.status = 'active'
  );
$$;
--> statement-breakpoint
ALTER POLICY tenant_memberships_visibility ON tenant_memberships
  USING (
    is_tenant_member(tenant_id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
  );
--> statement-breakpoint
ALTER POLICY tenants_visibility ON tenants
  USING (
    owner_user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
    OR is_tenant_member(id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
  );
  