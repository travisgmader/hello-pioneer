---
phase: 01-foundation-walking-skeleton
plan: "05"
subsystem: onboarding
tags:
  - wizard
  - family-creation
  - rls-bootstrap
  - luxon
  - revenuecat
  - edge-functions
dependency_graph:
  requires:
    - 01-04b  # visual shell + RequireFamily redirect
    - 01-02   # bootstrap RLS policies (members_insert_bootstrap, family_settings_insert_bootstrap)
  provides:
    - Family creation wizard (/onboarding/create-family)
    - computeTrialEnd helper (ARCH-13)
    - RevenueCat webhook Edge Function
  affects:
    - src/routes/router.tsx  # Stub replaced with real CreateFamily
    - supabase/config.toml   # revenuecat-webhook function entry added
tech_stack:
  added:
    - luxon (already in package.json — confirmed present)
    - supabase/functions/revenuecat-webhook (new Deno Edge Function)
  patterns:
    - TanStack Query useMutation with three sequential anon-JWT INSERTs
    - Bootstrap RLS policy pattern: families → members → family_settings
    - RevenueCat webhook authorization via shared secret header
key_files:
  created:
    - src/lib/trialEnd.ts
    - tests/unit/luxon-trial.test.ts
    - src/routes/onboarding/create-family.tsx
    - src/routes/onboarding/create-family.module.css
    - supabase/functions/revenuecat-webhook/index.ts
    - supabase/functions/revenuecat-webhook/deno.json
  modified:
    - src/routes/router.tsx  # Stub → CreateFamily import
    - supabase/config.toml   # Stripe entries → revenuecat-webhook entry
    - src/data/types.ts      # Removed CLI stdout pollution (bug fix)
decisions:
  - "Stripe replaced by RevenueCat throughout — no Stripe Edge Functions created, no rc_app_user_id set during wizard submit"
  - "RevenueCat app_user_id = family UUID (set by RC SDK on first purchase, not during wizard)"
  - "Bootstrap RLS INSERT order enforced: families → members → family_settings (required by Plan 02 policies)"
  - "Luxon calendar-day arithmetic for trial_ends_at — DST-safe per ARCH-13"
metrics:
  duration: "~25 minutes"
  completed: "2026-05-21T03:47:28Z"
  tasks_completed: 3
  tasks_total: 4
  files_created: 6
  files_modified: 3
---

# Phase 1 Plan 05: Family Creation Wizard + RevenueCat Webhook Summary

**One-liner:** Family creation wizard (3-INSERT bootstrap pattern via anon JWT) + Luxon DST-safe trial helper + RevenueCat webhook Edge Function (replacing Stripe throughout).

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 5.1 | computeTrialEnd helper + unit tests | 09be5cd | src/lib/trialEnd.ts, tests/unit/luxon-trial.test.ts |
| 5.2 | Family Creation Wizard route | d3ab811 | src/routes/onboarding/create-family.tsx, create-family.module.css, router.tsx |
| 5.3 | RevenueCat webhook Edge Function | 7da7a47 | supabase/functions/revenuecat-webhook/index.ts, deno.json, config.toml |
| 5.4 | End-to-end smoke test | — | Checkpoint: awaiting human verification |

## What Was Built

### Task 5.1 — computeTrialEnd + Unit Tests (ARCH-13)

`src/lib/trialEnd.ts` exports `computeTrialEnd(now: DateTime): DateTime` returning `now.plus({ days: 7 })`. Luxon's calendar-day arithmetic is DST-safe — adding 7 days across the America/Chicago 2026-03-08 spring-forward gives 2026-03-15T12:00:00, not T13:00:00 (which 7×24h would produce).

Three GREEN unit tests in `tests/unit/luxon-trial.test.ts` replace the Wave 0 RED stub:
1. Basic 7-calendar-day addition
2. DST-safe across spring forward (America/Chicago March 2026)
3. Timezone preservation (Europe/Berlin)

All 3 tests pass.

### Task 5.2 — Family Creation Wizard (ONBD-01)

`/onboarding/create-family` renders a card wizard matching the login card geometry (max-width 380px, padding 48px 40px). Contains:
- h1 "Name your family"
- Label + input with placeholder "The Mader Family"
- Label + 8 emoji chip buttons (🏠 🌳 🌟 🌈 🏡 🦊 🐝 🌻)
- Helper text "This is just for you — you can change it later in Settings."
- Primary CTA "Create my family" / "Setting up your family…" (pending state)

On submit, a `useMutation` runs three INSERTs in this exact order (required by Plan 02 bootstrap RLS policies):
1. `families` INSERT — `families_insert` policy: `with check (true)` for any auth user
2. `members` INSERT — `members_insert_bootstrap`: auth user with no prior member rows
3. `family_settings` INSERT — `family_settings_insert_bootstrap`: user is family's `created_by`

All inserts use the user's anon JWT. On success: `invalidateQueries(['current-family'])` + `navigate('/dashboard', { replace: true })`.

`router.tsx` updated: `const Stub` removed, `import CreateFamily from './onboarding/create-family'` added, route element updated.

### Task 5.3 — RevenueCat Webhook Edge Function

`supabase/functions/revenuecat-webhook/index.ts` handles incoming RevenueCat server-to-server webhooks:
- Verifies `Authorization` header matches `REVENUECAT_WEBHOOK_AUTH_HEADER` secret → 401 if missing/wrong
- Parses `event.type` and `event.app_user_id` (the family UUID)
- Maps event types to `subscription_status`:
  - `INITIAL_PURCHASE`, `RENEWAL`, `PRODUCT_CHANGE` → `event.type.toLowerCase()`
  - `CANCELLATION`, `EXPIRATION` → `'canceled'`
  - `TRIAL_STARTED` → `'trialing'`
- UPDATEs `family_settings.subscription_status` via service role client
- Returns 200 for recognized events, 400 for unrecognized
- `supabase/config.toml` updated with `[functions.revenuecat-webhook] verify_jwt = false`

## Deviations from Plan

### Stripe → RevenueCat Architectural Substitution (Instructed)

The original plan specified two Stripe Edge Functions (`stripe-create-customer` and `stripe-webhook`). Per explicit instruction from the orchestrator, these were replaced with a single `revenuecat-webhook` Edge Function.

**Impact on original plan artifacts:**
- `supabase/functions/stripe-create-customer/` — NOT created
- `supabase/functions/stripe-webhook/` — NOT created
- `supabase/config.toml` — Stripe entries replaced with `[functions.revenuecat-webhook]`

**rc_app_user_id behavior:** `families.rc_app_user_id` is NOT set during wizard submit. RevenueCat populates it automatically via their SDK when the user first purchases (the RC SDK uses the family UUID as the app user ID, which is then returned via webhook).

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed CLI stdout pollution from src/data/types.ts**
- **Found during:** Task 5.1 TypeScript check
- **Issue:** `src/data/types.ts` had "Initialising login role..." on line 1 and "A new version of Supabase CLI is available..." on the last two lines — CLI output mixed into the file when types were generated
- **Fix:** Removed both polluted lines; file is now valid TypeScript
- **Files modified:** `src/data/types.ts`
- **Commit:** 09be5cd

## Known Stubs

None — the wizard is fully wired with real Supabase INSERT calls. The RevenueCat webhook is a real Edge Function but requires the `REVENUECAT_WEBHOOK_AUTH_HEADER` secret to be set before it will function in production.

## User Setup Required (Non-Blocking)

The RevenueCat webhook requires one Supabase secret set after the function is deployed:

```bash
supabase secrets set REVENUECAT_WEBHOOK_AUTH_HEADER=<secret from RevenueCat dashboard>
```

The wizard and trial logic (`computeTrialEnd`) work without any credentials. The webhook function handles missing auth gracefully (returns 401).

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: unset_secret | supabase/functions/revenuecat-webhook/index.ts | REVENUECAT_WEBHOOK_AUTH_HEADER defaults to empty string if not set — the webhook will reject all requests with 401 until the secret is configured. This is the correct fail-safe behavior. |

## Verification Gates — All Passed

1. `npm test -- tests/unit/luxon-trial.test.ts` — 3/3 tests passing
2. `npx tsc --noEmit` — exits 0
3. `npm run build` — exits 0 (✓ built in 548ms)
4. `create-family.tsx` contains "Create my family" AND does NOT contain "stripe" (case-insensitive)
5. `revenuecat-webhook/index.ts` contains "REVENUECAT_WEBHOOK_AUTH_HEADER" AND "subscription_status"

## Task 5.4 — Checkpoint Pending

The end-to-end smoke test (Task 5.4) requires:
- RevenueCat Dashboard: create a webhook endpoint pointing at `<SUPABASE_URL>/functions/v1/revenuecat-webhook`
- Set `REVENUECAT_WEBHOOK_AUTH_HEADER` in Supabase secrets
- Deploy the function: `supabase functions deploy revenuecat-webhook`
- Verify wizard creates 3 rows in sequence, navigates to /dashboard
- Verify RevenueCat test webhook updates `family_settings.subscription_status`

## Self-Check

### Files Created/Modified
- [x] `src/lib/trialEnd.ts` — exists and exports `computeTrialEnd`
- [x] `tests/unit/luxon-trial.test.ts` — 3 GREEN tests, all passing
- [x] `src/routes/onboarding/create-family.tsx` — wizard component with 3 INSERTs
- [x] `src/routes/onboarding/create-family.module.css` — all CSS vars, no raw hex
- [x] `src/routes/router.tsx` — CreateFamily imported and wired
- [x] `supabase/functions/revenuecat-webhook/index.ts` — auth + event handling
- [x] `supabase/functions/revenuecat-webhook/deno.json` — empty imports

### Commits
- [x] `09be5cd` — feat(01-05): computeTrialEnd + GREEN tests + types.ts fix
- [x] `d3ab811` — feat(01-05): Family Creation Wizard route + router wiring
- [x] `7da7a47` — feat(01-05): RevenueCat webhook Edge Function

## Self-Check: PASSED
