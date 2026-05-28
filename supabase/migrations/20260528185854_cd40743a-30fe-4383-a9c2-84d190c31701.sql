
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.spend_credit(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.activate_plan(UUID, public.subscription_plan, public.payment_provider, INT, TEXT, TEXT) FROM PUBLIC, anon;
