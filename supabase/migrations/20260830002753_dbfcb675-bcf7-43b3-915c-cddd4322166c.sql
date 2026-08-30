DROP POLICY IF EXISTS "Anyone can view active plans" ON public.subscription_plans;

CREATE POLICY "Active plans are public"
ON public.subscription_plans
FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Admins can view all plans"
ON public.subscription_plans
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.subscription_plans TO anon, authenticated;