-- Custom SQL migration file, put your code below! --
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY analytics_events_visibility ON analytics_events
  USING (
    user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
    OR EXISTS (
      SELECT 1 FROM tenants
      WHERE tenants.id = analytics_events.tenant_id
        AND tenants.owner_user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
    )
  )
  WITH CHECK (
    user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
  );