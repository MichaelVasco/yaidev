
-- Tighten RLS on user_credits and user_roles: explicitly block direct writes by clients.
-- Writes happen only through SECURITY DEFINER functions (spend_credit, activate_plan, handle_new_user).

REVOKE INSERT, UPDATE, DELETE ON public.user_credits FROM authenticated, anon;
REVOKE INSERT, UPDATE, DELETE ON public.user_roles  FROM authenticated, anon;

-- Restrictive policies that always evaluate to false for client writes (defense-in-depth).
DROP POLICY IF EXISTS "Block client writes on user_credits" ON public.user_credits;
CREATE POLICY "Block client writes on user_credits"
  ON public.user_credits AS RESTRICTIVE
  FOR ALL TO authenticated, anon
  USING (false) WITH CHECK (false);

-- Keep existing SELECT permission for owner via the permissive policy already in place.
-- The RESTRICTIVE policy above intersects with permissive ones; allow SELECT by re-permitting it.
DROP POLICY IF EXISTS "Block client writes on user_roles" ON public.user_roles;
CREATE POLICY "Block client writes on user_roles"
  ON public.user_roles AS RESTRICTIVE
  FOR ALL TO authenticated, anon
  USING (false) WITH CHECK (false);

-- Re-allow SELECT for owners by adding restrictive that only blocks write commands.
DROP POLICY IF EXISTS "Block client writes on user_credits" ON public.user_credits;
CREATE POLICY "Deny client INSERT on user_credits" ON public.user_credits AS RESTRICTIVE
  FOR INSERT TO authenticated, anon WITH CHECK (false);
CREATE POLICY "Deny client UPDATE on user_credits" ON public.user_credits AS RESTRICTIVE
  FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false);
CREATE POLICY "Deny client DELETE on user_credits" ON public.user_credits AS RESTRICTIVE
  FOR DELETE TO authenticated, anon USING (false);

DROP POLICY IF EXISTS "Block client writes on user_roles" ON public.user_roles;
CREATE POLICY "Deny client INSERT on user_roles" ON public.user_roles AS RESTRICTIVE
  FOR INSERT TO authenticated, anon WITH CHECK (false);
CREATE POLICY "Deny client UPDATE on user_roles" ON public.user_roles AS RESTRICTIVE
  FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false);
CREATE POLICY "Deny client DELETE on user_roles" ON public.user_roles AS RESTRICTIVE
  FOR DELETE TO authenticated, anon USING (false);

-- Scope project-family policies to authenticated role only (eliminates anonymous evaluation).
DROP POLICY IF EXISTS "owner manages projects" ON public.projects;
CREATE POLICY "owner manages projects" ON public.projects
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner manages tasks" ON public.project_tasks;
CREATE POLICY "owner manages tasks" ON public.project_tasks
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner manages conversations" ON public.project_conversations;
CREATE POLICY "owner manages conversations" ON public.project_conversations
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner manages files" ON public.project_files;
CREATE POLICY "owner manages files" ON public.project_files
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Restrict EXECUTE on internal SECURITY DEFINER helpers; keep client-callable RPCs open.
-- handle_new_user is fired by an auth trigger — clients should not call it.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
-- update_updated_at_column is a trigger function — no client call needed.
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- spend_credit and activate_plan remain callable by authenticated clients;
-- both validate auth.uid() = _user_id internally.
