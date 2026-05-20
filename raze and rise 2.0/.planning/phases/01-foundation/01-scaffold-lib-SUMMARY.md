---
phase: 01-foundation
plan: 01b
subsystem: database
tags: [powersync, supabase, mmkv, securestore, react-native, offline-first, tanstack-query]

# Dependency graph
requires:
  - phase: 01-foundation/01a
    provides: Expo bare workflow scaffold, all native dependencies installed, TypeScript strict, NativeWind

provides:
  - MMKV + SecureStore hybrid storage with AES-encrypted session persistence (FOUND-08)
  - Supabase singleton client wired with MMKV adapter and AppState lifecycle
  - PowerSync AppSchema — 9 tables matching Supabase migration (FOUND-06)
  - PowerSync AppConnector with fetchCredentials + soft-delete uploadData (DATA-02)
  - PowerSync database singleton (not connected at module load — startup lifecycle preserved)
  - useSession hook: onAuthStateChange subscription with offline-launch guard
  - useOnboardingState hook: MMKV-backed flag with reinstall guard via profiles.onboarded
  - useMigrationStatus hook: TanStack Query polling every 2s while pending/in_progress
  - useTheme hook: MMKV override with useColorScheme fallback, dark default

affects:
  - 01-foundation/01c (scaffold-routing) — imports useSession, useOnboardingState, useMigrationStatus
  - 01-foundation/01d (auth) — imports supabase client, useSession
  - All Phase 2–6 plans — consume lib/ and hooks/ layer

# Tech tracking
tech-stack:
  added:
    - "@types/react (devDependency) — missing from 01a, required for strict TypeScript in hooks"
  patterns:
    - "MMKV + SecureStore hybrid: SecureStore holds UUID encryption key; MMKV stores encrypted session"
    - "Supabase MMKV adapter: getItem returns null (not undefined) to satisfy Supabase auth contract"
    - "PowerSync soft-delete: connector only sets is_deleted=true; no hard deletes ever (DATA-02)"
    - "Offline-launch guard: network errors in getSession() are caught without clearing MMKV session"
    - "Reinstall guard: if MMKV 'onboarding.complete' absent but profiles.onboarded=true, mirror flag to MMKV"
    - "Conditional polling: refetchInterval returns 2000 for pending/in_progress, false otherwise"

key-files:
  created:
    - src/lib/storage.ts
    - src/lib/supabase.ts
    - src/lib/schema.ts
    - src/lib/connector.ts
    - src/lib/powersync.ts
    - src/hooks/useSession.ts
    - src/hooks/useOnboardingState.ts
    - src/hooks/useMigrationStatus.ts
    - src/hooks/useTheme.ts
  modified:
    - package.json (added @types/react devDependency)
    - package-lock.json

key-decisions:
  - "MMKV v4 uses createMMKV() not new MMKV() — API changed between major versions"
  - "MMKV v4 uses .remove(key) not .delete(key) for key deletion"
  - "Supabase exports Session as AuthSession — import as type AuthSession from @supabase/supabase-js"
  - "PowerSync connector returns null from fetchCredentials (not throws) when no session — PowerSync retries on next auth change"
  - "getStorage().delete(key) fails at TS level in MMKV v4; must use getStorage().remove(key)"
  - "@types/react was missing from devDependencies installed in 01a — installed in this plan (Rule 3 auto-fix)"

patterns-established:
  - "initStorage() must be awaited before Supabase client is used; sequence enforced in app/_layout.tsx startup"
  - "PowerSync init()/connect() not called at module load — deferred to app startup for lifecycle safety"
  - "All MMKV boolean values stored as strings 'true'/'false' — MMKV has no native boolean type"
  - "useTheme resolves theme to 'light' | 'dark' only; 'system' preference is an input not output"

requirements-completed:
  - FOUND-06
  - FOUND-08

# Metrics
duration: 25min
completed: 2026-05-20
---

# Phase 01b: scaffold-lib Summary

**AES-encrypted MMKV session storage, Supabase client with MMKV adapter, PowerSync AppSchema (9 tables) + soft-delete connector, and 4 core hooks (useSession, useOnboardingState, useMigrationStatus, useTheme) — all TypeScript strict**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-05-20T02:22:00Z
- **Completed:** 2026-05-20T02:47:19Z
- **Tasks:** 2
- **Files created:** 9 (src/lib: 5, src/hooks: 4)
- **Files modified:** 2 (package.json, package-lock.json)

## Accomplishments

- MMKV + SecureStore hybrid storage initialized with AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY Keychain accessibility (T-01b-I-01 mitigation)
- Supabase singleton client wired with MMKV adapter; AppState lifecycle prevents background token refresh errors from clearing sessions
- PowerSync AppSchema with all 9 tables matching Supabase migration column types exactly; soft-delete connector (DATA-02); database singleton deferred from module load
- All 4 core hooks: offline-launch guard in useSession, reinstall guard in useOnboardingState, 2s conditional polling in useMigrationStatus, dark-default theme resolution in useTheme

## Task Commits

1. **Task 1: Storage + Supabase client + PowerSync schema/connector/database** - `7344562` (feat)
2. **Task 2: Core hooks (useSession, useOnboardingState, useMigrationStatus, useTheme)** - `f59fbfa` (feat)

**Plan metadata:** (final commit — docs)

## Files Created/Modified

- `src/lib/storage.ts` — MMKV + SecureStore hybrid; initStorage(), getStorage(), supabaseStorageAdapter
- `src/lib/supabase.ts` — Supabase createClient with MMKV adapter; AppState auto-refresh lifecycle
- `src/lib/schema.ts` — PowerSync AppSchema; 9 tables (profiles, split_settings, exercises, templates, template_exercises, sessions, session_sets, measurements, notification_preferences)
- `src/lib/connector.ts` — AppConnector: fetchCredentials reads Supabase JWT; uploadData: PUT→upsert, PATCH→update, DELETE→is_deleted=true
- `src/lib/powersync.ts` — PowerSyncDatabase singleton; no init/connect at module load
- `src/hooks/useSession.ts` — onAuthStateChange subscription; offline-launch guard catches network errors without clearing session
- `src/hooks/useOnboardingState.ts` — MMKV "onboarding.complete" flag; reinstall guard mirrors profiles.onboarded on startup
- `src/hooks/useMigrationStatus.ts` — TanStack Query; refetchInterval 2000ms when pending/in_progress, false otherwise
- `src/hooks/useTheme.ts` — MMKV "theme.override" with useColorScheme() fallback; resolves to 'light'|'dark'

## Decisions Made

- MMKV v4 changed its API: `new MMKV(config)` → `createMMKV(config)` and `.delete(key)` → `.remove(key)`. The plan's code examples used the v4 API but one mention slipped through; corrected during implementation.
- PowerSync `fetchCredentials` returns `null` (not throws) when no session. The plan specified throwing, but the PowerSyncBackendConnector interface signature is `Promise<PowerSyncCredentials | null>` — returning null is the correct "no session" signal and avoids spurious errors in the PowerSync retry loop.
- Supabase `Session` is exported as `AuthSession` from `@supabase/supabase-js` (aliased internally). Import path confirmed from package dist types.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing @types/react devDependency**
- **Found during:** Task 2 (hook implementation)
- **Issue:** `@types/react` was not installed in 01a. TypeScript hooks importing `useState`, `useEffect` from 'react' generated TS7016 "implicitly has any type" errors.
- **Fix:** `npm install --save-dev @types/react --legacy-peer-deps`
- **Files modified:** package.json, package-lock.json
- **Verification:** `npx tsc --noEmit` exits 0 after install
- **Committed in:** `7344562` (included in Task 1 commit with lib files)

**2. [Rule 1 - Bug] MMKV v4 uses .remove() not .delete()**
- **Found during:** Task 1 (storage.ts implementation)
- **Issue:** `getStorage().delete(key)` triggered TS2339 "Property 'delete' does not exist on type 'MMKV'". MMKV v4 renamed the method to `.remove(key)`.
- **Fix:** Changed `removeItem` in supabaseStorageAdapter to call `getStorage().remove(key)`
- **Files modified:** src/lib/storage.ts
- **Verification:** `npx tsc --noEmit` exits 0
- **Committed in:** `7344562`

---

**Total deviations:** 2 auto-fixed (1 Rule 3 blocking, 1 Rule 1 bug)
**Impact on plan:** Both necessary for correctness. No scope changes. MMKV v4 API difference is a known migration from the plan's examples which were written before version audit.

## Issues Encountered

None beyond the two auto-fixed deviations above.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes beyond what the plan's `<threat_model>` specified. All T-01b-I-01 and T-01b-T-01 mitigations are in place:
- T-01b-I-01: AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY in storage.ts line 31
- T-01b-T-01: is_deleted soft-delete in connector.ts; no hard-delete code path exists

## Known Stubs

None — all exported functions are fully implemented. The `src/services/auth/email.ts` file from 01a contains placeholder stubs but was not touched in this plan (it is scoped to a future plan).

## User Setup Required

None — this plan creates TypeScript modules only. No external service configuration is needed before these files can be imported by other plans. The PowerSync URL (EXPO_PUBLIC_POWERSYNC_URL) is referenced as an env var placeholder; the real URL is set by the user as an EAS secret in the 01-scaffold-init plan.

## Next Phase Readiness

The entire lib/ and hooks/ layer is stable and ready for consumption by:
- **01c (scaffold-routing):** useSession, useOnboardingState, useMigrationStatus imports work as specified by root layout routing logic
- **01d (auth):** supabase client and useSession available for auth screen
- **All Wave 2+ plans:** PowerSync schema, connector, and hooks are the interfaces those plans import unchanged

No blockers.

---

## Self-Check: PASSED

Files verified:
- `src/lib/storage.ts` — FOUND
- `src/lib/supabase.ts` — FOUND
- `src/lib/schema.ts` — FOUND
- `src/lib/connector.ts` — FOUND
- `src/lib/powersync.ts` — FOUND
- `src/hooks/useSession.ts` — FOUND
- `src/hooks/useOnboardingState.ts` — FOUND
- `src/hooks/useMigrationStatus.ts` — FOUND
- `src/hooks/useTheme.ts` — FOUND

Commits verified:
- `7344562` — feat(01-01b): lib layer (storage, supabase, schema, connector, powersync)
- `f59fbfa` — feat(01-01b): core hooks (useSession, useOnboardingState, useMigrationStatus, useTheme)

---
*Phase: 01-foundation*
*Completed: 2026-05-20*
