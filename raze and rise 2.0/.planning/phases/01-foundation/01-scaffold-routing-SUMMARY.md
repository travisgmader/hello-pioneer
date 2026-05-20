---
phase: 01-foundation
plan: 01d
subsystem: routing
tags: [expo-router, navigation, auth-gate, onboarding-gate, migration-gate, powersync, tabs, tdd]
dependency_graph:
  requires:
    - 01-scaffold-lib-PLAN.md (useSession, useOnboardingState, useMigrationStatus, powersync, AppConnector)
    - 01-scaffold-init-PLAN.md (Expo Router, NativeWind, TanStack Query installed)
  provides:
    - app/_layout.tsx (root routing gate consumed by all subsequent plans)
    - app/(auth)/ group (stubs replaced in 01-auth-PLAN.md)
    - app/(onboarding)/ group (stubs replaced in 01-navigation-onboarding-PLAN.md)
    - app/(tabs)/ group (5-tab navigator, consumed by all Phase 2+ screens)
    - app/migration.tsx (stub replaced in 01-migration-PLAN.md)
  affects:
    - All screen plans (every screen renders inside these navigation layouts)
tech_stack:
  added: []
  patterns:
    - Expo Router v3 file-based routing with group layouts ((auth), (onboarding), (tabs))
    - useEffect routing gate pattern (session + onboarding + migration → replace)
    - TDD RED/GREEN cycle with fs-based Node vitest assertions
    - CSS module declaration for global.css side-effect import
key_files:
  created:
    - app/_layout.tsx
    - app/(auth)/_layout.tsx
    - app/(auth)/index.tsx
    - app/(auth)/forgot-password.tsx
    - app/(onboarding)/_layout.tsx
    - app/(onboarding)/profile.tsx
    - app/(onboarding)/split.tsx
    - app/(onboarding)/template.tsx
    - app/(onboarding)/practice-set.tsx
    - app/(tabs)/_layout.tsx
    - app/(tabs)/index.tsx
    - app/(tabs)/workouts.tsx
    - app/(tabs)/split.tsx
    - app/(tabs)/progress.tsx
    - app/(tabs)/settings.tsx
    - app/migration.tsx
    - app/+not-found.tsx
    - tests/unit/routing.test.ts
  modified:
    - nativewind-env.d.ts (added *.css module declaration)
    - tests/integration/rls.test.ts (bug fix: deferred createClient into beforeAll)
decisions:
  - CSS side-effect import handled via declare module '*.css' in nativewind-env.d.ts (not a separate .d.ts)
  - SyncStatus.status does not exist; used connected/connecting boolean flags for __DEV__ label
  - signOut stub as no-op async function until 01-auth-PLAN.md ships src/services/auth/signOut.ts
  - tabBarButton haptics via listeners.tabPress instead of tabBarButton wrapper (cleaner, type-safe)
  - rls.test.ts createClient deferred into beforeAll to avoid module-eval-time throw when env vars absent
metrics:
  duration: 7 min
  completed_date: "2026-05-20"
  tasks_completed: 2
  files_created: 18
  files_modified: 2
---

# Phase 1 Plan 01d: Scaffold Routing Summary

**One-liner:** Expo Router v3 routing shell with session + onboarding + migration gate in root layout, 5-tab navigator (accent tint, Lucide icons, haptics), and complete screen stubs for all route groups.

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| RED | TDD: add failing routing scaffold tests | 1d51208 | Done |
| 1 | Root layout + navigation group layouts | e065be0 | Done |
| 2 | Screen stubs + Settings screen | 806d8f5 | Done |

## What Was Built

### Task 1: Root Layout + Navigation Group Layouts

**app/_layout.tsx** implements the three-layer routing gate:
- `useSession` → no session → `router.replace('/(auth)')`
- `useMigrationStatus` → pending/in_progress/failed → `router.replace('/migration')`
- `useOnboardingState` → not onboarded → `router.replace('/(onboarding)/profile')`
- onboarded → `router.replace('/(tabs)')`

PowerSync initialized on mount (`powersync.init()`), connected when session available (`powersync.connect(new AppConnector())`). OAuth deep-link handler validates `razeandrise://` scheme before parsing tokens (T-01d-S-01 mitigation). Wrapped with `QueryClientProvider` + `SafeAreaProvider`.

**app/(auth)/_layout.tsx:** Stack, headerShown false, gestureEnabled false on root auth screen.

**app/(onboarding)/_layout.tsx:** Stack, slide_from_right animation, gestureEnabled true (practice-set overrides to false).

**app/(tabs)/_layout.tsx:** 5-tab navigator — Dashboard (LayoutDashboard), Workouts (Dumbbell), Split (CalendarDays), Progress (LineChart), Settings (Settings). Accent tint `#F2CA50`, inactive `#99907C`, tab bar bg `#0A0A0B` with 1px border. `Haptics.selectionAsync()` on every tab press via `listeners.tabPress`.

### Task 2: Screen Stubs + Settings Screen

**Dashboard (app/(tabs)/index.tsx):**
- TanStack Query fetches `profiles.display_name` for the welcome heading
- "Welcome, {displayName ?? 'athlete'}" (Noto Serif 700, text-fg)
- "Today is a rest day." (Manrope 400, fg-muted)
- Empty state card: "No workout scheduled." + "Real workout logging ships in Phase 2."
- No action buttons (non-functional UI reads as broken per UI-SPEC)
- `__DEV__` PowerSync status indicator for Walking Skeleton verification

**Settings (app/(tabs)/settings.tsx):**
- Account: Sign Out pressable → `Alert.alert` confirmation (only permitted Alert per CONTEXT.md Decision 3)
- Appearance: theme toggle via `useTheme()` + `Switch`
- Two-factor auth: SMS MFA stub pointing to Supabase account settings
- signOut imported as no-op stub (replaced when 01-auth-PLAN.md ships)

**All stubs** have clear implementation comments referencing the plan that replaces them.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] rls.test.ts createClient at module evaluation time**
- **Found during:** Task 1 verification (test suite failed with "supabaseUrl is required")
- **Issue:** `createClient` was called inside the `describe` body but outside `beforeAll`. When `supabaseUrl` is empty and `skipSuite=true`, `describe.skipIf` cannot prevent the throw because JS evaluates describe-body synchronously before `skipIf` takes effect.
- **Fix:** Moved `clientA` and `clientB` declarations to `let` variables; construction deferred into `beforeAll` where they are only executed after `skipIf` guard fires.
- **Files modified:** `tests/integration/rls.test.ts`
- **Commit:** e065be0 (included in Task 1 commit)

**2. [Rule 3 - Blocking] global.css side-effect import TypeScript error**
- **Found during:** Task 1 first `npx tsc --noEmit` run
- **Issue:** TypeScript 6 strict mode raises `TS2882: Cannot find module or type declarations for side-effect import of '../global.css'`. NativeWind's type package does not include a CSS wildcard declaration.
- **Fix:** Added `declare module '*.css' {}` to `nativewind-env.d.ts` (already included in `tsconfig.json`).
- **Files modified:** `nativewind-env.d.ts`
- **Commit:** e065be0

**3. [Rule 1 - Bug] SyncStatus.status property does not exist**
- **Found during:** Task 1 first `npx tsc --noEmit` run
- **Issue:** `powersync.currentStatus?.status` used in Dashboard — but `SyncStatus` exposes `connected` (boolean) and `connecting` (boolean), not a `.status` string.
- **Fix:** Derived a readable label from the boolean flags: `connected → 'connected'`, `connecting → 'connecting'`, else `'initializing'`.
- **Files modified:** `app/(tabs)/index.tsx`
- **Commit:** 806d8f5

## Known Stubs

| File | Stub | Reason |
|------|------|--------|
| app/(auth)/index.tsx | Renders `Text("Sign In")` | Replaced in 01-auth-PLAN.md (Wave 3) |
| app/(auth)/forgot-password.tsx | Renders `Text("Forgot password")` | Replaced in 01-auth-PLAN.md |
| app/(onboarding)/profile.tsx | Renders `Text("Onboarding step 1")` | Replaced in 01-navigation-onboarding-PLAN.md |
| app/(onboarding)/split.tsx | Renders `Text("Onboarding step 2")` | Replaced in same plan |
| app/(onboarding)/template.tsx | Renders `Text("Onboarding step 3")` | Replaced in same plan |
| app/(onboarding)/practice-set.tsx | Renders `Text("Onboarding step 4")` | Replaced in same plan |
| app/(tabs)/workouts.tsx | Renders `Text("Workouts")` | Phase 2 Core Session Loop |
| app/(tabs)/split.tsx | Renders `Text("Split")` | Phase 2 |
| app/(tabs)/progress.tsx | Renders `Text("Progress")` | Phase 3 |
| app/migration.tsx | Renders `Text("Migration in progress")` | Replaced in 01-migration-PLAN.md |
| settings.tsx signOut | No-op async function | Replaced when 01-auth-PLAN.md ships signOut.ts |

All stubs are intentional scaffolding — they establish the Expo Router file-based routing contract for subsequent plans.

## Threat Surface Scan

| Flag | File | Description |
|------|------|-------------|
| threat_flag: deep-link-token-injection | app/_layout.tsx | OAuth razeandrise:// handler — mitigated per T-01d-S-01: scheme validated before token parsing; Supabase validates server-side |

No new threat surface beyond what the plan's threat model covers.

## TDD Gate Compliance

- RED gate commit: `1d51208` — `test(01-01d)` — routing.test.ts with 40 failing tests
- GREEN gate commit: `e065be0` + `806d8f5` — `feat(01-01d)` — all 125 tests passing
- REFACTOR gate: not needed — implementation clean on first pass

## Self-Check: PASSED

Files verified:
- app/_layout.tsx: FOUND
- app/(auth)/_layout.tsx: FOUND
- app/(auth)/index.tsx: FOUND
- app/(auth)/forgot-password.tsx: FOUND
- app/(onboarding)/_layout.tsx: FOUND
- app/(tabs)/_layout.tsx: FOUND
- app/(tabs)/index.tsx: FOUND
- app/(tabs)/settings.tsx: FOUND
- app/migration.tsx: FOUND
- app/+not-found.tsx: FOUND

Commits verified:
- 1d51208 (test RED): FOUND
- e065be0 (feat Task 1): FOUND
- 806d8f5 (feat Task 2): FOUND

TypeScript: npx tsc --noEmit exits 0
Tests: 125 passed, 0 failed
