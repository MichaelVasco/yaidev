
-- Providers
CREATE TABLE public.ai_providers (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  priority INT NOT NULL DEFAULT 100,
  weight INT NOT NULL DEFAULT 10,
  health_status TEXT NOT NULL DEFAULT 'healthy',
  last_failure_at TIMESTAMPTZ,
  cooldown_until TIMESTAMPTZ,
  consecutive_failures INT NOT NULL DEFAULT 0,
  base_url TEXT,
  env_var TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ai_providers TO authenticated;
GRANT ALL ON public.ai_providers TO service_role;
ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read providers" ON public.ai_providers FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_ai_providers_updated BEFORE UPDATE ON public.ai_providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Models
CREATE TABLE public.ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_slug TEXT NOT NULL REFERENCES public.ai_providers(slug) ON DELETE CASCADE,
  model_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  context_window INT,
  max_output INT,
  cost_input_per_1k NUMERIC(10,6) DEFAULT 0,
  cost_output_per_1k NUMERIC(10,6) DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  task_tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider_slug, model_id)
);
GRANT SELECT ON public.ai_models TO authenticated;
GRANT ALL ON public.ai_models TO service_role;
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read models" ON public.ai_models FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_ai_models_updated BEFORE UPDATE ON public.ai_models
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Request logs
CREATE TABLE public.ai_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  feature TEXT,
  task_profile TEXT,
  provider_slug TEXT,
  model_id TEXT,
  latency_ms INT,
  prompt_tokens INT,
  completion_tokens INT,
  total_tokens INT,
  estimated_cost_usd NUMERIC(10,6),
  attempt INT NOT NULL DEFAULT 1,
  success BOOLEAN NOT NULL DEFAULT false,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ai_request_logs_created_idx ON public.ai_request_logs(created_at DESC);
CREATE INDEX ai_request_logs_provider_idx ON public.ai_request_logs(provider_slug, created_at DESC);
CREATE INDEX ai_request_logs_user_idx ON public.ai_request_logs(user_id, created_at DESC);
GRANT SELECT ON public.ai_request_logs TO authenticated;
GRANT ALL ON public.ai_request_logs TO service_role;
ALTER TABLE public.ai_request_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read logs" ON public.ai_request_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Global routing config
CREATE TABLE public.ai_routing_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ai_routing_config TO authenticated;
GRANT ALL ON public.ai_routing_config TO service_role;
ALTER TABLE public.ai_routing_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read config" ON public.ai_routing_config FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_ai_routing_config_updated BEFORE UPDATE ON public.ai_routing_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed providers (priority: lower = higher priority)
INSERT INTO public.ai_providers (slug, name, priority, weight, env_var, base_url) VALUES
  ('openrouter', 'OpenRouter',        10, 50, 'OPENROUTER_API_KEY',    'https://openrouter.ai/api/v1'),
  ('gemini',     'Google Gemini',     20, 20, 'GOOGLE_GEMINI_API_KEY', 'https://generativelanguage.googleapis.com/v1beta'),
  ('openai',     'OpenAI',            30, 15, 'OPENAI_API_KEY',        'https://api.openai.com/v1'),
  ('anthropic',  'Anthropic Claude',  40,  5, 'ANTHROPIC_API_KEY',     'https://api.anthropic.com/v1'),
  ('deepseek',   'DeepSeek',          50,  5, 'DEEPSEEK_API_KEY',      'https://api.deepseek.com/v1'),
  ('xai',        'xAI Grok',          60,  3, 'XAI_API_KEY',           'https://api.x.ai/v1'),
  ('mistral',    'Mistral AI',        70,  2, 'MISTRAL_API_KEY',       'https://api.mistral.ai/v1'),
  ('lovable',    'Lovable AI (internal fallback)', 90, 0, 'LOVABLE_API_KEY', 'https://ai.gateway.lovable.dev/v1');

-- Seed model catalog
INSERT INTO public.ai_models (provider_slug, model_id, display_name, context_window, max_output, cost_input_per_1k, cost_output_per_1k, task_tags) VALUES
  ('openrouter', 'openai/gpt-5',                       'GPT-5 (via OpenRouter)',        200000, 16000, 0.005, 0.015, ARRAY['code','reasoning','website','software','business','generic']),
  ('openrouter', 'openai/gpt-5-mini',                  'GPT-5 Mini (via OpenRouter)',   200000, 16000, 0.001, 0.003, ARRAY['chat','generic']),
  ('openrouter', 'google/gemini-2.5-pro',              'Gemini 2.5 Pro (OR)',          1000000, 8000, 0.002, 0.010, ARRAY['reasoning','large_context','long_doc']),
  ('openrouter', 'google/gemini-2.5-flash',            'Gemini 2.5 Flash (OR)',        1000000, 8000, 0.0005, 0.002, ARRAY['chat','generic','large_context']),
  ('openrouter', 'anthropic/claude-sonnet-4.5',        'Claude Sonnet 4.5 (OR)',        200000, 8000, 0.003, 0.015, ARRAY['code','creative','long_doc']),
  ('openrouter', 'anthropic/claude-opus-4',            'Claude Opus 4 (OR)',            200000, 8000, 0.015, 0.075, ARRAY['creative','reasoning','long_doc']),
  ('openrouter', 'deepseek/deepseek-chat',             'DeepSeek Chat (OR)',            128000, 8000, 0.0003, 0.001, ARRAY['chat','generic']),
  ('openrouter', 'deepseek/deepseek-coder',            'DeepSeek Coder (OR)',           128000, 8000, 0.0003, 0.001, ARRAY['code','software']),
  ('openrouter', 'x-ai/grok-4',                        'Grok 4 (OR)',                   256000, 8000, 0.005, 0.015, ARRAY['reasoning','generic']),
  ('openrouter', 'mistralai/mistral-large',            'Mistral Large (OR)',            128000, 8000, 0.002, 0.006, ARRAY['generic','business']),
  ('openrouter', 'meta-llama/llama-3.1-405b-instruct', 'Llama 3.1 405B (OR)',           128000, 8000, 0.003, 0.003, ARRAY['generic']),
  ('openrouter', 'qwen/qwen-2.5-72b-instruct',         'Qwen 2.5 72B (OR)',             131072, 8000, 0.0004, 0.0004, ARRAY['generic','code']),
  ('gemini',     'gemini-2.5-pro',                     'Gemini 2.5 Pro',               1000000, 8000, 0.002, 0.010, ARRAY['reasoning','large_context','long_doc']),
  ('gemini',     'gemini-2.5-flash',                   'Gemini 2.5 Flash',             1000000, 8000, 0.0005, 0.002, ARRAY['chat','generic','large_context']),
  ('openai',     'gpt-5',                              'GPT-5',                         200000, 16000, 0.005, 0.015, ARRAY['code','website','software','business','generic']),
  ('openai',     'gpt-5-mini',                         'GPT-5 Mini',                    200000, 16000, 0.001, 0.003, ARRAY['chat','generic']),
  ('anthropic',  'claude-sonnet-4-5',                  'Claude Sonnet 4.5',             200000, 8000, 0.003, 0.015, ARRAY['code','creative','long_doc']),
  ('anthropic',  'claude-opus-4',                      'Claude Opus 4',                 200000, 8000, 0.015, 0.075, ARRAY['creative','reasoning','long_doc']),
  ('deepseek',   'deepseek-chat',                      'DeepSeek Chat',                 128000, 8000, 0.0003, 0.001, ARRAY['chat','generic']),
  ('deepseek',   'deepseek-coder',                     'DeepSeek Coder',                128000, 8000, 0.0003, 0.001, ARRAY['code','software']),
  ('xai',        'grok-4',                             'Grok 4',                        256000, 8000, 0.005, 0.015, ARRAY['reasoning','generic']),
  ('mistral',    'mistral-large-latest',               'Mistral Large',                 128000, 8000, 0.002, 0.006, ARRAY['generic','business']),
  ('lovable',    'google/gemini-2.5-flash',            'Lovable Gemini 2.5 Flash',     1000000, 8000, 0, 0, ARRAY['chat','generic','large_context']),
  ('lovable',    'openai/gpt-5',                       'Lovable GPT-5',                 200000, 16000, 0, 0, ARRAY['code','website','software','generic']);

INSERT INTO public.ai_routing_config (key, value) VALUES
  ('failover', '{"max_attempts": 5, "cooldown_seconds": 120, "failure_threshold": 3, "timeout_ms": 60000, "backoff_ms": 400}'::jsonb),
  ('task_profiles', '{
    "code":          ["openrouter","openai","anthropic","deepseek","lovable"],
    "reasoning":     ["openrouter","gemini","openai","anthropic","xai","lovable"],
    "chat":          ["gemini","openrouter","openai","deepseek","lovable"],
    "website":       ["openrouter","openai","anthropic","lovable"],
    "software":      ["openai","anthropic","deepseek","openrouter","lovable"],
    "long_doc":      ["anthropic","gemini","openrouter","lovable"],
    "business":      ["openai","openrouter","anthropic","lovable"],
    "creative":      ["anthropic","openai","openrouter","lovable"],
    "large_context": ["gemini","anthropic","openrouter","lovable"],
    "generic":       ["openrouter","gemini","openai","anthropic","deepseek","xai","mistral","lovable"]
  }'::jsonb);
