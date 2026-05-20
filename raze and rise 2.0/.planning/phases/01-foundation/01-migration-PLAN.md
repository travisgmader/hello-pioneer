---
phase: 01-foundation
plan: 05
type: execute
wave: 3
depends_on:
  - 01-schema-PLAN.md
  - 01-auth-PLAN.md
files_modified:
  - supabase/functions/migrate-v1-user/index.ts
  - app/migration.tsx
  - src/services/migration.ts
  - src/components/MigrationProgress/index.tsx
  - src/hooks/useMigrationStatus.ts
  - tests/integration/migrate.test.ts
  - .planning/phases/01-foundation/v1-sample-state.json
autonomous: false
requirements:
  - DATA-01
  - DATA-02
  - DATA-03

must_haves:
  truths:
    - "Existing v1 user who logs in sees the migration progress screen (not onboarding) until migration completes"
    - "v1 workout history is queryable from sessions + session_sets tables after migration"
    - "v1 templates are queryable from templates + template_exercises after migration"
    - "v1 measurements appear in measurements table after migration"
    - "Running the Edge Function twice for the same user is safe (idempotent)"
    - "Migration failure shows Retry button; user cannot reach Dashboard until success"
    - "New users (no v1 user_state row) skip migration entirely and proceed to onboarding"
    - "v1 raze-and-rise.vercel.app remains live and functional during and after v2 migration"
  artifacts:
    - path: "supabase/functions/migrate-v1-user/index.ts"
      provides: "Edge Function: reads user_state blob, writes normalized v2 rows, marks status"
      contains: "migration_status, deterministicUuid, kgFromLbs"
    - path: "src/services/migration.ts"
      provides: "Client trigger + polling service"
      exports: ["startMigration", "checkMigrationStatus"]
    - path: "src/components/MigrationProgress/index.tsx"
      provides: "Full-screen migration UI with 3 states (in_progress / complete / failed)"
    - path: ".planning/phases/01-foundation/v1-sample-state.json"
      provides: "Real v1 blob shape for migration function to target"
  key_links:
    - from: "app/migration.tsx"
      to: "src/services/migration.ts"
      via: "startMigration called on mount if migration_status is pending"
      pattern: "startMigration"
    - from: "supabase/functions/migrate-v1-user/index.ts"
      to: "public.user_state"
      via: "admin client reads v1 blob: SELECT state FROM user_state WHERE user_id = ?"
      pattern: "user_state"

user_setup:
  - service: supabase
    why: "Edge Function deployment and v1 data inspection require Supabase CLI + project access"
    env_vars:
      - name: SUPABASE_SERVICE_ROLE_KEY
        source: "Supabase Dashboard → Settings → API → service_role (secret) key — store in EAS secrets only, NEVER in client bundle"
    dashboard_config:
      - task: "Add SUPABASE_SERVICE_ROLE_KEY as EAS secret: eas secret:create --name SUPABASE_SERVICE_ROLE_KEY --value <key>"
        location: "Terminal"
      - task: "Take a Supabase point-in-time backup BEFORE deploying the Edge Function to production (STATE.md blocker)"
        location: "Supabase Dashboard → Project Settings → Backups"
      - task: "After Task 1 is done, inspect real v1 user_state via Supabase SQL Editor and copy one row to v1-sample-state.json so Task 2 migration function targets the real shape"
        location: "Supabase SQL Editor: SELECT state FROM user_state WHERE user_id = '<your-user-id>' LIMIT 1"
---

<objective>
This plan implements the v1 → v2 data migration: an Edge Function that reads the `user_state` JSON blob (v1 format) and writes normalized v2 rows into all relevant tables, a client-side trigger + polling service, and the migration progress screen (3 render states: in_progress / complete / failed with Retry).

The migration uses the expand-and-contract pattern: v2 tables exist first (from 01-schema-PLAN.md), the Edge Function backfills them from the v1 blob. The v1 `user_state` table is NOT modified or deleted — it stays as a 60-day read-only backup (DATA-01).

Purpose: Without migration, all existing v1 users (including the developer) would lose workout history when switching to v2. This plan makes v2 a non-destructive upgrade.

Output: Edge Function deployed. Existing v1 users auto-migrated on first v2 login with progress indication. Migration idempotent — safe to retry. New users unaffected.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/01-foundation/CONTEXT.md
@.planning/phases/01-foundation/01-RESEARCH.md
@.planning/phases/01-foundation/01-SKELETON.md
@.planning/phases/01-foundation/01-schema-SUMMARY.md
@.planning/phases/01-foundation/01-auth-SUMMARY.md

<interfaces>
<!-- migration_status enum values (from schema plan) -->
type MigrationStatus = 'none' | 'pending' | 'in_progress' | 'complete' | 'failed'

<!-- Root layout routing (from scaffold plan) -->
session + migration_status in ('pending','in_progress','failed') → /migration screen
session + migration_status in ('none','complete') + not onboarded → (onboarding)/profile
session + migration_status in ('none','complete') + onboarded → (tabs)

<!-- v1 user_state table (same Supabase project jmtogdlsgpfoefbgdubm) -->
TABLE user_state (
  user_id uuid PRIMARY KEY REFERENCES auth.users,
  state jsonb,
  updated_at timestamptz
)
v1 blob shape (INFERRED — confirm against real blob in Task 1):
  state.profile: { name, age, height, sex }
  state.measurements: { weight, bodyFat }
  state.settings: { split, splitPhase, restSeconds, units }
  state.rotation: { pointer }
  state.templates: { [dayLabel]: { exercises: [{ id, name, sets, repLow, repHigh }] } }
  state.history: [{ id, day_label, started_at, completed_at, notes, sets: [...] }]

<!-- MigrationProgress component render states (from UI-SPEC) -->
in_progress: heading "Bringing your history forward" + body + Spinner
complete: CheckCircle2 icon (success color) + heading "All set" + body "Your history is ready."
failed: AlertTriangle icon (danger color) + heading "Something went wrong" + body + Retry Button + Contact support ghost Button

<!-- Idempotency rules -->
All inserts are upserts with deterministic IDs:
  - v1 session.id preserved as-is (already UUID)
  - session_sets: deterministicUuid(sessionId, `s-${exerciseId}-${setNumber}`) using UUIDv5
  - measurements: deterministicUuid(userId, 'm-initial')
  - templates: deterministicUuid(userId, `t-${dayLabel}`)
  - template_exercises: deterministicUuid(templateId, `te-${position}`)
UUIDv5 namespace: use "6ba7b810-9dad-11d1-80b4-00c04fd430c8" (URL namespace) for consistency
</interfaces>
</context>

<tasks>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 1: Inspect real v1 user_state blob + save to v1-sample-state.json</name>
  <read_first>
    .planning/phases/01-foundation/01-RESEARCH.md (v1 Migration section — v1 Data Shape, Assumption A7)
  </read_first>
  <what-built>
    The migration function in Task 2 is designed against an INFERRED v1 blob shape (see RESEARCH.md Assumption A7). Before writing the function, we need the REAL blob shape from the live v1 database — otherwise the migration will fail silently on field name mismatches.

    The v1 Supabase project is jmtogdlsgpfoefbgdubm. The user_state table exists there.
  </what-built>
  <how-to-verify>
    1. Open Supabase Dashboard for project jmtogdlsgpfoefbgdubm
    2. Navigate to SQL Editor
    3. Run: SELECT state FROM user_state WHERE user_id = '<your-user-id>' LIMIT 1;
       (Your user ID can be found in Authentication → Users → your account)
    4. Copy the full JSON blob from the result
    5. Create the file .planning/phases/01-foundation/v1-sample-state.json and paste the blob there
    6. Review the blob: note the actual field names in state.profile, state.settings, state.templates, state.history[0].sets
    7. Write down any field names that differ from the inferred shape in RESEARCH.md (e.g., if history uses "workouts" not "history", or sets use "weight_lbs" not "weight")
    8. Share the diff with Claude — it will update the migration function in Task 2 to match the real shape
  </how-to-verify>
  <resume-signal>Paste the v1-sample-state.json contents (or confirm the file is saved). Note any field names that differ from the RESEARCH.md inferred shape. If the inferred shape matches exactly, type "shape matches".</resume-signal>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Edge Function + client migration service + MigrationProgress screen + integration test</name>
  <read_first>
    .planning/phases/01-foundation/v1-sample-state.json (REAL blob shape from Task 1 — USE THIS, not the inferred shape)
    .planning/phases/01-foundation/01-RESEARCH.md (v1 Migration section — Migration Function Design, Client-side Trigger + Polling, Idempotency Rules, Migration Trigger Logic)
    .planning/phases/01-foundation/01-UI-SPEC.md (Migration Progress Screen layout — in_progress, complete, failed states; Copywriting Contract — Migration Screen)
    supabase/migrations/20260519000000_initial_schema.sql (target table structures)
  </read_first>
  <behavior>
    - deterministicUuid(sessionId, "s-exId-1") always returns the same UUID for the same inputs
    - deterministicUuid("user1", "m-initial") ≠ deterministicUuid("user2", "m-initial")
    - Edge Function called twice for same user: second call returns { status: 'complete' } without duplicating rows
    - Edge Function called for new user (no user_state row): returns { status: 'none' } without writing rows
    - MigrationProgress in in_progress state: Spinner visible, no buttons
    - MigrationProgress in failed state: Retry button visible, tapping it calls onRetry
    - tests/integration/migrate.test.ts: calls the migration logic with a fixture blob matching v1-sample-state.json and asserts sessions/session_sets row count matches expected
  </behavior>
  <action>
    supabase/functions/migrate-v1-user/index.ts:
    Implement the full Edge Function using the REAL v1 blob shape from v1-sample-state.json. Structure:
    1. Validate Authorization header — extract JWT, call userClient.auth.getUser(). Return 401 if no user.
    2. Create admin client using Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') — this bypasses RLS for migration writes.
    3. Check if migration already complete: query profiles.migration_status for this user. If 'complete', return { status: 'complete' } immediately (idempotent fast-path).
    4. Mark in_progress: admin.from('profiles').update({ migration_status: 'in_progress' }).eq('user_id', user.id)
    5. Fetch v1 blob: admin.from('user_state').select('state,updated_at').eq('user_id', user.id).maybeSingle()
    6. If no v1 row: update migration_status='none', return { status: 'none' }
    7. Map v1 blob to v2 tables (use ACTUAL field names from v1-sample-state.json, not inferred):
       a. Profile upsert: display_name, age, height_cm (parse from v1 height field), sex, units, onboarded (true if v1 had split + templates)
       b. Measurements upsert (if v1 weight exists): id=deterministicUuid(userId,'m-initial'), weight_kg (convert lbs→kg if units=lbs), body_fat_pct
       c. Split settings upsert: split_type, rotation_pointer, phase=splitPhase, global_rest_seconds
       d. For each template in v1 templates object: upsert templates row with deterministicUuid(userId, `t-${dayLabel}`). For each exercise in template: look up exercise by name in exercises table (case-insensitive ILIKE); if not found, insert as custom exercise; then upsert template_exercises row with deterministicUuid(templateId, `te-${position}`).
       e. For each entry in v1 history array: upsert sessions row preserving the v1 entry.id as the sessions.id (DATA-02 — client-generated UUIDs). For each set in entry.sets: upsert session_sets with deterministicUuid(sessionId, `s-${setIndex}`) using set index if no stable exercise ID available.
    8. Mark complete: update migration_status='complete'
    9. Return { status: 'complete' }
    10. Catch all errors: update migration_status='failed', return { error: String(err) } with status 500

    Helper functions:
    deterministicUuid(...parts: string[]): string — implement using crypto.subtle.digest('SHA-1', encoded) to produce a UUID v5. Namespace: "6ba7b810-9dad-11d1-80b4-00c04fd430c8" (URL namespace, standard UUIDv5). The digest produces a deterministic UUID from the input parts, ensuring idempotency across re-runs.
    kgFromLbs(lbs: number): number — lbs * 0.45359237
    parseHeight(h: string | number | undefined): number | null — handle formats like "70" (inches), "5'10\"", or numeric cm

    Deploy the function:
    supabase functions deploy migrate-v1-user --no-verify-jwt  (JWT verification is manual in the function)

    src/services/migration.ts:
    startMigration(userId: string): Promise<'complete' | 'failed'>
    1. Update profiles.migration_status = 'pending'
    2. supabase.functions.invoke('migrate-v1-user') — fire, don't await result
    3. Poll profiles.migration_status every 1500ms until 'complete' or 'failed'
    4. Return the final status

    checkMigrationStatus(userId: string): Promise<MigrationStatus>
    Fetches current migration_status from profiles table for the given user.

    src/components/MigrationProgress/index.tsx:
    Full implementation per UI-SPEC Migration Progress Screen. Props: { status: MigrationStatus; onRetry: () => void }
    in_progress: SafeAreaView (bg-bg, flex-1, items-center, justify-center). Heading "Bringing your history forward" (Noto Serif 24px). mt-lg. Body "We're moving your v1 workouts into the new app. Hang tight." (16px fg-muted). mt-lg. Spinner (accent, 32px). No buttons.
    complete: CheckCircle2 icon (32px, success color). Heading "All set". Body "Your history is ready." Auto-navigates to onboarding or tabs after 1500ms (setTimeout).
    failed: AlertTriangle icon (32px, danger color). Heading "Something went wrong". Body "We couldn't import your data. You can try again — your old workouts are safe." mt-xl. Primary Button "Retry" full-width → calls onRetry. mt-md. Ghost Button "Contact support" → Linking.openURL('mailto:support@razeandrise.app').

    app/migration.tsx:
    Render MigrationProgress component. On mount: if migrationStatus is 'pending', call startMigration(session.user.id). Pass onRetry callback that calls startMigration again after resetting status to 'pending'. useMigrationStatus hook drives the status prop.

    Update src/hooks/useMigrationStatus.ts from scaffold plan:
    Real implementation: TanStack Query with { refetchInterval: (data) => (data?.migration_status === 'pending' || data?.migration_status === 'in_progress') ? 2000 : false }. Returns { migrationStatus: MigrationStatus, loading: boolean }.

    tests/integration/migrate.test.ts:
    Real test using the v1-sample-state.json as fixture. Mock the Supabase admin client. Test:
    1. Call migration logic with fixture blob → assert profiles, sessions, session_sets rows were upserted with correct data
    2. Call twice → assert no duplicate rows (idempotency check via deterministicUuid consistency)
    3. Call with no user_state row → assert migration_status set to 'none', no data rows inserted
    4. deterministicUuid unit tests: same inputs → same output; different inputs → different output
  </action>
  <verify>
    <automated>npx tsc --noEmit && npm run test:unit && npm run test:integration</automated>
  </verify>
  <acceptance_criteria>
    - `npx tsc --noEmit` exits 0
    - `npm run test:unit -- --run` passes
    - `npm run test:integration -- --run` passes (migrate.test.ts passes with fixture)
    - `grep "SUPABASE_SERVICE_ROLE_KEY" supabase/functions/migrate-v1-user/index.ts` returns a match (service role used)
    - `grep "EXPO_PUBLIC\|anon_key\|anonKey" supabase/functions/migrate-v1-user/index.ts` returns NO matches (no anon key in edge function)
    - `grep "deterministicUuid" supabase/functions/migrate-v1-user/index.ts | wc -l` — at least 4 uses (sessions, session_sets, measurements, templates)
    - `grep "is_deleted\|soft.delete" supabase/functions/migrate-v1-user/index.ts` — no hard deletes present
    - `grep "user_state" supabase/functions/migrate-v1-user/index.ts` returns a match (reads v1 table)
    - MigrationProgress component has 3 render states (grep "in_progress\|complete\|failed" src/components/MigrationProgress/index.tsx)
    - `grep "Contact support" src/components/MigrationProgress/index.tsx` returns a match (failed state copy correct)
  </acceptance_criteria>
  <done>Edge Function implemented against real v1 blob shape. Idempotent upserts with deterministicUuid. Client-side migration service triggers and polls. MigrationProgress screen has all 3 states per UI-SPEC. Integration tests pass with fixture blob. Function deployable via supabase functions deploy.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Edge Function → v1 user_state | Admin client reads v1 data; service role bypasses RLS — must only be used server-side |
| Edge Function ← Client | JWT auth header validated before any work begins |
| v1 user_state table | Read-only during migration; never written to or deleted (60-day backup window per DATA-01) |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-05-E-01 | Elevation | Service role key in Edge Function | mitigate | Key stored in EAS secrets + Supabase Edge Function env only; never in EXPO_PUBLIC_* or shipped in client bundle. Edge Function validates user JWT before creating admin client. |
| T-05-T-01 | Tampering | Migration replay creating duplicate rows | mitigate | All inserts are upserts with deterministicUuid; same inputs always produce same UUID; fast-path check on migration_status='complete' short-circuits re-runs |
| T-05-T-02 | Tampering | Migration running for another user's data | mitigate | user.id extracted from validated JWT; all queries are WHERE user_id = user.id; admin client only used for writes to own user's rows |
| T-05-I-01 | Information Disclosure | v1 workout history (PII) exposed in migration logs | mitigate | Edge Function logs go to Supabase Edge Function logs (private, accessible only to project owner); no workout data logged to stdout |
| T-05-D-01 | Denial of Service | Migration stuck in in_progress — user cannot access app | mitigate | Client polls for failure; failed state shows Retry; user cannot escape until success or retry — intentional gate. Failure sets status='failed' in catch block. |
| T-05-SC | Tampering | npm/pip/cargo installs | mitigate | Edge Function uses Deno imports (jsr:) — no npm install required; no package legitimacy risk in edge function |
</threat_model>

<verification>
1. `npx tsc --noEmit` exits 0
2. `npm run test:integration -- --run` — migrate.test.ts passes
3. Manual: `supabase functions deploy migrate-v1-user --no-verify-jwt` — deploys without errors
4. Manual: Sign in as existing v1 user in v2 app → migration screen appears → Spinner shows → check Supabase logs for Edge Function run → status changes to complete → app routes to onboarding (or tabs if v1 user already had split+templates)
5. Manual: Run migration twice for same user → Supabase sessions count unchanged (idempotency verified)
6. Manual DATA-03: Open raze-and-rise.vercel.app (v1) in browser — confirms v1 app still works and user_state table unchanged
7. Manual: Sign in as brand new user (no v1 data) → migration screen does NOT appear → goes straight to onboarding
</verification>

<success_criteria>
- v1 user_state blob correctly transformed into normalized v2 rows (DATA-01)
- Migration is idempotent — safe to re-run; upserts with deterministicUuid (DATA-01, DATA-02)
- v1 raze-and-rise.vercel.app continues to work; user_state table unmodified (DATA-03)
- Migration failure shows Retry option; user cannot bypass to Dashboard
- New users (no v1 data) skip migration entirely
- Sessions table uses client-generated UUIDs (DATA-02 offline conflict resolution foundation)
- Edge Function deployed to Supabase project jmtogdlsgpfoefbgdubm
</success_criteria>

<output>
Create `.planning/phases/01-foundation/01-migration-SUMMARY.md` when done.
</output>
