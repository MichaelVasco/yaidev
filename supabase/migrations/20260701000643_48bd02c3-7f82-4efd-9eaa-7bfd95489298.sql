
-- 1. New enum values (must be committed before use in inserts)
ALTER TYPE public.subscription_plan ADD VALUE IF NOT EXISTS 'premium';
ALTER TYPE public.subscription_plan ADD VALUE IF NOT EXISTS 'enterprise_1200';
ALTER TYPE public.subscription_plan ADD VALUE IF NOT EXISTS 'enterprise_2000';

-- 2. Add plan_code column
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS paystack_plan_code TEXT;

-- 3. Replace old plan rows with the 6 official YAIDEV plans (NGN, price in kobo)
DELETE FROM public.subscription_plans;

INSERT INTO public.subscription_plans (slug, name, price_cents, currency, monthly_credits, features, sort_order, is_active, paystack_plan_code) VALUES
('starter',         'YAIDEV Starter 100',         20000000,  'NGN', 100,  '["100 AI Coins / month","Website Hosting & Publishing",".yaidev.app subdomain","AI Website / App / Software Builder","AI Project Assistant & Agents","Social / Email / Office / Company Managers","Premium Image, Video, Audio & Code Generation","Priority Support"]'::jsonb, 1, true, 'PLN_0y9br1ozyv8knk'),
('professional',    'YAIDEV Professional 200',    40000000,  'NGN', 200,  '["200 AI Coins / month","Everything in Starter","Custom Domains","Faster Deploys","Extended context AI generation"]'::jsonb, 2, true, 'PLN_gw4gkmxrltz99h4'),
('business',        'YAIDEV Business 400',        80000000,  'NGN', 400,  '["400 AI Coins / month","Everything in Professional","API Access","Team Workspaces","Advanced AI Features","White-label Features"]'::jsonb, 3, true, 'PLN_08e55h8kpe0en4b'),
('premium',         'YAIDEV Premium 800',        160000000,  'NGN', 800,  '["800 AI Coins / month","Everything in Business","Higher rate limits","Premium model routing","Dedicated onboarding"]'::jsonb, 4, true, 'PLN_aw385x4f5a2xzob'),
('enterprise_1200', 'YAIDEV Enterprise 1200',    235200000,  'NGN', 1200, '["1,200 AI Coins / month","Enterprise-grade capabilities","SLA & priority queue","Advanced security & audit logs"]'::jsonb, 5, true, 'PLN_tncl36bhttg4jk8'),
('enterprise_2000', 'YAIDEV Enterprise 2000',    384000000,  'NGN', 2000, '["2,000 AI Coins / month","All platform features unlocked","Highest limits & priority","Dedicated success manager"]'::jsonb, 6, true, 'PLN_c9ig1hk0fds4ul8');

-- 4. Update activate_plan to handle new plan enum values dynamically via subscription_plans table
CREATE OR REPLACE FUNCTION public.activate_plan(_user_id uuid, _plan subscription_plan, _provider payment_provider, _amount_cents integer, _currency text, _reference text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _coins INT := 0;
  _expires TIMESTAMPTZ := now() + INTERVAL '30 days';
  _plan_text TEXT := _plan::text;
  _cfg RECORD;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthorized');
  END IF;

  SELECT monthly_credits INTO _cfg FROM public.subscription_plans WHERE slug = _plan_text AND is_active = true;
  IF FOUND THEN
    _coins := _cfg.monthly_credits;
  END IF;

  -- Idempotency
  IF _reference IS NOT NULL AND EXISTS (SELECT 1 FROM public.transactions WHERE reference = _reference AND status = 'success') THEN
    RETURN jsonb_build_object('ok', true, 'duplicate', true);
  END IF;

  INSERT INTO public.transactions (user_id, plan, provider, amount_cents, currency, status, reference, coins_added)
  VALUES (_user_id, _plan, _provider, _amount_cents, _currency, 'success', _reference, _coins);

  INSERT INTO public.subscriptions (user_id, plan, status, coins_granted, expires_at)
  VALUES (_user_id, _plan, 'active', _coins, _expires);

  -- Reset paid_balance to the plan allocation (never negative), per YAIDEV billing rules
  UPDATE public.user_credits
    SET paid_balance = _coins
    WHERE user_id = _user_id;

  RETURN jsonb_build_object('ok', true, 'coins_added', _coins);
END;
$function$;
