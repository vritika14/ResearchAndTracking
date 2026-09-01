-- Custom SQL migration file, put your code below! --
CREATE OR REPLACE FUNCTION check_tenant_membership(check_tenant_id uuid, check_user_id uuid)
RETURNS TABLE(id uuid, role text, status text)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id, role, status FROM tenant_memberships
  WHERE tenant_id = check_tenant_id AND user_id = check_user_id;
$$;
