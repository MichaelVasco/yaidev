-- 1) Kill free coins ------------------------------------------------------
ALTER TABLE public.user_credits ALTER COLUMN daily_free_remaining SET DEFAULT 0;
UPDATE public.user_credits SET daily_free_remaining = 0 WHERE daily_free_remaining <> 0;

-- 2) Coin ledger ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  type text NOT NULL,
  reason text,
  balance_after integer NOT NULL DEFAULT 0,
  build_session_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coin_transactions TO authenticated;
GRANT ALL ON public.coin_transactions TO service_role;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own coin transactions" ON public.coin_transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Deny client insert coin transactions" ON public.coin_transactions
  AS RESTRICTIVE FOR INSERT TO authenticated, anon WITH CHECK (false);
CREATE POLICY "Deny client update coin transactions" ON public.coin_transactions
  AS RESTRICTIVE FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false);
CREATE POLICY "Deny client delete coin transactions" ON public.coin_transactions
  AS RESTRICTIVE FOR DELETE TO authenticated, anon USING (false);
CREATE INDEX IF NOT EXISTS coin_transactions_user_idx ON public.coin_transactions(user_id, created_at DESC);

-- 3) Build sessions -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.build_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  prompt text NOT NULL,
  preview jsonb NOT NULL DEFAULT '{}'::jsonb,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  state text NOT NULL DEFAULT 'preview',
  payment_status text NOT NULL DEFAULT 'unpaid',
  coins_spent integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.build_sessions TO authenticated;
GRANT ALL ON public.build_sessions TO service_role;
ALTER TABLE public.build_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own build sessions" ON public.build_sessions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own build sessions" ON public.build_sessions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own build sessions" ON public.build_sessions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_build_sessions_updated BEFORE UPDATE ON public.build_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX IF NOT EXISTS build_sessions_user_idx ON public.build_sessions(user_id, created_at DESC);

-- 4) Preview claims (server-side rate limit, no coins involved) -----------
CREATE TABLE IF NOT EXISTS public.preview_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.preview_claims TO authenticated;
GRANT ALL ON public.preview_claims TO service_role;
ALTER TABLE public.preview_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own preview claims" ON public.preview_claims
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Deny client write preview claims" ON public.preview_claims
  AS RESTRICTIVE FOR INSERT TO authenticated, anon WITH CHECK (false);
CREATE INDEX IF NOT EXISTS preview_claims_user_idx ON public.preview_claims(user_id, created_at DESC);

-- 5) spend_credit: paid coins only, ledgered, never negative ---------------
DROP FUNCTION IF EXISTS public.spend_credit(uuid);
CREATE OR REPLACE FUNCTION public.spend_credit(_user_id uuid, _amount integer DEFAULT 1, _reason text DEFAULT 'ai_generation', _build_session_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rec public.user_credits%ROWTYPE;
  amt integer := GREATEST(1, COALESCE(_amount, 1));
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthorized');
  END IF;

  SELECT * INTO rec FROM public.user_credits WHERE user_id = _user_id FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.user_credits (user_id, daily_free_remaining, paid_balance)
    VALUES (_user_id, 0, 0) RETURNING * INTO rec;
  END IF;

  IF rec.lifetime_unlimited THEN
    UPDATE public.user_credits SET total_used = total_used + amt WHERE user_id = _user_id;
    INSERT INTO public.coin_transactions (user_id, amount, type, reason, balance_after, build_session_id)
    VALUES (_user_id, 0, 'debit_unlimited', _reason, rec.paid_balance, _build_session_id);
    RETURN jsonb_build_object('ok', true, 'unlimited', true, 'paid_balance', rec.paid_balance);
  END IF;

  IF rec.paid_balance < amt THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_credits', 'paid_balance', rec.paid_balance, 'required', amt);
  END IF;

  UPDATE public.user_credits
    SET paid_balance = paid_balance - amt,
        total_used = total_used + amt
    WHERE user_id = _user_id;

  INSERT INTO public.coin_transactions (user_id, amount, type, reason, balance_after, build_session_id)
  VALUES (_user_id, -amt, 'debit', _reason, rec.paid_balance - amt, _build_session_id);

  RETURN jsonb_build_object('ok', true, 'source', 'paid', 'spent', amt, 'paid_balance', rec.paid_balance - amt);
END;
$$;

-- 6) Preview claim with server-enforced daily cap -------------------------
CREATE OR REPLACE FUNCTION public.claim_preview(_user_id uuid, _category text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  used integer;
  cap integer := 5;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthorized');
  END IF;

  SELECT count(*) INTO used FROM public.preview_claims
    WHERE user_id = _user_id AND created_at > now() - INTERVAL '24 hours';

  IF used >= cap THEN
    RETURN jsonb_build_object('ok', false, 'error', 'preview_limit_reached', 'cap', cap);
  END IF;

  INSERT INTO public.preview_claims (user_id, category) VALUES (_user_id, _category);
  RETURN jsonb_build_object('ok', true, 'remaining', cap - used - 1, 'cap', cap);
END;
$$;

-- 7) New users get zero coins --------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_credits (user_id, daily_free_remaining, paid_balance)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  IF lower(NEW.email) = 'contact@yaidev.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- 8) Plan activation also ledgers the credit allocation -------------------
CREATE OR REPLACE FUNCTION public.activate_plan(_user_id uuid, _plan subscription_plan, _provider payment_provider, _amount_cents bigint, _currency text, _reference text, _cycle billing_cycle DEFAULT 'monthly'::billing_cycle)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
    SET paid_balance = _coins, daily_free_remaining = 0
    WHERE user_id = _user_id;

  INSERT INTO public.coin_transactions (user_id, amount, type, reason, balance_after, metadata)
  VALUES (_user_id, _coins, 'credit', 'subscription_' || _plan_text || '_' || _cycle::text, _coins,
          jsonb_build_object('reference', _reference, 'provider', _provider::text));

  RETURN jsonb_build_object('ok', true, 'coins_added', _coins, 'billing_cycle', _cycle, 'expires_at', _expires);
END;
$$;

-- 9) Admin grants are ledgered too ---------------------------------------
CREATE OR REPLACE FUNCTION public.admin_adjust_credits(_target_user uuid, _delta integer, _reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _new integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthorized');
  END IF;

  UPDATE public.user_credits
    SET paid_balance = GREATEST(0, paid_balance + _delta)
    WHERE user_id = _target_user
    RETURNING paid_balance INTO _new;

  INSERT INTO public.coin_transactions (user_id, amount, type, reason, balance_after, metadata)
  VALUES (_target_user, _delta, 'admin_adjust', COALESCE(_reason, 'admin adjustment'), COALESCE(_new, 0),
          jsonb_build_object('admin', auth.uid()));

  INSERT INTO public.activity_logs (user_id, module, action, metadata)
  VALUES (auth.uid(), 'admin', 'admin_adjust_credits',
    jsonb_build_object('target', _target_user, 'delta', _delta, 'reason', _reason));

  RETURN jsonb_build_object('ok', true, 'paid_balance', _new);
END;
$$;

-- 10) Keep the five official tiers only ----------------------------------
UPDATE public.subscription_plans SET is_active = false WHERE slug = 'enterprise_2000';
