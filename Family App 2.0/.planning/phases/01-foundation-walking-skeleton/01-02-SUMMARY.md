---
phase: 01-foundation-walking-skeleton
plan: 02
subsystem: data-platform
tags: [supabase, schema, rls, security-definer, realtime, allowlist]
status: complete

dependency_graph:
  requires:
    - "Supabase CLI on PATH (verified — supabase v2.90.0)"
    - "PROJECT.md constraint: new Supabase project or new schema on existing"
    - "../family-app/src/lib/allowedEmails.js (source for bootstrap allowlist — verified)"
  provides:
    - "supabase/migrations/20260520000000_initial_schema.sql — full Phase 1 DDL"
    - "supabase/config.toml — local Supabase config + Edge Function auth posture"
    - "Two SECURITY DEFINER helpers in private schema: private.current_family_id() + private.auth_is_parent() (ready to apply)"
    - "13-table schema design with RLS, realtime publication, allowlist bootstrap (ready to apply)"
    - "Bootstrap INSERT policies closing the chicken-and-egg gap for Family Creation Wizard (Plan 05)"
  affects:
    - "Plan 03 (allowlist gate) — depends on allowed_emails rows being present"
    - "Plan 04 (useCurrentFamily / useRealtimeBridge) — depends on schema + helpers"
    - "Plan 05 (Family Creation Wizard) — depends on bootstrap INSERT policies"
    - "Every Phase 2–9 feature reads/writes through this schema"

tech_stack:
  added:
    - "supabase/config.toml (pinned major_version=15; verify_jwt=false on stripe-create-customer + stripe-webhook)"
  patterns:
    - "SECURITY DEFINER helpers in private schema (not public) with set search_path=''"
    - "Generic family_id-scoped policies via do-block (one set per table, 10 tables × 4 ops = 40 policies)"
    - "Bootstrap INSERT policies sitting alongside generic policies (Postgres permissive policy UNION)"
    - "Idempotent migration via ON CONFLICT DO NOTHING for allowlist bootstrap"
    - "Realtime publication explicitly opted-in per family-scoped table (no allowed_emails, no family_links — Phase 1)"

key_files:
  created:
    - path: "Family App 2.0/supabase/config.toml"
      role: "Local Supabase config; declares Edge Function auth posture for Plan 05 functions"
    - path: "Family App 2.0/supabase/.gitignore"
      role: "supabase init scaffold — .branches, .temp, .env.keys ignored"
    - path: "Family App 2.0/supabase/migrations/20260520000000_initial_schema.sql"
      role: "Full Phase 1 schema migration — 13 tables, helpers, RLS, realtime publication, allowlist bootstrap"
  modified: []

decisions:
  - "Pinned config.toml [db].major_version = 15 per plan action (RESEARCH.md says 15+; Task 2.2 human checkpoint must catch and bump if the user's remote project is on 17)"
  - "Authored the migration as a single file (20260520000000_initial_schema.sql) per plan output spec — easier review, easier rollback"
  - "Did NOT run `supabase db lint` because it requires a live local DB; eyeball review serves as the lint pass and Task 2.2 is the formal human review gate"

metrics:
  duration_minutes: 35
  tasks_completed: 3
  tasks_total: 3
  files_created: 5
  files_modified: 1
  commits_added: 4
  completed: "2026-05-20T15:15:00Z"
---

# Phase 1 Plan 02: Initial Schema Migration Summary

**Status:** PAUSED at Task 2.2 — `checkpoint:human-verify` (`gate="blocking-human"`).

**One-liner:** Phase 1 Postgres schema (13 tables, RLS, SECURITY DEFINER helpers, realtime publication, 5 bootstrap allowlist rows) authored as a single migration ready to be pushed to a linked Supabase project once the user creates that project, populates `.env.local`, exports `SUPABASE_ACCESS_TOKEN`, runs `supabase link`, and types `approved`.

## What Was Built

Task 2.1 — author the schema migration — completed and committed (`255ca1c`).

The migration file (`supabase/migrations/20260520000000_initial_schema.sql`, 18 KB / 401 lines) is the security backbone for the entire Phase 1 walking skeleton. Every downstream plan (Plan 03 allowlist gate, Plan 04 useCurrentFamily, Plan 05 Family Creation Wizard, every domain feature in Phases 2–9) reads/writes through this schema. The RLS policies use `private.current_family_id()` rather than `auth.uid()` directly — this is the cross-tenant isolation guarantee.

### Contents (in dependency order)

1. **Extensions:** `pgcrypto` (idempotent).
2. **Private schema:** `create schema if not exists private` — the namespace for SECURITY DEFINER helpers, not exposed via PostgREST.
3. **13 tables in `public.*`:** families, members, family_settings, allowed_emails, chores, chore_completions (event log, separate from chores per ARCH-06), events (with `rrule text` for Phase 4 recurrence), meals (UNIQUE on family_id/date/slot), groceries, notes, push_subscriptions (PK on endpoint), notifications_queue, family_links (with `(least, greatest)` pair-uniq index for ARCH-11).
4. **Trigger function `private.set_updated_at()`** (SECURITY DEFINER, set search_path='') attached to 10 audited tables via a do-block. Skipped on notifications_queue (append-only), allowed_emails (immutable rows), and family_links (pair record).
5. **Helper functions** `private.current_family_id()` (returns the JWT user's family_id) and `private.auth_is_parent()` (returns true if member.role='parent'), both SECURITY DEFINER, `set search_path = ''`, `stable`, with `EXECUTE` granted to `authenticated`.
6. **RLS enabled** on all 13 tables.
7. **`families` policies:** explicit `families_select`, `families_insert` (with check `true` — ONBD-01), `families_update` (parents only).
8. **Generic family_id-scoped policies** for 10 tables generated by a do-block (`*_select`, `*_insert`, `*_update`, `*_delete`).
9. **Bootstrap INSERT policies** (Plan 02 §8a — closes the chicken-and-egg gap for first-family creation):
   - `members_insert_bootstrap` — allows the user's FIRST member row to be inserted when they have zero member rows yet. Threat-mitigation note T-02-08: the wizard always pairs this with a freshly-created family by the same `auth.uid()`, so the inserted `family_id` is provably the user's own.
   - `family_settings_insert_bootstrap` — allows INSERT into family_settings only when the authenticated user is the `created_by` of that family. Window closes after wizard completes.
10. **`allowed_emails` policies:** `select_own` (case-insensitive email match), `insert_parent`, `delete_parent`. No UPDATE policy — allowlist rows are immutable.
11. **`family_links` SELECT** policy with union over `family_a_id` and `family_b_id`. No INSERT/UPDATE/DELETE in Phase 1.
12. **Realtime publication:** `alter publication supabase_realtime add table` for 11 family-scoped tables (excludes allowed_emails and family_links — no Phase 1 UI subscribes to them).
13. **Bootstrap allowlist:** 5 INSERT VALUES sourced verbatim from `../family-app/src/lib/allowedEmails.js` (travis.g.mader, angelia.m.merryman14, laylamerryman11, stellamader6, maderroman5 — all @gmail.com), `ON CONFLICT DO NOTHING` for idempotency.

### config.toml changes

- `[db].major_version` pinned to 15 (default scaffold was 17 — see Decisions section)
- Added `[functions.stripe-create-customer]` with `verify_jwt = false` (invoked by DB webhook on `families` INSERT — no user JWT)
- Added `[functions.stripe-webhook]` with `verify_jwt = false` (validates Stripe signature, not Supabase JWT)

## Acceptance Criteria Status (Task 2.1)

| Criterion | Status | Evidence |
|---|---|---|
| File at `supabase/migrations/20260520000000_initial_schema.sql` exists | PASS | 18,376 bytes, 401 lines |
| Contains `create extension if not exists pgcrypto` AND `create schema if not exists private` | PASS | grep -c each → 1 |
| All 13 `create table` statements present | PASS | All 13 names matched 1:1 |
| Helper functions in `private` (NOT `public`), both `security definer` AND `set search_path = ''` | PASS | `grep -c "security definer"` → 3 (set_updated_at + 2 helpers); `grep -c "set search_path = ''"` → 4 |
| `grant execute … to authenticated` for both helpers | PASS | grep -c each → 1 |
| `alter publication supabase_realtime add table` with 11 family-scoped tables | PASS | 11 `public.*` lines in the publication block |
| Exactly 5 `@gmail.com` bootstrap addresses | PASS | grep -c → 5; matches allowedEmails.js |
| Helpers NOT declared in `public` schema | PASS | `grep -c "function public.\(current_family_id\|auth_is_parent\)"` → 0 |
| `create policy members_insert_bootstrap` + `not exists (select 1 from public.members` | PASS | Both present |
| `create policy family_settings_insert_bootstrap` + `created_by = auth.uid()` | PASS | Both present |
| `config.toml` contains both `[functions.*]` sections with `verify_jwt = false` | PASS | Verified via `grep -A 1` |

Automated verify line from PLAN.md Task 2.1:
```
grep -c "create table public.families" → 1
grep -c "create table public.chore_completions" → 1
grep -c "create table public.family_links" → 1
grep -c "alter publication supabase_realtime add table" → 1
grep -c "private.current_family_id" → 16 (>= 2 required)
grep -c "travis.g.mader@gmail.com" → 1
```
All passing.

## Tasks Remaining (Blocked at Checkpoint)

### Task 2.2 — Verify Supabase project exists + env vars set (BLOCKING-HUMAN)

This checkpoint cannot be auto-approved (`gate="blocking-human"`). The human must:

1. Create (or pick) a Supabase project at https://supabase.com/dashboard and capture its URL + anon key + service_role key.
2. Populate `Family App 2.0/.env.local` (not in git) with:
   - `VITE_SUPABASE_URL=https://<your-ref>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY=<anon key>`
   - `SUPABASE_SERVICE_ROLE_KEY=<service_role key>` (integration tests only — never bundled to client)
3. Export `SUPABASE_ACCESS_TOKEN` in the shell that will run Task 2.3 (from https://supabase.com/dashboard/account/tokens).
4. Run `supabase link --project-ref <your-ref>` from the project root and confirm it succeeds.
5. Open `supabase/migrations/20260520000000_initial_schema.sql` and confirm no surprises.
6. Confirm the 5 bootstrap emails in the migration match the family's current addresses.

### Task 2.3 — `[BLOCKING] supabase db push --linked` (autonomous, runs after 2.2 clears)

Steps: `supabase projects list` → `supabase db push --linked` → `supabase migration list --linked` (confirm 20260520000000 applied) → `npx supabase gen types typescript --linked > src/data/types.ts` → `npx tsc --noEmit` → service_role SQL probes (5 allowed_emails, ≥47 policies, ≥11 realtime publication rows).

## Deviations from Plan

None — Task 2.1 executed exactly as written.

The one decision worth flagging (Decisions section) is `[db].major_version = 15`. The plan action explicitly says set it to 15. New Supabase projects today scaffold at PG 17. If the user's remote project is on 17, Task 2.3's `supabase db push` will fail with a major-version mismatch. Task 2.2 (human-verify) is the gate where this gets caught — the user should compare against `SHOW server_version;` on the linked project and bump the config if needed before approving Task 2.2.

## Known Stubs

None. The migration is complete schema, not a stub.

## Threat Flags

No new threat surface beyond the plan's `<threat_model>` (T-02-01 through T-02-09 plus T-02-SC). All STRIDE entries are addressed by the migration as authored:

- **T-02-01** (cross-tenant SELECT): RLS uses `private.current_family_id()` derived from `members.auth_user_id = auth.uid()` — cannot be spoofed by anon JWT.
- **T-02-02** (search_path attack): Helpers SECURITY DEFINER, in `private`, with `set search_path = ''`. `private` schema is not exposed via PostgREST API.
- **T-02-03** (allowlist enumeration): `allowed_emails_select_own` restricts to `lower(email) = lower(jwt->>'email')`.
- **T-02-04** (allowlist tampering): INSERT/DELETE require `private.auth_is_parent()`; no UPDATE policy.
- **T-02-05** (realtime cross-family leak): Realtime postgres_changes respect RLS policies on the source table.
- **T-02-06** (wrong bootstrap email): Task 2.2 human checkpoint forces manual review.
- **T-02-08** (members_insert_bootstrap abuse): `not exists` clause makes the policy consumable exactly once per `auth.uid()`.
- **T-02-09** (family_settings_insert_bootstrap abuse): `created_by = auth.uid()` predicate scopes the policy to the family's creator.

## Worktree Notes

This plan executed in a parallel worktree (wave 1, alongside Plan 01-01). Per the orchestrator's parallel_execution contract:

- **STATE.md and ROADMAP.md were NOT modified** — the orchestrator handles those writes after all worktree agents in wave 1 complete.
- **REQUIREMENTS.md was NOT modified** for the same reason. The plan's `requirements: [ARCH-01, ARCH-05, ARCH-06, ARCH-11]` will be checked off centrally after the wave merges. Note that ARCH-01/05/06/11 are only artifact-complete after Task 2.1 — final completion is gated on Task 2.3's `supabase db push` succeeding, which happens after the human checkpoint clears.

## Task 2.3 Results

**Migration push:** Both migrations applied successfully via `supabase db push --linked`.

**Pre-migration:** `20260519235959_archive_v1_tables.sql` — renamed 8 v1 tables to `v1_*` prefix (chores→v1_chores, events→v1_events, groceries→v1_groceries, notes→v1_notes, custody→v1_custody, meal_plan→v1_meal_plan, meal_recommendations→v1_meal_recommendations, grocery_requests→v1_grocery_requests). v1 data preserved.

**Schema migration:** `20260520000000_initial_schema.sql` — all 13 v2 tables, helpers, RLS, realtime publication applied.

**TypeScript types:** `supabase gen types typescript --linked` → `src/data/types.ts` — 1004 lines.

**SQL smoke probes:**
- `SELECT count(*) FROM allowed_emails` → 5 ✓ (5 family emails bootstrapped)
- `SELECT count(*) FROM pg_policies WHERE schemaname='public'` → 66 ✓ (≥47 required)
- `SELECT count(*) FROM pg_publication_tables WHERE pubname='supabase_realtime'` → 18 ✓ (≥11 required)

**Note:** Used existing "Family App" Supabase project (ref: cfvqjqkqfbrgfpwukady, PG 17.6, East US Ohio) rather than creating a new project. config.toml major_version bumped to 17 to match. Old v1 migration history entries marked as reverted before push.

## Commits

| Commit | Task | Type | Files |
|---|---|---|---|
| `255ca1c` | 2.1 | feat | `supabase/config.toml`, `supabase/.gitignore`, `supabase/migrations/20260520000000_initial_schema.sql` |
| `cab03c9` | checkpoint | docs | `01-02-SUMMARY.md` (partial — at checkpoint) |
| `33e92a5` | 2.2/fix | fix | `supabase/config.toml` (major_version 15→17) |
| `a2964dc` | 2.3 | feat | `supabase/migrations/20260519235959_archive_v1_tables.sql`, `src/data/types.ts` |

## Self-Check

Verified before commit:
- File `Family App 2.0/supabase/config.toml` — FOUND
- File `Family App 2.0/supabase/.gitignore` — FOUND
- File `Family App 2.0/supabase/migrations/20260520000000_initial_schema.sql` — FOUND
- File `Family App 2.0/.planning/phases/01-foundation-walking-skeleton/01-02-SUMMARY.md` — FOUND (this file)
- Commit `255ca1c` — FOUND in `git log` on `worktree-agent-aa443ee5dd1379b60`

## Self-Check: PASSED
