-- Custom SQL migration file, put your code below! --
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_memberships ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenants_visibility ON tenants
  USING (
    owner_user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
    OR EXISTS (
      SELECT 1 FROM tenant_memberships
      WHERE tenant_memberships.tenant_id = tenants.id
        AND tenant_memberships.user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
        AND tenant_memberships.status = 'active'
    )
  )
  WITH CHECK (
    owner_user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
  );
--> statement-breakpoint
CREATE POLICY tenant_memberships_visibility ON tenant_memberships
  USING (
    EXISTS (
      SELECT 1 FROM tenant_memberships tm
      WHERE tm.tenant_id = tenant_memberships.tenant_id
        AND tm.user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
        AND tm.status = 'active'
    )
  )
  WITH CHECK (
    user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
    AND role = 'owner'
    AND EXISTS (
      SELECT 1 FROM tenants
      WHERE tenants.id = tenant_memberships.tenant_id
        AND tenants.owner_user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
    )
  );
  