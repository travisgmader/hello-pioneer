-- =============================================================================
-- Migration: 20260519000100_rls_policies.sql
-- Critical: RLS + policies in same migration per FOUND-07. Missing SELECT
-- policy = silent empty queries (supabase/supabase#35282).
--
-- All policies use (SELECT auth.uid()) — the cached form. Using auth.uid()
-- directly causes a per-row function call; wrapping in SELECT caches the
-- result for the entire query (RESEARCH.md Pitfall 2).
-- =============================================================================

-- -------------------------------------------------------------------------
-- profiles
-- -------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_own
  ON public.profiles FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY profiles_insert_own
  ON public.profiles FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY profiles_update_own
  ON public.profiles FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY profiles_delete_own
  ON public.profiles FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- -------------------------------------------------------------------------
-- split_settings
-- -------------------------------------------------------------------------
ALTER TABLE public.split_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY split_settings_select_own
  ON public.split_settings FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY split_settings_insert_own
  ON public.split_settings FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY split_settings_update_own
  ON public.split_settings FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY split_settings_delete_own
  ON public.split_settings FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- -------------------------------------------------------------------------
-- exercises
-- SELECT: built-in exercises (is_custom = false) visible to all authenticated
--         users; custom exercises visible only to their creator.
-- INSERT: only custom exercises; creator must be the authenticated user.
-- UPDATE/DELETE: only the creator of a custom exercise.
-- -------------------------------------------------------------------------
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY exercises_select_visible
  ON public.exercises FOR SELECT
  USING (
    is_custom = false
    OR created_by = (SELECT auth.uid())
  );

CREATE POLICY exercises_insert_own
  ON public.exercises FOR INSERT
  WITH CHECK (
    is_custom = true
    AND created_by = (SELECT auth.uid())
  );

CREATE POLICY exercises_update_own
  ON public.exercises FOR UPDATE
  USING (created_by = (SELECT auth.uid()))
  WITH CHECK (created_by = (SELECT auth.uid()));

CREATE POLICY exercises_delete_own
  ON public.exercises FOR DELETE
  USING (created_by = (SELECT auth.uid()));

-- -------------------------------------------------------------------------
-- templates
-- -------------------------------------------------------------------------
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY templates_select_own
  ON public.templates FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY templates_insert_own
  ON public.templates FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY templates_update_own
  ON public.templates FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY templates_delete_own
  ON public.templates FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- -------------------------------------------------------------------------
-- template_exercises
-- All 4 policies check parent template ownership via EXISTS subquery.
-- -------------------------------------------------------------------------
ALTER TABLE public.template_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY template_exercises_select_own
  ON public.template_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.templates t
      WHERE t.id = template_id
        AND t.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY template_exercises_insert_own
  ON public.template_exercises FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.templates t
      WHERE t.id = template_id
        AND t.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY template_exercises_update_own
  ON public.template_exercises FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.templates t
      WHERE t.id = template_id
        AND t.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.templates t
      WHERE t.id = template_id
        AND t.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY template_exercises_delete_own
  ON public.template_exercises FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.templates t
      WHERE t.id = template_id
        AND t.user_id = (SELECT auth.uid())
    )
  );

-- -------------------------------------------------------------------------
-- sessions
-- -------------------------------------------------------------------------
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY sessions_select_own
  ON public.sessions FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY sessions_insert_own
  ON public.sessions FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY sessions_update_own
  ON public.sessions FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY sessions_delete_own
  ON public.sessions FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- -------------------------------------------------------------------------
-- session_sets
-- All 4 policies check parent session ownership via EXISTS subquery.
-- -------------------------------------------------------------------------
ALTER TABLE public.session_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY session_sets_select_own
  ON public.session_sets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_id
        AND s.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY session_sets_insert_own
  ON public.session_sets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_id
        AND s.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY session_sets_update_own
  ON public.session_sets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_id
        AND s.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_id
        AND s.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY session_sets_delete_own
  ON public.session_sets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_id
        AND s.user_id = (SELECT auth.uid())
    )
  );

-- -------------------------------------------------------------------------
-- measurements
-- -------------------------------------------------------------------------
ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY measurements_select_own
  ON public.measurements FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY measurements_insert_own
  ON public.measurements FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY measurements_update_own
  ON public.measurements FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY measurements_delete_own
  ON public.measurements FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- -------------------------------------------------------------------------
-- notification_preferences
-- -------------------------------------------------------------------------
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY notification_preferences_select_own
  ON public.notification_preferences FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY notification_preferences_insert_own
  ON public.notification_preferences FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY notification_preferences_update_own
  ON public.notification_preferences FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY notification_preferences_delete_own
  ON public.notification_preferences FOR DELETE
  USING (user_id = (SELECT auth.uid()));
