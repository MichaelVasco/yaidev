
CREATE OR REPLACE FUNCTION public.activate_plan(
  _user_id uuid,
  _plan subscription_plan,
  _provider payment_provider,
  _amount_cents bigint,
  _currency text,
  _reference text,
  _cycle public.billing_cycle DEFAULT 'monthly'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _coins INT := 0;
  _expires TIMESTAMPTZ;
  _plan_text TEXT := _plan::text;
  _cfg RECORD;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthorized');
  END IF;

  _expires := now() + CASE WHEN _cycle = 'yearly' THEN INTERVAL '365 days' ELSE INTERVAL '30 days' END;

  SELECT monthly_credits INTO _cfg
    FROM public.subscription_plans
    WHERE slug = _plan_text AND billing_cycle = _cycle AND is_active = true
    LIMIT 1;
  IF FOUND THEN
    _coins := _cfg.monthly_credits;
  END IF;

  IF _reference IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.transactions WHERE reference = _reference AND status = 'success'
  ) THEN
    RETURN jsonb_build_object('ok', true, 'duplicate', true);
  END IF;

  INSERT INTO public.transactions (user_id, plan, provider, amount_cents, currency, status, reference, coins_added)
  VALUES (_user_id, _plan, _provider, _amount_cents, _currency, 'success', _reference, _coins);

  INSERT INTO public.subscriptions (user_id, plan, status, coins_granted, expires_at, billing_cycle)
  VALUES (_user_id, _plan, 'active', _coins, _expires, _cycle);

  UPDATE public.user_credits
    SET paid_balance = _coins
    WHERE user_id = _user_id;

  RETURN jsonb_build_object('ok', true, 'coins_added', _coins, 'billing_cycle', _cycle);
END;
$function$;
