
-- 1) service_profiles
CREATE TABLE public.service_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module text NOT NULL CHECK (module IN ('social','email','office','company')),
  platform text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX service_profiles_unique ON public.service_profiles(user_id, module, COALESCE(platform,''));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_profiles TO authenticated;
GRANT ALL ON public.service_profiles TO service_role;
ALTER TABLE public.service_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner all profiles" ON public.service_profiles FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_sp_updated BEFORE UPDATE ON public.service_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) service_items
CREATE TABLE public.service_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.service_profiles(id) ON DELETE SET NULL,
  module text NOT NULL,
  type text NOT NULL,
  title text NOT NULL DEFAULT 'Untitled',
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX service_items_user_module_idx ON public.service_items(user_id, module, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_items TO authenticated;
GRANT ALL ON public.service_items TO service_role;
ALTER TABLE public.service_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner all items" ON public.service_items FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_si_updated BEFORE UPDATE ON public.service_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) approval_requests
CREATE TABLE public.approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id uuid REFERENCES public.service_items(id) ON DELETE CASCADE,
  module text NOT NULL,
  action text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  note text,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX approval_user_status_idx ON public.approval_requests(user_id, status, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.approval_requests TO authenticated;
GRANT ALL ON public.approval_requests TO service_role;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner all approvals" ON public.approval_requests FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4) notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  body text,
  link text,
  read boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON public.notifications(user_id, read, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner all notifications" ON public.notifications FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5) activity_logs
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module text NOT NULL,
  action text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX activity_user_idx ON public.activity_logs(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner read activity" ON public.activity_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "owner insert activity" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
