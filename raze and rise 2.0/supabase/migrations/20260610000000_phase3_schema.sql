-- =============================================================================
-- Migration: 20260610000000_phase3_schema.sql
-- Phase 3 — Templates, Programs & Progress.
--
-- Adds 5 new tables (programs, program_weeks, progress_photos, badges,
-- user_stats), 1 column on template_exercises, 4 defensive column adds on
-- measurements, all RLS policies, and the two Storage buckets.
--
-- Conventions carried from 20260519000000_initial_schema.sql:
--   - timestamps are timestamptz DEFAULT now()
--   - booleans are real booleans (PowerSync mirrors them as 0/1 integers)
--   - soft delete via is_deleted boolean
--   - index on user_id / every FK column
--   - server-generated PKs use DEFAULT gen_random_uuid(); clients still supply
--     their own UUID for offline conflict resolution (DATA-02) and the DEFAULT
--     is only a fallback.
--
-- CRITICAL — RLS + policies live in this SAME migration (FOUND-07 /
-- RESEARCH Pitfall 7). A table with RLS enabled but no SELECT policy syncs as
-- silently empty through PowerSync and drops Realtime events.
--
-- All policies use the cached `(SELECT auth.uid())` form — wrapping in SELECT
-- caches the result for the whole query instead of re-invoking per row.
--
-- PowerSync: the `powersync` publication is FOR ALL TABLES
-- (20260519000200_powersync_setup.sql:34) and default privileges already grant
-- SELECT on future tables in `public`. New tables therefore auto-publish —
-- this migration deliberately contains NO publication changes.
-- =============================================================================


-- =============================================================================
-- SECTION 1 — New tables (foreign-key dependency order)
-- =============================================================================

-- -------------------------------------------------------------------------
-- 1. programs (PROGRAM-01)
-- A multi-week training program. `current_week` advances as sessions complete;
-- `phase` mirrors split_settings.phase (0 = hypertrophy, 1 = strength, 2 = power).
-- -------------------------------------------------------------------------
CREATE TABLE public.programs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name         text NOT NULL,
  total_weeks  int NOT NULL DEFAULT 4,
  current_week int NOT NULL DEFAULT 1,
  phase        int NOT NULL DEFAULT 0,
  is_active    boolean NOT NULL DEFAULT false,
  is_deleted   boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_programs_user_id ON public.programs (user_id);
CREATE INDEX idx_programs_user_active ON public.programs (user_id, is_active);

-- -------------------------------------------------------------------------
-- 2. program_weeks (PROGRAM-01 / PROGRAM-03)
-- One row per (week, day) cell of the ProgramWeekGrid.
-- template_id NULL = rest day. ON DELETE SET NULL so deleting a template
-- degrades the cell to a rest day instead of destroying the program row.
-- -------------------------------------------------------------------------
CREATE TABLE public.program_weeks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id  uuid NOT NULL REFERENCES public.programs ON DELETE CASCADE,
  week_number int NOT NULL,
  is_deload   boolean NOT NULL DEFAULT false,
  day_label   text,
  template_id uuid REFERENCES public.templates ON DELETE SET NULL,
  position    int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_program_weeks_program_id ON public.program_weeks (program_id);
CREATE INDEX idx_program_weeks_template_id ON public.program_weeks (template_id);
CREATE INDEX idx_program_weeks_grid ON public.program_weeks (program_id, week_number, position);

-- -------------------------------------------------------------------------
-- 3. progress_photos (PHOTO-01 / PHOTO-02)
-- Metadata only. The binary lives in the private `progress-photos` Storage
-- bucket at `{user_id}/{filename}` — see SECTION 4.
-- taken_on is a text ISO date (YYYY-MM-DD), not a timestamp: photos are
-- compared day-over-day and the capture time is not meaningful.
-- -------------------------------------------------------------------------
CREATE TABLE public.progress_photos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  taken_on     text NOT NULL,
  storage_path text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_progress_photos_user_id ON public.progress_photos (user_id);
CREATE INDEX idx_progress_photos_taken_on ON public.progress_photos (user_id, taken_on DESC);

-- -------------------------------------------------------------------------
-- 4. badges (GAMIFY-01)
-- One row per unlocked achievement. The UNIQUE (user_id, badge_key)
-- constraint is what makes `ON CONFLICT DO NOTHING` idempotent, so badge
-- detection can run inside completeSession's writeTransaction on every
-- session without double-unlocking (RESEARCH Pattern 8).
-- -------------------------------------------------------------------------
CREATE TABLE public.badges (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  badge_key   text NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT badges_user_badge_key_unique UNIQUE (user_id, badge_key)
);

CREATE INDEX idx_badges_user_id ON public.badges (user_id);

-- -------------------------------------------------------------------------
-- 5. user_stats (GAMIFY-01 — resolves RESEARCH Open Question 4)
-- Cheap running aggregates so badge threshold detection never scans full
-- history per session. Written inside the completeSession transaction.
-- -------------------------------------------------------------------------
CREATE TABLE public.user_stats (
  user_id            uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  total_sessions     int NOT NULL DEFAULT 0,
  lifetime_volume_kg real NOT NULL DEFAULT 0,
  first_pr_at        timestamptz,
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_stats_user_id ON public.user_stats (user_id);


-- =============================================================================
-- SECTION 2 — Column additions to existing tables
-- =============================================================================

-- -------------------------------------------------------------------------
-- template_exercises.exercise_type (TEMPLATE-05)
-- Resolves RESEARCH Open Question 1 / Pitfall 3. Nullable: NULL means "fall
-- back to the linked exercises.type from the library JOIN", which preserves
-- the current useSessionData behaviour for every existing row.
-- -------------------------------------------------------------------------
ALTER TABLE public.template_exercises
  ADD COLUMN exercise_type text;

ALTER TABLE public.template_exercises
  ADD CONSTRAINT template_exercises_exercise_type_check
  CHECK (exercise_type IN ('strength', 'bodyweight', 'run', 'cardio') OR exercise_type IS NULL);

-- -------------------------------------------------------------------------
-- measurements extra columns (PROGRESS-04)
--
-- DEVIATION FROM PLAN (Rule 1): hips_cm / arms_cm / thighs_cm / notes ALREADY
-- exist on public.measurements — they were created in
-- 20260519000000_initial_schema.sql (measurements block). Plain
-- `ADD COLUMN` would abort this migration with "column already exists".
-- IF NOT EXISTS makes this a verified no-op on the current database while
-- still guaranteeing the columns are present for PROGRESS-04.
-- The real Phase 3 gap is the PowerSync mirror in src/lib/schema.ts, which
-- never declared them — fixed in the same commit wave.
--
-- measured_at also already exists and is NOT re-added (it is `measured_at`,
-- never `logged_at` — useSessionData.ts:184 has a latent bug querying
-- `logged_at`, tracked for plan 03-03).
-- -------------------------------------------------------------------------
ALTER TABLE public.measurements
  ADD COLUMN IF NOT EXISTS hips_cm   real,
  ADD COLUMN IF NOT EXISTS arms_cm   real,
  ADD COLUMN IF NOT EXISTS thighs_cm real,
  ADD COLUMN IF NOT EXISTS notes     text;


-- =============================================================================
-- SECTION 3 — Row Level Security (T-03-01, T-03-03)
-- Every new table gets ENABLE ROW LEVEL SECURITY plus all four CRUD policies
-- in this same migration.
-- =============================================================================

-- -------------------------------------------------------------------------
-- programs
-- -------------------------------------------------------------------------
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY programs_select_own
  ON public.programs FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY programs_insert_own
  ON public.programs FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY programs_update_own
  ON public.programs FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY programs_delete_own
  ON public.programs FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- -------------------------------------------------------------------------
-- program_weeks
-- No direct user_id column — ownership is derived from the parent programs
-- row via an EXISTS subquery on every CRUD verb (T-03-03). Same shape as
-- template_exercises / session_sets in 20260519000100_rls_policies.sql.
-- -------------------------------------------------------------------------
ALTER TABLE public.program_weeks ENABLE ROW LEVEL SECURITY;

CREATE POLICY program_weeks_select_own
  ON public.program_weeks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.id = program_id
        AND p.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY program_weeks_insert_own
  ON public.program_weeks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.id = program_id
        AND p.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY program_weeks_update_own
  ON public.program_weeks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.id = program_id
        AND p.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.id = program_id
        AND p.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY program_weeks_delete_own
  ON public.program_weeks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.id = program_id
        AND p.user_id = (SELECT auth.uid())
    )
  );

-- -------------------------------------------------------------------------
-- progress_photos
-- -------------------------------------------------------------------------
ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY progress_photos_select_own
  ON public.progress_photos FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY progress_photos_insert_own
  ON public.progress_photos FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY progress_photos_update_own
  ON public.progress_photos FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY progress_photos_delete_own
  ON public.progress_photos FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- -------------------------------------------------------------------------
-- badges
-- -------------------------------------------------------------------------
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY badges_select_own
  ON public.badges FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY badges_insert_own
  ON public.badges FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY badges_update_own
  ON public.badges FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY badges_delete_own
  ON public.badges FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- -------------------------------------------------------------------------
-- user_stats
-- -------------------------------------------------------------------------
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_stats_select_own
  ON public.user_stats FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY user_stats_insert_own
  ON public.user_stats FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY user_stats_update_own
  ON public.user_stats FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY user_stats_delete_own
  ON public.user_stats FOR DELETE
  USING (user_id = (SELECT auth.uid()));


-- =============================================================================
-- SECTION 4 — Storage buckets (T-03-02, RESEARCH Pitfall 6)
--
-- `progress-photos` — PRIVATE. Objects are stored at `{user_id}/{filename}`
--   and every CRUD verb is folder-scoped to the owning user via
--   (storage.foldername(name))[1] = auth.uid()::text. A private bucket alone
--   is NOT sufficient: without these policies an authenticated user could read
--   another user's objects through the authenticated Storage API.
--
-- `exercise-media` — PUBLIC read (seeded ExerciseDB GIFs/videos are not
--   user data). Writes are restricted to the service role, which is what the
--   one-time seed script in plan 03-08 uses. Authenticated users get no
--   INSERT/UPDATE/DELETE policy, so writes are denied by RLS default-deny.
-- =============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('progress-photos', 'progress-photos', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('exercise-media', 'exercise-media', true)
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------------------------
-- progress-photos object policies — folder-scoped to the owning user
-- -------------------------------------------------------------------------
CREATE POLICY progress_photos_objects_select_own
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'progress-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY progress_photos_objects_insert_own
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'progress-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY progress_photos_objects_update_own
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'progress-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'progress-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY progress_photos_objects_delete_own
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'progress-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- -------------------------------------------------------------------------
-- exercise-media object policies — public read, service-role write
-- -------------------------------------------------------------------------
CREATE POLICY exercise_media_objects_select_public
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'exercise-media');

CREATE POLICY exercise_media_objects_insert_service
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'exercise-media');

CREATE POLICY exercise_media_objects_update_service
  ON storage.objects FOR UPDATE
  TO service_role
  USING (bucket_id = 'exercise-media')
  WITH CHECK (bucket_id = 'exercise-media');

CREATE POLICY exercise_media_objects_delete_service
  ON storage.objects FOR DELETE
  TO service_role
  USING (bucket_id = 'exercise-media');
