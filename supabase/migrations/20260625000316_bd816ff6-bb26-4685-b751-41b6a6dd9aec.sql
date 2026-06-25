
-- Extend plan enum
ALTER TYPE public.subscription_plan ADD VALUE IF NOT EXISTS 'starter';
ALTER TYPE public.subscription_plan ADD VALUE IF NOT EXISTS 'professional';
ALTER TYPE public.subscription_plan ADD VALUE IF NOT EXISTS 'business';

COMMIT;

-- Plans config table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  monthly_credits INTEGER NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.subscription_plans TO anon, authenticated;
GRANT ALL ON public.subscription_plans TO service_role;

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans"
  ON public.subscription_plans FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage plans (insert)"
  ON public.subscription_plans FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage plans (update)"
  ON public.subscription_plans FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage plans (delete)"
  ON public.subscription_plans FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed plans
INSERT INTO public.subscription_plans (slug, name, price_cents, currency, monthly_credits, features, sort_order)
VALUES
  ('starter', 'Starter', 20000, 'USD', 500,
   '["Access to all AI Builders","Website / App / Software Builder","Image, Logo, Video, Audio, Design Generators","AI Agents","Basic Support"]'::jsonb, 1),
  ('professional', 'Professional', 30000, 'USD', 1500,
   '["Everything in Starter","Priority AI Processing","Faster Generation Queue","AI Project Assistant","Social Media / Email / Office / Company Managers","Priority Support"]'::jsonb, 2),
  ('business', 'Business', 100000, 'USD', 10000,
   '["Everything in Professional","Team Management & Multiple Users","Dedicated Workspace","Advanced Analytics","API Access","White Label Features","Dedicated Account Manager"]'::jsonb, 3)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  price_cents = EXCLUDED.price_cents,
  monthly_credits = EXCLUDED.monthly_credits,
  features = EXCLUDED.features,
  sort_order = EXCLUDED.sort_order,
  is_active = true;

-- Auto-promote owner email to admin
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

  INSERT INTO public.user_credits (user_id) VALUES (NEW.id)
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

-- Backfill admin role if owner already exists
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE lower(email) = 'contact@yaidev.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Update activate_plan to support new plans + dynamic lookup
CREATE OR REPLACE FUNCTION public.activate_plan(_user_id uuid, _plan subscription_plan, _provider payment_provider, _amount_cents integer, _currency text, _reference text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _coins INT := 0;
  _unlimited BOOLEAN := FALSE;
  _expires TIMESTAMPTZ := NULL;
  _plan_text TEXT := _plan::text;
  _cfg RECORD;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthorized');
  END IF;

  -- Prefer dynamic plan config when present
  SELECT monthly_credits INTO _cfg FROM public.subscription_plans WHERE slug = _plan_text AND is_active = true;
  IF FOUND THEN
    _coins := _cfg.monthly_credits;
    _expires := now() + INTERVAL '30 days';
  ELSIF _plan = 'pro' THEN
    _coins := 300; _expires := now() + INTERVAL '30 days';
  ELSIF _plan = 'enterprise' THEN
    _coins := 1000; _expires := now() + INTERVAL '30 days';
  ELSIF _plan = 'forever' THEN
    _unlimited := TRUE;
  END IF;

  -- Idempotency: skip if reference already processed
  IF _reference IS NOT NULL AND EXISTS (SELECT 1 FROM public.transactions WHERE reference = _reference AND status = 'success') THEN
    RETURN jsonb_build_object('ok', true, 'duplicate', true);
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

-- Admin RPC: adjust user credits (bonus/deduct), logs activity
CREATE OR REPLACE FUNCTION public.admin_adjust_credits(_target_user uuid, _delta integer, _reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthorized');
  END IF;

  UPDATE public.user_credits
    SET paid_balance = GREATEST(0, paid_balance + _delta)
    WHERE user_id = _target_user;

  INSERT INTO public.activity_logs (user_id, action, details)
  VALUES (auth.uid(), 'admin_adjust_credits',
    jsonb_build_object('target', _target_user, 'delta', _delta, 'reason', _reason));

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_adjust_credits(uuid, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_adjust_credits(uuid, integer, text) TO authenticated;
