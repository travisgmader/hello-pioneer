# Walking Skeleton — Family Hub 2.0

**Phase:** 1
**Generated:** 2026-05-20

## Capability Proven End-to-End

An allowlisted user signs in with Google, creates their family space (name + emoji), and lands on the authenticated app shell where realtime invalidation, offline banner, theme persistence, error boundaries, RLS-protected reads, and a deployed PWA service worker are all live.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | React 19.2 + Vite 8 (SPA, no SSR) | CLAUDE.md locks Vite over Next.js — family app is post-login, no SEO, no SSR requirement; Vite gives fast HMR + ESM-native + first-class PWA plugin. |
| Language | TypeScript 5.7 strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` | Supabase generated types, TanStack Query, and React Router v7 all compound the value of strict TS. |
| Routing | React Router v7.15 (Data mode, `createBrowserRouter` + `RouterProvider`) | v6 is feature-frozen; v7 Data mode gives loader-based auth guards, `errorElement` per route, and `shouldRevalidate` without forcing Framework/SSR mode. Import from `react-router` only (drop `react-router-dom`). |
| Server state | TanStack Query v5.100 (single QueryClient at root) | Replaces v1's monolithic AppContext. `networkMode: 'offlineFirst'` on mutations is the in-memory offline queue (D-01/D-02). |
| Auth | Supabase Auth — Google OAuth via PKCE flow (`flowType: 'pkce'`, `detectSessionInUrl: true`) | Closed-family app; PKCE is the SPA-correct flow in 2026. No email/password — every family member already has a Google account. |
| Access control | `allowed_emails` table in Supabase + RLS SELECT-own policy + post-OAuth gate (D-08/D-09/D-10) | DB-driven so a parent can manage from Settings (Phase 7) without redeploy. |
| Database | Supabase Postgres 15 with RLS enabled on every table from day one (ARCH-01, ARCH-05) | `private` schema for SECURITY DEFINER helpers (`current_family_id()`, `auth_is_parent()`) to avoid RLS recursion (Pitfall 2). |
| Tenancy | `family_id UUID` partition key on every domain table + RLS keying off `private.current_family_id()` derived from `auth.uid()` | ARCH-01 lock — cross-tenant access blocked at the database level, not the client. |
| ID generation | `crypto.randomUUID()` on the client for every domain row | Enables optimistic updates without temp-id reconciliation (CLAUDE.md §UUID Generation). |
| Realtime | Single channel at app root (`useRealtimeBridge`) subscribing to `postgres_changes` for all family-scoped tables, translating each event into `queryClient.invalidateQueries({ queryKey: [table, familyId] })` (ARCH-07) | One channel per logical concern, never push payloads into cache, always `supabase.removeChannel()` cleanup (not `channel.unsubscribe()`). |
| Offline | TanStack Query `networkMode: 'offlineFirst'` on mutations + `MutationCache` subscription drives `OfflineBanner` (D-01/D-02/D-03) | In-memory queue only. Page-close loses paused mutations. IndexedDB/Background-Sync deferred to Phase 6. |
| PWA | `vite-plugin-pwa@1.3` with `strategies: 'injectManifest'`, custom `src/sw.ts` doing precache-only in Phase 1 (ARCH-04) | `generateSW` cannot include push handlers — Phase 6 extends `src/sw.ts` with `push` + `notificationclick`. |
| Date/time | Luxon 3.7 keyed to `family_settings.timezone` (ARCH-13) | First usage: `trial_ends_at = DateTime.now().setZone(browserTz).plus({ days: 7 })` in the Edge Function. |
| Stripe customer | Edge Function `stripe-create-customer` triggered by Supabase DB webhook on `families` INSERT, authenticated via custom shared-secret header (D-05) | Never client-side. Idempotency key = `family-{id}-create-customer`. |
| Stripe webhook | Edge Function `stripe-webhook` verifies signature via `stripe.webhooks.constructEventAsync()`; handles `customer.subscription.updated`, `customer.subscription.deleted`, logs `trial_will_end` (D-07) | All other events 200-acked and ignored. |
| Theme | OS `prefers-color-scheme` default (Lavender / Midnight) reconciled with `family_settings.theme` after auth (D-15) | Family-wide setting, not per-member. Activation via `<html data-theme="midnight">` (Lavender = no attribute). |
| Error boundaries | React Router v7 `errorElement` on every route (D-16, ARCH-08) | Catches both loader errors and render errors; no class-component boundaries needed. |
| Deployment target | Vercel preview URL via `vercel --prod` from `/Users/travismader/Desktop/Pioneer` (see Project Memory note about path quirk) | Same pipeline as v1; supports PWA service worker on HTTPS automatically. |
| Directory layout | Feature-folder style under `src/` — `src/routes/`, `src/auth/`, `src/data/`, `src/theme/`, `src/components/`, `src/lib/`, plus `supabase/migrations/`, `supabase/functions/`, `tests/unit/`, `tests/e2e/` | Matches RESEARCH.md §Recommended Project Structure. |
| Testing | Vitest 4 + @testing-library/react 16 (unit), Playwright 1.60 (E2E vs Vercel preview) | Per ship-process memory: every phase runs Playwright vs preview before merging to main. |

## Stack Touched in Phase 1

- [x] Project scaffold — Vite 8 + React 19 + TypeScript strict; lint, vitest, playwright wired (Plan 01)
- [x] Routing — React Router v7 Data mode with 6 placeholder routes + login + access-denied + onboarding (Plan 04)
- [x] Database — supabase/migrations/20260520_000_initial_schema.sql with 13 tables, RLS, helpers, allowed_emails bootstrap; `useCurrentFamily` does a real RLS-protected SELECT; family creation wizard does a real INSERT (Plans 02 + 05)
- [x] UI — Google OAuth button, Login card, Access Denied screen, Family Creation Wizard, app shell with bottom nav + theme toggle + offline banner — all interactive and wired to Supabase (Plans 03 + 04 + 05)
- [x] Deployment — Vercel preview URL with PWA manifest + service worker registered (Plan 06)

## Out of Scope (Deferred to Later Slices)

- **`useTier()` hook + premium feature gating** — Phase 2 (with member CRUD + invitations).
- **Stripe billing portal UI** — Phase 7 (SETT-05).
- **IndexedDB / Background Sync for offline mutation persistence across page-close** — Phase 6 (with the SW push handlers).
- **Member avatar chips in nav** — Phase 2 (members are Phase 2).
- **Per-member theme preference** — rejected; family-level theme is the model.
- **`handle_new_user()` trigger that auto-links a Google sign-in to a pre-seeded member row by email** — Phase 2 (MEMB-07) when invitations exist.
- **COPPA parental-consent flow** — Phase 2 (ONBD-04).
- **6-digit family invite code + invite-by-email link** — Phase 2 (ONBD-02/ONBD-03).
- **Linked-family UI** — Phase 4 (CUST-07). The `family_links` table is created in Phase 1, but Phase 1 has no UI.
- **iOS install-coach screen + double-permission push opt-in** — Phase 6 (NOTF-01/NOTF-02).
- **Push handlers in `src/sw.ts`** — Phase 6 (NOTF-03..NOTF-09). Phase 1 SW is precache-only.
- **VAPID key generation** — Phase 6. Phase 1 only reserves the `VITE_VAPID_PUBLIC_KEY` env slot as a placeholder.
- **Runtime caching of Supabase responses in the SW** — Phase 6 (intentionally absent to avoid stale-auth caching, Pitfall 10).
- **Settings UI for theme / timezone / allowlist management** — Phase 7.
- **v1 → v2 data migration** — Phase 10 (ARCH-12).

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- **Phase 2** — Members, Onboarding & Billing: member CRUD (real + virtual), invitations (email link + 6-digit code), `handle_new_user()` trigger linking by lowercase email, COPPA flow, `useTier()` hook driven by Stripe subscription state.
- **Phase 3** — Chores: `chores` template CRUD, `chore_completions` event log writes, per-chore Duolingo-style streaks with DST-safe Luxon math keyed to `family_settings.timezone`, queue `chore_due` and `chore_completed` rows in `notifications_queue`.
- **Phase 4** — Calendar & Custody: month grid with layer toggles, RRULE events, custody pattern + per-day overrides, iCal export, linked-family read-only custody view (consumes `family_links` table from Phase 1).
- **Phase 5** — Meals, Groceries, Notes: week meal planner with normalized `meal_votes`, shared real-time grocery list, family notes — all using the realtime bridge from Phase 1.
- **Phase 6** — Push & PWA: extend `src/sw.ts` with `push` + `notificationclick` handlers, iOS install-coach, `push_subscriptions` writes, `dispatch-notifications` Edge Function, `pg_cron` schedule.
- **Phase 7** — Settings, Search, Member Pages, Compliance: Settings UI consuming `family_settings.theme`, `family_settings.timezone`, `allowed_emails` management, Stripe billing portal, GDPR/COPPA/CAN-SPAM controls.
- **Phase 8** — Premium: Co-Parent DM, family announcements, expense tracking, per-child info bank.
- **Phase 9** — Premium: Allowance + custom rewards, routines, photo journal, AI meal suggestions, recipe storage.
- **Phase 10** — Data Migration & Production Hardening: v1 → v2 transform on branch DB, single-transaction cutover.
