---
phase: 01-foundation-walking-skeleton
plan: 03
subsystem: auth
tags: [supabase-auth, google-oauth, pkce, allowlist, react19, react-router-v7, css-modules, vitest]
status: complete

dependency_graph:
  requires:
    - "Plan 01-01 — Vite + React 19 + TS scaffold (src/lib/env.ts, src/lib/check.ts)"
    - "Plan 01-02 — Supabase schema applied; allowed_emails table seeded with 5 family addresses; src/data/types.ts generated"
  provides:
    - "src/data/supabase.ts — single createClient<Database> with PKCE + detectSessionInUrl + persistSession + autoRefreshToken; signInWithGoogle() helper"
    - "src/auth/allowlist.ts — isAllowedEmail() DB-driven gate, lowercased and trimmed, case-insensitive"
    - "src/routes/login.tsx — UI-SPEC-compliant /login card with Google OAuth CTA"
    - "src/routes/access-denied.tsx — /access-denied card surfacing the rejected email"
    - "src/components/GoogleIcon.tsx — multi-color Google brand SVG (the one Phase 1 raw-hex carve-out)"
  affects:
    - "Plan 01-04 — router will mount /login and /access-denied as routes; requireAuthLoader will call isAllowedEmail()"
    - "Plan 01-05 — Family Creation Wizard runs after sign-in lands; relies on the same supabase client export"
    - "Plan 01-06 — Maestro E2E will exercise the /login → OAuth → /dashboard round-trip"

tech_stack:
  added: []
  patterns:
    - "PKCE OAuth flow via supabase-js v2 default — flowType: 'pkce' + detectSessionInUrl: true + redirectTo `${origin}/` (trailing slash required per RESEARCH.md Pitfall 9)"
    - "DB-driven allowlist via `allowed_emails` table — no hardcoded env list, no array constant; RLS SELECT policy restricts each user to their own row"
    - "Module-boundary vi.mock pattern for Supabase in unit tests — chain a thenable for .select().eq().maybeSingle() to avoid network calls"
    - "CSS Modules with `var(--token)` only — raw hex is forbidden except inside brand-mark SVGs (e.g. GoogleIcon)"

key_files:
  created:
    - path: "Family App 2.0/src/data/supabase.ts"
      role: "Configured Supabase client + signInWithGoogle helper — single source of Supabase config"
    - path: "Family App 2.0/src/auth/allowlist.ts"
      role: "isAllowedEmail() — DB-driven, case-insensitive, trimmed allowlist gate"
    - path: "Family App 2.0/src/routes/login.tsx"
      role: "/login route component with UI-SPEC copy and Google OAuth CTA"
    - path: "Family App 2.0/src/routes/login.module.css"
      role: "Login card CSS — ported from v1 + min-height: 44px (WCAG 2.5.5)"
    - path: "Family App 2.0/src/routes/access-denied.tsx"
      role: "/access-denied route component surfacing the rejected email"
    - path: "Family App 2.0/src/routes/access-denied.module.css"
      role: "Access Denied card CSS — mirrors Login geometry, destructive heading via var(--pink-dark)"
    - path: "Family App 2.0/src/components/GoogleIcon.tsx"
      role: "Google brand-mark SVG with four canonical fill colors"
    - path: "Family App 2.0/tests/unit/allowlist.test.ts"
      role: "3 tests asserting isAllowedEmail's lowercase + trim + maybeSingle contract"
    - path: "Family App 2.0/tests/unit/login.test.tsx"
      role: "3 tests asserting Login UI-SPEC copy, click handler, and error pill behavior"
    - path: "Family App 2.0/tests/unit/access-denied.test.tsx"
      role: "3 tests asserting AccessDenied heading, email interpolation, fallback, and signOut wiring"
  modified: []

decisions:
  - "Used module-boundary vi.mock for supabase in unit tests (returns a thenable chain for .select().eq().maybeSingle()) rather than spinning up MSW — keeps unit tests synchronous and fast; MSW lands in integration tests."
  - "AccessDenied's onClick wraps signOut in `void supabase.auth.signOut()` (fire-and-forget) — matches v1 behavior; the parent route guard re-routes to /login as soon as the session clears via Supabase's auth state listener."
  - "GoogleIcon SVG uses 24×24 viewBox (not v1's 48×48) per PATTERNS.md, sized to 18×18 to fit the WCAG-44px tap target with room for the label."
  - "The raw Google brand hex colors live inside GoogleIcon.tsx, not in any .module.css file — preserves the UI-SPEC §Color rule that .module.css uses `var(--token)` exclusively."

requirements_completed:
  - ARCH-01
  - ARCH-02
  - ARCH-05

metrics:
  duration_minutes: 9
  tasks_completed: 3
  tasks_total: 3
  files_created: 10
  files_modified: 0
  commits_added: 6
  started: "2026-05-20T17:31:00Z"
  completed: "2026-05-20T17:36:00Z"
---

# Phase 1 Plan 03: Supabase Client + OAuth/Allowlist Slice Summary

**Google OAuth (PKCE) sign-in card and Access Denied screen, wired to a DB-driven `allowed_emails` allowlist via a typed `createClient<Database>` — the first user-visible end-to-end auth slice of the Walking Skeleton.**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-05-20T17:31:00Z
- **Completed:** 2026-05-20T17:36:00Z
- **Tasks:** 3 / 3
- **Files created:** 10 (3 src modules, 2 CSS modules, 1 brand-mark SVG, 3 test files, 1 SUMMARY)
- **Commits:** 6 (RED + GREEN per TDD task)

## Accomplishments

- **PKCE OAuth wired correctly.** `src/data/supabase.ts` ships with `flowType: 'pkce'`, `detectSessionInUrl: true`, `persistSession: true`, `autoRefreshToken: true`, and the parameterized `createClient<Database>` generic. `signInWithGoogle()` sets `redirectTo: ${origin}/` with the mandatory trailing slash (RESEARCH.md Pitfall 9).
- **DB-driven allowlist gate.** `src/auth/allowlist.ts`'s `isAllowedEmail()` lowercases + trims the input before `select.eq.maybeSingle`. Three tests verify the lowercase coercion, the whitespace trim, and the row-hit/null return contract — the test suite mocks supabase at the module boundary, so it never hits the network.
- **UI-SPEC-compliant /login + /access-denied cards.** Every UI-SPEC copy literal lives verbatim in the source: "Family Plan", "Sign in to access your family's dashboard", "Sign in with Google" / "Redirecting…", "This email isn't on the family list", "doesn't have access to this Family Plan", "Sign out". Card geometry mirrors v1 (380px max-width, 48px×40px padding, 12px gap); the Google button gains `min-height: 44px` for WCAG 2.5.5; all CSS colors flow through `var(--token)`.
- **Plan-owned suite: 9 / 9 green.** allowlist (3) + login (3) + access-denied (3) all pass; `npx tsc --noEmit` exits 0.

## Task Commits

1. **Task 3.1 — RED:** `b2f4cdc` — `test(01-03): add failing allowlist gate unit tests (RED)`
2. **Task 3.1 — GREEN:** `1e78c49` — `feat(01-03): wire Supabase client + DB-driven allowlist gate (GREEN)`
3. **Task 3.2 — RED:** `d6c6bf3` — `test(01-03): add failing Login route component tests (RED)`
4. **Task 3.2 — GREEN:** `2658e47` — `feat(01-03): build /login route with Google OAuth card (GREEN)`
5. **Task 3.3 — RED:** `b067eb7` — `test(01-03): add failing AccessDenied route component tests (RED)`
6. **Task 3.3 — GREEN:** `471dc03` — `feat(01-03): build /access-denied route surfacing rejected email (GREEN)`

_Task 3.4 is a `checkpoint:human-verify` source-level review — verified by the automated grep + `npm test` line below. The OAuth browser round-trip is intentionally deferred to Plan 06 Task 6.4 (after the router mounts /login as a real route)._

## Files Created/Modified

**Source modules (5):**

- `Family App 2.0/src/data/supabase.ts` — Configured `createClient<Database>` with PKCE OAuth; `signInWithGoogle()` helper.
- `Family App 2.0/src/auth/allowlist.ts` — `isAllowedEmail(email)` DB-driven gate with lowercase + trim.
- `Family App 2.0/src/routes/login.tsx` — `<Login/>` component with verbatim UI-SPEC copy.
- `Family App 2.0/src/routes/access-denied.tsx` — `<AccessDenied/>` component reading `?email=` via `useSearchParams`.
- `Family App 2.0/src/components/GoogleIcon.tsx` — Google brand-mark SVG (the only Phase 1 raw-hex carve-out).

**CSS modules (2):**

- `Family App 2.0/src/routes/login.module.css` — Card geometry + `.googleBtn` (`min-height: 44px`); all colors via `var(--token)`.
- `Family App 2.0/src/routes/access-denied.module.css` — Mirrors Login geometry; `.title` uses `var(--pink-dark)` destructive color.

**Tests (3):**

- `Family App 2.0/tests/unit/allowlist.test.ts` — 3 tests for the lowercase + trim + maybeSingle contract.
- `Family App 2.0/tests/unit/login.test.tsx` — 3 tests for UI-SPEC copy + click handler + error pill behavior.
- `Family App 2.0/tests/unit/access-denied.test.tsx` — 3 tests for heading + email interpolation + fallback + signOut.

## Acceptance Criteria Status

### Task 3.1
| Criterion | Status | Evidence |
|---|---|---|
| `src/data/supabase.ts` contains `flowType: 'pkce'` | PASS | `grep -c` → 2 |
| `src/data/supabase.ts` contains `detectSessionInUrl: true` | PASS | `grep -c` → 2 |
| `src/data/supabase.ts` contains `window.location.origin` | PASS | `grep -c` → 1 |
| `src/data/supabase.ts` contains `createClient<Database>` | PASS | `grep -c` → 1 |
| `src/auth/allowlist.ts` contains `from('allowed_emails')` | PASS | `grep -c` → 1 |
| `src/auth/allowlist.ts` contains `.toLowerCase()` and `.trim()` | PASS | `grep -c '.toLowerCase().trim()'` → 1 |
| `npm test -- tests/unit/allowlist.test.ts` exits 0 with 3 tests passing | PASS | 3/3 green |
| `npx tsc --noEmit` exits 0 | PASS | clean |

### Task 3.2
| Criterion | Status | Evidence |
|---|---|---|
| `src/routes/login.tsx` contains "Family Plan" | PASS | `grep -c` → 2 |
| `src/routes/login.tsx` contains "Sign in to access your family's dashboard" | PASS | `grep -c "Sign in to access"` → 2 |
| `src/routes/login.tsx` contains "Sign in with Google" | PASS | `grep -c` → 2 |
| `src/routes/login.tsx` contains "Redirecting" | PASS | `grep -c` → 2 |
| `src/routes/login.tsx` imports `signInWithGoogle` from `'../data/supabase'` | PASS | `grep -c` → 1 |
| `src/routes/login.module.css` contains `max-width: 380px` | PASS | `grep -c` → 1 |
| `src/routes/login.module.css` contains `padding: 48px 40px` | PASS | `grep -c` → 1 |
| `src/routes/login.module.css` contains `min-height: 44px` | PASS | `grep -c` → 2 (`.googleBtn`) |
| `src/routes/login.module.css` contains no raw hex | PASS | `grep -E "#[0-9a-fA-F]{3,6}"` → 0 matches |
| `src/components/GoogleIcon.tsx` contains the four canonical hex colors | PASS | `#FFC107`, `#FF3D00`, `#4CAF50`, `#1976D2` all present |
| `npx tsc --noEmit` exits 0 | PASS | clean |

### Task 3.3
| Criterion | Status | Evidence |
|---|---|---|
| `src/routes/access-denied.tsx` contains "This email isn't on the family list" | PASS | `grep -c "This email isn"` → 2 |
| `src/routes/access-denied.tsx` contains "doesn't have access to this Family Plan" | PASS | `grep -c "doesn"` → 2 |
| `src/routes/access-denied.tsx` contains "Sign out" | PASS | `grep -c` → 2 |
| `src/routes/access-denied.tsx` imports `useSearchParams` from `react-router` (NOT `react-router-dom`) | PASS | `grep -c "react-router-dom"` → 0 |
| `src/routes/access-denied.tsx` imports `supabase` from `'../data/supabase'` | PASS | `grep -c` → 1 |
| `src/routes/access-denied.module.css` contains no raw hex | PASS | `grep -E "#[0-9a-fA-F]{3,6}"` → 0 matches |
| `src/routes/access-denied.module.css` contains `var(--pink-dark)` for the heading | PASS | `grep -c` → 2 (heading + signOutBtn hover) |
| `npx tsc --noEmit` exits 0 | PASS | clean |

### Task 3.4 — `checkpoint:human-verify` (source-level review)

The automated verification line in PLAN.md Task 3.4 is:

```
npm test -- tests/unit/allowlist.test.ts && \
  grep -c "flowType: 'pkce'" src/data/supabase.ts | grep -E "^[1-9]" && \
  grep -c "This email isn't on the family list" src/routes/access-denied.tsx | grep -E "^[1-9]"
```

Re-run inside `Family App 2.0/`:

- `npm test -- tests/unit/allowlist.test.ts` → 3/3 green.
- `grep -c "flowType: 'pkce'" src/data/supabase.ts` → `2` (matches `^[1-9]`).
- `grep -c "This email isn't on the family list" src/routes/access-denied.tsx` → `1` (matches `^[1-9]`).

All source-level checks defined in Task 3.4's `<how-to-verify>` are satisfied by the artifacts. The OAuth browser round-trip is intentionally deferred to Plan 06 Task 6.4 (per PLAN.md Task 3.4 note: the router has not yet been wired at this wave order, so /login cannot be exercised in a browser until Plan 04 lands).

## Decisions Made

1. **Module-boundary vi.mock for unit tests.** Each new test mocks `src/data/supabase` at the boundary and returns a chainable thenable for `.select().eq().maybeSingle()`. This keeps unit tests fast and offline. MSW will land later when integration tests need full request/response shapes.
2. **Fire-and-forget signOut in AccessDenied.** The Sign-out button's handler is `() => { void supabase.auth.signOut(); }` — matches v1 behavior. The session change triggers Supabase's `onAuthStateChange` listener (mounted by Plan 04's router loader) which will route back to /login automatically.
3. **GoogleIcon viewBox 24×24, sized 18×18.** PATTERNS.md spec; pairs with the 44px tap target with comfortable label spacing.
4. **Raw hex confined to GoogleIcon.tsx.** UI-SPEC §Color forbids raw hex in `.module.css`; the Google brand mark is the carve-out and lives in TSX so the CSS lint rule stays clean.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

The Google OAuth provider must already be configured on Supabase before sign-in works at runtime. This was handled at Plan 02 Task 2.2's `checkpoint:human-verify` (the human confirmed the OAuth provider is enabled and the redirect URLs include `http://localhost:5173/` and the Vercel preview URL pattern). No additional setup is required for Plan 03's source artifacts to ship.

The actual browser OAuth round-trip is deferred to Plan 06 Task 6.4 (Vercel preview gate).

## Threat Model — STRIDE Disposition

All STRIDE entries from PLAN.md `<threat_model>` are addressed:

- **T-03-01 (PKCE code interception):** Mitigated. `flowType: 'pkce'` + `detectSessionInUrl: true` in `src/data/supabase.ts`.
- **T-03-02 (Open redirect via redirectTo):** Mitigated. `signInWithGoogle` hard-codes `${window.location.origin}/`; Supabase rejects unlisted redirect URLs (configured at Plan 02 Task 2.2).
- **T-03-03 (Allowlist enumeration):** Mitigated. RLS SELECT policy from Plan 02 restricts each user to their own row (`lower(email) = lower(jwt ->> 'email')`).
- **T-03-04 (Session lifetime / XSS):** Accept (mitigated by stack). Phase 1 renders zero user-supplied HTML; Phase 5 (Notes) is the first XSS surface and will use React's default escaping.
- **T-03-05 (Allowlist case mismatch):** Triple-defense. Client lowercases + trims; allowlist rows are seeded lowercased; RLS lowercases both sides.
- **T-03-06 (OAuth retry loop on transient error):** Accept. Login button disables during loading and re-enables on error; user retries manually. Supabase backend rate-limits OAuth.
- **T-03-SC (Supply chain):** Mitigated. This plan adds no new packages.

## Known Stubs

None. Every component renders real DOM with real data sources. The only "deferred" wiring is the route table itself — `/login` and `/access-denied` are not mounted in the SPA's router until Plan 04 runs, which is the documented next plan in the wave order.

## Threat Flags

No new threat surface beyond PLAN.md `<threat_model>`. The plan added zero new packages, no new network endpoints, no new schema changes, and no new file-system access patterns. The /access-denied surface reads a query string (`?email=`) but renders it through React's default escaping inside a `<strong>` tag — no `dangerouslySetInnerHTML`, no DOM mutation.

## Next Phase Readiness

- `src/data/supabase.ts` is ready for Plan 04 to import as the singleton client and for `requireAuthLoader` to call `supabase.auth.getSession()`.
- `src/auth/allowlist.ts` is ready for Plan 04's `requireAuthLoader` to call after `getSession()` returns a session — the loader redirects to `/access-denied?email=…` when `isAllowedEmail()` returns `false`.
- `src/routes/login.tsx` and `src/routes/access-denied.tsx` are default-exported and ready to be referenced as the `element` for the `/login` and `/access-denied` routes in Plan 04's `createBrowserRouter` config.
- Plan 04 should also wire a Supabase `onAuthStateChange` listener so that AccessDenied's fire-and-forget `signOut()` immediately routes back to /login (no full page reload needed).

## Worktree Notes

This plan executed in a parallel worktree (wave 2, single plan). Per the orchestrator's `parallel_execution` contract:

- **STATE.md and ROADMAP.md were NOT modified** — the orchestrator handles those writes after all worktree agents in this wave complete.
- **REQUIREMENTS.md was NOT modified** for the same reason. This plan's `requirements: [ARCH-01, ARCH-02, ARCH-05]` will be checked off centrally after the wave merges.

## Self-Check

Verified before commit:

- `Family App 2.0/src/data/supabase.ts` — FOUND
- `Family App 2.0/src/auth/allowlist.ts` — FOUND
- `Family App 2.0/src/routes/login.tsx` — FOUND
- `Family App 2.0/src/routes/login.module.css` — FOUND
- `Family App 2.0/src/routes/access-denied.tsx` — FOUND
- `Family App 2.0/src/routes/access-denied.module.css` — FOUND
- `Family App 2.0/src/components/GoogleIcon.tsx` — FOUND
- `Family App 2.0/tests/unit/allowlist.test.ts` — FOUND (3 tests green)
- `Family App 2.0/tests/unit/login.test.tsx` — FOUND (3 tests green)
- `Family App 2.0/tests/unit/access-denied.test.tsx` — FOUND (3 tests green)
- Commit `b2f4cdc` — FOUND in `git log` (RED 3.1)
- Commit `1e78c49` — FOUND in `git log` (GREEN 3.1)
- Commit `d6c6bf3` — FOUND in `git log` (RED 3.2)
- Commit `2658e47` — FOUND in `git log` (GREEN 3.2)
- Commit `b067eb7` — FOUND in `git log` (RED 3.3)
- Commit `471dc03` — FOUND in `git log` (GREEN 3.3)

## Self-Check: PASSED

---

*Phase: 01-foundation-walking-skeleton*
*Plan: 03*
*Completed: 2026-05-20*
