# Plan 02 — Schema Summary

**Plan:** 01-foundation/02 (schema)
**Status:** Complete
**Completed:** 2026-05-19
**Duration:** ~30 min

## What Was Built

All 9 v2 normalized tables deployed to Supabase project `jmtogdlsgpfoefbgdubm` with full RLS and PowerSync replication setup.

### Schema Deployed

| Table | PK Type | RLS | Soft Delete | Notes |
|-------|---------|-----|-------------|-------|
| `profiles` | `user_id` (auth ref) | ✓ (4 policies) | — | Auto-created by trigger on auth.users insert |
| `split_settings` | `user_id` (auth ref) | ✓ (4 policies) | — | |
| `exercises` | `gen_random_uuid()` | ✓ (4 policies) | — | Built-in exercises visible to all; custom exercises visible to creator only |
| `templates` | `gen_random_uuid()` | ✓ (4 policies) | ✓ `is_deleted` | |
| `template_exercises` | `gen_random_uuid()` | ✓ (4 policies via EXISTS) | — | Policies check parent template ownership |
| `sessions` | client-generated UUID | ✓ (4 policies) | ✓ `is_deleted` | No DEFAULT — caller supplies UUID for offline conflict resolution (DATA-02) |
| `session_sets` | client-generated UUID | ✓ (4 policies via EXISTS) | — | No DEFAULT — caller supplies UUID (DATA-02) |
| `measurements` | `gen_random_uuid()` | ✓ (4 policies) | — | |
| `notification_preferences` | `user_id` (auth ref) | ✓ (4 policies) | — | |

### Key Design Decisions Applied

- **RLS predicate:** `(SELECT auth.uid())` cached form throughout — prevents per-row function call (RESEARCH.md Pitfall 2)
- **Trigger:** `handle_new_user()` SECURITY DEFINER with `ON CONFLICT DO NOTHING` — idempotent on migration replay (RESEARCH.md Pitfall 6)
- **PowerSync role:** `powersync_role` created with REPLICATION + LOGIN, SELECT-only grants (T-02-E-01 threat mitigation)
- **Publication:** `powersync FOR ALL TABLES` created for WAL streaming

### V1 Table Handling

The existing v1 `profiles` table (13 rows) was renamed to `profiles_v1` before creating the v2 schema. This is the expand-and-contract pattern: v1 data preserved in `profiles_v1` and `user_state`, the v1 migration Edge Function (Plan 05) will read from these and populate v2 rows.

### Migrations Applied

All applied via Supabase MCP (not `supabase db push` CLI):

| Migration | Name | Status |
|-----------|------|--------|
| pre-migration | `preserve_v1_tables_before_v2_schema` | ✓ Applied |
| `20260519000000` | `20260519000000_initial_schema` | ✓ Applied |
| `20260519000100` | `20260519000100_rls_policies` | ✓ Applied |
| `20260519000200` | `20260519000200_powersync_setup` | ✓ Applied |

### Seed Data

- 36 built-in exercises seeded (`is_custom = false`) covering 8 muscle groups
- `supabase/starter-templates.json`: 5 split configurations (PPL, Upper/Lower, Full Body, Body Part, AF PT Prep) — consumed by onboarding template picker (Plan 04)

### Files Created

| File | Description |
|------|-------------|
| `supabase/migrations/20260519000000_initial_schema.sql` | 9 tables + handle_new_user trigger |
| `supabase/migrations/20260519000100_rls_policies.sql` | RLS enabled + 4 CRUD policies per table |
| `supabase/migrations/20260519000200_powersync_setup.sql` | powersync_role + powersync publication |
| `src/types/database.ts` | TypeScript types generated from live schema |
| `supabase/seed.sql` | 36 built-in exercises |
| `supabase/starter-templates.json` | 5 onboarding template configs |
| `tests/integration/rls.test.ts` | Real RLS assertions (cross-user isolation + exercise visibility) |

## Verification Results

- ✓ `SELECT COUNT(*) FROM public.exercises WHERE is_custom = false` → 36
- ✓ `npx tsc --noEmit` exits 0 with generated types
- ✓ All 9 v2 tables visible in Supabase Table Editor with RLS enabled
- ✓ `profiles_v1` preserved with 13 v1 rows intact

## Commits

- `dce9c67` — feat(01-foundation/02): SQL migration files (schema + RLS + PowerSync setup)
- `ccbbf73` — feat(01-foundation/02): seed exercise library + starter templates + RLS integration test

## Notes for Downstream Plans

- **Plan 04 (nav/onboarding):** Read `supabase/starter-templates.json` for template picker; the exercise names in the JSON match exactly what's seeded in `public.exercises`
- **Plan 05 (migration):** v1 data is in `profiles_v1` (email/role/created_at) and `user_state` (JSONB blob). The migration Edge Function reads from these.
- **PowerSync password:** stored in your password manager — needed for PowerSync dashboard → Database Connection setup (was generated and applied via MCP during execution)
