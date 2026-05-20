---
phase: 01-foundation
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - supabase/migrations/20260519000000_initial_schema.sql
  - supabase/migrations/20260519000100_rls_policies.sql
  - supabase/migrations/20260519000200_powersync_setup.sql
  - src/types/database.ts
autonomous: false
requirements:
  - FOUND-07
  - DATA-01
  - DATA-02

must_haves:
  truths:
    - "9 Postgres tables exist in the Supabase project with correct column types"
    - "RLS is enabled on every table and all 4 CRUD policies exist per table"
    - "A profile row is auto-created when a new auth.users record is inserted"
    - "supabase db push succeeds with no errors"
    - "src/types/database.ts is generated and imports without TypeScript errors"
    - "Querying a table as a non-owner returns empty rows (RLS enforcement)"
  artifacts:
    - path: "supabase/migrations/20260519000000_initial_schema.sql"
      provides: "9 normalized tables with constraints, indexes, and auto-create trigger"
      contains: "CREATE TABLE public.profiles, CREATE TABLE public.sessions, CREATE TABLE public.session_sets, handle_new_user"
    - path: "supabase/migrations/20260519000100_rls_policies.sql"
      provides: "RLS enabled + 4 CRUD policies per table"
      contains: "ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY"
    - path: "supabase/migrations/20260519000200_powersync_setup.sql"
      provides: "Postgres replication role + publication for PowerSync"
      contains: "CREATE ROLE powersync_role, CREATE PUBLICATION powersync"
    - path: "src/types/database.ts"
      provides: "TypeScript types generated from live Supabase schema"
  key_links:
    - from: "supabase/migrations/20260519000100_rls_policies.sql"
      to: "auth.uid()"
      via: "(SELECT auth.uid()) predicate in every RLS policy"
      pattern: "SELECT auth.uid()"
    - from: "supabase/migrations/20260519000200_powersync_setup.sql"
      to: "src/lib/connector.ts"
      via: "powersync_role + powersync publication enable WAL sync"
      pattern: "powersync_role"

user_setup:
  - service: supabase
    why: "Schema must be pushed to live Supabase project before client tests pass"
    env_vars:
      - name: SUPABASE_ACCESS_TOKEN
        source: "Supabase Dashboard → Account → Access Tokens"
      - name: SUPABASE_DB_PASSWORD
        source: "Supabase Dashboard → Settings → Database → Connection string password"
    dashboard_config:
      - task: "Install Supabase CLI: brew install supabase/tap/supabase"
        location: "Terminal"
      - task: "Run: supabase login"
        location: "Terminal"
      - task: "Run: supabase link --project-ref jmtogdlsgpfoefbgdubm"
        location: "Terminal (from project root)"
      - task: "Create powersync_role password — store in password manager; needed in PowerSync dashboard setup"
        location: "Supabase SQL Editor (run migration 000200)"
---

<objective>
This plan creates the complete normalized Supabase schema for v2 — 9 tables, RLS policies on every table (all 4 CRUD operations), a PowerSync replication role, and a Postgres publication. Then runs [BLOCKING] supabase db push to deploy the schema to the live Supabase project. Finally generates TypeScript types from the deployed schema.

This plan runs in Wave 1 parallel with the scaffold plan (01-scaffold-PLAN.md) — they share no files.

Purpose: Without the deployed schema, all Phase 1 auth, onboarding, migration, and sync tasks cannot be verified against real Supabase rows. The schema must be live before Wave 2 auth integration begins.

Output: All 9 tables deployed to jmtogdlsgpfoefbgdubm with RLS enabled, PowerSync publication active, and TypeScript types generated.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/01-foundation/CONTEXT.md
@.planning/phases/01-foundation/01-RESEARCH.md
@.planning/phases/01-foundation/01-SKELETON.md

<interfaces>
<!-- Tables that must exist after this plan — PowerSync schema.ts and connector.ts depend on these exact names -->
Tables: profiles, split_settings, exercises, templates, template_exercises, sessions, session_sets, measurements, notification_preferences
Migration status enum: 'none' | 'pending' | 'in_progress' | 'complete' | 'failed'
Sessions PK: client-generated UUID (not DEFAULT gen_random_uuid()) — required for offline conflict resolution (DATA-02)
Session_sets PK: client-generated UUID (same reason)
Soft delete column: is_deleted boolean on sessions, templates (DATA-02 — never hard delete)
RLS predicate pattern: (SELECT auth.uid()) — cached per-query (not auth.uid() directly) per RESEARCH.md Pitfall 2

Profiles auto-create trigger:
  Function: handle_new_user() SECURITY DEFINER
  Trigger: AFTER INSERT ON auth.users FOR EACH ROW
  Action: INSERT INTO profiles(user_id, display_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)) ON CONFLICT DO NOTHING

PowerSync setup (migration 000200):
  Role: powersync_role WITH REPLICATION LOGIN
  Grants: USAGE ON SCHEMA public, SELECT ON ALL TABLES, ALTER DEFAULT PRIVILEGES future tables
  Publication: CREATE PUBLICATION powersync FOR ALL TABLES
  Note: powersync_role password is separate from Supabase DB password — store securely
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Write SQL migration files (schema + RLS + PowerSync)</name>
  <read_first>
    .planning/phases/01-foundation/01-RESEARCH.md (Database Schema section — lines 1010–1245, RLS section, PowerSync Architecture section)
    .planning/phases/01-foundation/CONTEXT.md (Decision 4a — migration_status enum; DATA-02 soft deletes)
  </read_first>
  <action>
    Create three SQL migration files under supabase/migrations/. Initialize the supabase directory first with `supabase init` if not already present, then `supabase link --project-ref jmtogdlsgpfoefbgdubm`.

    File 1: supabase/migrations/20260519000000_initial_schema.sql
    Create all 9 tables in this exact order (respects foreign key dependencies):
    1. profiles — user_id uuid PK REFERENCES auth.users ON DELETE CASCADE; display_name text; units text NOT NULL DEFAULT 'lbs' CHECK (units IN ('lbs','kg')); primary_goal text; age int; height_cm real; sex text CHECK (sex IN ('male','female','other',NULL)); onboarded boolean NOT NULL DEFAULT false; migration_status text NOT NULL DEFAULT 'none' CHECK (migration_status IN ('none','pending','in_progress','complete','failed')); created_at + updated_at timestamptz NOT NULL DEFAULT now(). Index: idx_profiles_user_id.
    2. split_settings — user_id uuid PK REFERENCES auth.users ON DELETE CASCADE; split_type text NOT NULL; rotation_pointer int NOT NULL DEFAULT 0; phase int NOT NULL DEFAULT 0; phase_started_at timestamptz; weeks_in_phase int NOT NULL DEFAULT 0; deload_active boolean NOT NULL DEFAULT false; global_rest_seconds int NOT NULL DEFAULT 90; weight_method text NOT NULL DEFAULT 'manual'; updated_at timestamptz NOT NULL DEFAULT now(). Index: idx_split_settings_user_id.
    3. exercises — id uuid PK DEFAULT gen_random_uuid(); name text NOT NULL; muscle_group text; equipment text; type text NOT NULL DEFAULT 'strength' CHECK (type IN ('strength','bodyweight','run','cardio')); exercisedb_video_id text; is_custom boolean NOT NULL DEFAULT false; created_by uuid REFERENCES auth.users ON DELETE CASCADE; created_at timestamptz NOT NULL DEFAULT now(). Indexes: idx_exercises_created_by, idx_exercises_muscle_group.
    4. templates — id uuid PK DEFAULT gen_random_uuid(); user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE; day_label text NOT NULL; name text; is_deleted boolean NOT NULL DEFAULT false; created_at + updated_at timestamptz NOT NULL DEFAULT now(). Index: idx_templates_user_id.
    5. template_exercises — id uuid PK DEFAULT gen_random_uuid(); template_id uuid NOT NULL REFERENCES templates ON DELETE CASCADE; exercise_id uuid NOT NULL REFERENCES exercises ON DELETE RESTRICT; position int NOT NULL; sets int NOT NULL; rep_low int; rep_high int; superset_group int; default_rest_seconds int; created_at timestamptz NOT NULL DEFAULT now(). Index: idx_template_exercises_template_id.
    6. sessions — id uuid PRIMARY KEY (NOT DEFAULT gen_random_uuid() — client-generated for conflict resolution per DATA-02); user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE; template_id uuid REFERENCES templates ON DELETE SET NULL; day_label text; started_at timestamptz NOT NULL DEFAULT now(); completed_at timestamptz; notes text; is_deleted boolean NOT NULL DEFAULT false. Indexes: idx_sessions_user_id, idx_sessions_started_at (DESC).
    7. session_sets — id uuid PRIMARY KEY (client-generated); session_id uuid NOT NULL REFERENCES sessions ON DELETE CASCADE; exercise_id uuid NOT NULL REFERENCES exercises ON DELETE RESTRICT; exercise_name text; set_number int NOT NULL; weight_kg real; reps_target int; result text CHECK (result IN ('go','no-go') OR result IS NULL); rpe int CHECK (rpe BETWEEN 1 AND 10); is_warmup boolean NOT NULL DEFAULT false; notes text; logged_at timestamptz NOT NULL DEFAULT now(). Index: idx_session_sets_session_id.
    8. measurements — id uuid PK DEFAULT gen_random_uuid(); user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE; measured_at timestamptz NOT NULL DEFAULT now(); weight_kg real; body_fat_pct real; chest_cm real; waist_cm real; hips_cm real; arms_cm real; thighs_cm real; notes text. Indexes: idx_measurements_user_id, idx_measurements_measured_at (user_id, measured_at DESC).
    9. notification_preferences — user_id uuid PK REFERENCES auth.users ON DELETE CASCADE; workout_reminder_enabled boolean NOT NULL DEFAULT true; workout_reminder_time time; pr_alerts_enabled boolean NOT NULL DEFAULT true; weekly_summary_enabled boolean NOT NULL DEFAULT true; meal_reminders_enabled boolean NOT NULL DEFAULT false; updated_at timestamptz NOT NULL DEFAULT now().
    Include the handle_new_user() trigger function (SECURITY DEFINER) and trigger on auth.users. The INSERT statement in the function MUST use ON CONFLICT (user_id) DO NOTHING — idempotent with migration upserts (RESEARCH.md Pitfall 6).

    File 2: supabase/migrations/20260519000100_rls_policies.sql
    For every table: ALTER TABLE ... ENABLE ROW LEVEL SECURITY. Then create 4 policies per table (SELECT/INSERT/UPDATE/DELETE). All policies use `(SELECT auth.uid())` (cached form — not `auth.uid()` directly; prevents per-row function calls per RESEARCH.md Pitfall 2). Policy naming pattern: "{tablename}_{operation}_own". Exceptions:
    - exercises: SELECT policy is "exercises_select_visible" — `is_custom = false OR created_by = (SELECT auth.uid())`; INSERT policy requires `is_custom = true AND created_by = (SELECT auth.uid())`
    - template_exercises: all 4 policies use EXISTS subquery checking parent template ownership
    - session_sets: all 4 policies use EXISTS subquery checking parent session ownership
    Include a comment at the top: "-- Critical: RLS + policies in same migration per FOUND-07. Missing SELECT policy = silent empty queries (supabase/supabase#35282)."

    File 3: supabase/migrations/20260519000200_powersync_setup.sql
    Create the PowerSync replication role:
    CREATE ROLE powersync_role WITH REPLICATION LOGIN PASSWORD '${POWERSYNC_ROLE_PASSWORD}';
    (Note: Replace ${POWERSYNC_ROLE_PASSWORD} placeholder before running — this is a secret set by the user in Supabase SQL Editor, not hardcoded in the file)
    GRANT USAGE ON SCHEMA public TO powersync_role;
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO powersync_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO powersync_role;
    CREATE PUBLICATION powersync FOR ALL TABLES;
    Add comment explaining the POWERSYNC_ROLE_PASSWORD placeholder must be replaced before pushing.
  </action>
  <verify>
    <automated>npx tsc --noEmit && grep -c "ENABLE ROW LEVEL SECURITY" supabase/migrations/20260519000100_rls_policies.sql && grep -c "CREATE TABLE" supabase/migrations/20260519000000_initial_schema.sql && ls supabase/migrations/ | wc -l</automated>
    <!-- SQL correctness (RLS policies, triggers) is only fully verifiable post-deploy via the Task 2 human checkpoint.
         The grep structural checks above are the best pre-deploy signal: they confirm RLS was applied to all 9 tables
         and all 9 CREATE TABLE statements exist. Exact policy logic is verified in Task 2 via Supabase Dashboard. -->
  </verify>
  <acceptance_criteria>
    - `grep -c "ENABLE ROW LEVEL SECURITY" supabase/migrations/20260519000100_rls_policies.sql` returns 9
    - `grep -c "CREATE TABLE" supabase/migrations/20260519000000_initial_schema.sql` returns 9
    - `ls supabase/migrations/ | wc -l` returns 3
    - `ls supabase/migrations/` shows 3 files with the exact timestamps 20260519000000, 20260519000100, 20260519000200
    - `grep "ENABLE ROW LEVEL SECURITY" supabase/migrations/20260519000100_rls_policies.sql | wc -l` returns 9 or more (one per table)
    - `grep "SELECT auth.uid()" supabase/migrations/20260519000100_rls_policies.sql` returns matches (cached form used)
    - `grep "ON CONFLICT.*DO NOTHING" supabase/migrations/20260519000000_initial_schema.sql` returns a match (trigger idempotency)
    - `grep "id uuid PRIMARY KEY," supabase/migrations/20260519000000_initial_schema.sql` returns matches for sessions and session_sets (no DEFAULT gen_random_uuid() on those PKs)
    - `grep "is_deleted" supabase/migrations/20260519000000_initial_schema.sql | grep -v "#"` returns matches for sessions and templates tables
  </acceptance_criteria>
  <done>All 3 SQL migration files written with correct schema, RLS policies, and PowerSync setup.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 2 [BLOCKING]: supabase db push + verify schema deployed</name>
  <read_first>
    supabase/migrations/20260519000200_powersync_setup.sql (read the POWERSYNC_ROLE_PASSWORD placeholder — replace it with a real password before pushing)
  </read_first>
  <what-built>
    All 3 SQL migration files are written to supabase/migrations/. Claude has verified the SQL structure passes tsc. Now you need to run supabase db push to apply these migrations to the live Supabase project jmtogdlsgpfoefbgdubm.

    BEFORE running db push:
    1. Open supabase/migrations/20260519000200_powersync_setup.sql and replace ${POWERSYNC_ROLE_PASSWORD} with a real strong password (store it in your password manager — you will need it when connecting PowerSync to Supabase).
    2. Make sure you are logged in: run `supabase login` and `supabase link --project-ref jmtogdlsgpfoefbgdubm`.

    IMPORTANT: supabase db push may prompt interactively for your database password. It cannot be suppressed — this is a blocking human action.
  </what-built>
  <how-to-verify>
    1. Replace ${POWERSYNC_ROLE_PASSWORD} in 20260519000200_powersync_setup.sql with a real password.
    2. Run: `supabase db push`
    3. Confirm the command succeeds with no errors.
    4. Verify in Supabase Dashboard → Table Editor: you should see all 9 tables: profiles, split_settings, exercises, templates, template_exercises, sessions, session_sets, measurements, notification_preferences.
    5. Click on profiles table → click the lock icon or go to Authentication → Policies — confirm RLS is enabled and policies exist.
    6. Run: `npm run gen:types` — this runs `supabase gen types typescript --project-id jmtogdlsgpfoefbgdubm > src/types/database.ts`. Confirm src/types/database.ts is created.
    7. Run: `npx tsc --noEmit` — confirm it still passes with the generated types file.
  </how-to-verify>
  <resume-signal>Type "schema deployed" when supabase db push succeeds and all 9 tables are visible in the Supabase dashboard. If push fails, paste the error output.</resume-signal>
</task>

<task type="auto">
  <name>Task 3: Seed starter templates exercise library + verify RLS integration test passes</name>
  <read_first>
    .planning/phases/01-foundation/01-RESEARCH.md (Database Schema — exercises table, templates table)
    .planning/phases/01-foundation/CONTEXT.md (ONBOARD-04 — user creates/selects first template; starter templates needed for onboarding step 3)
    supabase/migrations/20260519000000_initial_schema.sql (exercises and templates table structure)
  </read_first>
  <action>
    Step 1 — Create supabase/seed.sql with starter exercise data:
    Insert 30–50 built-in exercises (is_custom = false, created_by = null) covering the major muscle groups. Include at minimum: Bench Press (chest, strength), Incline Dumbbell Press (chest), Cable Fly (chest), Squat (legs, strength), Romanian Deadlift (legs), Leg Press (legs), Pull-up (back, bodyweight), Bent-over Row (back), Lat Pulldown (back), Overhead Press (shoulders, strength), Lateral Raise (shoulders), Arnold Press (shoulders), Tricep Pushdown (triceps), Skull Crusher (triceps), Barbell Curl (biceps), Hammer Curl (biceps), Deadlift (full body, strength), Hip Thrust (glutes), Running (run type), Push-up (chest, bodyweight), Dip (chest, bodyweight), Sit-up (core, bodyweight). Use gen_random_uuid() for each id. All exercises have name, muscle_group, equipment (barbell/dumbbell/cable/machine/bodyweight/none), type (strength/bodyweight/run).

    Step 2 — Create supabase/seed-templates.sql with 3 starter templates for each main split type:
    These are seeded as user_id = null with a special is_starter = true column. Wait — the templates table has user_id NOT NULL. Instead, seed templates are stored as exercises-only seed data; the onboarding UI assembles them by presenting exercise selections grouped by split.

    Alternative: Create a `starter_templates` JSONB config file at supabase/starter-templates.json containing pre-defined template configurations per split type. The onboarding template-picker screen reads this JSON and creates real template rows for the user on selection.

    Create supabase/starter-templates.json with entries for: PPL (Push day: Bench Press + Overhead Press + Tricep Pushdown; Pull day: Pull-up + Bent-over Row + Barbell Curl; Legs day: Squat + Romanian Deadlift + Leg Press), Upper/Lower (Upper: Bench Press + Bent-over Row + Overhead Press; Lower: Squat + Romanian Deadlift + Hip Thrust), Full Body (Full Body A: Squat + Bench Press + Bent-over Row; Full Body B: Deadlift + Overhead Press + Pull-up), Body Part (Chest: Bench Press + Incline Dumbbell Press + Cable Fly; Back: Pull-up + Bent-over Row + Lat Pulldown; Shoulders: Overhead Press + Lateral Raise + Arnold Press; Arms: Barbell Curl + Hammer Curl + Tricep Pushdown; Legs: Squat + Romanian Deadlift + Leg Press), AF PT Prep (Run day: Running + Push-up + Sit-up + Pull-up).

    Step 3 — Run seed: `supabase db reset --linked` would work but is destructive. Instead: `supabase db push` already ran. Run the exercises seed directly: `supabase sql --file supabase/seed.sql`. This inserts built-in exercises into the live project.

    Step 4 — Update tests/integration/rls.test.ts from placeholder skeleton to a real test:
    The test uses the Supabase test client with two test users (anonymous auth or pre-created test users). It:
    a) Signs in as test user A, inserts a sessions row, then queries it — expects 1 row returned.
    b) Signs in as test user B, queries test user A's sessions — expects 0 rows returned (RLS blocks cross-user read).
    c) Verifies exercises with is_custom = false are readable by both users.
    This test requires EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY environment variables.
    Note: In CI these are set via GitHub Actions secrets. Locally they come from .env.local.
  </action>
  <verify>
    <automated>supabase sql "SELECT count(*) FROM exercises WHERE is_custom = false" && npx tsc --noEmit</automated>
  </verify>
  <acceptance_criteria>
    - `supabase sql "SELECT count(*) FROM public.exercises WHERE is_custom = false"` returns count >= 20
    - supabase/starter-templates.json exists and contains entries for "ppl", "upper-lower", "full-body", "body-part", "af-pt" keys
    - tests/integration/rls.test.ts is no longer a placeholder skeleton — it contains real describe/it blocks with RLS assertions
    - `npx tsc --noEmit` exits 0
    - `cat src/types/database.ts | grep "profiles"` returns a match (types generated from deployed schema)
  </acceptance_criteria>
  <done>Supabase schema deployed to live project. Built-in exercise library seeded (20+ exercises). Starter template configuration file created for onboarding step 3. RLS integration test updated from placeholder to real assertions. TypeScript types generated from live schema.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Supabase RLS | All data access enforced server-side; client cannot bypass |
| PowerSync replication role | Read-only access to WAL; separate credential from app user |
| Edge Function service role | Only used inside Edge Functions; never exposed to client |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-02-T-01 | Tampering | RLS policies — missing SELECT policy = silent empty results | mitigate | All 4 CRUD policies in same migration (FOUND-07); vitest RLS test confirms cross-user isolation |
| T-02-T-02 | Tampering | Migration replay — duplicate profile rows | mitigate | handle_new_user trigger uses ON CONFLICT DO NOTHING; migration uses upsert ON CONFLICT (user_id) |
| T-02-E-01 | Elevation | powersync_role having write access | mitigate | powersync_role granted SELECT only (GRANT SELECT — no INSERT/UPDATE/DELETE) |
| T-02-E-02 | Elevation | service role key used in client | mitigate | SERVICE_ROLE_KEY only in EAS secrets + Edge Function env; never in EXPO_PUBLIC_* or client bundle |
| T-02-I-01 | Information Disclosure | v1 user_state rows readable by powersync_role | accept | powersync_role has SELECT on ALL TABLES — acceptable since v1 data is the user's own data; RLS policies still enforce user isolation at app level |
| T-02-T-03 | Tampering | npm/pip/cargo installs | mitigate | slopcheck + blocking human checkpoint for [ASSUMED]/[SUS]; supabase CLI is Supabase-published |
| T-02-SC | Tampering | npm/pip/cargo installs | mitigate | slopcheck + blocking human checkpoint for [ASSUMED] / [SUS] |
</threat_model>

<verification>
1. `supabase sql "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"` — returns all 9 expected tables
2. `supabase sql "SELECT tablename FROM pg_policies WHERE schemaname='public' ORDER BY tablename, cmd"` — returns 4+ policies per table
3. `supabase sql "SELECT count(*) FROM public.exercises WHERE is_custom = false"` — returns >= 20
4. `npx tsc --noEmit` exits 0 with generated types
5. `cat src/types/database.ts | grep "profiles"` — confirms types generated from live schema
6. Manual: Supabase Dashboard → Table Editor → sessions → lock icon — confirm RLS enabled
</verification>

<success_criteria>
- All 9 v2 normalized tables deployed to Supabase project jmtogdlsgpfoefbgdubm (FOUND-07)
- RLS enabled on every table with all 4 CRUD policies per table (FOUND-07)
- PowerSync replication role and publication configured (FOUND-06 server-side)
- Profile auto-create trigger functional (DATA-01 foundation)
- Soft delete pattern established on sessions and templates (DATA-02)
- Client-generated UUIDs on sessions.id and session_sets.id (DATA-02)
- TypeScript types generated from live schema
- Built-in exercise library seeded for onboarding template picker (ONBOARD-04 foundation)
</success_criteria>

<output>
Create `.planning/phases/01-foundation/01-schema-SUMMARY.md` when done.
</output>
