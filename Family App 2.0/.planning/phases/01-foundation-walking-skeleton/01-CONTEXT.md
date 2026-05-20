# Phase 1: Foundation & Walking Skeleton - Context

**Gathered:** 2026-05-19
**Status:** Ready for planning

<domain>
## Phase Boundary

A deployable PWA shell where an authenticated, allowlisted user lands on a routable app backed by a multi-tenant RLS-protected Supabase schema, with realtime invalidation, offline write queuing, Stripe customer infrastructure, and the family creation wizard — all wired before any domain feature ships.

Visible output: Google OAuth login → allowlist check → family creation wizard (new users) → bottom nav with placeholder pages per section (Dashboard, Chores, Calendar, Meals, Groceries, Notes). Theme responds to OS `prefers-color-scheme` on first load, then persists in `family_settings`.

</domain>

<decisions>
## Implementation Decisions

### Offline Queue (ARCH-09)
- **D-01:** Use TanStack Query's built-in offline mechanism — `networkMode: 'offlineFirst'` on all mutations. No IndexedDB or custom queue needed.
- **D-02:** Queue is in-memory only. Paused mutations are lost on page close while offline. IndexedDB persistence is deferred to Phase 6 (when the service worker is built out).
- **D-03:** Show a visible offline banner ("Offline — changes will sync when reconnected") while any mutations are in the paused queue.

### Stripe Billing Infrastructure (ARCH-10)
- **D-04:** Phase 1 scope is infrastructure only — no `useTier()` hook, no feature gating, no billing portal UI (those land in Phase 2 and Phase 7 respectively).
- **D-05:** Stripe customer is created via a Supabase Edge Function triggered on `families` INSERT (DB trigger → webhook → Edge Function). Not client-side.
- **D-06:** Trial period tracked via a `trial_ends_at` timestamp column on `family_settings`, set at family creation. Stripe subscription object may or may not exist at trial start — `trial_ends_at` is the authoritative client-side signal.
- **D-07:** A Stripe webhook handler endpoint must exist in Phase 1, but only needs to handle the `customer.subscription.updated` / `deleted` events needed to update `trial_ends_at` or future subscription state.

### Email Allowlist Gate
- **D-08:** Access control via an `allowed_emails` table in Supabase. No hardcoded list, no env var — DB-driven so a parent can manage it from Settings (Phase 7) without a redeploy.
- **D-09:** On sign-in, after Google OAuth callback, the app checks `allowed_emails` for the authenticated user's email (case-insensitive). If not found: immediately sign out, show "Access Denied" screen with the email used and a sign-out button.
- **D-10:** RLS on `allowed_emails`: only parents (auth_is_parent() = true) can INSERT/DELETE rows. Bootstrapped at migration time with the family's known emails.

### family_id Resolution
- **D-11:** After auth, a `useCurrentFamily()` TanStack Query hook fetches the `families` row linked to `auth.uid()` via `members.auth_user_id`. This hook is the single source of `family_id` for all downstream data hooks.
- **D-12:** When `useCurrentFamily()` returns null (no family linked to this user), a `RequireFamily` boundary redirects to `/onboarding/create-family`. This is the ONBD-01 family creation wizard.

### Walking Skeleton Shell (ARCH-02, ARCH-08)
- **D-13:** The Phase 1 shell includes: bottom nav with links to all main routes (Dashboard, Chores, Calendar, Meals, Groceries, Notes), each route shows an empty/placeholder page, theme toggle is functional.
- **D-14:** Member avatar chips in the nav are NOT part of Phase 1 (members are Phase 2). Nav shows family name only.
- **D-15:** Default theme on first load uses `prefers-color-scheme`: Light OS → Lavender, Dark OS → Midnight. User preference is persisted to `family_settings.theme` (family-wide, all devices see the same theme).
- **D-16:** Error boundaries wrap every route via React Router v7's `errorElement`. A fallback UI catches render failures without crashing the whole app.

### Claude's Discretion
- **Offline queue persistence depth:** Whether to layer localStorage serialization of the paused mutation queue on top of the in-memory TanStack Query queue is left to researcher/planner judgement. In-memory is the baseline; serialization may add more complexity than value for Phase 1.
- **Stripe webhook event list:** The specific Stripe event types to handle in Phase 1 beyond the trial-related ones are left to researcher to determine based on Stripe docs.
- **TypeScript strictness:** Use `strict: true` in tsconfig unless the researcher finds a compelling reason to relax specific checks.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Foundation
- `.planning/PROJECT.md` — Key Decisions table, constraints (auth, hosting, DB, closed access), v1 patterns to carry forward and discard
- `.planning/REQUIREMENTS.md` — Phase 1 requirement IDs: ARCH-01 through ARCH-11, ARCH-13, ONBD-01; acceptance criteria in traceability table
- `.planning/ROADMAP.md` §Phase 1 — Goal, success criteria (5 items), mode, depends-on

### Technology Stack (from CLAUDE.md)
- `CLAUDE.md` §Recommended Stack — pinned versions for React 19, Vite 8, TypeScript 5.7, React Router 7.15, TanStack Query 5.100, Supabase JS 2.106, vite-plugin-pwa 1.3
- `CLAUDE.md` §TanStack Query v5 Patterns — standard query pattern, optimistic mutation with rollback, what NOT to do
- `CLAUDE.md` §Supabase Realtime Patterns — single channel per concern, postgres_changes → invalidateQueries pattern, removeChannel cleanup
- `CLAUDE.md` §UUID Generation — crypto.randomUUID() on client, why server-gen is wrong for this stack
- `CLAUDE.md` §Push Notification Architecture — injectManifest requirement, VAPID keys setup, custom service worker pattern

### v1 Codebase Reference
- `../family-app/src/lib/db.js` — db isolation pattern (all Supabase calls behind a module boundary), row↔app-state transforms to port
- `../family-app/src/index.css` — CSS variable theme system (--lavender, --lavender-light, --lavender-dark, --bg, --card-bg, --text, --text-muted, --border, --shadow, --radius vars) to carry forward to v2
- `../family-app/src/App.jsx` — v1 auth gate pattern (ALLOWED_EMAILS check post-OAuth), page string routing to REPLACE with React Router v7

### External Docs
- No external specs beyond CLAUDE.md — all architectural decisions are captured above

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **CSS variable system** (`../family-app/src/index.css`): The full `--lavender`, `--bg`, `--card-bg`, `--text`, `--border`, `--shadow`, `--radius` variable set from v1 should be ported verbatim. `data-theme="midnight"` attribute switch pattern carries forward.
- **db.js isolation pattern** (`../family-app/src/lib/db.js`): The `check()` / `checked()` wrapper pattern and row↔app-state transform functions (choreFromRow, eventFromRow, etc.) are the model for v2's data layer, though v2 replaces the flat functions with TanStack Query hooks.
- **Auth gate shape** (`../family-app/src/App.jsx`): The sign-in → ALLOWED_EMAILS check → family data load sequence is the visual model for v2's auth flow, even though the implementation changes substantially.

### Established Patterns
- **No hardcoded member IDs**: v1's `MEMBER_IDS = ['mom', 'dad', 'stella', 'roman', 'layla']` is the anti-pattern. v2 members come from the `members` table — no reference to specific member names anywhere in app code.
- **`page` string routing is gone**: v1's `const [page, setPage] = useState('dashboard')` and giant if-else chain is fully replaced by React Router v7 `createBrowserRouter` + `RouterProvider`.
- **No monolithic AppContext**: v1's AppContext held all family data. v2 replaces it with per-feature TanStack Query hooks. No global context for server state.

### Integration Points
- Supabase project: new project or new schema — researcher should determine which (new project is cleaner for RLS isolation)
- Vercel deployment: same pipeline as v1 (`vercel --prod` from `/Users/travismader/Desktop/Pioneer` — see memory for the path quirk)
- PWA manifest and service worker: Phase 1 registers the SW via vite-plugin-pwa but push handlers are Phase 6

</code_context>

<specifics>
## Specific Ideas

- The Stripe customer creation Edge Function should be triggered from a DB-side mechanism (not client-side) so the client-facing family creation form stays simple and fast.
- The offline banner should be subtle but visible — not a modal. A fixed top bar or a small persistent indicator.
- OS preference for theme default: `window.matchMedia('(prefers-color-scheme: dark)').matches` → Midnight, else Lavender.

</specifics>

<deferred>
## Deferred Ideas

- **`useTier()` hook and feature gating** — assigned to Phase 2 when the first premium-gated feature (invitations, trial enforcement) is needed.
- **Stripe billing portal UI (SETT-05)** — Phase 7 with the rest of Settings.
- **Offline queue persistence across page close** — deferred to Phase 6 when the service worker is built; Background Sync API is the right primitive.
- **Member avatar chips in nav** — Phase 2 (members don't exist yet in Phase 1).
- **Per-member theme preference** — considered but rejected; family-level theme in `family_settings` is the right model.

</deferred>

---

*Phase: 1-Foundation & Walking Skeleton*
*Context gathered: 2026-05-19*
