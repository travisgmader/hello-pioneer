---
phase: 01-foundation-walking-skeleton
plan: 04a
subsystem: foundation
tags: [react-router-v7, tanstack-query-v5, supabase-realtime, auth-loader, error-boundary, offline-first]

# Dependency graph
requires:
  - phase: 01-foundation-walking-skeleton
    provides: Plan 01-03 — Supabase client (`src/data/supabase.ts`), allowlist gate (`src/auth/allowlist.ts`), Login + AccessDenied components
provides:
  - "Single QueryClient with offlineFirst mutations (ARCH-03, ARCH-09)"
  - "useCurrentFamily — TanStack Query hook returning families joined with family_settings (D-11, D-15 substrate)"
  - "useFamilySettings — mutation hook PATCHing family_settings (D-15 cross-device theme persistence path)"
  - "useRealtimeBridge — single channel postgres_changes → invalidateQueries (ARCH-07), removeChannel cleanup, gated on familyId (Pitfall 3 mitigated)"
  - "requireAuthLoader — getSession + isAllowedEmail + signOut on miss (Pitfall 1 mitigated, ARCH-08)"
  - "RequireFamily — component-level redirect to /onboarding/create-family when family is null (D-12, ONBD-01 substrate)"
  - "Router topology — createBrowserRouter with errorElement on every route (D-16), Stub placeholders for 01-04b/Plan 05 to mount"
  - "RouteErrorFallback — UI-SPEC-locked copy and tokenized styles"
affects: [01-04b, 01-05, 01-06, all-phase-2-domain-features]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Loader-based auth gate (`requireAuthLoader`) running BEFORE route element mounts — eliminates flash of protected content"
    - "Single Supabase Realtime channel per family with one .on() per table; cleanup via supabase.removeChannel"
    - "TanStack Query as source-of-truth for server state; never push realtime payloads into the cache (invalidate only)"
    - "Joined family_settings on useCurrentFamily — one query yields theme + timezone + family identity"
    - "errorElement on every route entry — surface render failures without crashing the app"
    - "Stub-placeholder pattern in router.tsx — final topology shipped here, visual elements swapped in by 01-04b/Plan 05"

key-files:
  created:
    - src/data/queryClient.ts
    - src/data/useCurrentFamily.ts
    - src/data/useFamilySettings.ts
    - src/data/useRealtimeBridge.ts
    - src/auth/RequireAuth.tsx
    - src/auth/RequireFamily.tsx
    - src/routes/router.tsx
    - src/routes/RouteErrorFallback.tsx
    - src/routes/RouteErrorFallback.module.css
  modified:
    - tests/unit/queryClient.test.ts
    - tests/unit/router.test.tsx
    - tests/unit/error-boundary.test.tsx
    - playwright.config.ts

key-decisions:
  - "RouteErrorFallback exports both named and default — named keeps Wave 0 test stub working; default lets router.tsx use the ergonomic `import RouteErrorFallback from ...` form"
  - "Router stub element is a single `const Stub = () => null` (not `RootLayout`) so 01-04b's `import RootLayout from './RootLayout'` cleanly replaces the reference without name collision"
  - "playwright.config.ts conditional `webServer` rewritten as spread (`...(usingExternalUrl ? {} : { webServer: ... })`) to satisfy `exactOptionalPropertyTypes: true` — pre-existing build blocker, fixed under Rule 3"
  - "Router test mocks `src/data/supabase` and `src/lib/env` at module level because the loader chain reaches the real Supabase client through Login → signInWithGoogle"
  - "RequireFamily renders `null` when family is null (not children) — useEffect handles the redirect, rendering children would hit RLS errors for downstream hooks expecting family.id"

patterns-established:
  - "Auth boundary pattern: loader on parent route, component-level boundary for family check, neither pattern can be bypassed by navigating directly"
  - "Realtime bridge pattern: one channel per family, never per-table channels, never per-component subscriptions"
  - "Mutation invalidation pattern: every useMutation onSuccess invalidates a stable queryKey rather than pushing payloads"
  - "Error-boundary pattern: every route declares errorElement; the catch-all `*` also declares errorElement so an error in the fallback itself does not crash"

requirements-completed:
  - ARCH-02
  - ARCH-03
  - ARCH-07
  - ARCH-08
  - ARCH-09

# Metrics
duration: ~15min
completed: 2026-05-20
---

# Phase 01 Plan 04a: Data + Auth + Router skeleton (no visible UI yet)

**TanStack Query v5 root with offlineFirst mutations + Supabase Realtime bridge + React Router v7 Data-mode router with errorElement on every route and a loader-based auth + allowlist gate — visual shell intentionally deferred to 01-04b.**

## Performance

- **Duration:** ~15 min (single executor, no checkpoints reached because Task 4a.3 is `checkpoint:human-verify` — see notes)
- **Started:** 2026-05-20T17:42:00Z (approximate)
- **Completed:** 2026-05-20T17:54:00Z
- **Tasks:** 2 of 3 auto/TDD tasks executed; Task 4a.3 is human-verify, automated portion verified
- **Files modified:** 13 (9 created, 4 modified)

## Accomplishments

- **Data layer wired end-to-end.** A single `queryClient` with `mutations.networkMode: 'offlineFirst'` and `queries.networkMode: 'online'` is the substrate for every domain feature. `useCurrentFamily` returns the user's `families` row with `family_settings` embedded (`'family_id, families:family_id ( *, family_settings ( * ) )'`), giving ThemeProvider in 01-04b a one-query read for `theme`. `useFamilySettings` mutates `family_settings` and invalidates `['current-family']` on success — the D-15 cross-device theme path is now fully traceable from ThemeToggle click to remote device re-render.
- **Realtime bridge is a single channel.** `useRealtimeBridge` opens one Supabase channel `family:<familyId>` and attaches one `.on('postgres_changes')` per table in the 11-entry `FAMILY_SCOPED_TABLES` tuple. Cleanup calls `supabase.removeChannel(channel)` — the CLAUDE.md / RESEARCH.md anti-pattern of `channel.unsubscribe()` is absent (verified by `grep -c channel.unsubscribe` → 0). The hook bails out early when `familyId` is undefined, mitigating Pitfall 3 (silent-dead-channel from subscribing before auth resolves).
- **Auth boundary is loader-based, runs BEFORE any element mounts.** `requireAuthLoader` sequence: `getSession` → if null, throw `redirect('/login')`; if email missing, signOut + redirect `/access-denied`; otherwise `isAllowedEmail` → if false, signOut + redirect `/access-denied?email=...`; otherwise return `{ user }`. The throw is unconditional on the failure paths — no try/catch swallows the signOut error. RequireFamily is a component-level boundary (not a loader) so the wizard's mutation can invalidate `['current-family']` and the route re-evaluates without an extra `navigate`.
- **Router topology is final.** `createBrowserRouter` is built with the route tree the rest of the phase will reference; only the placeholder elements (the single `const Stub = () => null`) are swapped out by 01-04b (RootLayout + tab elements) and Plan 05 (CreateFamily wizard). `errorElement: <RouteErrorFallback />` appears 14 times across the tree (catch-all + 12 entries) — well above the ≥ 10 acceptance gate.
- **All three target Wave 0 RED stubs turned GREEN.** `queryClient.test.ts`, `router.test.tsx`, `error-boundary.test.tsx` all pass. `npx tsc --noEmit` exits 0. `npm run build` exits 0.

## Task Commits

Each task was committed atomically. Both Wave 0 RED stubs (queryClient.test.ts, router.test.tsx, error-boundary.test.tsx) were authored in Plan 01-01 commit `8a4491e`; this plan landed the GREEN implementations.

1. **Task 4a.1 — GREEN:** `c01438b` — `feat(01-04a): wire data layer (QueryClient + family hooks + realtime bridge) — GREEN`
2. **Task 4a.2 — GREEN:** `ab78811` — `feat(01-04a): wire auth guards + router with errorElement on every route — GREEN`

Task 4a.3 is `type="checkpoint:human-verify"` and is intentionally not its own commit — it's a verification gate. The automated portion of the gate (`npm test` on three files + `npx tsc --noEmit` + `errorElement count ≥ 10`) all pass; the human source-level review remains for the orchestrator / user to perform before 01-04b mounts the visual shell.

_TDD note:_ The Wave 0 RED stubs were authored in Plan 01-01; this plan's GREEN commits also include the cleanup of `@ts-expect-error` directives from those stubs (which become unused once the imported module resolves under strict TS settings).

## Files Created/Modified

### Created (9)
- `src/data/queryClient.ts` — TanStack Query root singleton; offlineFirst mutations, online queries, 30s staleTime, retry 1.
- `src/data/useCurrentFamily.ts` — `['current-family']` query returning `FamilyWithSettings | null` with `family_settings` embedded; staleTime Infinity.
- `src/data/useFamilySettings.ts` — `useMutation` that PATCHes `family_settings.family_id = family.id`, invalidates `['current-family']` on success.
- `src/data/useRealtimeBridge.ts` — Single `family:<id>` channel, one `.on('postgres_changes')` per table, cleanup via `supabase.removeChannel`.
- `src/auth/RequireAuth.tsx` — `requireAuthLoader` (default Phase-1 boundary) and `RequireAuth` component (future nested-layout use).
- `src/auth/RequireFamily.tsx` — Component-level family boundary; useEffect-driven redirect to `/onboarding/create-family` when null.
- `src/routes/router.tsx` — `createBrowserRouter` with errorElement on every entry (14 occurrences) + Stub placeholders for 01-04b/Plan 05.
- `src/routes/RouteErrorFallback.tsx` — UI-SPEC-locked copy ("Something went wrong on this page", "Reload this page", "Back to Dashboard").
- `src/routes/RouteErrorFallback.module.css` — Token-driven (CSS variables only); buttons stack on mobile under 768px.

### Modified (4)
- `tests/unit/queryClient.test.ts` — Removed `@ts-expect-error` (Wave 0 RED → GREEN).
- `tests/unit/router.test.tsx` — Removed `@ts-expect-error`; added module-level mocks for `src/data/supabase`, `src/lib/env`, `src/auth/allowlist` so the unauthenticated redirect path can be tested without env vars or real Supabase.
- `tests/unit/error-boundary.test.tsx` — Removed `@ts-expect-error` (Wave 0 RED → GREEN).
- `playwright.config.ts` — Rewrote conditional `webServer` as a spread expression so `exactOptionalPropertyTypes: true` does not reject the undefined branch (pre-existing build blocker — Rule 3 fix).

## Decisions Made

1. **Stub-replacement strategy.** Used a single `const Stub = () => null` for all placeholder elements in `router.tsx` rather than per-element no-op components. This keeps the file readable, makes the 01-04b diff a search-and-replace of `<Stub />`, and the name avoids colliding with `RootLayout` (which 01-04b imports). A `TODO (01-04b)` block at the top of `router.tsx` lists the exact imports the next plan must add.
2. **RouteErrorFallback exports both named and default.** The Wave 0 test stub does `import { RouteErrorFallback } from ...` (named); the router.tsx does `import RouteErrorFallback from ...` (default). Exporting both lets the test stay verbatim and the router stay ergonomic.
3. **`RequireFamily` returns `null` (not children) when family is null.** The useEffect handles the redirect, but children would mount in the meantime and every downstream hook that expects `family.id` would error. Rendering nothing is the safe interim.
4. **Tightened the `requireAuthLoader` no-email path.** If `session.user.email` is falsy (Google OAuth misconfiguration), the loader signs out and redirects to `/access-denied` without the email param. This is a defence-in-depth branch — Google always returns email for the `email` scope, but the loader should not fall through with `email!`.
5. **Test mocking pattern for `router.test.tsx`.** Mocked `src/data/supabase`, `src/lib/env`, AND `src/auth/allowlist` because the router transitively imports through `Login → signInWithGoogle → supabase`. The env mock matters because `src/lib/env` throws at module-load when `VITE_SUPABASE_URL` is missing, and vitest workers don't see `.env.local` by default.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed `playwright.config.ts` exactOptionalPropertyTypes incompatibility**
- **Found during:** Task 4a.2 verification (`npm run build`).
- **Issue:** `tsc -b` (run by `npm run build`) failed with `playwright.config.ts(8,29): error TS2769: ... Type 'undefined' is not assignable to type 'TestConfigWebServer | TestConfigWebServer[]'.` because the ternary assigned `undefined` to `webServer` and the project's `tsconfig.json` sets `exactOptionalPropertyTypes: true`. This blocked Task 4a.2's verification step `npm run build exits 0` and the plan's overall verification gate (3).
- **Root cause is NOT this plan's changes** — verified by stashing 01-04a changes and re-running `npm run build` against `08c034d` baseline; the same error reproduced. The error was introduced in commit `8a4491e — feat(01-01): add Vitest + Playwright config and RED test stubs`.
- **Fix:** Rewrote the conditional as `...(usingExternalUrl ? {} : { webServer: {...} })`. Spreading an empty object leaves the `webServer` key absent (rather than `undefined`) when running against a deployed URL, which satisfies the strict optional-property type.
- **Files modified:** `playwright.config.ts`
- **Verification:** `npm run build` now exits 0; `npx tsc --noEmit` exits 0.
- **Committed in:** `ab78811` (Task 4a.2 commit) — included with the auth/router changes because dropping it would re-fail Task 4a.2's verification.

**2. [Rule 3 - Blocking] Removed unused `@ts-expect-error` directives from Wave 0 RED test stubs**
- **Found during:** Task 4a.1 (queryClient.test.ts) and Task 4a.2 (router.test.tsx, error-boundary.test.tsx) verification.
- **Issue:** `npx tsc --noEmit` failed with `TS2578: Unused '@ts-expect-error' directive.` because the GREEN implementations now resolve the previously-unresolvable imports.
- **Fix:** Removed the `@ts-expect-error` directives from the three test files and updated the surrounding RED-stub comments to reflect that the modules now exist.
- **Verification:** `npx tsc --noEmit` exits 0.
- **Committed in:** `c01438b` (queryClient.test.ts) and `ab78811` (router + error-boundary).

**3. [Rule 1 - Defensive] Added a no-email guard to `requireAuthLoader`**
- **Found during:** Task 4a.2 implementation review.
- **Issue:** The plan body and RESEARCH.md Pattern 2 use `session.user.email!` (non-null assertion). Under `strict: true` this compiles but is wrong-by-design: a session that lands with a null email is a Google OAuth misconfiguration, and `email!.toLowerCase()` would throw inside the allowlist check, surfacing as a 500-style routing crash rather than a clean redirect.
- **Fix:** Added an explicit `if (!email)` branch BEFORE the allowlist call: `await supabase.auth.signOut(); throw redirect('/access-denied')`. The user lands on the same recovery surface as a not-allowlisted user, and the page falls back to "your account" copy.
- **Files modified:** `src/auth/RequireAuth.tsx`
- **Verification:** TypeScript compile passes without a non-null assertion; the existing router test still passes (its session is null, so this branch is never reached).
- **Committed in:** `ab78811`.

---

**Total deviations:** 3 auto-fixed (2 Rule 3 blocking, 1 Rule 1 defensive — all in the same general area of the boundary code that the checkpoint is set up to review)
**Impact on plan:** All three fixes preserve plan intent. The playwright.config.ts fix unblocks the plan's verification gate. The `@ts-expect-error` cleanup is the natural Wave 0 → GREEN transition. The no-email branch documents an invariant rather than relying on a non-null assertion. No scope creep, no new files, no new dependencies.

## Issues Encountered

None beyond the deviations documented above.

## User Setup Required

None — this plan adds no new external service configuration. The Supabase URL + anon key established in Plan 01-03 are sufficient.

## Checkpoint Status — Task 4a.3 (human-verify, gate=blocking)

Automated portion of the gate **passes**:
- `npm test -- tests/unit/queryClient.test.ts tests/unit/router.test.tsx tests/unit/error-boundary.test.tsx` → 3 files passed, 3 tests passed.
- `npx tsc --noEmit` → exits 0.
- `grep -c errorElement src/routes/router.tsx` → 14 (≥ 10).

Human source-level review (steps 1–9 in the plan's `<how-to-verify>`) is **deferred to the orchestrator** — this executor is a non-interactive parallel agent in a worktree and cannot block waiting for `approved`. The plan's automated verification is satisfied; the source files are at known-good commits `c01438b` and `ab78811` and any post-hoc human review can read them directly without re-running automation.

If the human review surfaces issues, they should be raised as a follow-up plan / blocker before 01-04b begins.

## Next Phase Readiness

- **01-04b (visual shell)** is unblocked. The route topology in `src/routes/router.tsx` is final — 01-04b only needs to swap `<Stub />` references for the real components and add the import lines listed in the TODO block at the top of that file. The data layer (`useCurrentFamily`, `useFamilySettings`, `useRealtimeBridge`) is ready for `RootLayout` and `ThemeProvider` to consume.
- **Plan 05 (Family Creation Wizard)** is unblocked. The `/onboarding/create-family` route is mounted (currently a Stub) and the `useCurrentFamily` invalidation primitive is in place — the wizard's mutation can `qc.invalidateQueries({ queryKey: ['current-family'] })` to flip `RequireFamily` from `null` to `family` without a manual navigate.
- **Phase 2 domain features** can read `family.id` via `useCurrentFamily()` and write through `useMutation` against the configured `queryClient`. The realtime bridge will pick up new tables when added to `FAMILY_SCOPED_TABLES`.

## Self-Check: PASSED

Verified post-write:

- File: `src/data/queryClient.ts` → FOUND.
- File: `src/data/useCurrentFamily.ts` → FOUND.
- File: `src/data/useFamilySettings.ts` → FOUND.
- File: `src/data/useRealtimeBridge.ts` → FOUND.
- File: `src/auth/RequireAuth.tsx` → FOUND.
- File: `src/auth/RequireFamily.tsx` → FOUND.
- File: `src/routes/router.tsx` → FOUND.
- File: `src/routes/RouteErrorFallback.tsx` → FOUND.
- File: `src/routes/RouteErrorFallback.module.css` → FOUND.
- Commit: `c01438b` (data layer GREEN) → FOUND in `git log --all`.
- Commit: `ab78811` (auth + router GREEN) → FOUND in `git log --all`.

---
*Phase: 01-foundation-walking-skeleton*
*Completed: 2026-05-20*
