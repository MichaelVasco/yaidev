ALTER TABLE public.build_sessions
  ADD COLUMN IF NOT EXISTS project_name text,
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS favicon_url text,
  ADD COLUMN IF NOT EXISTS custom_domain text,
  ADD COLUMN IF NOT EXISTS domain_status text NOT NULL DEFAULT 'not_connected',
  ADD COLUMN IF NOT EXISTS ssl_status text NOT NULL DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS stage text NOT NULL DEFAULT 'queued',
  ADD COLUMN IF NOT EXISTS progress integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS files jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS activity jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS versions jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS deployment_status text NOT NULL DEFAULT 'not_deployed';

CREATE INDEX IF NOT EXISTS build_sessions_user_updated_idx ON public.build_sessions (user_id, updated_at DESC);