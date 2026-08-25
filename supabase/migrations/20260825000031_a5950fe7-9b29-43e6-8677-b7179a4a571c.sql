REVOKE ALL ON FUNCTION public.spend_credit(uuid, integer, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.spend_credit(uuid, integer, text, uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.claim_preview(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_preview(uuid, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.activate_plan(uuid, subscription_plan, payment_provider, bigint, text, text, billing_cycle) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.activate_plan(uuid, subscription_plan, payment_provider, bigint, text, text, billing_cycle) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.admin_adjust_credits(uuid, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_adjust_credits(uuid, integer, text) TO authenticated, service_role;

DROP FUNCTION IF EXISTS public.activate_plan(uuid, subscription_plan, payment_provider, integer, text, text);
