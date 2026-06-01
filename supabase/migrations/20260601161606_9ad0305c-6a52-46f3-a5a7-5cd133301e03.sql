DROP POLICY IF EXISTS "view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "admin manage roles" ON public.user_roles;

CREATE POLICY "users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;