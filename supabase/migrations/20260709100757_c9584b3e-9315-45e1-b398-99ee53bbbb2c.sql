
DO $$ BEGIN
  CREATE TYPE public.billing_cycle AS ENUM ('monthly', 'yearly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.subscription_plans
  ALTER COLUMN price_cents TYPE bigint;

ALTER TABLE public.transactions
  ALTER COLUMN amount_cents TYPE bigint;

ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS billing_cycle public.billing_cycle NOT NULL DEFAULT 'monthly';

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS billing_cycle public.billing_cycle NOT NULL DEFAULT 'monthly';

ALTER TABLE public.subscription_plans
  ALTER COLUMN paystack_plan_code DROP NOT NULL;

DO $$ BEGIN
  ALTER TABLE public.subscription_plans DROP CONSTRAINT IF EXISTS subscription_plans_slug_key;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS subscription_plans_slug_cycle_uidx
  ON public.subscription_plans(slug, billing_cycle);

INSERT INTO public.subscription_plans
  (slug, name, monthly_credits, price_cents, currency, features, sort_order, is_active, billing_cycle, paystack_plan_code)
VALUES
  ('starter',         'YAIDEV Starter 100 (Yearly)',      1200,   228000000, 'NGN', '["1,200 AI Coins / year","All Starter features","Save 5%"]'::jsonb,                                                             10, true, 'yearly', NULL),
  ('professional',    'YAIDEV Professional 200 (Yearly)', 2400,   456000000, 'NGN', '["2,400 AI Coins / year","All Professional features","Save 5%"]'::jsonb,                                                       20, true, 'yearly', NULL),
  ('business',        'YAIDEV Business 400 (Yearly)',     4800,   912000000, 'NGN', '["4,800 AI Coins / year","All Business features","API access, team workspace","Save 5%"]'::jsonb,                              30, true, 'yearly', NULL),
  ('premium',         'YAIDEV Premium 800 (Yearly)',      9600,  1824000000, 'NGN', '["9,600 AI Coins / year","All Premium features","Save 5%"]'::jsonb,                                                            40, true, 'yearly', NULL),
  ('enterprise_1200', 'YAIDEV Enterprise 1200 (Yearly)', 14400,  2681280000, 'NGN', '["14,400 AI Coins / year","All Enterprise features","White label, dedicated workspace","Save 5%"]'::jsonb,                     50, true, 'yearly', NULL),
  ('enterprise_2000', 'YAIDEV Enterprise 2000 (Yearly)', 24000,  4377600000, 'NGN', '["24,000 AI Coins / year","All Enterprise features","Highest priority support","Save 5%"]'::jsonb,                             60, true, 'yearly', NULL)
ON CONFLICT DO NOTHING;
