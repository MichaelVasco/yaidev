
-- =========================
-- Enums
-- =========================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.subscription_plan AS ENUM ('pro', 'enterprise', 'forever');
CREATE TYPE public.subscription_status AS ENUM ('active', 'cancelled', 'expired');
CREATE TYPE public.transaction_status AS ENUM ('pending', 'success', 'failed');
CREATE TYPE public.payment_provider AS ENUM ('paystack', 'stripe', 'flutterwave', 'demo');

-- =========================
-- Shared updated_at trigger fn
-- =========================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================
-- Profiles
-- =========================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by owner"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Profiles insertable by owner"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Profiles updatable by owner"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- User roles (separate table to avoid privilege escalation)
-- =========================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

-- =========================
-- User credits (daily free + paid balance)
-- =========================
CREATE TABLE public.user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  daily_free_remaining INT NOT NULL DEFAULT 10,
  daily_reset_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_balance INT NOT NULL DEFAULT 0,
  lifetime_unlimited BOOLEAN NOT NULL DEFAULT FALSE,
  total_used INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_credits TO authenticated;
GRANT ALL ON public.user_credits TO service_role;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own credits"
  ON public.user_credits FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_user_credits_updated
  BEFORE UPDATE ON public.user_credits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- Subscriptions
-- =========================
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan public.subscription_plan NOT NULL,
  status public.subscription_status NOT NULL DEFAULT 'active',
  coins_granted INT NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscriptions"
  ON public.subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_subscriptions_updated
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- Transactions
-- =========================
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan public.subscription_plan,
  provider public.payment_provider NOT NULL,
  amount_cents INT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status public.transaction_status NOT NULL DEFAULT 'pending',
  reference TEXT,
  coins_added INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own transactions"
  ON public.transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- =========================
-- New-user bootstrap: create profile, credits, and default role
-- =========================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  INSERT INTO public.user_credits (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================
-- Spend a coin (daily free auto-resets every 24h; falls back to paid; unlimited if lifetime)
-- =========================
CREATE OR REPLACE FUNCTION public.spend_credit(_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec public.user_credits%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthorized');
  END IF;

  SELECT * INTO rec FROM public.user_credits WHERE user_id = _user_id FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.user_credits (user_id) VALUES (_user_id) RETURNING * INTO rec;
  END IF;

  -- Daily reset (every 24h)
  IF rec.daily_reset_at < now() - INTERVAL '24 hours' THEN
    rec.daily_free_remaining := 10;
    rec.daily_reset_at := now();
  END IF;

  IF rec.lifetime_unlimited THEN
    UPDATE public.user_credits
      SET daily_free_remaining = rec.daily_free_remaining,
          daily_reset_at = rec.daily_reset_at,
          total_used = total_used + 1
      WHERE user_id = _user_id;
    RETURN jsonb_build_object('ok', true, 'unlimited', true);
  END IF;

  IF rec.daily_free_remaining > 0 THEN
    UPDATE public.user_credits
      SET daily_free_remaining = rec.daily_free_remaining - 1,
          daily_reset_at = rec.daily_reset_at,
          total_used = total_used + 1
      WHERE user_id = _user_id;
    RETURN jsonb_build_object('ok', true, 'source', 'daily',
      'daily_free_remaining', rec.daily_free_remaining - 1,
      'paid_balance', rec.paid_balance);
  ELSIF rec.paid_balance > 0 THEN
    UPDATE public.user_credits
      SET paid_balance = paid_balance - 1,
          daily_reset_at = rec.daily_reset_at,
          total_used = total_used + 1
      WHERE user_id = _user_id;
    RETURN jsonb_build_object('ok', true, 'source', 'paid',
      'daily_free_remaining', rec.daily_free_remaining,
      'paid_balance', rec.paid_balance - 1);
  ELSE
    RETURN jsonb_build_object('ok', false, 'error', 'no_credits',
      'daily_free_remaining', 0, 'paid_balance', 0);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.spend_credit(UUID) TO authenticated;

-- =========================
-- Activate a (demo) purchase: adds coins / activates lifetime plan
-- For demo mode the client may call this; in production move to an edge function with provider webhook verification.
-- =========================
CREATE OR REPLACE FUNCTION public.activate_plan(
  _user_id UUID,
  _plan public.subscription_plan,
  _provider public.payment_provider,
  _amount_cents INT,
  _currency TEXT,
  _reference TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _coins INT := 0;
  _unlimited BOOLEAN := FALSE;
  _expires TIMESTAMPTZ := NULL;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthorized');
  END IF;

  IF _plan = 'pro' THEN
    _coins := 300;
    _expires := now() + INTERVAL '30 days';
  ELSIF _plan = 'enterprise' THEN
    _coins := 1000;
    _expires := now() + INTERVAL '30 days';
  ELSIF _plan = 'forever' THEN
    _unlimited := TRUE;
  END IF;

  INSERT INTO public.transactions (user_id, plan, provider, amount_cents, currency, status, reference, coins_added)
  VALUES (_user_id, _plan, _provider, _amount_cents, _currency, 'success', _reference, _coins);

  INSERT INTO public.subscriptions (user_id, plan, status, coins_granted, expires_at)
  VALUES (_user_id, _plan, 'active', _coins, _expires);

  UPDATE public.user_credits
    SET paid_balance = paid_balance + _coins,
        lifetime_unlimited = lifetime_unlimited OR _unlimited
    WHERE user_id = _user_id;

  RETURN jsonb_build_object('ok', true, 'coins_added', _coins, 'unlimited', _unlimited);
END;
$$;

GRANT EXECUTE ON FUNCTION public.activate_plan(UUID, public.subscription_plan, public.payment_provider, INT, TEXT, TEXT) TO authenticated;
