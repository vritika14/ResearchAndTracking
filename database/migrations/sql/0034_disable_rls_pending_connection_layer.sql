-- The tenant/user context these RLS policies rely on
-- (current_setting('app.current_user_id', true) / 'app.current_tenant_id')
-- is set by TenantContextMiddleware, which wraps each request in a manually
-- managed transaction and calls set_config(..., true) on it. That middleware
-- is registered on '*' but does not actually run for the app's real routes
-- (confirmed by live request tracing — its own debug logging never fires
-- for e.g. /api/v1/tenant/:tenantId/tasks), so the session variables the
-- policies check are always NULL for real traffic.
--
-- With RLS enabled and no context set, policies with a USING clause don't
-- error — they just silently match zero rows. That breaks INSERT (create
-- fails outright, since WITH CHECK does error) and, more dangerously,
-- silently no-ops UPDATE/DELETE: e.g. switching a task from Shared back to
-- Private is supposed to delete its task_members rows, but with no session
-- context that DELETE matches nothing, so a previously-shared user keeps
-- access to a task that now shows as Private.
--
-- Disabling RLS here restores correct behaviour immediately. Application-level
-- access control (TasksService.canAccess et al. — creator or explicit
-- task_members/note_members/*_collaborators row) is unaffected and remains
-- the actual enforcement mechanism; it was already what every access check
-- in this codebase relies on regardless of RLS. Re-enabling RLS is only
-- safe once requests genuinely run inside a transaction that has called
-- set_config for the caller — e.g. a connection-pool-aware request scope,
-- not global Express middleware — which is out of scope for this fix.
ALTER TABLE "projects" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "project_collaborators" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "modules" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "module_collaborators" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "tasks" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "task_members" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "notes" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "note_members" DISABLE ROW LEVEL SECURITY;
