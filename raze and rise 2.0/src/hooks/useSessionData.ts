/**
 * useSessionData — PowerSync read hooks for the session screen.
 *
 * Provides two hooks:
 *   - useTodaysTemplate(userId): reads today's workout template from PowerSync local SQLite
 *   - usePreviousPerformance(exerciseId, currentSessionId): loads last session's performance
 *
 * All reads are local SQLite via PowerSync — no network required. PowerSync
 * handles background sync with Supabase automatically.
 *
 * Query strategy:
 *   useTodaysTemplate: split_settings.rotation_pointer → templates.day_label → template_exercises
 *   usePreviousPerformance: session_sets JOIN sessions WHERE completed_at IS NOT NULL, LIMIT 10
 *
 * Schema notes (from src/lib/schema.ts):
 *   - template_exercises uses 'position' (not 'display_order') for ordering
 *   - template_exercises uses 'sets' (not 'set_count') for the set count column
 *   - sessions table has no 'exercise_name' column snapshot — exercise_name lives in session_sets
 */

import { usePowerSyncQuery } from '@powersync/react-native';
import { ExerciseState, SetState } from '@/stores/sessionStore';
import { SetResult } from '@/hooks/useSetResult';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TemplateRow {
  id: string;
  user_id: string;
  day_label: string;
  name: string;
  is_deleted: number;
}

export interface TemplateExerciseRow {
  id: string;
  template_id: string;
  exercise_id: string;
  exercise_name?: string;    // exercise_name is on session_sets, not template_exercises; need to join exercises
  position: number;
  sets: number;
  rep_low: number;
  rep_high: number;
  superset_group: number | null;
  default_rest_seconds: number | null;
  // Joined from exercises table
  name?: string;
  type?: string;
}

export interface SplitSettingsRow {
  id: string;
  user_id: string;
  rotation_pointer: number;
  global_rest_seconds: number | null;
}

export interface PreviousPerformanceRow {
  set_number: number;
  weight_kg: number | null;
  result: string | null;
}

// ── useTodaysTemplate ─────────────────────────────────────────────────────────

interface UseTodaysTemplateResult {
  template: TemplateRow | null;
  exercises: ExerciseState[];
  splitSettings: SplitSettingsRow | null;
  globalRestSeconds: number;
  loading: boolean;
}

/**
 * useTodaysTemplate — loads today's template and exercises from PowerSync.
 *
 * Flow:
 *   1. Read split_settings.rotation_pointer for the user
 *   2. Query templates by user_id (all templates — day_label selection logic below)
 *   3. Query template_exercises for the matching template
 *   4. Return ExerciseState[] for the Zustand store
 *
 * Note: rotation_pointer is used as an index into the user's templates ordered
 * by day_label. If no template exists for today (no templates at all), returns
 * template: null. Plan 08 handles the skip-day flow.
 */
export function useTodaysTemplate(userId: string): UseTodaysTemplateResult {
  // 1. Read split settings to get rotation pointer + global rest seconds
  const { data: splitRows } = usePowerSyncQuery<SplitSettingsRow>(
    `SELECT id, user_id, rotation_pointer, global_rest_seconds
     FROM split_settings
     WHERE user_id = ?`,
    [userId]
  );

  const splitSettings = splitRows?.[0] ?? null;
  const rotationPointer = splitSettings?.rotation_pointer ?? 0;
  const globalRestSeconds = splitSettings?.global_rest_seconds ?? 90;

  // 2. Read all active templates for this user, ordered by day_label
  const { data: allTemplates } = usePowerSyncQuery<TemplateRow>(
    `SELECT id, user_id, day_label, name, is_deleted
     FROM templates
     WHERE user_id = ? AND is_deleted = 0
     ORDER BY day_label`,
    [userId]
  );

  // Pick today's template using rotation_pointer modulo template count
  const template =
    allTemplates && allTemplates.length > 0
      ? allTemplates[rotationPointer % allTemplates.length] ?? null
      : null;

  // 3. Read template exercises for the selected template (joined with exercises for name/type)
  const { data: exerciseRows } = usePowerSyncQuery<TemplateExerciseRow & { exercise_name_from_lib: string; exercise_type: string }>(
    `SELECT
       te.id,
       te.template_id,
       te.exercise_id,
       te.position,
       te.sets,
       te.rep_low,
       te.rep_high,
       te.superset_group,
       te.default_rest_seconds,
       e.name AS exercise_name_from_lib,
       e.type AS exercise_type
     FROM template_exercises te
     LEFT JOIN exercises e ON e.id = te.exercise_id
     WHERE te.template_id = ?
     ORDER BY te.position`,
    [template?.id ?? '']
  );

  // Convert template_exercise rows to ExerciseState[] for the Zustand store
  // Sets are initialized empty — previous performance fills weight in SetRow
  const exercises: ExerciseState[] = (exerciseRows ?? []).map((row) => {
    const sets: SetState[] = Array.from({ length: row.sets ?? 1 }, (_, i) => ({
      id: `${row.id}-set-${i + 1}`,
      setNumber: i + 1,
      weightKg: null,   // pre-filled from previous performance in SetRow
      result: null as SetResult,
      rpe: null,
      isWarmup: false,
      notes: null,
    }));

    return {
      id: row.id,
      exerciseId: row.exercise_id,
      exerciseName: row.exercise_name_from_lib ?? 'Unknown Exercise',
      setCount: row.sets ?? 1,
      repLow: row.rep_low ?? 8,
      repHigh: row.rep_high ?? 12,
      exerciseType: (row.exercise_type as ExerciseState['exerciseType']) ?? 'standard',
      defaultRestSeconds: row.default_rest_seconds ?? null,
      supersetGroup: row.superset_group ?? null,
      sets,
    };
  });

  return {
    template: template ?? null,
    exercises,
    splitSettings,
    globalRestSeconds,
    loading: !splitRows || !allTemplates || !exerciseRows,
  };
}

// ── usePreviousPerformance ────────────────────────────────────────────────────

/**
 * usePreviousPerformance — loads previous performance for an exercise.
 *
 * Exact query from RESEARCH.md Code Examples:
 * Returns the 10 most recent set rows from COMPLETED sessions for this exercise,
 * excluding the current in-progress session.
 *
 * If currentSessionId is null (session not yet started), returns sets from
 * the most recent completed session only.
 *
 * Used by SetRow to pre-fill weight and display ✓✓✓✗ dots.
 */
export function usePreviousPerformance(
  exerciseId: string,
  currentSessionId: string | null
): PreviousPerformanceRow[] {
  // When no current session exists yet, use a placeholder UUID that won't match anything
  const excludeSessionId = currentSessionId ?? '00000000-0000-0000-0000-000000000000';

  const { data } = usePowerSyncQuery<PreviousPerformanceRow>(
    `SELECT ss.set_number, ss.weight_kg, ss.result
     FROM session_sets ss
     JOIN sessions s ON s.id = ss.session_id
     WHERE ss.exercise_id = ?
       AND ss.session_id != ?
       AND s.completed_at IS NOT NULL
     ORDER BY s.completed_at DESC
     LIMIT 10`,
    [exerciseId, excludeSessionId]
  );

  return data ?? [];
}
