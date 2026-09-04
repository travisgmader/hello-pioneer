---
phase: 03-templates-programs-progress
plan: 01
status: PARTIAL
subsystem: database
tags: [postgres, rls, supabase-storage, powersync, sqlite, victory-native, skia, design-tokens, vitest, tdd]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: initial 9-table schema, cached (SELECT auth.uid()) RLS pattern, PowerSync publication FOR ALL TABLES, tailwind token block
  - phase: 02-core-session-loop
    provides: sessionService writeTransaction pattern, sessionStats pure-helper style, vitest unit harness
provides:
  - programs / program_weeks / progress_photos / badges / user_stats tables with full CRUD RLS
  - template_exercises.exercise_type column (resolves RESEARCH Open Question 1)
  - progress-photos (private, folder-scoped) and exercise-media (public read) Storage buckets
  - PowerSync schema.ts mirror for all 5 new tables + 5 previously-undeclared columns
  - src/lib/tokens.ts + src/lib/chartStyles.ts — the JS token layer for the Skia canvas
  - 7 chart/badge Tailwind color tokens
  - assets/fonts/Manrope-Medium.ttf for Skia useFont
  - 5 RED test scaffolds pinning the contracts of badgeRules, streak, volumeBucket, exerciseSearch, historyService
affects: [03-02, 03-03, 03-04, 03-05, 03-06, 03-07, 03-08]

# Tech tracking
tech-stack:
  added:
    - victory-native@^41.26.0 (entry added, NOT installed)
    - "@shopify/react-native-skia@^2.6.4 (entry added, NOT installed)"
    - expo-video@~55.0.17 (entry added, NOT installed)
    - expo-image-picker@~55.0.20 (entry added, NOT installed)
    - expo-image-manipulator@~55.0.17 (entry added, NOT installed)
    - date-fns@^4.4.0 (entry added, NOT installed)
  patterns:
    - "JS token layer (src/lib/tokens.ts) for canvas renderers that className cannot reach"
    - "user_stats running aggregates so badge detection never scans history"
    - "RED-first scaffolds that fail on a missing helper module, never on a skip"

key-files:
  created:
    - supabase/migrations/20260610000000_phase3_schema.sql
    - src/lib/tokens.ts
    - src/lib/chartStyles.ts
    - assets/fonts/Manrope-Medium.ttf
    - assets/fonts/OFL.txt
    - assets/fonts/README.md
    - src/lib/__tests__/badgeRules.test.ts
    - src/lib/__tests__/streak.test.ts
    - src/lib/__tests__/volumeBucket.test.ts
    - src/lib/__tests__/exerciseSearch.test.ts
    - tests/integration/historyEdit.test.ts
    - .planning/phases/03-templates-programs-progress/deferred-items.md
  modified:
    - src/lib/schema.ts
    - tailwind.config.js
    - package.json
    - vitest.config.ts

decisions:
  - "measurements.hips_cm/arms_cm/thighs_cm/notes already existed in Postgres since the initial schema; the real gap was the PowerSync mirror. Migration uses ADD COLUMN IF NOT EXISTS so it is a verified no-op rather than an abort."
  - "template_exercises.exercise_type is nullable with a CHECK matching exercises.type; NULL means 'inherit from the library JOIN', so every existing row keeps current behaviour."
  - "Chart axis font is the Manrope 500 static instance from Google Fonts (OFL 1.1), not the variable TTF — Skia useFont wants a single concrete weight."
  - "vitest include extended to src/**/__tests__; without it the four new lib suites would have been silently uncollected."
  - "exercise-media writes are denied to authenticated users by RLS default-deny; explicit service_role policies document the seed script's write path."

metrics:
  duration: ~14 min
  completed: 2026-09-04
  tasks_completed: 3 of 4
  commits: 4
---

# Phase 3 Plan 01: Wave 0 Foundation Summary

**Status: PARTIAL** — all local file authoring is complete and committed. Three
side-effecting operations are deliberately deferred to the orchestrator (see
[Deferred to orchestrator](#deferred-to-orchestrator)). Execution stopped
cleanly at the Task 4 blocking human checkpoint.

The Phase 3 data + presentation foundation now exists on disk: one migration
adding 5 tables, 1 column, 20 table RLS policies and 8 Storage policies across 2
buckets; a column-for-column PowerSync mirror; the JS design-token layer that
Victory Native XL's Skia canvas needs because NativeWind class names cannot
reach it; a bundled Manrope TTF; and 5 RED test scaffolds that pin the contracts
downstream plans must satisfy.

## What Was Built

### Task 1 — `supabase/migrations/20260610000000_phase3_schema.sql` (`fd233d1`)

| Object | Purpose |
|--------|---------|
| `public.programs` | Multi-week program; `current_week` advances per completed session (PROGRAM-01) |
| `public.program_weeks` | One row per (week, day) grid cell; `template_id NULL` = rest day, `ON DELETE SET NULL` so deleting a template degrades the cell instead of destroying the program |
| `public.progress_photos` | Metadata only; binary lives at `progress-photos/{user_id}/{file}` (PHOTO-01/02) |
| `public.badges` | `UNIQUE (user_id, badge_key)` — this constraint is what makes the caller's `ON CONFLICT DO NOTHING` idempotent (GAMIFY-01) |
| `public.user_stats` | Running aggregates (`total_sessions`, `lifetime_volume_kg`, `first_pr_at`) so badge detection never scans history — resolves RESEARCH Open Question 4 |
| `template_exercises.exercise_type` | Nullable + CHECK; NULL inherits from the library JOIN — resolves RESEARCH Open Question 1 / Pitfall 3 |
| `measurements` ×4 | `ADD COLUMN IF NOT EXISTS` guard (see Deviations) |
| RLS | `ENABLE ROW LEVEL SECURITY` + all four CRUD policies per table, in the SAME migration (T-03-01, FOUND-07) |
| Storage | `progress-photos` private + `exercise-media` public-read buckets, `ON CONFLICT DO NOTHING` (T-03-02) |

`program_weeks` has no `user_id`, so all four of its policies scope through an
`EXISTS` subquery on the parent `programs.user_id` — the same shape as the
existing `session_sets` / `template_exercises` policies (T-03-03).

No `ALTER PUBLICATION` anywhere: the `powersync` publication is `FOR ALL TABLES`
and default privileges already grant SELECT on future tables, so the 5 new
tables auto-publish.

### Task 2 — mirror + tokens + font (`3fbfc4c`)

- `src/lib/schema.ts` grew from 9 to 14 tables. Booleans → `column.integer`,
  timestamps → `column.text`, reals → `column.real`, `id` never declared.
- `measurementsTable` gained `hips_cm`, `arms_cm`, `thighs_cm`, `notes` — these
  have existed in Postgres since day one but were never mirrored, so PowerSync
  was returning `undefined` for them.
- `templateExercisesTable` gained `exercise_type`.
- `src/lib/tokens.ts` (new) exports `COLOR_CHART_LINE`, `COLOR_CHART_BAR`,
  `COLOR_CHART_MEASUREMENT`, `COLOR_CHART_GRID`, `FONT_SIZE_CHART_AXIS`,
  `FONT_FAMILY_CHART`, plus the `FONT_SIZE_CAPTION` / `FONT_SIZE_BODY` /
  `COLOR_FG_MUTED` / `COLOR_ACCENT` / `COLOR_BG_ELEVATED` carry-forwards.
- `src/lib/chartStyles.ts` (new) exports `tickLabels` and the axis/grid/bar
  constants, importing everything `from '@/lib/tokens'` — zero inline hex.
- `tailwind.config.js` gained the 7 Phase 3 tokens. Verified via
  `resolveConfig` that all 7 resolve **and** that no Phase 1/2 token regressed.
- `assets/fonts/Manrope-Medium.ttf` — Manrope 500 static instance from Google
  Fonts (v20), 95 KB, verified `TrueType Font data, 14 tables`. `OFL.txt` and a
  `README.md` documenting the source and the `useFont` call site sit beside it.

### Task 3 (local half) — deps + RED scaffolds (`67c2278`)

Six dependency entries added to `package.json` at the RESEARCH-pinned versions.
**The installer was not run** — see Deferred.

Five scaffolds, all failing with `Cannot find package '@/lib/...'` — a true RED
on the missing helper, not a skipped suite:

| File | Pins the contract for | Ships in |
|------|----------------------|----------|
| `src/lib/__tests__/badgeRules.test.ts` | `detectNewBadges(stats, owned)` — edge-triggered thresholds, no double unlock (GAMIFY-01) | 03-06 |
| `src/lib/__tests__/streak.test.ts` | `computeStreak(dates)` — consecutive ISO weeks, gap breaks, order-independent (GAMIFY-03) | 03-03 |
| `src/lib/__tests__/volumeBucket.test.ts` | `bucketVolumeByWeek(rows)` — `weight_kg * reps_target` into `startOfISOWeek` buckets, warmups filtered upstream (PROGRESS-03) | 03-04 |
| `src/lib/__tests__/exerciseSearch.test.ts` | `filterExercises(rows, query, muscle, userId)` — `muscle_group` (not `primary_muscle`), custom scoped to creator (TEMPLATE-02) | 03-02 |
| `tests/integration/historyEdit.test.ts` | `updateSessionHistory` — one `writeTransaction`, `INSERT OR REPLACE` idempotency, never asserts `rowsAffected` (HISTORY-02/03) | 03-03 |

Full suite after the change: **238 passed, 4 skipped, 5 files RED as designed.**

## Deferred to orchestrator

These three side-effecting operations are explicitly NOT performed by this
executor and remain outstanding. Plan 03-01 is **not complete** until all three
land and Task 4 is approved.

1. **Package installs.** Run in this order — the Expo modules MUST go through
   `expo install` or npm resolves the SDK 56 line and the native build breaks:
   ```bash
   npx expo install expo-video expo-image-picker expo-image-manipulator
   npm install victory-native @shopify/react-native-skia date-fns --legacy-peer-deps
   ```
   Gate: the Task 4 package-legitimacy checkpoint must be approved first
   (T-03-SC — every package is tagged `[ASSUMED]` because slopcheck was
   unavailable at research time).
2. **Apply the migration** to the remote Supabase project (`supabase db push`
   or the Supabase MCP `apply_migration`). This is the BLOCKING Wave 0 gate —
   no plan in 03-02..03-08 can run before it.
3. **Rebuild the native dev client** (`npx expo run:ios` or the EAS dev
   profile). Skia, expo-video and expo-image-picker are native modules and will
   **not** arrive via OTA (RESEARCH Pitfall 2). Symptom if skipped: blank charts
   or `Cannot read property 'Skia' of undefined`.

Post-install follow-up for whoever picks up the first chart plan (03-04):
verify `Line` / `Bar` / `chartBounds` prop names against the *installed*
`victory-native@41` types (RESEARCH assumption A1) — training data for
pre-v40 Victory (`VictoryLine` JSX) is wrong for this API.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `measurements` columns already exist — plain `ADD COLUMN` would abort the migration**

- **Found during:** Task 1
- **Issue:** The plan instructs `ALTER public.measurements ADD COLUMN hips_cm real, arms_cm, thighs_cm, notes`. All four already exist — they were created in `20260519000000_initial_schema.sql` (measurements block, lines ~145-151). Plain `ADD COLUMN` raises `column "hips_cm" of relation "measurements" already exists` and aborts the **entire** migration, taking the 5 new tables and every RLS policy down with it. That would have failed the blocking `supabase db push` gate.
- **Fix:** Used `ADD COLUMN IF NOT EXISTS` for all four. The statement is a verified no-op against the current database while still guaranteeing the columns exist for PROGRESS-04. The real Phase 3 gap was the PowerSync mirror in `schema.ts`, which never declared them — fixed in Task 2.
- **Acceptance-criteria impact:** the plan's grep `ADD COLUMN (hips_cm|arms_cm|thighs_cm|notes)` returns 0. The corrected grep `grep -cE "ADD COLUMN IF NOT EXISTS (hips_cm|arms_cm|thighs_cm|notes)"` returns **4**. Every other Task 1 criterion passes unchanged.
- **Files modified:** `supabase/migrations/20260610000000_phase3_schema.sql`
- **Commit:** `fd233d1`

**2. [Rule 3 - Blocking] `vitest.config.ts` did not collect `src/**/__tests__`**

- **Found during:** Task 3
- **Issue:** `include` was `['tests/**/*.test.{ts,tsx}']`. All four new lib suites live under `src/lib/__tests__/`, so `npm run test:unit` would have reported success while silently never loading them — the worst possible failure mode for a RED scaffold.
- **Fix:** Added `'src/**/__tests__/**/*.test.{ts,tsx}'` to `include`. `test:integration` (`vitest run tests/integration`) is unaffected.
- **Files modified:** `vitest.config.ts`
- **Commit:** `67c2278`

### Additions beyond the plan

**3. [Rule 2 - Correctness] `CHECK` constraint on `template_exercises.exercise_type`**

Added `CHECK (exercise_type IN ('strength','bodyweight','run','cardio') OR exercise_type IS NULL)` to match the existing `exercises.type` constraint. Without it the per-template override could hold a value the session renderer cannot dispatch on.

**4. [Rule 2 - Licensing] `assets/fonts/OFL.txt` + `assets/fonts/README.md`**

Manrope ships under SIL OFL 1.1, which requires the license to travel with the font. Added the license text and a README recording the source, weight and the `useFont` call site.

**5. [Rule 2 - Indexes] extra indexes**

`idx_programs_user_active`, `idx_program_weeks_grid` and `idx_progress_photos_taken_on` were added beyond the plan's "indexes on user_id / FK columns" — they back the active-program lookup, the week-grid ordered read, and the date-sorted photo gallery respectively.

### Out of scope — logged, not fixed

`npx tsc --noEmit` fails with **24 pre-existing errors**, none in files this plan
touched (verified: 0 errors in `schema.ts`, `tokens.ts`, `chartStyles.ts`). CI
(`.github/workflows/test.yml`) runs `tsc --noEmit` on PRs, so PR CI was already
red before this plan. Full inventory plus the two confirmed latent query bugs
(`logged_at` → `measured_at` in `useSessionData.ts:184`; `primary_muscle` →
`muscle_group` in `ExerciseSwapModal:98`) is recorded in
`.planning/phases/03-templates-programs-progress/deferred-items.md`.

## Verification

| Check | Result |
|-------|--------|
| `grep -v '^--' <migration> \| grep -c "CREATE POLICY"` | **28** (≥20 required) |
| `CREATE TABLE public.(programs\|program_weeks\|progress_photos\|badges\|user_stats)` | **5** |
| `ADD COLUMN exercise_type` | **1** |
| `ADD COLUMN IF NOT EXISTS (hips_cm\|arms_cm\|thighs_cm\|notes)` | **4** (see Deviation 1) |
| `UNIQUE (user_id, badge_key)` | present |
| `storage.buckets` / `progress-photos` / `exercise-media` / `(storage.foldername(name))[1] = auth.uid()::text` | all present |
| `ALTER PUBLICATION` | **0** (correct — publication is FOR ALL TABLES) |
| All 7 Tailwind tokens resolve via `resolveConfig`, no Phase 1/2 token lost | pass |
| `file assets/fonts/Manrope-Medium.ttf` | `TrueType Font data, 14 tables` |
| `npx tsc --noEmit` errors in `schema.ts` / `tokens.ts` / `chartStyles.ts` | **0 new** |
| `npm run test:unit` | 238 passed, 4 skipped, 5 files RED by design |
| 5 new suites fail on `Cannot find package '@/lib/...'` | pass (true RED) |
| package.json contains all 6 new deps | pass |
| `supabase db push` | **NOT RUN — deferred to orchestrator** |
| native dev client rebuild | **NOT RUN — deferred to orchestrator** |
| package installs | **NOT RUN — deferred to orchestrator** |

## Known Stubs

None. Every file in this plan is foundation (schema, tokens, assets, test
contracts) — no UI renders from a hardcoded empty value.

The 5 RED test suites reference helper modules that do not exist yet. That is
intentional TDD state, not a stub: each is claimed by a named downstream plan
(03-02, 03-03, 03-04, 03-06) in the table above.

## Threat Flags

None. All new surface introduced by this plan is already enumerated in the
plan's `<threat_model>` (T-03-01 table RLS, T-03-02 Storage bucket scoping,
T-03-03 `program_weeks` parent-scoped policies, T-03-SC package legitimacy) and
each has its mitigation implemented or, for T-03-SC, gated at the Task 4
checkpoint.

## Self-Check: PASSED

All 13 claimed files verified present on disk; all 3 task commits verified in
`git log`.
