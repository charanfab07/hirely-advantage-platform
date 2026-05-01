-- 1. Plan enum + column on profiles
DO $$ BEGIN
  CREATE TYPE public.app_plan AS ENUM ('free', 'pro', 'advanced', 'teams');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan public.app_plan NOT NULL DEFAULT 'free';

-- 2. Usage counters table — one row per (user, period_start month)
CREATE TABLE IF NOT EXISTS public.usage_counters (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  period_start date NOT NULL DEFAULT date_trunc('month', now())::date,
  resume_uploads integer NOT NULL DEFAULT 0,
  analyses integer NOT NULL DEFAULT 0,
  cover_letters integer NOT NULL DEFAULT 0,
  mock_interviews integer NOT NULL DEFAULT 0,
  interview_questions integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, period_start)
);

CREATE INDEX IF NOT EXISTS idx_usage_counters_user_period
  ON public.usage_counters (user_id, period_start DESC);

ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;

-- Users can view their own counters. Writes go through edge functions
-- using the service-role key, so no INSERT/UPDATE policy for end-users.
DROP POLICY IF EXISTS "Users can view their own usage" ON public.usage_counters;
CREATE POLICY "Users can view their own usage"
  ON public.usage_counters
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Keep updated_at fresh
DROP TRIGGER IF EXISTS update_usage_counters_updated_at ON public.usage_counters;
CREATE TRIGGER update_usage_counters_updated_at
  BEFORE UPDATE ON public.usage_counters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. New-user trigger seeds plan = 'free' (already default) and a usage row.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url, plan)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    'free'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  INSERT INTO public.usage_counters (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id, period_start) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- Make sure the auth trigger that calls handle_new_user exists.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();