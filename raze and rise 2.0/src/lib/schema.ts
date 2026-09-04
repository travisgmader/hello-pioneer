/**
 * PowerSync AppSchema — mirrors the Supabase normalized schema.
 *
 * 14 tables: profiles, split_settings, exercises, templates, template_exercises,
 *            sessions, session_sets, measurements, notification_preferences,
 *            programs, program_weeks, progress_photos, badges, user_stats.
 *
 * Phase 1/2 tables mirror 20260519000000_initial_schema.sql.
 * Phase 3 tables + columns mirror 20260610000000_phase3_schema.sql.
 *
 * Column types follow the Supabase migration exactly:
 *   - uuid / text fields → column.text
 *   - integer / boolean (stored as 0/1) → column.integer
 *   - real / numeric → column.real
 *   - timestamp fields stored as ISO strings → column.text
 *
 * Note: PowerSync automatically manages the 'id' column as the row primary key.
 * Do NOT declare 'id' in the columns object — PowerSync adds it implicitly.
 * For tables that use a non-id primary key on the Supabase side (profiles,
 * split_settings, notification_preferences — keyed by user_id), the user_id
 * column is included as a regular column and indexed for query performance.
 */

import { column, Schema, Table } from '@powersync/react-native';

// 1. Profiles (one per auth user)
const profilesTable = new Table(
  {
    user_id: column.text,
    display_name: column.text,
    units: column.text,             // 'lbs' | 'kg'
    primary_goal: column.text,      // 'strength' | 'hypertrophy' | 'fat-loss' | 'general'
    age: column.integer,
    height_cm: column.real,
    sex: column.text,               // 'male' | 'female' | 'other'
    onboarded: column.integer,      // boolean: 0 | 1
    migration_status: column.text,  // 'none' | 'pending' | 'in_progress' | 'complete' | 'failed'
    created_at: column.text,
    updated_at: column.text,
  },
  { indexes: { by_user_id: ['user_id'] } },
);

// 2. Split settings (one per user)
const splitSettingsTable = new Table(
  {
    user_id: column.text,
    split_type: column.text,        // 'ppl' | 'upper-lower' | 'full-body' | 'body-part' | 'af-pt'
    rotation_pointer: column.integer,
    phase: column.integer,
    phase_started_at: column.text,
    weeks_in_phase: column.integer,
    deload_active: column.integer,  // boolean: 0 | 1
    global_rest_seconds: column.integer,
    weight_method: column.text,
    updated_at: column.text,
  },
  { indexes: { by_user_id: ['user_id'] } },
);

// 3. Exercises (shared library + custom per user)
const exercisesTable = new Table(
  {
    name: column.text,
    muscle_group: column.text,
    equipment: column.text,
    type: column.text,              // 'strength' | 'bodyweight' | 'run' | 'cardio'
    exercisedb_video_id: column.text,
    is_custom: column.integer,      // boolean: 0 | 1
    created_by: column.text,        // user_id or null
    created_at: column.text,
  },
  { indexes: { by_muscle_group: ['muscle_group'], by_created_by: ['created_by'] } },
);

// 4. Templates
const templatesTable = new Table(
  {
    user_id: column.text,
    day_label: column.text,
    name: column.text,
    is_deleted: column.integer,     // boolean: 0 | 1
    created_at: column.text,
    updated_at: column.text,
  },
  { indexes: { by_user_id: ['user_id'] } },
);

// 5. Template exercises
const templateExercisesTable = new Table(
  {
    template_id: column.text,
    exercise_id: column.text,
    position: column.integer,
    sets: column.integer,
    rep_low: column.integer,
    rep_high: column.integer,
    superset_group: column.integer,
    default_rest_seconds: column.integer,
    // Phase 3 (TEMPLATE-05): per-template override of the exercise type.
    // NULL = fall back to the linked exercises.type from the library JOIN.
    exercise_type: column.text,     // 'strength' | 'bodyweight' | 'run' | 'cardio' | null
    created_at: column.text,
  },
  { indexes: { by_template_id: ['template_id'] } },
);

// 6. Sessions (each workout is one row; id is client-generated UUID — DATA-02)
const sessionsTable = new Table(
  {
    user_id: column.text,
    template_id: column.text,
    day_label: column.text,
    started_at: column.text,
    completed_at: column.text,
    notes: column.text,
    is_deleted: column.integer,     // boolean: 0 | 1 — soft delete only (DATA-02)
  },
  { indexes: { by_user_id: ['user_id'], by_started_at: ['started_at'] } },
);

// 7. Session sets
const sessionSetsTable = new Table(
  {
    session_id: column.text,
    exercise_id: column.text,
    exercise_name: column.text,     // snapshot at time of logging
    set_number: column.integer,
    weight_kg: column.real,
    reps_target: column.integer,
    result: column.text,            // 'go' | 'no-go' | null
    rpe: column.integer,
    is_warmup: column.integer,      // boolean: 0 | 1
    notes: column.text,
    logged_at: column.text,
  },
  { indexes: { by_session_id: ['session_id'] } },
);

// 8. Measurements
// NOTE: the ordering column is `measured_at` — never `logged_at`. `logged_at`
// exists only on session_sets. (RESEARCH Pitfall 1.)
const measurementsTable = new Table(
  {
    user_id: column.text,
    measured_at: column.text,
    weight_kg: column.real,
    body_fat_pct: column.real,
    chest_cm: column.real,
    waist_cm: column.real,
    // Phase 3 (PROGRESS-04): these four columns have existed in Postgres since
    // the initial schema but were never mirrored here — PowerSync returned
    // undefined for them. Declared now so measurement history can read them.
    hips_cm: column.real,
    arms_cm: column.real,
    thighs_cm: column.real,
    notes: column.text,
  },
  { indexes: { by_user_id: ['user_id'] } },
);

// 9. Notification preferences (one per user)
const notificationPreferencesTable = new Table(
  {
    user_id: column.text,
    workout_reminder_enabled: column.integer,  // boolean: 0 | 1
    workout_reminder_time: column.text,         // HH:MM string
    updated_at: column.text,
  },
  { indexes: { by_user_id: ['user_id'] } },
);

// 10. Programs (PROGRAM-01) — multi-week training program
const programsTable = new Table(
  {
    user_id: column.text,
    name: column.text,
    total_weeks: column.integer,
    current_week: column.integer,
    phase: column.integer,
    is_active: column.integer,      // boolean: 0 | 1
    is_deleted: column.integer,     // boolean: 0 | 1 — soft delete (DATA-02)
    created_at: column.text,
    updated_at: column.text,
  },
  { indexes: { by_user_id: ['user_id'] } },
);

// 11. Program weeks (PROGRAM-01 / PROGRAM-03)
// One row per (week, day) cell of the ProgramWeekGrid. template_id null = rest day.
const programWeeksTable = new Table(
  {
    program_id: column.text,
    week_number: column.integer,
    is_deload: column.integer,      // boolean: 0 | 1
    day_label: column.text,
    template_id: column.text,       // null = rest day
    position: column.integer,
    created_at: column.text,
  },
  { indexes: { by_program_id: ['program_id'], by_template_id: ['template_id'] } },
);

// 12. Progress photos (PHOTO-01 / PHOTO-02)
// Metadata only — the binary lives in the private `progress-photos` Storage
// bucket at {user_id}/{filename}; storage_path holds that object path.
const progressPhotosTable = new Table(
  {
    user_id: column.text,
    taken_on: column.text,          // ISO date, YYYY-MM-DD
    storage_path: column.text,
    created_at: column.text,
  },
  { indexes: { by_user_id: ['user_id'], by_taken_on: ['taken_on'] } },
);

// 13. Badges (GAMIFY-01) — one row per unlocked achievement
const badgesTable = new Table(
  {
    user_id: column.text,
    badge_key: column.text,
    unlocked_at: column.text,
    created_at: column.text,
  },
  { indexes: { by_user_id: ['user_id'], by_badge_key: ['user_id', 'badge_key'] } },
);

// 14. User stats (GAMIFY-01) — running aggregates for badge threshold detection
const userStatsTable = new Table(
  {
    user_id: column.text,
    total_sessions: column.integer,
    lifetime_volume_kg: column.real,
    first_pr_at: column.text,
    updated_at: column.text,
  },
  { indexes: { by_user_id: ['user_id'] } },
);

export const AppSchema = new Schema({
  profiles: profilesTable,
  split_settings: splitSettingsTable,
  exercises: exercisesTable,
  templates: templatesTable,
  template_exercises: templateExercisesTable,
  sessions: sessionsTable,
  session_sets: sessionSetsTable,
  measurements: measurementsTable,
  notification_preferences: notificationPreferencesTable,
  // Phase 3
  programs: programsTable,
  program_weeks: programWeeksTable,
  progress_photos: progressPhotosTable,
  badges: badgesTable,
  user_stats: userStatsTable,
});
