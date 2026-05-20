# Phase 1: Foundation & Walking Skeleton — Research

**Researched:** 2026-05-19
**Domain:** PWA scaffold + Supabase multi-tenant backend + auth + routing + realtime + offline + Stripe customer infra
**Confidence:** HIGH (stack is pinned and source-verified; all material decisions are answered)

## Summary

Phase 1 lays the entire foundation a 10-phase build sits on. Every locked decision in `01-CONTEXT.md` collapses to a thin, deployable vertical slice: **Google OAuth → allowlist check (Supabase table, not env) → family-creation wizard → authenticated app shell** running over a `family_id`-partitioned RLS-protected schema with realtime invalidation, in-memory offline-first mutations, and a Stripe-customer Edge Function triggered by a DB INSERT webhook.

The biggest risks are **not** in any one technology — they are in the seams. Specifically: (1) Supabase Auth's default OAuth flow has changed to PKCE which subtly affects the SPA redirect dance, (2) `vite-plugin-pwa` with `injectManifest` requires a hand-written SW that must register correctly on first deploy or push will silently fail in Phase 6, (3) Supabase Database Webhooks calling Edge Functions must be configured with `verify_jwt = false` and a shared secret, and (4) TanStack Query's `networkMode: 'offlineFirst'` for mutations *pauses* on offline but does NOT persist across reload without `persistQueryClient` — which is explicitly deferred per D-02. The plan must surface these as hard contracts, not afterthoughts.

**Primary recommendation:** Build the Walking Skeleton as **one vertical slice** delivered across ~6 waves: (Wave 0) scaffold + tooling + Supabase project, (Wave 1) DB schema + RLS + helper functions, (Wave 2) Supabase client + Auth + allowlist gate, (Wave 3) Router + RequireAuth/RequireFamily + placeholder routes + error boundaries, (Wave 4) TanStack Query + useCurrentFamily + useRealtimeBridge + offline banner, (Wave 5) Stripe customer Edge Function + family creation wizard wired end-to-end, (Wave 6) vite-plugin-pwa registration + Vercel preview deploy. Each wave must end on `pnpm dev` green; the phase gate is a Vercel preview where a real allowlisted user can sign in, create a family, see the shell, refresh while offline, and have the change sync.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Offline Queue (ARCH-09)**
- **D-01:** Use TanStack Query's built-in offline mechanism — `networkMode: 'offlineFirst'` on all mutations. No IndexedDB or custom queue needed.
- **D-02:** Queue is in-memory only. Paused mutations are lost on page close while offline. IndexedDB persistence is deferred to Phase 6 (when the service worker is built out).
- **D-03:** Show a visible offline banner ("Offline — changes will sync when reconnected") while any mutations are in the paused queue.

**Stripe Billing Infrastructure (ARCH-10)**
- **D-04:** Phase 1 scope is infrastructure only — no `useTier()` hook, no feature gating, no billing portal UI (those land in Phase 2 and Phase 7 respectively).
- **D-05:** Stripe customer is created via a Supabase Edge Function triggered on `families` INSERT (DB trigger → webhook → Edge Function). Not client-side.
- **D-06:** Trial period tracked via a `trial_ends_at` timestamp column on `family_settings`, set at family creation. Stripe subscription object may or may not exist at trial start — `trial_ends_at` is the authoritative client-side signal.
- **D-07:** A Stripe webhook handler endpoint must exist in Phase 1, but only needs to handle the `customer.subscription.updated` / `deleted` events needed to update `trial_ends_at` or future subscription state.

**Email Allowlist Gate**
- **D-08:** Access control via an `allowed_emails` table in Supabase. No hardcoded list, no env var — DB-driven so a parent can manage it from Settings (Phase 7) without a redeploy.
- **D-09:** On sign-in, after Google OAuth callback, the app checks `allowed_emails` for the authenticated user's email (case-insensitive). If not found: immediately sign out, show "Access Denied" screen with the email used and a sign-out button.
- **D-10:** RLS on `allowed_emails`: only parents (auth_is_parent() = true) can INSERT/DELETE rows. Bootstrapped at migration time with the family's known emails.

**family_id Resolution**
- **D-11:** After auth, a `useCurrentFamily()` TanStack Query hook fetches the `families` row linked to `auth.uid()` via `members.auth_user_id`. This hook is the single source of `family_id` for all downstream data hooks.
- **D-12:** When `useCurrentFamily()` returns null (no family linked to this user), a `RequireFamily` boundary redirects to `/onboarding/create-family`. This is the ONBD-01 family creation wizard.

**Walking Skeleton Shell (ARCH-02, ARCH-08)**
- **D-13:** The Phase 1 shell includes: bottom nav with links to all main routes (Dashboard, Chores, Calendar, Meals, Groceries, Notes), each route shows an empty/placeholder page, theme toggle is functional.
- **D-14:** Member avatar chips in the nav are NOT part of Phase 1 (members are Phase 2). Nav shows family name only.
- **D-15:** Default theme on first load uses `prefers-color-scheme`: Light OS → Lavender, Dark OS → Midnight. User preference is persisted to `family_settings.theme` (family-wide, all devices see the same theme).
- **D-16:** Error boundaries wrap every route via React Router v7's `errorElement`. A fallback UI catches render failures without crashing the whole app.

### Claude's Discretion
- **Offline queue persistence depth:** Whether to layer localStorage serialization of the paused mutation queue on top of the in-memory TanStack Query queue is left to researcher/planner judgement. In-memory is the baseline; serialization may add more complexity than value for Phase 1.
  - **Researcher recommendation:** Do NOT add `persistQueryClient` in Phase 1. Reasons: (a) D-02 explicitly defers IndexedDB to Phase 6, (b) `persistQueryClient` requires a sync storage adapter and surfaces hydration races that would consume planning budget, (c) the UX value for a family of ~6 mostly-online users is marginal, (d) Phase 6 builds the SW and is the natural integration point. Show the offline banner; accept that page-close discards the in-flight queue.
- **Stripe webhook event list:** The specific Stripe event types to handle in Phase 1 beyond the trial-related ones are left to researcher to determine based on Stripe docs.
  - **Researcher recommendation:** Phase 1 webhook MUST handle `customer.subscription.updated` and `customer.subscription.deleted` (D-07 makes this explicit). Add `customer.subscription.trial_will_end` (Stripe fires this 3 days before trial expiry — useful for Phase 2 reminders but the handler should be a no-op stub in Phase 1, logged only). Reject all other event types with a 200 ack so Stripe doesn't retry. Do NOT handle `invoice.*` or `payment_intent.*` in Phase 1 — those require a payment method which we haven't collected.
- **TypeScript strictness:** Use `strict: true` in tsconfig unless the researcher finds a compelling reason to relax specific checks.
  - **Researcher recommendation:** `strict: true` + `noUncheckedIndexedAccess: true` + `exactOptionalPropertyTypes: true`. Supabase generated types and TanStack Query both benefit. The only relaxation is `verbatimModuleSyntax: false` (default) to avoid `import type` churn on every Supabase type re-export.

### Deferred Ideas (OUT OF SCOPE)
- **`useTier()` hook and feature gating** — assigned to Phase 2 when the first premium-gated feature (invitations, trial enforcement) is needed.
- **Stripe billing portal UI (SETT-05)** — Phase 7 with the rest of Settings.
- **Offline queue persistence across page close** — deferred to Phase 6 when the service worker is built; Background Sync API is the right primitive.
- **Member avatar chips in nav** — Phase 2 (members don't exist yet in Phase 1).
- **Per-member theme preference** — considered but rejected; family-level theme in `family_settings` is the right model.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ARCH-01 | Multi-tenant by `family_id` with RLS on every table | §Supabase Schema & RLS — all tables include `family_id UUID NOT NULL REFERENCES families(id)`, RLS enabled with `family_id IN (SELECT family_id FROM members WHERE auth_user_id = (select auth.uid()))` policies |
| ARCH-02 | React 19 + Vite + TS + React Router v7 Data mode | §Project Scaffold; §React Router v7 — `createBrowserRouter` + `RouterProvider`, no SSR |
| ARCH-03 | TanStack Query v5 — all server state | §TanStack Query Setup — single `QueryClient` at root, no React Context for server state |
| ARCH-04 | vite-plugin-pwa with `injectManifest` | §PWA Setup — strategy locked to `injectManifest`; `src/sw.ts` custom worker (Phase 6 adds push handlers) |
| ARCH-05 | New Supabase schema — UUIDs, `family_id` partition, audit columns, RLS day-one | §Supabase Schema & RLS — full DDL; `updated_at` trigger + `updated_by = auth.uid()` default |
| ARCH-06 | `chore_completions` event log table separate from `chores` template table | §Supabase Schema & RLS — both tables defined in migration; FK from `chore_completions.chore_id → chores.id` |
| ARCH-07 | `useRealtimeBridge()` at app root → `invalidateQueries` | §Realtime Bridge Hook — single channel subscribing to all family-scoped tables, translates each event into targeted invalidation |
| ARCH-08 | Error boundaries on every route | §React Router v7 — every route declares `errorElement: <RouteErrorFallback />` |
| ARCH-09 | Offline queue & sync | §Offline Mutations — `networkMode: 'offlineFirst'` + mutation cache subscription drives `OfflineBanner` |
| ARCH-10 | Stripe billing integration (infra in Phase 1) | §Stripe Edge Function — DB webhook on families INSERT → Edge Function creates Customer; webhook endpoint for subscription events |
| ARCH-11 | Linked families schema (full feature lands Phase 4) | §Supabase Schema & RLS — `family_links` table defined in initial schema; no UI in Phase 1 |
| ARCH-13 | Luxon for all date/time math | §Date/Time — Luxon installed, `family_settings.timezone` column included; first usage is `trial_ends_at` calculation |
| ONBD-01 | Parent creates family space (name + emoji) | §Family Creation Wizard — single-screen form, optimistic INSERT, triggers Stripe customer creation via DB webhook |

</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Google OAuth login | Browser / Client | Supabase Auth (managed) | Supabase Auth handles the OAuth dance; client only initiates and consumes the session |
| Allowlist enforcement | API / Backend (RLS on `allowed_emails`) | Browser (post-OAuth check) | The DB row + RLS is the authoritative gate; client just queries it and signs out on miss |
| Multi-tenant isolation | API / Backend (Postgres RLS) | — | RLS policies are non-bypassable; client cannot weaken them |
| Schema migrations | Database / Storage (Supabase CLI) | — | Migrations live in `supabase/migrations/`; `supabase db push` applies them |
| Auth session storage | Browser (localStorage via supabase-js) | — | `persistSession: true` default; auto-refresh on token expiry |
| Family resolution | API / Backend (SELECT through RLS) | Browser (TanStack Query cache) | Server does the join; client caches the answer |
| Realtime invalidation | Browser (single channel at app root) | API (Postgres logical replication) | Replication → WebSocket → `invalidateQueries`; client owns the cache reconciliation |
| Offline mutation queue | Browser (TanStack Query MutationCache in-memory) | — | D-01/D-02 explicitly client-only, in-memory, lost on close |
| Stripe customer creation | API / Backend (Supabase Edge Function on DB webhook) | — | D-05 explicit: never client-side; trigger via DB INSERT webhook |
| Stripe webhook handling | API / Backend (Edge Function endpoint) | — | Stripe signs requests; verification must happen server-side with the secret |
| PWA service worker | Browser | Build pipeline (`vite-plugin-pwa`) | SW runs in browser; Vite builds and emits the manifest |
| Theme persistence | Database / Storage (`family_settings.theme`) | Browser (initial render from `prefers-color-scheme`) | D-15: server is source of truth; client falls back to OS preference on first load |
| Error boundaries | Browser (React Router `errorElement`) | — | Render-time failures must be caught client-side |
| Static asset hosting | CDN / Static (Vercel) | — | Vercel serves the built SPA |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | 19.2.6 | UI runtime | Pinned in CLAUDE.md; required by current TanStack Query v5 + React Router v7 [VERIFIED: npm registry, published recent — `npm view react version` → 19.2.6] |
| react-dom | 19.2.6 | Render | Pairs with react; same major [VERIFIED: npm registry] |
| typescript | 5.7.x (current 6.0.3) | Type safety | CLAUDE.md pins ^5.7; TS 6 is now available — see §State of the Art [VERIFIED: npm registry — `npm view typescript version` → 6.0.3; CLAUDE.md pin = ^5.7.0 (acceptable lower-bound)] |
| vite | 8.0.13 | Build + dev | Vite-native ecosystem (vitest, vite-plugin-pwa); zero SSR overhead [VERIFIED: npm registry] |
| @vitejs/plugin-react | 6.0.2 | React HMR | Required by Vite + React SPAs [VERIFIED: npm registry] |
| react-router | 7.15.1 | Routing (Data mode) | `createBrowserRouter` + `RouterProvider`; package consolidation in v7 means `react-router-dom` is no longer needed [VERIFIED: npm registry; CITED: reactrouter.com/start/data/installation] |
| @tanstack/react-query | 5.100.11 | Server state | Single source of truth replacing v1's AppContext; supports `networkMode: 'offlineFirst'` for mutations [VERIFIED: npm registry; CITED: tanstack.com/query/v5/docs/framework/react/guides/mutations] |
| @tanstack/react-query-devtools | 5.100.11 | Dev-only cache inspector | Tree-shaken from prod; essential during Phase 1–N debugging [VERIFIED: npm registry] |
| @supabase/supabase-js | 2.106.0 | DB + Auth + Realtime client | CLAUDE.md pinned [VERIFIED: npm registry — confirmed 2.106.0] |
| vite-plugin-pwa | 1.3.0 | PWA manifest + SW build | Must use `strategies: 'injectManifest'` for Phase 6 push handlers [VERIFIED: npm registry; CITED: vite-pwa-org.netlify.app/guide/inject-manifest] |
| workbox-precaching | 7.4.1 | Pre-cache app shell inside custom SW | Imported into `src/sw.ts` [VERIFIED: npm registry] |
| workbox-routing | 7.4.1 | Optional runtime caching | Not strictly required in Phase 1; install now so Phase 6 doesn't need a fresh decision [VERIFIED: npm registry] |
| luxon | 3.7.2 | Date/time math | ARCH-13 lock; first use in Phase 1 is `trial_ends_at` calculation [VERIFIED: npm registry] |
| stripe | 22.1.1 (server only, Edge Function) | Stripe API client | Used inside Edge Function via Deno npm: specifier; do NOT install in app deps [VERIFIED: npm registry] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/react | 19.2.15 | React types | Always for TS [VERIFIED: npm registry] |
| @types/react-dom | 19.2.3 | React DOM types | Always for TS [VERIFIED: npm registry] |
| @types/luxon | latest | Luxon types | Co-installed with luxon [ASSUMED — install when adding luxon] |
| vitest | 4.1.6 | Unit tests | Phase 1 starts test infra (Wave 0) [VERIFIED: npm registry] |
| @testing-library/react | 16.3.2 | Component tests | Pairs with vitest [VERIFIED: npm registry] |
| @testing-library/jest-dom | latest | DOM matchers | Imported once in `vitest.setup.ts` [ASSUMED — verify at install] |
| jsdom | latest | Vitest DOM env | `test.environment = 'jsdom'` [ASSUMED — verify at install] |
| playwright | 1.60.0 | E2E for the walking-skeleton smoke test | One spec in Phase 1: sign-in → create-family → see shell [VERIFIED: npm registry] |
| msw | 2.14.6 | Network mocking | For unit tests of hooks; Phase 1 may not need it yet [VERIFIED: npm registry] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| In-memory mutation queue + `persistQueryClient` | localStorage-persisted query client | Adds hydration race + bundle size; D-02 already defers persistence to Phase 6 with the SW |
| Stripe `customer.create` via Edge Function | Stripe Checkout session at family creation | Forces a payment method upfront; D-04 says no billing UI until Phase 2 |
| Database webhook → Edge Function | Postgres trigger calling `pg_net` extension directly | Pg_net works but error handling and retries are coarser than database webhook config in the Supabase dashboard |
| `react-router-dom` separate package | `react-router` only (v7 consolidates) | v7 made `react-router` the single import; `react-router-dom` is a back-compat shim [CITED: reactrouter.com/upgrading/v6] |
| `prefers-color-scheme` only | localStorage cache of last theme | D-15 makes `family_settings.theme` server-side authoritative — but read once from localStorage on first load is acceptable to avoid theme flash |

**Installation:**
```bash
# Core runtime + framework
npm install react@^19.2 react-dom@^19.2 react-router@^7.15 \
  @tanstack/react-query@^5.100 @tanstack/react-query-devtools@^5.100 \
  @supabase/supabase-js@^2.106 luxon@^3.7

# PWA + Service Worker
npm install vite-plugin-pwa@^1.3 workbox-precaching@^7.4 workbox-routing@^7.4

# Dev dependencies
npm install -D typescript@^5.7 vite@^8.0 @vitejs/plugin-react@^6.0 \
  @types/react@^19.2 @types/react-dom@^19.2 @types/luxon@^3 \
  vitest@^4 @testing-library/react@^16 @testing-library/jest-dom@^6 jsdom@^25 \
  playwright@^1.60 @playwright/test@^1.60 msw@^2.14
```

**Version verification (executed 2026-05-19):** All Core packages above were checked against the npm registry via `npm view <pkg> version`. Versions captured in the table reflect the most recent published version at the time of research. CLAUDE.md uses caret-range pins (`^5.7.0`, `^19.2.0`, etc.) which will resolve to the latest compatible release at install time.

## Package Legitimacy Audit

> **slopcheck unavailable** in this environment (no `pip` on PATH). Per protocol, all packages are subject to verification before install. Each row below cites the authoritative source from which the package was first identified.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| react | npm | 12 yrs | 30M+/wk | github.com/facebook/react | n/a | Approved — verified via npm view + official react.dev docs |
| react-dom | npm | 12 yrs | 30M+/wk | github.com/facebook/react | n/a | Approved — same monorepo as react |
| react-router | npm | 11 yrs | 14M+/wk | github.com/remix-run/react-router | n/a | Approved — reactrouter.com is the official source |
| @tanstack/react-query | npm | 5+ yrs | 13M+/wk | github.com/TanStack/query | n/a | Approved — tanstack.com is official |
| @tanstack/react-query-devtools | npm | 5+ yrs | 5M+/wk | github.com/TanStack/query | n/a | Approved — same monorepo |
| @supabase/supabase-js | npm | 5+ yrs | 5M+/wk | github.com/supabase/supabase-js | n/a | Approved — supabase.com is official |
| vite | npm | 5+ yrs | 30M+/wk | github.com/vitejs/vite | n/a | Approved — vitejs.dev is official |
| @vitejs/plugin-react | npm | 4+ yrs | 10M+/wk | github.com/vitejs/vite-plugin-react | n/a | Approved — same org |
| vite-plugin-pwa | npm | 4+ yrs | 1M+/wk | github.com/vite-pwa/vite-plugin-pwa | n/a | Approved — official PWA plugin under vite-pwa org |
| workbox-precaching | npm | 8+ yrs | 4M+/wk | github.com/GoogleChrome/workbox | n/a | Approved — Google official |
| workbox-routing | npm | 8+ yrs | 4M+/wk | github.com/GoogleChrome/workbox | n/a | Approved — Google official |
| typescript | npm | 12+ yrs | 70M+/wk | github.com/microsoft/TypeScript | n/a | Approved — Microsoft official |
| luxon | npm | 7+ yrs | 10M+/wk | github.com/moment/luxon | n/a | Approved — moment team's successor library |
| stripe (server-side) | npm | 12+ yrs | 4M+/wk | github.com/stripe/stripe-node | n/a | Approved — Stripe official; used inside Edge Function only |
| vitest | npm | 3+ yrs | 8M+/wk | github.com/vitest-dev/vitest | n/a | Approved |
| @testing-library/react | npm | 7+ yrs | 13M+/wk | github.com/testing-library/react-testing-library | n/a | Approved |
| playwright / @playwright/test | npm | 5+ yrs | 8M+/wk | github.com/microsoft/playwright | n/a | Approved — Microsoft official |
| msw | npm | 5+ yrs | 8M+/wk | github.com/mswjs/msw | n/a | Approved |

**Packages removed due to slopcheck [SLOP] verdict:** none (slopcheck not available; all packages independently verified via official sources)
**Packages flagged as suspicious [SUS]:** none

*slopcheck was unavailable; however, every package above was identified from CLAUDE.md (a researcher-curated stack document) and cross-checked against its official repository AND `npm view` registry confirmation. Planner: a single `checkpoint:human-verify` task before the install wave is sufficient — there is no need to gate each package individually.*

## Architecture Patterns

### System Architecture Diagram

```
                                 ┌────────────────────────────────┐
                                 │           Browser              │
                                 │  ┌──────────────────────────┐  │
                                 │  │ React 19 SPA (Vite SPA)  │  │
                                 │  │  - RouterProvider        │  │
                                 │  │  - QueryClientProvider   │  │
                                 │  │  - useRealtimeBridge     │  │
                                 │  │  - OfflineBanner         │  │
                                 │  │  - ErrorBoundary/route   │  │
                                 │  │  - Service Worker (PWA)  │  │
                                 │  └──────────────────────────┘  │
                                 └────┬───────────────────────────┘
                                      │ HTTPS
                                      ▼
            ┌─────────────────────────────────────────────────────┐
            │              Vercel (static hosting)                │
            │   - Serves built SPA (Vite output)                  │
            │   - No API routes (we run none in Phase 1)          │
            └─────────────────────────────────────────────────────┘
                                      │
                          (browser → supabase.co)
                                      ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │                          Supabase                                │
   │                                                                  │
   │   ┌──────────────┐    ┌─────────────────┐    ┌──────────────┐   │
   │   │   Auth       │    │   Postgres 15   │    │   Realtime    │   │
   │   │  Google      │    │  - Tables + RLS │    │  (logical     │   │
   │   │  OAuth (PKCE)│    │  - Triggers     │    │   replication │   │
   │   └──────┬───────┘    │  - Functions    │    │   → WebSocket)│   │
   │          │            └──────┬──────────┘    └──────┬────────┘   │
   │          │                   │                      │            │
   │          │              INSERT families             │            │
   │          │                   │                      │            │
   │          │                   ▼                      ▼            │
   │          │            ┌────────────────────────────────┐         │
   │          │            │  DB Webhook (configured        │         │
   │          │            │  in Supabase Dashboard)        │         │
   │          │            └──────────────┬─────────────────┘         │
   │          │                           │ POST /functions/v1/       │
   │          │                           ▼  stripe-create-customer   │
   │          │            ┌────────────────────────────────┐         │
   │          │            │   Edge Function (Deno)         │         │
   │          │            │   - stripe-create-customer     │ ─────►  │ → Stripe API
   │          │            │     (verify_jwt = false +      │         │   POST /v1/customers
   │          │            │      shared-secret header)     │         │
   │          │            │   - stripe-webhook             │ ◄─────  │ ← Stripe webhook
   │          │            │     (Stripe signature verify)  │         │   customer.subscription.*
   │          │            └────────────────────────────────┘         │
   └─────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure
```
family-hub-2/
├── src/
│   ├── main.tsx                  # Mount RouterProvider + QueryClientProvider
│   ├── sw.ts                     # Custom Service Worker (Workbox precache only in Phase 1)
│   ├── vite-env.d.ts             # Vite env types
│   ├── routes/
│   │   ├── router.ts             # createBrowserRouter config
│   │   ├── RootLayout.tsx        # Top nav + bottom nav + <Outlet/>
│   │   ├── RouteErrorFallback.tsx
│   │   ├── login.tsx
│   │   ├── access-denied.tsx
│   │   ├── onboarding/
│   │   │   └── create-family.tsx
│   │   └── (app)/
│   │       ├── dashboard.tsx
│   │       ├── chores.tsx
│   │       ├── calendar.tsx
│   │       ├── meals.tsx
│   │       ├── groceries.tsx
│   │       └── notes.tsx
│   ├── auth/
│   │   ├── RequireAuth.tsx       # Loader-based guard
│   │   ├── RequireFamily.tsx     # Wraps app-area routes
│   │   └── allowlist.ts          # Post-OAuth allowlist check + sign-out
│   ├── data/
│   │   ├── supabase.ts           # createClient + types
│   │   ├── queryClient.ts        # QueryClient w/ networkMode defaults
│   │   ├── useCurrentFamily.ts   # The single family-id source
│   │   ├── useRealtimeBridge.ts  # Single channel at app root
│   │   └── types.ts              # Re-exports of Supabase generated types
│   ├── components/
│   │   ├── BottomNav.tsx
│   │   ├── TopNav.tsx
│   │   ├── OfflineBanner.tsx
│   │   ├── ReconnectedToast.tsx
│   │   └── ThemeToggle.tsx
│   ├── theme/
│   │   ├── ThemeProvider.tsx     # prefers-color-scheme + family_settings.theme reconciliation
│   │   └── theme.css             # Lavender + Midnight CSS variables (ported from v1)
│   ├── lib/
│   │   ├── env.ts                # Typed env var access
│   │   └── newId.ts              # crypto.randomUUID() wrapper
│   └── styles/
│       └── globals.css           # Reset + base typography
├── supabase/
│   ├── config.toml               # Local dev config + Edge Function verify_jwt overrides
│   ├── migrations/
│   │   └── 20260520_000_initial_schema.sql
│   └── functions/
│       ├── stripe-create-customer/
│       │   └── index.ts
│       └── stripe-webhook/
│           └── index.ts
├── tests/
│   ├── unit/
│   │   └── allowlist.test.ts
│   └── e2e/
│       └── walking-skeleton.spec.ts
├── public/
│   ├── icons/                    # PWA icons
│   └── manifest-icons/
├── .env.example                  # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (no secrets)
├── index.html
├── tsconfig.json                 # strict: true
├── vite.config.ts                # VitePWA with strategies: 'injectManifest'
├── vitest.config.ts
├── playwright.config.ts
└── package.json
```

### Pattern 1: Project Scaffold (Wave 0)

**What:** Create the Vite SPA with the exact toolchain.
**When to use:** Phase 1 Wave 0, exactly once.
**Example:**
```bash
# Create the project (do NOT use --template react-ts directly — it lags Vite major;
#   prefer the explicit recipe so we get vite@8)
mkdir family-hub-2 && cd family-hub-2
npm create vite@latest . -- --template react-ts
# Pin versions per CLAUDE.md
npm install react@^19.2 react-dom@^19.2
# Then install the rest of the stack (see Installation block above)
```

**Critical:** Do not `npm create vite@latest` in the project root if it's not empty. If you've already initialized git, run it in a sibling directory and copy files in.

### Pattern 2: createBrowserRouter with Data-Mode Guards

**What:** React Router v7 Data-mode router with loader-based auth guards.
**When to use:** All authenticated routes.
**Example:**
```typescript
// src/routes/router.ts
// Source: reactrouter.com/start/data/installation (verified)
import { createBrowserRouter, redirect } from 'react-router';
import RootLayout from './RootLayout';
import RouteErrorFallback from './RouteErrorFallback';
import { supabase } from '../data/supabase';
import { isAllowedEmail } from '../auth/allowlist';
import Login from './login';
import AccessDenied from './access-denied';
import CreateFamily from './onboarding/create-family';
import Dashboard from './(app)/dashboard';
// ... other route imports

async function requireAuthLoader() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw redirect('/login');
  const allowed = await isAllowedEmail(session.user.email!);
  if (!allowed) {
    await supabase.auth.signOut();
    throw redirect('/access-denied?email=' + encodeURIComponent(session.user.email!));
  }
  return { user: session.user };
}

async function requireFamilyLoader() {
  // Returns family or throws redirect('/onboarding/create-family')
  // Defer the actual query — let useCurrentFamily handle it inside RequireFamily component
  // (We use a component-level boundary, not a loader, so the wizard's mutation can
  //  invalidate ['current-family'] and the route re-evaluates without a navigate.)
  return null;
}

export const router = createBrowserRouter([
  { path: '/login', element: <Login />, errorElement: <RouteErrorFallback /> },
  { path: '/access-denied', element: <AccessDenied />, errorElement: <RouteErrorFallback /> },
  {
    path: '/',
    loader: requireAuthLoader,
    errorElement: <RouteErrorFallback />,
    children: [
      {
        path: 'onboarding/create-family',
        element: <CreateFamily />,
        errorElement: <RouteErrorFallback />,
      },
      {
        element: <RootLayout />,           // <-- wraps with RequireFamily + nav
        errorElement: <RouteErrorFallback />,
        children: [
          { path: '', loader: () => redirect('/dashboard') },
          { path: 'dashboard', element: <Dashboard />, errorElement: <RouteErrorFallback /> },
          { path: 'chores', element: <Chores />, errorElement: <RouteErrorFallback /> },
          { path: 'calendar', element: <Calendar />, errorElement: <RouteErrorFallback /> },
          { path: 'meals', element: <Meals />, errorElement: <RouteErrorFallback /> },
          { path: 'groceries', element: <Groceries />, errorElement: <RouteErrorFallback /> },
          { path: 'notes', element: <Notes />, errorElement: <RouteErrorFallback /> },
        ],
      },
    ],
  },
  { path: '*', element: <RouteErrorFallback /> },
]);
```

```tsx
// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { router } from './routes/router';
import { queryClient } from './data/queryClient';
import { ThemeProvider } from './theme/ThemeProvider';
import './styles/globals.css';
import './theme/theme.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
);
```

### Pattern 3: Supabase Client with OAuth-Aware Config

**What:** `createClient` configured for SPA + Google OAuth (PKCE).
**When to use:** Once, exported from `src/data/supabase.ts`.
**Example:**
```typescript
// src/data/supabase.ts
// Source: supabase.com/docs/reference/javascript/initializing (verified)
//         supabase.com/docs/guides/auth/social-login/auth-google (verified)
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types'; // generated via supabase gen types typescript

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,        // default; explicit for clarity
    autoRefreshToken: true,      // default
    detectSessionInUrl: true,    // REQUIRED for OAuth callback parsing in SPA
    flowType: 'pkce',            // PKCE is the 2026 default and required for SPAs
                                 //   without a server-side callback exchange
  },
});

// Sign-in helper
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/`,
      // Supabase parses the URL fragment on redirect; the router auth loader
      // then runs and gates access.
    },
  });
  if (error) throw error;
}
```

### Pattern 4: Allowlist Gate (D-08/D-09)

**What:** Post-OAuth membership check against `allowed_emails`.
**When to use:** Inside `requireAuthLoader` immediately after `getSession`.
**Example:**
```typescript
// src/auth/allowlist.ts
import { supabase } from '../data/supabase';

export async function isAllowedEmail(email: string): Promise<boolean> {
  const lowered = email.toLowerCase().trim();
  const { data, error } = await supabase
    .from('allowed_emails')
    .select('email')
    .eq('email', lowered)
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}
```

**Why this works under RLS:** The `allowed_emails` table needs a SELECT policy that lets *any authenticated user* read their own row only. Sketch:
```sql
create policy "Users can check their own allowlist row"
  on allowed_emails for select
  to authenticated
  using (lower(email) = lower((select auth.jwt() ->> 'email')));
```

### Pattern 5: TanStack Query Setup with Offline-First Mutations

**What:** Single `QueryClient` with offline-first defaults.
**When to use:** Once, exported from `src/data/queryClient.ts`.
**Example:**
```typescript
// src/data/queryClient.ts
// Source: tanstack.com/query/v5/docs/framework/react/guides/mutations
//         + tanstack.com/query/v5/docs/react/guides/network-mode (verified)
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,            // 30s — chosen because realtime invalidates anyway
      gcTime: 5 * 60_000,           // 5m
      retry: 1,
      refetchOnWindowFocus: false,  // realtime bridge handles staleness
      networkMode: 'online',        // queries: pause when offline, refetch on reconnect
    },
    mutations: {
      networkMode: 'offlineFirst',  // mutations: pause when offline, resume on reconnect
      retry: 0,                     // we prefer explicit user-visible failure
    },
  },
});
```

**Critical claim verified:** "When a mutation has been paused because the device is offline, the paused mutation can be dehydrated when the application quits, then hydrated again when the application is started, and resumed with queryClient.resumePausedMutations()." [CITED: tanstack.com search snippet — see Sources]. We deliberately skip `dehydrate`/`hydrate` in Phase 1 per D-02.

### Pattern 6: useCurrentFamily Hook (D-11)

**What:** Single source of `family_id` for the entire app.
**When to use:** Inside `RequireFamily` and downstream data hooks.
**Example:**
```typescript
// src/data/useCurrentFamily.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';

export function useCurrentFamily() {
  return useQuery({
    queryKey: ['current-family'],
    queryFn: async () => {
      // Join through members to find this user's family
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('members')
        .select('family_id, families(*)')
        .eq('auth_user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data?.families ?? null;
    },
    staleTime: Infinity,  // family rarely changes; realtime bridge invalidates on update
  });
}
```

### Pattern 7: useRealtimeBridge (ARCH-07)

**What:** Single channel at app root, postgres_changes → `invalidateQueries`.
**When to use:** Mount once inside the authenticated layout (RootLayout).
**Example:**
```typescript
// src/data/useRealtimeBridge.ts
// Source: supabase.com/docs/guides/realtime/postgres-changes (verified)
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { useCurrentFamily } from './useCurrentFamily';

const FAMILY_SCOPED_TABLES = [
  'families', 'members', 'family_settings',
  'chores', 'chore_completions', 'events',
  'meals', 'groceries', 'notes',
  'push_subscriptions', 'notifications_queue',
] as const;

export function useRealtimeBridge() {
  const qc = useQueryClient();
  const { data: family } = useCurrentFamily();
  const familyId = family?.id;

  useEffect(() => {
    if (!familyId) return;

    let channel = supabase.channel(`family:${familyId}`);
    for (const table of FAMILY_SCOPED_TABLES) {
      const filter = table === 'families' ? `id=eq.${familyId}` : `family_id=eq.${familyId}`;
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter },
        (payload) => {
          // Translate into targeted invalidation; never push payload into cache directly.
          qc.invalidateQueries({ queryKey: [table, familyId] });
        },
      );
    }
    channel.subscribe();

    return () => { supabase.removeChannel(channel); };  // canonical cleanup
  }, [familyId, qc]);
}
```

**Critical:** Use `supabase.removeChannel(channel)`, NOT `channel.unsubscribe()` — the former also removes the client's internal reference. [CITED: CLAUDE.md §Supabase Realtime Patterns; supabase.com/docs/reference/javascript/removechannel]

### Pattern 8: Offline Banner via MutationCache Subscription

**What:** A banner that appears whenever any mutation is paused (offline) OR `navigator.onLine === false`.
**When to use:** Mounted in RootLayout, above main content.
**Example:**
```typescript
// src/components/OfflineBanner.tsx
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function OfflineBanner() {
  const qc = useQueryClient();
  const [online, setOnline] = useState(navigator.onLine);
  const [hasPausedMutations, setHasPausedMutations] = useState(false);

  useEffect(() => {
    const update = () => {
      const paused = qc.getMutationCache().getAll().some((m) => m.state.isPaused);
      setHasPausedMutations(paused);
    };
    update();
    const unsubscribe = qc.getMutationCache().subscribe(update);
    return unsubscribe;
  }, [qc]);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  if (online && !hasPausedMutations) return null;
  return (
    <div role="status" className="offline-banner">
      <strong>Offline</strong> — changes will sync when reconnected
    </div>
  );
}
```

**Note on detection pattern:** `queryClient.getMutationCache().getAll().filter((m) => m.state.isPaused)` is the documented approach [CITED: TanStack Query Discussion #6756]. We subscribe to the mutation cache for live updates.

### Pattern 9: vite-plugin-pwa with injectManifest

**What:** PWA setup using `injectManifest` so Phase 6 can add push event handlers.
**When to use:** Once in `vite.config.ts`.
**Example:**
```typescript
// vite.config.ts
// Source: vite-pwa-org.netlify.app/guide/inject-manifest (verified)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Family Plan',
        short_name: 'Family',
        description: 'Family Hub 2.0',
        theme_color: '#c9a8e0',
        background_color: '#fdf6ff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icons/192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      devOptions: {
        enabled: false,   // Don't enable in dev — clutters dev-tools and slows HMR
      },
    }),
  ],
});
```

```typescript
// src/sw.ts
// Source: vite-pwa-org.netlify.app/guide/inject-manifest (verified)
/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Phase 6 will add: self.addEventListener('push', ...) and 'notificationclick'.
// Leave the file minimal in Phase 1 to avoid SW bugs that block deploys.
```

### Pattern 10: Stripe Customer Creation via DB Webhook → Edge Function

**What:** When a new family is inserted, Supabase fires a database webhook that calls an Edge Function which creates the Stripe Customer and writes the `customer_id` back.
**When to use:** Once at family creation; D-05 explicit.

**Step 1 — Family creation client-side:**
```typescript
// src/routes/onboarding/create-family.tsx
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { DateTime } from 'luxon';
import { supabase } from '../../data/supabase';
import { newId } from '../../lib/newId';  // crypto.randomUUID() wrapper

export default function CreateFamily() {
  const navigate = useNavigate();
  const createFamily = useMutation({
    mutationFn: async (input: { name: string; emoji: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('not authenticated');

      const familyId = newId();
      const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const trialEndsAt = DateTime.now().setZone(browserTz).plus({ days: 7 }).toISO();

      // 1. INSERT family
      const { error: e1 } = await supabase.from('families').insert({
        id: familyId,
        name: input.name,
        emoji: input.emoji,
        created_by: user.id,
      });
      if (e1) throw e1;

      // 2. INSERT family_settings (timezone + trial)
      const { error: e2 } = await supabase.from('family_settings').insert({
        family_id: familyId,
        timezone: browserTz,
        theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'midnight' : 'lavender',
        trial_ends_at: trialEndsAt,
      });
      if (e2) throw e2;

      // 3. INSERT first member (this parent)
      const { error: e3 } = await supabase.from('members').insert({
        family_id: familyId,
        auth_user_id: user.id,
        email: user.email!,
        name: user.user_metadata?.full_name ?? user.email,
        role: 'parent',
      });
      if (e3) throw e3;

      // 4. The DB webhook fires automatically (no client action).
      //    The Edge Function creates the Stripe customer and writes families.stripe_customer_id.
      return familyId;
    },
    onSuccess: () => {
      navigate('/dashboard');
    },
  });
  // ... form rendering with optimistic update
}
```

**Step 2 — Database webhook:**
Configure in Supabase Dashboard → Database → Webhooks:
- Name: `stripe-create-customer-on-family-insert`
- Table: `families`
- Events: `INSERT`
- Type: HTTP Request
- URL: `{SUPABASE_URL}/functions/v1/stripe-create-customer`
- HTTP Headers: `Authorization: Bearer {WEBHOOK_SHARED_SECRET}` (custom shared secret stored in Vault)
- Method: POST

**Step 3 — Edge Function (`supabase/functions/stripe-create-customer/index.ts`):**
```typescript
// supabase/config.toml entry:
// [functions.stripe-create-customer]
// verify_jwt = false        // because Supabase webhooks don't send a Supabase JWT
//
// Source: supabase.com/docs/guides/functions/auth + community-verified pattern
import { createClient } from 'jsr:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@^17';   // server-side Stripe SDK

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_FAMILY_SHARED_SECRET')!;

Deno.serve(async (req) => {
  // 1. Verify our shared secret (webhook sent with custom Authorization header)
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${WEBHOOK_SECRET}`) {
    return new Response('unauthorized', { status: 401 });
  }

  const payload = await req.json();
  if (payload.type !== 'INSERT' || payload.table !== 'families') {
    return new Response('ignored', { status: 200 });
  }
  const family = payload.record;

  // 2. Create the Customer
  const customer = await stripe.customers.create({
    name: family.name,
    metadata: { family_id: family.id },
  }, {
    idempotencyKey: `family-${family.id}-create-customer`,
  });

  // 3. Write back via service role client
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const { error } = await admin
    .from('families')
    .update({ stripe_customer_id: customer.id })
    .eq('id', family.id);
  if (error) return new Response(error.message, { status: 500 });

  return new Response(JSON.stringify({ ok: true, customer_id: customer.id }), {
    headers: { 'content-type': 'application/json' },
  });
});
```

### Pattern 11: Stripe Webhook Endpoint (D-07)

**What:** Edge Function endpoint that Stripe calls when subscription events fire.
**When to use:** Configured in Stripe Dashboard pointing at our Edge Function URL.
**Example:**
```typescript
// supabase/functions/stripe-webhook/index.ts
// supabase/config.toml: [functions.stripe-webhook] verify_jwt = false
import Stripe from 'npm:stripe@^17';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
const SIGNING_SECRET = Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET')!;

Deno.serve(async (req) => {
  const sig = req.headers.get('stripe-signature');
  if (!sig) return new Response('missing signature', { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, SIGNING_SECRET);
  } catch (e) {
    return new Response(`signature verification failed: ${e}`, { status: 400 });
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  switch (event.type) {
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      // Update family_settings.trial_ends_at + future subscription_status columns
      // (Phase 2 expands this; Phase 1 just persists.)
      await admin
        .from('family_settings')
        .update({ stripe_subscription_status: sub.status })
        .eq('stripe_customer_id', sub.customer);
      break;
    }
    case 'customer.subscription.trial_will_end':
      // Phase 1: log only; Phase 2 will send a notification
      console.log('trial_will_end for', event.data.object);
      break;
    default:
      // Accept and ignore everything else
      break;
  }

  return new Response('ok', { status: 200 });
});
```

### Pattern 12: Theme System (D-15)

**What:** `prefers-color-scheme` default + family-wide persisted preference.
**When to use:** Mount ThemeProvider once inside QueryClientProvider.
**Example:**
```tsx
// src/theme/ThemeProvider.tsx
import { useEffect } from 'react';
import { useCurrentFamily } from '../data/useCurrentFamily';

type Theme = 'lavender' | 'midnight';

function osDefault(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'midnight' : 'lavender';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: family } = useCurrentFamily();

  useEffect(() => {
    const theme: Theme = (family as any)?.family_settings?.theme ?? osDefault();
    if (theme === 'midnight') {
      document.documentElement.setAttribute('data-theme', 'midnight');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [family]);

  return <>{children}</>;
}
```

The CSS variable system is ported verbatim from `../family-app/src/index.css` (the Lavender `:root` block and the `[data-theme="midnight"]` block only). The Electric theme block is dropped — it's explicitly out of scope.

### Anti-Patterns to Avoid

- **Don't use `react-router-dom`.** v7 made `react-router` the canonical import; `react-router-dom` is a back-compat shim that pulls extra surface area.
- **Don't share a single QueryClient across tests.** Provide a fresh one per test (`new QueryClient({ defaultOptions: { queries: { retry: false } } })`) or query state leaks between tests.
- **Don't subscribe to postgres_changes per-component.** ARCH-07 mandates one channel at app root. Per-component subscriptions multiply handler invocations and burn WebSocket quota.
- **Don't push realtime payloads directly into the cache.** Always `invalidateQueries` and let TanStack Query refetch. Direct cache writes from realtime race with optimistic updates and produce inconsistent UI.
- **Don't use `gen_random_uuid()` server-side for client-inserted rows.** Always `crypto.randomUUID()` on the client — required for optimistic updates without temp-id reconciliation (CLAUDE.md §UUID Generation).
- **Don't put the Stripe secret key in Vite env.** It MUST be in Supabase Edge Function secrets. Anything prefixed `VITE_*` is bundled into the client.
- **Don't enable `devOptions.enabled = true` in vite-plugin-pwa during Phase 1.** The dev SW interferes with HMR and creates ghost stale caches. Test the SW in `npm run preview` instead.
- **Don't use `channel.unsubscribe()` for cleanup.** Use `supabase.removeChannel(channel)` — the former leaves a dangling reference in the client's tracking map.
- **Don't gate routes with React state.** Use React Router loaders (`requireAuthLoader`). A `useEffect` gate causes a flash of protected content and breaks deep-linking.
- **Don't hand-roll an offline queue.** D-01: TanStack Query's pause-on-offline is the queue. Adding a parallel queue is a v1 anti-pattern in disguise.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Persistent auth session across reloads | localStorage reads/writes manually | `supabase-js` `persistSession: true` (default) | Already handles token refresh, race conditions, and storage events |
| OAuth callback parsing | Manual URL fragment parsing | `detectSessionInUrl: true` | supabase-js handles the OAuth fragment + history.replaceState cleanup |
| Offline mutation queueing | A custom queue in IndexedDB | TanStack Query `networkMode: 'offlineFirst'` | Built-in pause/resume keyed to onlineManager; D-01 locks this in |
| Realtime cache invalidation | Polling, ETag checks, or manual refresh | `postgres_changes` → `invalidateQueries` | Server pushes only relevant deltas; TanStack handles refetch |
| Service worker registration | Hand-coded `navigator.serviceWorker.register` | vite-plugin-pwa with `injectRegister: 'auto'` | Plugin emits the registration script with proper scope + update detection |
| PWA precache manifest | Hand-listing files to cache | `precacheAndRoute(self.__WB_MANIFEST)` | Workbox injects the build-output manifest at compile time |
| Stripe Customer creation | Calling Stripe API from the client | DB webhook → Edge Function | Secret key is server-side; idempotency is centralized |
| Webhook signature verification | DIY HMAC + timing-safe compare | `stripe.webhooks.constructEventAsync()` | Stripe SDK handles signature, replay-tolerance window, and parse |
| UUID generation | `Math.random()` IDs or `Date.now()`-based | `crypto.randomUUID()` | 122-bit entropy, secure, universally available; v1 anti-pattern is "c" + Date.now() |
| DST-safe date math | Native `Date` + manual TZ math | Luxon | ARCH-13 lock; the only library that DOES DST correctly with `family_settings.timezone` as the source of truth |
| Allowlist enforcement | Hardcoded array in client code | `allowed_emails` table + RLS SELECT-own policy | D-08 lock; lets parents manage allowlist post-deploy without a release |
| Error boundary per route | Class-component boundaries + manual route detection | React Router v7 `errorElement` per route | Built-in; integrates with route loader errors and render errors |

**Key insight:** Every "Don't Hand-Roll" item above maps to a v1 mistake or a phase-1-shaped trap. The whole point of the rewrite is to delete custom plumbing in favor of stack-blessed primitives.

## Common Pitfalls

### Pitfall 1: OAuth Redirect Loop
**What goes wrong:** After Google OAuth, the user lands on `/` but the session isn't visible to `getSession()` yet → the `requireAuthLoader` redirects to `/login` → the user signs in again, infinite loop.
**Why it happens:** Two causes — (a) `detectSessionInUrl` is false, so the URL fragment is never consumed; (b) the loader runs before the supabase client finishes parsing the fragment.
**How to avoid:**
- Always set `detectSessionInUrl: true` (it's the default but make it explicit).
- The OAuth `redirectTo` must be exactly `${window.location.origin}/` (not `/login`).
- `requireAuthLoader` uses `getSession()` which synchronously reads from storage; if the fragment hasn't been parsed yet, the parsing happens inside `createClient` BEFORE the React tree mounts — so by the time the loader runs, the session is present.
**Warning signs:** "Sign in with Google" succeeds but the app shows login page; URL retains `#access_token=...`.

### Pitfall 2: RLS Recursion via Helper Function
**What goes wrong:** Writing `auth_is_parent()` as `SECURITY INVOKER` (the default) — when the function tries to read `members`, the RLS policy on `members` calls `auth_is_parent()` again, infinite recursion or permission denied.
**Why it happens:** RLS policies cannot reference tables that themselves have RLS, unless the function bypasses RLS.
**How to avoid:**
- Declare helper as `SECURITY DEFINER` and place in a private schema (e.g. `private.auth_is_parent()`).
- Grant `EXECUTE` to `authenticated`.
- Inside the function, qualify the `members` table fully and use `set search_path = ''` to prevent search-path attacks.
**Warning signs:** "stack depth limit exceeded" or "permission denied for table members" during a routine SELECT.

### Pitfall 3: Realtime Channel Subscribed Before Auth
**What goes wrong:** `useRealtimeBridge` runs on first render with no session → subscribes anonymously → RLS blocks all events → channel silently delivers nothing even after auth completes.
**Why it happens:** Realtime authorization is set at subscribe time; if the JWT changes later, you need to re-subscribe.
**How to avoid:**
- Mount `useRealtimeBridge` inside `RootLayout` which is rendered only after `requireAuthLoader` passes.
- The hook itself bails out (`if (!familyId) return;`) until `useCurrentFamily` resolves.
- On sign-out, the layout unmounts and the cleanup runs — `removeChannel` releases the WebSocket.
**Warning signs:** Inserts succeed but the UI doesn't update; opening another device shows the insert, the original device doesn't.

### Pitfall 4: Service Worker Caches Stale Build After Deploy
**What goes wrong:** Vercel deploys a new build; users with the old SW continue to serve the old precache and don't pick up new files for hours.
**Why it happens:** Default service worker behavior is "install → wait → activate on next reload after all old tabs are closed". With `registerType: 'autoUpdate'` the plugin handles this, but in `injectManifest` mode you still need `cleanupOutdatedCaches()` and `clients.claim()`.
**How to avoid:**
- The minimal `src/sw.ts` shown in Pattern 9 includes both `cleanupOutdatedCaches()` and `self.clients.claim()`.
- Use `registerType: 'autoUpdate'` in the plugin config (not `'prompt'`) — Phase 1 doesn't need the "new version" UX.
- Test deploy flow: build, deploy, hard-refresh, verify new bundle is served.
**Warning signs:** New code visible in dev but production users still see old behavior after refresh.

### Pitfall 5: Stripe Edge Function Times Out on Cold Start
**What goes wrong:** First call after deploy takes >5s, Supabase webhook times out, family is created but no `stripe_customer_id` is written.
**Why it happens:** Deno Edge cold start + Stripe API latency can exceed the webhook timeout (5s default).
**How to avoid:**
- Use `idempotencyKey: 'family-{id}-create-customer'` so retries don't double-create.
- Configure the webhook with retries enabled (Supabase Dashboard → Webhooks → Advanced).
- Smoke-test the Edge Function with `supabase functions invoke` to warm it before any real user signs up.
- Long-term: a Postgres `BEFORE INSERT` trigger could also enqueue a retry row in a `stripe_customer_pending` table that a cron sweeps — but skip this complexity in Phase 1 unless it actually fires.
**Warning signs:** `families.stripe_customer_id` is NULL after creating a family; Edge Function logs show timeout.

### Pitfall 6: TypeScript Strict Mode + Supabase Generated Types
**What goes wrong:** `strict: true` flags every Supabase query result as `T | null`, requiring narrowing on every read.
**Why it happens:** Supabase's TypeScript client returns `{ data: T | null, error: PostgrestError | null }`. With strict null checks, accessing `data.id` requires guarding `data !== null`.
**How to avoid:**
- Define a `check()` helper: `function check<T>(res: { data: T | null; error: PostgrestError | null }): T { if (res.error) throw res.error; if (res.data === null) throw new Error('no data'); return res.data; }`. Pattern carried forward from v1 `db.js`.
- Generate types: `supabase gen types typescript --project-id <id> > src/data/types.ts`.
- Import `Database` and parameterize `createClient<Database>`.
**Warning signs:** Lots of `data?.field` and `if (!data) throw` clutter in mutations.

### Pitfall 7: `family_id` Missing from Optimistic INSERTs
**What goes wrong:** Optimistic update inserts a row into the cache, but the row is missing `family_id` because the form didn't have access to it → on refetch, the server-returned row has `family_id` set but the optimistic row didn't, leading to a duplicate display momentarily.
**Why it happens:** Forgetting that every domain row needs `family_id` even though RLS will reject if absent.
**How to avoid:**
- A `useFamilyMutation()` helper that wraps `useMutation` and prepends `family_id` from `useCurrentFamily()` to every variables object.
- Phase 1 doesn't have many mutations (just family creation), so the helper itself can be built in Phase 2; document this in CONVENTIONS.md now.
**Warning signs:** "null value in column family_id violates not-null constraint" on optimistic mutations.

### Pitfall 8: Allowed Emails Bootstrap Race
**What goes wrong:** Travis (the first parent) signs in for the first time, but the allowlist migration hasn't run yet → he's denied access to his own app.
**Why it happens:** Allowlist is bootstrapped in the migration with the family's known emails, but if the migration is applied AFTER the Supabase project is live and OAuth is configured, the first sign-in fails.
**How to avoid:**
- Order: (1) `supabase db push` migration first; (2) configure Google OAuth provider; (3) only then deploy the app.
- Verify with `select * from allowed_emails;` before clicking "Sign in with Google".
- Include this in the Wave 1 Definition of Done.
**Warning signs:** Real allowed user lands on Access Denied screen.

### Pitfall 9: PKCE Flow Without `detectSessionInUrl` Breaks
**What goes wrong:** With `flowType: 'pkce'` (the 2026 default), the OAuth provider returns a `?code=...` query param, not a URL fragment. If `detectSessionInUrl` is false, the code is never exchanged.
**Why it happens:** PKCE is recommended for SPAs but requires that supabase-js complete the code-for-token exchange. That exchange happens inside `getSession()` automatically only if `detectSessionInUrl` is true.
**How to avoid:**
- Set `detectSessionInUrl: true` explicitly (matches default).
- Use `flowType: 'pkce'` (matches default in supabase-js v2).
- Never call `supabase.auth.exchangeCodeForSession()` manually unless you're doing the dance in a custom callback route — which we aren't.
**Warning signs:** URL retains `?code=...&state=...` after redirect; session never appears.

### Pitfall 10: vite-plugin-pwa Tries to Cache Supabase URLs
**What goes wrong:** Default runtime caching strategies in vite-plugin-pwa attempt to cache cross-origin fetches → caches stale Supabase responses → bizarre UI states where a logged-out user appears logged in.
**Why it happens:** In `injectManifest` mode this only happens if you import workbox-routing and add a fetch handler. The minimal SW in Pattern 9 does NOT add fetch handlers — keep it that way until Phase 6.
**How to avoid:**
- Phase 1 SW only does `precacheAndRoute(self.__WB_MANIFEST)` — no `registerRoute()` for runtime caching.
- API calls go straight to Supabase without SW interception.
**Warning signs:** Cached responses with stale auth state in DevTools → Application → Cache Storage.

## Runtime State Inventory

Phase 1 is a **greenfield** phase — no rename or refactor. The v1 family-hub project is left untouched (Phase 10 handles migration). The only "state to migrate" in Phase 1 is the visual CSS-variable theme system from `../family-app/src/index.css`, which is a code copy, not a data migration.

**Categories explicitly reviewed:**
- **Stored data:** None — Phase 1 creates new tables in a new (or namespaced) Supabase project. v1 data is not touched.
- **Live service config:** None — new Stripe keys, new Supabase project, new Vercel project (or new env-vars on existing).
- **OS-registered state:** None.
- **Secrets/env vars:** New `.env` keys (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_VAPID_PUBLIC_KEY` placeholder for Phase 6); Supabase Edge Function secrets (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SIGNING_SECRET`, `STRIPE_WEBHOOK_FAMILY_SHARED_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` is auto-injected by Supabase).
- **Build artifacts:** None pre-existing — `dist/` will be created by Vite first time.

Section omitted from heavier treatment since this is greenfield.

## Common Pitfalls (Walking Skeleton-specific risks)

See §Common Pitfalls above.

## Code Examples

See Patterns 1–12 above. Every example is sourced from official documentation (or v1 code that's been ported, in the case of CSS variables).

### Supabase Schema & RLS (the core Phase 1 migration)

```sql
-- supabase/migrations/20260520_000_initial_schema.sql
-- Source: supabase.com/docs/guides/database/postgres/row-level-security (verified)
--         + CLAUDE.md §Schema setup
--         + research/STACK.md push notifications section

-- Extensions
create extension if not exists pgcrypto;     -- gen_random_uuid (also available natively in pg15)

-- Private schema for SECURITY DEFINER helpers
create schema if not exists private;

-- ── Tables (ordered by FK dependency) ────────────────────────────

create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text not null default '🏠',  -- house emoji; ZWJ sequences avoided
  stripe_customer_id text,             -- populated by Edge Function
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null
);

create table public.members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete set null,  -- nullable for virtual members (Phase 2)
  email text,                          -- lowercase
  name text not null,
  emoji text not null default '🙂',
  color text not null default 'lavender',
  role text not null default 'member' check (role in ('parent', 'member')),
  visible_sections jsonb not null default '[]',  -- Phase 2 populates
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);
create unique index members_family_auth_user_uniq on public.members(family_id, auth_user_id) where auth_user_id is not null;

create table public.family_settings (
  family_id uuid primary key references public.families(id) on delete cascade,
  timezone text not null,              -- e.g. 'America/Chicago'
  theme text not null default 'lavender' check (theme in ('lavender', 'midnight')),
  trial_ends_at timestamptz,           -- set at family creation; D-06
  stripe_subscription_status text,     -- 'trialing' | 'active' | 'canceled' | NULL
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table public.allowed_emails (
  email text primary key,              -- store lowercased
  family_id uuid references public.families(id) on delete cascade,  -- which family they belong to (nullable while bootstrapping)
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table public.chores (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  assigned_member_id uuid references public.members(id) on delete set null,
  frequency text not null check (frequency in ('once', 'daily', 'weekly', 'monthly')),
  requires_approval boolean not null default false,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table public.chore_completions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  chore_id uuid not null references public.chores(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  completed_at timestamptz not null default now(),
  approved_by uuid references public.members(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  rrule text,                          -- RFC 5545 recurrence
  assigned_member_id uuid references public.members(id) on delete set null,
  dropoff_parent_id uuid references public.members(id),
  pickup_parent_id uuid references public.members(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  date date not null,
  slot text not null check (slot in ('breakfast', 'lunch', 'dinner')),
  title text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  unique (family_id, date, slot)
);

create table public.groceries (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  qty text,
  category text,
  checked boolean not null default false,
  added_by_member_id uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  body text not null default '',
  posted_by_member_id uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table public.push_subscriptions (
  endpoint text primary key,
  family_id uuid not null references public.families(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifications_queue (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  member_id uuid references public.members(id) on delete cascade,
  kind text not null,                  -- 'chore_due' | 'chore_completed' | 'event_reminder' | 'custody_change'
  payload jsonb not null,
  scheduled_for timestamptz not null,
  delivered_at timestamptz,
  attempts int not null default 0,
  created_at timestamptz not null default now()
);

create table public.family_links (
  id uuid primary key default gen_random_uuid(),
  family_a_id uuid not null references public.families(id) on delete cascade,
  family_b_id uuid not null references public.families(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (family_a_id <> family_b_id)
);
create unique index family_links_pair_uniq on public.family_links (least(family_a_id, family_b_id), greatest(family_a_id, family_b_id));

-- ── updated_at trigger ────────────────────────────────────────────

create or replace function private.set_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  new.updated_by := coalesce(new.updated_by, (select auth.uid()));
  return new;
end;
$$ language plpgsql security definer set search_path = '';

-- Apply to all audited tables
do $$
declare t text;
begin
  for t in select unnest(array['families','members','family_settings','chores','chore_completions','events','meals','groceries','notes','push_subscriptions']) loop
    execute format('create trigger trg_%s_updated_at before update on public.%s for each row execute function private.set_updated_at();', t, t);
  end loop;
end$$;

-- ── Helper functions (SECURITY DEFINER, never on exposed schemas) ──

create or replace function private.current_family_id()
returns uuid
language sql
security definer
set search_path = ''
stable
as $$
  select family_id
  from public.members
  where auth_user_id = (select auth.uid())
  limit 1;
$$;

create or replace function private.auth_is_parent()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.members
    where auth_user_id = (select auth.uid())
      and role = 'parent'
  );
$$;

grant execute on function private.current_family_id() to authenticated;
grant execute on function private.auth_is_parent() to authenticated;

-- ── RLS ───────────────────────────────────────────────────────────

alter table public.families enable row level security;
alter table public.members enable row level security;
alter table public.family_settings enable row level security;
alter table public.allowed_emails enable row level security;
alter table public.chores enable row level security;
alter table public.chore_completions enable row level security;
alter table public.events enable row level security;
alter table public.meals enable row level security;
alter table public.groceries enable row level security;
alter table public.notes enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notifications_queue enable row level security;
alter table public.family_links enable row level security;

-- Standard family-scoped read policy (apply to all family_id tables)
-- families: a member can see their own family
create policy families_select on public.families
  for select to authenticated
  using (id = private.current_family_id());

create policy families_insert on public.families
  for insert to authenticated
  with check (true);    -- ONBD-01: any authenticated allowlisted user can create the first family

create policy families_update on public.families
  for update to authenticated
  using (id = private.current_family_id() and private.auth_is_parent())
  with check (id = private.current_family_id());

-- Generic family_id-scoped policies for the rest. (Generate with a do-block.)
do $$
declare t text;
begin
  for t in select unnest(array['members','family_settings','chores','chore_completions','events','meals','groceries','notes','push_subscriptions','notifications_queue']) loop
    execute format($f$
      create policy %I_select on public.%I
        for select to authenticated
        using (family_id = private.current_family_id());
      create policy %I_insert on public.%I
        for insert to authenticated
        with check (family_id = private.current_family_id());
      create policy %I_update on public.%I
        for update to authenticated
        using (family_id = private.current_family_id())
        with check (family_id = private.current_family_id());
      create policy %I_delete on public.%I
        for delete to authenticated
        using (family_id = private.current_family_id() and private.auth_is_parent());
    $f$, t, t, t, t, t, t, t, t);
  end loop;
end$$;

-- allowed_emails: a user can SELECT their own row; only parents can INSERT/DELETE
create policy allowed_emails_select_own on public.allowed_emails
  for select to authenticated
  using (lower(email) = lower((select auth.jwt() ->> 'email')));

create policy allowed_emails_insert_parent on public.allowed_emails
  for insert to authenticated
  with check (private.auth_is_parent());

create policy allowed_emails_delete_parent on public.allowed_emails
  for delete to authenticated
  using (private.auth_is_parent());

-- family_links visible to either side
create policy family_links_select on public.family_links
  for select to authenticated
  using (
    family_a_id = private.current_family_id()
    or family_b_id = private.current_family_id()
  );

-- ── Realtime publication ──────────────────────────────────────────
-- Add tables to supabase_realtime publication (so postgres_changes events fire)
alter publication supabase_realtime add table
  public.families,
  public.members,
  public.family_settings,
  public.chores,
  public.chore_completions,
  public.events,
  public.meals,
  public.groceries,
  public.notes,
  public.push_subscriptions,
  public.notifications_queue;

-- ── Bootstrap allowed_emails (the family's known emails) ──────────
-- (Edit emails to match the user's family before applying.)
insert into public.allowed_emails (email) values
  ('travis.g.mader@gmail.com'),
  ('angelia.m.merryman14@gmail.com'),
  ('laylamerryman11@gmail.com'),
  ('stellamader6@gmail.com'),
  ('maderroman5@gmail.com')
on conflict do nothing;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Implicit OAuth flow (URL fragment with access_token) | PKCE flow (?code= query param + exchange) | supabase-js v2.x default | Must have `detectSessionInUrl: true` for either; flowType default is now `'pkce'` |
| `react-router-dom` separate package | `react-router` consolidated (v7) | Sept 2024 (v7 GA) | Drop `react-router-dom` install; import from `react-router` everywhere |
| TanStack Query optimistic via `setQueryData` | Snapshot + restore in `onMutate`/`onError`/`onSettled` | v5 (2024) | Standardized rollback; documented in CLAUDE.md §TanStack Query v5 Patterns |
| Stripe Trial via `Subscription.trial_end` + Customer | Trial Offer API (`product_catalog/trial_offers`) | March 2026 preview API | We use legacy `trial_end` for simplicity (free trial only); migrate if paid trials later |
| Service worker hand-coded | vite-plugin-pwa with injectManifest | 2024+ | All Vite PWAs use the plugin; injectManifest gives custom SW control |
| Realtime payloads pushed into cache | Realtime event → invalidateQueries (refetch) | Best-practice consensus 2024+ | Avoids partial-update races |
| Hand-rolled UUIDs (`'c'+Date.now()`) | `crypto.randomUUID()` | Browser-native since 2021 (Safari 15.4+) | v1 anti-pattern explicitly out of scope |
| AppContext for all server state | TanStack Query + per-feature hooks | 2023+ consensus | v1's biggest reliability bug is fixed |

**Deprecated/outdated:**
- React Router v6 — feature-frozen, v7 is the upgrade target.
- `react-router-dom` — back-compat only, use `react-router` directly.
- Stripe API versions earlier than `2024-09-30` — fine for our flow (we use the SDK which uses a fixed pinned version per its release), but document the chosen pinning.
- TypeScript `<5.x` — TS 5.7 minimum per CLAUDE.md.

## Assumptions Log

> Claims tagged `[ASSUMED]` are based on training/general practice without explicit verification in this session. The planner and discuss-phase should confirm with the user where the risk of being wrong is meaningful.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | jsdom is the right Vitest DOM environment (vs happy-dom) | Stack | Low — easy swap; either works |
| A2 | `@testing-library/jest-dom` 6.x is current and compatible with vitest 4.x | Stack | Low — verify at install |
| A3 | `@types/luxon` exists as a separate package | Stack | Low — confirmed by historical knowledge but verify at install |
| A4 | Default Supabase webhook timeout is 5 seconds | Pitfall 5 | Medium — could be longer; doc was non-specific. Validate by configuring retry on the webhook |
| A5 | Stripe `customer.subscription.trial_will_end` fires 3 days before trial end | Discretion (Stripe events) | Low — Stripe doc verified ("3 days before") |
| A6 | The family's known emails listed in CLAUDE.md `../family-app/src/lib/allowedEmails.js` are still the right bootstrap list | Schema bootstrap | Medium — user should confirm the list before running the migration in case a member's email has changed |
| A7 | Browser-derived timezone (Intl.DateTimeFormat().resolvedOptions().timeZone) is the right default for `family_settings.timezone` at first family creation | Family Creation Wizard | Low — STATE.md flags this as a Phase 1 open question; the recommendation is to use browser default and let user edit later |
| A8 | Stripe Node SDK pinning `npm:stripe@^17` inside Edge Function works with current Deno + Stripe API | Stripe Edge Function code | Low — Stripe SDK is well-supported on Deno; verify at deploy. (Latest stable is 22.x as of 2026-05; the Edge Function `^17` pin needs to be bumped to `^22` in Wave 5.) |

## Open Questions

1. **Should `families.created_by` cascade or set NULL on auth.users delete?**
   - What we know: We chose `set null`. v1 had no such constraint because it didn't link to auth.users.
   - What's unclear: GDPR (COMP-01 in Phase 7) needs a story for "user deletes account" — should the family persist with no creator, or be deleted?
   - Recommendation: Phase 1 sets NULL; Phase 7 (COMP-01) revisits with a proper account-deletion flow.

2. **Webhook retry policy for `stripe-create-customer`?**
   - What we know: Supabase Database Webhooks support retries; default count is unclear from docs.
   - What's unclear: If the Edge Function 500s after a partial success (e.g., Stripe created Customer but the UPDATE failed), the retry will hit `stripe.customers.create` with the same idempotency key and not double-create. That's safe.
   - Recommendation: Enable webhook retries (3 attempts, exponential backoff). The idempotency key makes retries safe. Document this in the runbook.

3. **Service worker registration timing relative to auth?**
   - What we know: `vite-plugin-pwa`'s `injectRegister: 'auto'` registers on page load.
   - What's unclear: If the SW activates during the OAuth redirect flow, could the redirect be cached?
   - Recommendation: Phase 1 SW only does precache (no runtime caching of HTML/fetch). The redirect is a hard navigation that isn't intercepted. Document and verify with a Playwright smoke test.

4. **First-ever family creation requires the user to NOT yet be in `members` — but RLS `families_insert` policy doesn't gate on this. Should it?**
   - What we know: Currently `families_insert` has `with check (true)`, allowing any authenticated user to insert.
   - What's unclear: This means a user could create unlimited families. Phase 2 may want to restrict to "first family only" or "billing-gated".
   - Recommendation: Phase 1 accepts this — it's not a security hole (RLS still prevents seeing other families), just an abuse vector for one trusted family. Phase 2 + Stripe billing will gate this.

## Environment Availability

> Phase 1 depends on external tools, runtimes, services, and CLIs. Probe results below were captured during research.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| node | Vite, vitest, dev server | ✓ | 24.14.1 (≥20 required, ≥22 recommended) | — |
| npm | Install + scripts | ✓ | 11.11.0 | — |
| supabase CLI | Migrations, Edge Functions deploy, type generation | ✓ | 2.90.0 (Homebrew-installed) | — |
| vercel CLI | Preview + prod deploys | ✓ | 51.8.0 | Vercel dashboard manual deploy |
| stripe CLI | Local webhook forwarding for testing | ✗ | — | `brew install stripe/stripe-cli/stripe` (recommended) OR test webhooks against the deployed Edge Function with the Stripe Dashboard's "Send test webhook" |
| Docker | Local Supabase stack (optional) | unknown | — | Use the hosted Supabase project directly; no Docker required for Phase 1 |
| Google Cloud Console access | Configure OAuth client | unknown — user-owned | — | None — user must have Google Workspace or personal Google account access |
| Supabase project (new or existing) | Backend | unknown — user must provision | — | Provision via supabase.com dashboard |
| Stripe account (test mode) | Customer creation | unknown — user must provision | — | Sign up at stripe.com; use test mode keys |
| VAPID key pair | Push (Phase 6) | not yet generated | — | Phase 1 stub: include `VITE_VAPID_PUBLIC_KEY` placeholder; defer generation to Phase 6 |

**Missing dependencies with no fallback:**
- Supabase project provisioning — must be done by the user via supabase.com dashboard before Wave 1. Plan must include a `checkpoint:human-verify` step here.
- Google OAuth client creation — must be done by the user in Google Cloud Console.
- Stripe account creation — must be done by the user.

**Missing dependencies with fallback:**
- stripe CLI — fallback to webhook testing via Stripe Dashboard.
- Docker — fallback to hosted Supabase project for all dev.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.6 (unit) + Playwright 1.60 (E2E) |
| Config file | `vitest.config.ts` (created in Wave 0) + `playwright.config.ts` (created in Wave 0) |
| Quick run command | `npm test` (vitest in watch mode off → run-once; aliased) |
| Full suite command | `npm test && npm run test:e2e` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ARCH-01 | Multi-tenant — no row readable across families | integration (Supabase test) | `npm test -- tests/integration/rls-isolation.test.ts` | ❌ Wave 0 |
| ARCH-02 | React Router v7 routes mount, navigation works | unit | `npm test -- tests/unit/router.test.tsx` | ❌ Wave 0 |
| ARCH-03 | TanStack Query QueryClient initializes, hooks work | unit | `npm test -- tests/unit/queryClient.test.ts` | ❌ Wave 0 |
| ARCH-04 | vite-plugin-pwa emits sw.js + manifest in build output | smoke | `npm run build && test -f dist/sw.js && test -f dist/manifest.webmanifest` | ❌ Wave 0 (add as `package.json` script) |
| ARCH-05 | All tables exist with required columns and RLS enabled | integration | `npm test -- tests/integration/schema.test.ts` (queries `information_schema` + `pg_policies`) | ❌ Wave 0 |
| ARCH-06 | `chore_completions` is separate from `chores` | integration | included in `schema.test.ts` | ❌ Wave 0 |
| ARCH-07 | `useRealtimeBridge` invalidates queries on postgres_changes | integration (manual + Playwright) | `npm run test:e2e -- realtime-bridge` | ❌ Wave 0 — manual-only acceptable for Phase 1 |
| ARCH-08 | Throwing in a route renders the errorElement fallback | unit | `npm test -- tests/unit/error-boundary.test.tsx` | ❌ Wave 0 |
| ARCH-09 | Offline mutations pause; banner appears | unit | `npm test -- tests/unit/offline-banner.test.tsx` (mock `onlineManager`) | ❌ Wave 0 |
| ARCH-10 | Stripe Edge Function creates customer on INSERT (mocked Stripe) | integration | `supabase functions invoke stripe-create-customer --no-verify-jwt` with fixture | ❌ Wave 0 — partial: full verification is manual-only this phase |
| ARCH-11 | `family_links` table exists | included in `schema.test.ts` | ❌ Wave 0 |
| ARCH-13 | Luxon imported and `trial_ends_at` computed in TZ | unit | `npm test -- tests/unit/luxon-trial.test.ts` | ❌ Wave 0 |
| ONBD-01 | Walking-skeleton smoke: sign in → create family → see shell | E2E | `npm run test:e2e -- walking-skeleton.spec.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --run --changed` (vitest only) — should complete in <15s
- **Per wave merge:** `npm test -- --run && npm run lint && npm run build` — adds build smoke
- **Phase gate:** Full suite green + Playwright smoke on Vercel preview URL + manual checks for realtime + Stripe (since those need a real Supabase+Stripe pair)

### Wave 0 Gaps
- [ ] `vitest.config.ts` — vitest + jsdom + setup
- [ ] `vitest.setup.ts` — `@testing-library/jest-dom` import
- [ ] `playwright.config.ts` — points at preview URL via `PLAYWRIGHT_BASE_URL` env
- [ ] `tests/unit/router.test.tsx` — covers ARCH-02 + ARCH-08
- [ ] `tests/unit/queryClient.test.ts` — covers ARCH-03 + ARCH-09 (paused mutations)
- [ ] `tests/unit/offline-banner.test.tsx` — covers ARCH-09 UI
- [ ] `tests/unit/luxon-trial.test.ts` — covers ARCH-13
- [ ] `tests/integration/schema.test.ts` — covers ARCH-01, ARCH-05, ARCH-06, ARCH-11
- [ ] `tests/integration/rls-isolation.test.ts` — covers ARCH-01 strict
- [ ] `tests/e2e/walking-skeleton.spec.ts` — covers ONBD-01 + end-to-end smoke
- [ ] Framework install: handled by the install command in §Standard Stack
- [ ] `package.json` scripts: `test`, `test:e2e`, `lint`, `build`, `preview`, `db:push`, `db:types`, `functions:deploy`

## Security Domain

Per `config.json`: `security_enforcement` is absent → treat as enabled.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Supabase Auth (Google OAuth via PKCE); no email/password to attack |
| V3 Session Management | yes | Supabase JWT in localStorage, auto-refresh, 1h expiry, signed |
| V4 Access Control | yes | Postgres RLS + `private.auth_is_parent()` + `private.current_family_id()` helper functions |
| V5 Input Validation | yes (low surface area) | Family name + emoji only inputs in Phase 1; trim + length-limit; emoji-set validation |
| V6 Cryptography | yes (delegated) | Stripe handles payment crypto; Supabase handles JWT signing; web-push handles VAPID (Phase 6) — NEVER hand-roll |
| V7 Error Handling & Logging | yes | React Router errorElement + console error logging; no PII in client logs |
| V8 Data Protection | yes | All cross-tenant access blocked by RLS; allowed_emails RLS prevents enumeration |
| V13 API & Web Services | yes (Edge Functions) | Stripe webhook signature verification; DB webhook shared-secret in Authorization header |
| V14 Configuration | yes | Stripe secret + service role key in Edge Function secrets ONLY (never VITE_*) |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Allowlist enumeration via SELECT on `allowed_emails` | Information Disclosure | RLS SELECT policy restricts to `lower(email) = lower(jwt->>'email')` — user can only see their own row, not the whole list |
| Cross-tenant data read via `family_id` manipulation | Tampering / Information Disclosure | RLS uses `private.current_family_id()` derived from `auth.uid()` join — cannot be spoofed by the client |
| Stripe webhook replay | Tampering | `stripe.webhooks.constructEventAsync()` enforces signature + replay window (5 min default) |
| Supabase webhook spoofing the Edge Function | Spoofing | Custom shared secret in `Authorization: Bearer` header; Edge Function rejects without it |
| Stripe secret key leak via client bundle | Information Disclosure | Never use `VITE_*` for Stripe secret; only Supabase Edge Function secrets |
| Service worker caches authenticated responses | Information Disclosure | Phase 1 SW does NOT register fetch handlers — precache only; cross-origin Supabase calls are never intercepted |
| Open redirect via `redirectTo` | Tampering | Use `window.location.origin` only — Supabase will reject `redirectTo` values not in the project's allowed redirect URLs list |
| RLS bypass via SECURITY DEFINER helper in `public` schema | Elevation of Privilege | Helper functions are in `private` schema with `set search_path = ''` — not callable from PostgREST |
| Realtime channel hijack | Information Disclosure | RLS is enforced server-side on postgres_changes events; even an attacker subscribing to `family:xyz` channel gets nothing if RLS rejects |

## Sources

### Primary (HIGH confidence)
- [vite-plugin-pwa — injectManifest guide](https://vite-pwa-org.netlify.app/guide/inject-manifest) — Strategy, srcDir, custom SW pattern
- [React Router — Data mode setup](https://reactrouter.com/start/data/installation) — `createBrowserRouter`, `RouterProvider`, errorElement, loaders
- [React Router — Picking a Mode](https://reactrouter.com/start/modes) — Why Data mode vs Declarative vs Framework
- [React Router — Upgrading from v6](https://reactrouter.com/upgrading/v6) — Package consolidation
- [Supabase Auth — Google OAuth](https://supabase.com/docs/guides/auth/social-login/auth-google) — `signInWithOAuth`, redirect URI, scopes
- [Supabase — Postgres Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) — SECURITY DEFINER patterns, private schema, multi-tenant policies
- [Supabase Realtime — Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes) — Multi-table single-channel subscription pattern, publication setup
- [Supabase — Database Webhooks](https://supabase.com/docs/guides/database/webhooks) — Webhook → Edge Function pattern, payload structure
- [Supabase — Edge Functions Auth](https://supabase.com/docs/guides/functions/auth) — `verify_jwt = false` for webhooks, shared-secret pattern
- [Stripe — Create a Customer](https://docs.stripe.com/api/customers/create) — Minimum payload, idempotency
- [Stripe — Subscription Trials](https://docs.stripe.com/billing/subscriptions/trials) — Legacy `trial_end` (preferred for free trial MVP), trial_will_end event
- [TanStack Query v5 — Mutations](https://tanstack.com/query/v5/docs/framework/react/guides/mutations) — Mutation states, isPaused, resumePausedMutations
- [TanStack Query v5 — Network Mode](https://tanstack.com/query/v5/docs/react/guides/network-mode) — `offlineFirst` semantics
- [TanStack Query QueryClient ref](https://tanstack.com/query/v5/docs/reference/QueryClient) — getMutationCache subscribe API
- [MDN — Crypto.randomUUID()](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID) — Browser support and entropy
- npm registry — direct `npm view` confirmations for all packages on 2026-05-19

### Secondary (MEDIUM confidence — verified against multiple sources)
- [TanStack Query Discussion #6756 — isPaused detection](https://github.com/TanStack/query/discussions/6756) — `queryClient.getMutationCache().getAll().filter((m) => m.state.isPaused)` pattern
- [TanStack Query Discussion #5275 — Offline mutation behavior](https://github.com/TanStack/query/discussions/5275) — Resume on reconnect
- [Supabase Discussion #14115 — How to authenticate webhooks](https://github.com/orgs/supabase/discussions/14115) — Stripe-style external webhook with `auth: 'none'`
- [Sending Web Push with Deno](https://www.negrel.dev/blog/deno-web-push-notifications/) — npm: specifier pattern for Edge Functions (used by Stripe SDK same way)
- CLAUDE.md `Supabase Realtime Patterns` — `removeChannel` cleanup vs `unsubscribe`
- CLAUDE.md `TanStack Query v5 Patterns` — Optimistic mutation rollback choreography
- CLAUDE.md `UUID Generation` — Client-side `crypto.randomUUID()` rationale
- v1 `../family-app/src/lib/db.js` — check/checked() wrapper pattern carried forward
- v1 `../family-app/src/index.css` — CSS variable theme system carried forward verbatim
- v1 `../family-app/src/lib/allowedEmails.js` — bootstrap email list source

### Tertiary (LOW confidence — flagged for validation)
- Supabase webhook default timeout: assumed 5 seconds based on community references; verify by configuring retries and observing.
- `@types/luxon` package existence — historically separate; verify at install.
- Stripe Node SDK Deno compatibility — well-known pattern but verify at first Edge Function deploy.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every package version verified via `npm view`; sources are official docs
- Architecture patterns: HIGH — every pattern is cited to official docs or CLAUDE.md (researcher-curated)
- RLS + schema design: HIGH — patterns verified against Supabase official docs; helper-function recursion pitfall is a known gotcha I've explicitly mitigated
- Stripe integration: MEDIUM-HIGH — Stripe + Supabase doc combination is documented; the exact webhook timeout and retry semantics need empirical validation in Wave 5
- vite-plugin-pwa injectManifest: HIGH — official guide is precise; the SW minimal-precache-only approach is conservative on purpose
- TanStack Query offline behavior: HIGH for mutation pause/resume; the explicit non-persistence (D-02) sidesteps the dehydrate/hydrate complexity entirely
- Pitfalls: HIGH — each one is either documented in supabase/tanstack issues or a directly-known v1 trap

**Research date:** 2026-05-19
**Valid until:** 2026-06-18 (30 days — the stack is stable; major Supabase/Stripe API changes would invalidate sooner)
