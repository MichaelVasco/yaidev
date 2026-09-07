
-- 1) Founder entitlement helper
CREATE OR REPLACE FUNCTION public.is_founder(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('founder','admin')
  );
$$;
REVOKE EXECUTE ON FUNCTION public.is_founder(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_founder(uuid) TO authenticated, service_role;

-- 2) spend_credit: founder entitlement checked BEFORE coin/plan rules
CREATE OR REPLACE FUNCTION public.spend_credit(_user_id uuid, _amount integer DEFAULT 1, _reason text DEFAULT 'ai_generation'::text, _build_session_id uuid DEFAULT NULL::uuid)
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

  -- Founder / admin entitlement: unlimited, never deducts coins.
  IF public.is_founder(_user_id) THEN
    UPDATE public.user_credits SET total_used = total_used + amt WHERE user_id = _user_id;
    RETURN jsonb_build_object('ok', true, 'unlimited', true, 'founder', true, 'paid_balance', 0);
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

-- 3) New sign-ups: auto-assign founder to the exact founder email
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

  IF lower(NEW.email) = 'superstarmichaelvasco@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'founder')
    ON CONFLICT (user_id, role) DO NOTHING;
    UPDATE public.user_credits SET lifetime_unlimited = true WHERE user_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- 4) Grant the entitlement to the existing founder account
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'founder' FROM auth.users WHERE lower(email) = 'superstarmichaelvasco@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

UPDATE public.user_credits SET lifetime_unlimited = true
WHERE user_id IN (SELECT id FROM auth.users WHERE lower(email) = 'superstarmichaelvasco@gmail.com');

-- 5) AI provider routing repair: disable dead/unfunded provider keys, promote the working gateway
UPDATE public.ai_providers SET enabled = false
  WHERE slug IN ('openrouter','openai','anthropic','deepseek','xai','mistral');
UPDATE public.ai_providers
  SET enabled = true, priority = 1, weight = 100, health_status = 'healthy',
      cooldown_until = NULL, consecutive_failures = 0
  WHERE slug = 'lovable';
UPDATE public.ai_providers
  SET priority = 20, weight = 10, health_status = 'healthy', cooldown_until = NULL, consecutive_failures = 0
  WHERE slug = 'gemini';

UPDATE public.ai_models SET enabled = false WHERE provider_slug = 'gemini' AND model_id = 'gemini-2.5-pro';
UPDATE public.ai_models
  SET task_tags = ARRAY['code','website','software','business','reasoning','creative','long_doc','generic']
  WHERE provider_slug = 'lovable' AND model_id = 'openai/gpt-5';
UPDATE public.ai_models
  SET task_tags = ARRAY['chat','generic','large_context']
  WHERE provider_slug = 'lovable' AND model_id = 'google/gemini-2.5-flash';

UPDATE public.ai_routing_config
  SET value = jsonb_build_object(
    'business', jsonb_build_array('lovable','gemini'),
    'chat', jsonb_build_array('lovable','gemini'),
    'code', jsonb_build_array('lovable','gemini'),
    'creative', jsonb_build_array('lovable','gemini'),
    'generic', jsonb_build_array('lovable','gemini'),
    'large_context', jsonb_build_array('lovable','gemini'),
    'long_doc', jsonb_build_array('lovable','gemini'),
    'reasoning', jsonb_build_array('lovable','gemini'),
    'software', jsonb_build_array('lovable','gemini'),
    'website', jsonb_build_array('lovable','gemini')
  ), updated_at = now()
  WHERE key = 'task_profiles';

UPDATE public.ai_routing_config
  SET value = jsonb_build_object('max_attempts', 4, 'timeout_ms', 180000, 'backoff_ms', 400,
                                 'failure_threshold', 3, 'cooldown_seconds', 120),
      updated_at = now()
  WHERE key = 'failover';
