-- =============================================================================
-- Migration: 20260519000000_initial_schema.sql
-- Creates all 9 normalized tables for Raze and Rise v2.
-- Tables created in foreign-key dependency order.
-- Client-generated UUIDs on sessions.id and session_sets.id (DATA-02 offline
-- conflict resolution — do not add DEFAULT gen_random_uuid() to those PKs).
-- Soft delete (is_deleted) on sessions and templates (DATA-02).
-- =============================================================================

-- -------------------------------------------------------------------------
-- 1. profiles
-- -------------------------------------------------------------------------
CREATE TABLE public.profiles (
  user_id           uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name      text,
  units             text NOT NULL DEFAULT 'lbs' CHECK (units IN ('lbs', 'kg')),
  primary_goal      text,
  age               int,
  height_cm         real,
  sex               text CHECK (sex IN ('male', 'female', 'other') OR sex IS NULL),
  onboarded         boolean NOT NULL DEFAULT false,
  migration_status  text NOT NULL DEFAULT 'none'
                    CHECK (migration_status IN ('none', 'pending', 'in_progress', 'complete', 'failed')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_user_id ON public.profiles (user_id);

-- -------------------------------------------------------------------------
-- 2. split_settings
-- -------------------------------------------------------------------------
CREATE TABLE public.split_settings (
  user_id              uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  split_type           text NOT NULL,
  rotation_pointer     int NOT NULL DEFAULT 0,
  phase                int NOT NULL DEFAULT 0,
  phase_started_at     timestamptz,
  weeks_in_phase       int NOT NULL DEFAULT 0,
  deload_active        boolean NOT NULL DEFAULT false,
  global_rest_seconds  int NOT NULL DEFAULT 90,
  weight_method        text NOT NULL DEFAULT 'manual',
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_split_settings_user_id ON public.split_settings (user_id);

-- -------------------------------------------------------------------------
-- 3. exercises
-- -------------------------------------------------------------------------
CREATE TABLE public.exercises (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL,
  muscle_group        text,
  equipment           text,
  type                text NOT NULL DEFAULT 'strength'
                      CHECK (type IN ('strength', 'bodyweight', 'run', 'cardio')),
  exercisedb_video_id text,
  is_custom           boolean NOT NULL DEFAULT false,
  created_by          uuid REFERENCES auth.users ON DELETE CASCADE,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_exercises_created_by ON public.exercises (created_by);
CREATE INDEX idx_exercises_muscle_group ON public.exercises (muscle_group);

-- -------------------------------------------------------------------------
-- 4. templates
-- -------------------------------------------------------------------------
CREATE TABLE public.templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  day_label   text NOT NULL,
  name        text,
  is_deleted  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_templates_user_id ON public.templates (user_id);

-- -------------------------------------------------------------------------
-- 5. template_exercises
-- -------------------------------------------------------------------------
CREATE TABLE public.template_exercises (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id          uuid NOT NULL REFERENCES public.templates ON DELETE CASCADE,
  exercise_id          uuid NOT NULL REFERENCES public.exercises ON DELETE RESTRICT,
  position             int NOT NULL,
  sets                 int NOT NULL,
  rep_low              int,
  rep_high             int,
  superset_group       int,
  default_rest_seconds int,
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_template_exercises_template_id ON public.template_exercises (template_id);

-- -------------------------------------------------------------------------
-- 6. sessions
-- Note: id is client-generated UUID (no DEFAULT) for offline conflict resolution
-- per DATA-02. Callers MUST supply a UUID before insert.
-- -------------------------------------------------------------------------
CREATE TABLE public.sessions (
  id           uuid PRIMARY KEY,
  user_id      uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  template_id  uuid REFERENCES public.templates ON DELETE SET NULL,
  day_label    text,
  started_at   timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  notes        text,
  is_deleted   boolean NOT NULL DEFAULT false
);

CREATE INDEX idx_sessions_user_id ON public.sessions (user_id);
CREATE INDEX idx_sessions_started_at ON public.sessions (started_at DESC);

-- -------------------------------------------------------------------------
-- 7. session_sets
-- Note: id is client-generated UUID (no DEFAULT) for offline conflict resolution
-- per DATA-02. Callers MUST supply a UUID before insert.
-- -------------------------------------------------------------------------
CREATE TABLE public.session_sets (
  id             uuid PRIMARY KEY,
  session_id     uuid NOT NULL REFERENCES public.sessions ON DELETE CASCADE,
  exercise_id    uuid NOT NULL REFERENCES public.exercises ON DELETE RESTRICT,
  exercise_name  text,
  set_number     int NOT NULL,
  weight_kg      real,
  reps_target    int,
  result         text CHECK (result IN ('go', 'no-go') OR result IS NULL),
  rpe            int CHECK (rpe BETWEEN 1 AND 10),
  is_warmup      boolean NOT NULL DEFAULT false,
  notes          text,
  logged_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_session_sets_session_id ON public.session_sets (session_id);

-- -------------------------------------------------------------------------
-- 8. measurements
-- -------------------------------------------------------------------------
CREATE TABLE public.measurements (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  measured_at  timestamptz NOT NULL DEFAULT now(),
  weight_kg    real,
  body_fat_pct real,
  chest_cm     real,
  waist_cm     real,
  hips_cm      real,
  arms_cm      real,
  thighs_cm    real,
  notes        text
);

CREATE INDEX idx_measurements_user_id ON public.measurements (user_id);
CREATE INDEX idx_measurements_measured_at ON public.measurements (user_id, measured_at DESC);

-- -------------------------------------------------------------------------
-- 9. notification_preferences
-- -------------------------------------------------------------------------
CREATE TABLE public.notification_preferences (
  user_id                    uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  workout_reminder_enabled   boolean NOT NULL DEFAULT true,
  workout_reminder_time      time,
  pr_alerts_enabled          boolean NOT NULL DEFAULT true,
  weekly_summary_enabled     boolean NOT NULL DEFAULT true,
  meal_reminders_enabled     boolean NOT NULL DEFAULT false,
  updated_at                 timestamptz NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------------------
-- Auto-create profile on new auth.users row
-- SECURITY DEFINER so trigger can write to profiles table regardless of RLS.
-- ON CONFLICT (user_id) DO NOTHING — idempotent; safe to replay migrations
-- (RESEARCH.md Pitfall 6).
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
