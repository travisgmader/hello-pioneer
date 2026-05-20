<!-- GSD:project-start source:PROJECT.md -->
## Project

**Family Hub 2.0**

Family Hub 2.0 is a mobile-first PWA for shared household management — chores, calendar, meals, groceries, notes, and custody tracking — built for a family of any size. Members are dynamically managed (no hardcoded users), each with a custom name, emoji, and color. Parents get full control; kids get a streamlined experience with chore streaks to keep them engaged. Push notifications ensure nobody misses what matters.

**Core Value:** Every family member always knows what needs doing, what's coming up, and who has the kids today — and gets a push notification when it actually matters.

### Constraints

- **Auth**: Google OAuth only — no email/password, matches existing family Google accounts
- **Hosting**: Vercel — same deployment pipeline
- **Database**: Supabase — new project or new schema on existing project, with migration
- **Access**: Closed app — only approved family emails can log in
- **Existing data**: Real family events, chores, meals, groceries must survive migration
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Executive Summary
## Recommended Stack
### Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **React** | `^19.2.0` | UI runtime | React 19 is GA. New use-hook + Actions complement TanStack Query (don't replace it). React 19 is required by current TanStack Query v5 and React Router v7. |
| **Vite** | `^8.0.0` | Build + dev server | Vite 8 is current. Stays familiar (v1 was Vite). HMR, ESM-native, fast cold starts, first-class PWA plugin. Decision in PROJECT.md to skip Next.js is correct — no SSR requirement, family app is post-login behind Google OAuth, SEO is irrelevant. |
| **TypeScript** | `^5.7.0` | Type safety | Strongly recommended for a rewrite. TanStack Query v5 + React Router v7 + Supabase generated types compound the value. Even without it the rest of the stack assumes its ergonomics. |
| **React Router** | `^7.15.0` | Routing | v6 is feature-frozen. v7 is a non-breaking upgrade (no breaking changes if v6 future flags were enabled). Use **Data mode** (`createBrowserRouter` + `RouterProvider`) — gives route-level data loaders, errorElement, and shouldRevalidate without forcing you into Framework mode (Remix-style file routing/SSR). Package consolidation: import everything from `react-router`, drop `react-router-dom`. |
### Data Layer
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **@tanstack/react-query** | `^5.100.0` | Server state, cache, mutations | Replaces v1's monolithic AppContext. Caching, background refetch, stale-while-revalidate, optimistic updates with rollback. v5 stabilized the new optimistic-update API: cache snapshot in `onMutate`, return as context, restore in `onError`. React 19 compatible. |
| **@tanstack/react-query-devtools** | `^5.100.0` | Dev-only inspector | Essential for debugging cache state during phase development. Tree-shaken out of prod builds. |
| **@supabase/supabase-js** | `^2.106.0` | DB client + Auth + Realtime + Storage | Single SDK covers everything we need. v2 is the current stable major. Includes the `channel()` Realtime API and a hardened auth flow that survives token refresh. |
### PWA + Push Notifications
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **vite-plugin-pwa** | `^1.3.0` | PWA manifest, SW build, registration | Reached 1.0 in 2025, now at 1.3.0 (published 2026-05-05). Officially maintained Vite plugin. **Must use `strategies: 'injectManifest'`** — generateSW does not support push event handlers. |
| **workbox-precaching** | `^7.4.0` | Pre-cache app shell inside custom SW | Workbox is the underlying Google library that vite-plugin-pwa wraps. With injectManifest you import workbox modules into your custom SW. |
| **workbox-routing** | `^7.4.0` | Runtime caching for API responses (optional) | Add later when offline support becomes a real requirement. Not needed for first push milestone. |
| **web-push** (Deno-compatible build) | `^3.6.7` (Node) / npm:web-push via esm.sh in Edge Functions | Server-side: encrypt + sign push messages with VAPID | Reference implementation of the Web Push protocol. Runs in Supabase Edge Functions via Deno's npm: specifier or `https://esm.sh/web-push@3.6.7`. The official Supabase docs only cover Expo/FCM; for Web Push API you bring your own library. |
### Supabase Backend Services
| Service | Version | Purpose | Why |
|---------|---------|---------|-----|
| **Supabase Postgres** | 15+ (managed) | Source of truth | Native `gen_random_uuid()` (no extension needed), Postgres-native RLS, row-level audit triggers, JSONB for flexible columns. |
| **Supabase Auth** | Bundled in supabase-js | Google OAuth + session | Already proven in v1. RLS keys off `auth.uid()`. |
| **Supabase Realtime v2** | Bundled in supabase-js | Cross-device sync | `channel().on('postgres_changes', ...).subscribe()`. Always pair with `supabase.removeChannel(ch)` in cleanup. |
| **Supabase Edge Functions** | Deno runtime | VAPID push sender, scheduled chore reminders | Runs Deno; deploy with `supabase functions deploy`. Triggered by database webhooks, pg_cron, or direct invoke. |
| **pg_cron** | Postgres extension | Scheduled push notification triggers | Built into Supabase. Required for "chore due today at 7am" style reminders. |
### Styling
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **CSS Modules** or vanilla CSS w/ CSS variables | — | Theming (Lavender + Midnight) | Carry forward v1's CSS-variable theme system. Avoid adding Tailwind/styled-components to a rewrite that already has working theme primitives. |
### Testing
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Vitest** | `^3.0.0` | Unit tests | Vite-native, same config as the app, ESM-first. |
| **@testing-library/react** | `^16.0.0` | Component tests | Standard for React testing. |
| **Playwright** | `^1.50.0` | E2E + PWA install testing | User's documented workflow uses Playwright (per ship-process memory). Can drive service worker registration tests. |
| **msw** | `^2.7.0` | Mock Supabase responses in tests | Network-level mocking; works with TanStack Query without monkey-patching the client. |
## Push Notification Architecture (End-to-End)
### Components
### Subscription Storage Schema
### VAPID Keys
# Returns: { publicKey, privateKey }
- **Public key:** Vite env var `VITE_VAPID_PUBLIC_KEY`. Safe to embed in client bundle.
- **Private key + subject email:** Supabase Edge Function secrets `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (e.g. `mailto:travis.g.mader@gmail.com`).
- **NEVER** ship the private key to the client. Browser only sees the public key during `subscribe()`.
### Client subscription flow
### Custom service worker (src/sw.ts)
### vite.config.ts
### Edge function: send-push
### Critical gotchas
## Supabase Realtime Patterns (v2 API)
### Standard subscription pattern
### Best practices
- **One channel per logical concern**, not one per component. Many components subscribed to the same channel will multiply handler invocations.
- **Always filter on the server side** (`filter: 'family_id=eq.X'`). RLS will also gate it, but filters cut wasted WebSocket traffic.
- **Realtime + TanStack Query: don't push payloads into the cache directly.** Use the Realtime event as an *invalidation signal* — let TanStack Query refetch the canonical state. This avoids partial-update bugs when an INSERT arrives before a related SELECT has happened.
- **`removeChannel` is the canonical cleanup**, not `channel.unsubscribe()`. removeChannel both unsubs and removes from the client's tracking map.
- **For scale (10K+ concurrent), prefer Broadcast over postgres_changes.** Postgres Changes process on a single thread to preserve ordering. For a 5–10 user family app, postgres_changes is fine — but flag this as a Phase-N concern if the app ever opens up beyond one family.
- **Auth + RLS:** Realtime now supports `private: true` channels that enforce RLS on `realtime.messages` directly. Not needed for postgres_changes (which uses table-level RLS), but the option exists if we add Broadcast later.
## TanStack Query v5 Patterns
### Standard query
### Optimistic mutation with rollback
### Caveats
- **Cancel before snapshot.** A pending refetch could race the optimistic update and overwrite it. `cancelQueries` is non-negotiable.
- **Return the snapshot from `onMutate`.** It's the only way `onError` gets the previous state.
- **Invalidate in `onSettled`, not `onSuccess`.** Settled fires for both success and error, ensuring cache is always reconciled with the server.
- **Query keys are arrays.** `['chores', familyId]` not `'chores-' + familyId`. Enables partial-match invalidation (`['chores']` invalidates all family-scoped chore queries).
- **`staleTime` vs `gcTime`:** staleTime gates *when refetch occurs*, gcTime gates *when unused data is freed*. Default staleTime is 0 (always considered stale). Set per-query.
### What NOT to do
- **Don't store mutations in React state.** Use `useMutation` and let the cache be the source of truth.
- **Don't share a single global QueryClient between tests** without resetting. Provide a fresh one per test.
- **Don't combine TanStack Query with a separate React Context for the same data.** Pick one. The whole point of moving off v1's AppContext is to delete that pattern.
## UUID Generation: Client vs Server
### Why client-side wins for this app
| Reason | Detail |
|--------|--------|
| **Optimistic updates need an ID immediately** | TanStack Query's optimistic cache update needs a stable `id` before the server responds. Client-generated UUIDs eliminate the "temp id → real id" reconciliation step. |
| **Offline-first compatibility** | Service worker / IndexedDB writes can happen with no network. Server-generated IDs would require a sync-and-renumber phase. |
| **`crypto.randomUUID()` is universal in 2026** | Available in all evergreen browsers (Chrome 92+, Firefox 95+, Safari 15.4+), in Workers, cryptographically secure. Requires HTTPS or localhost (we always have HTTPS via Vercel). |
| **Collision probability is effectively zero** | UUIDv4 has 122 bits of entropy. A family of 10 generating 1M IDs each will not collide in any practical sense. |
### Schema setup
### v1 anti-pattern to discard
## Alternatives Considered
| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| **Framework** | Vite + React Router v7 (Data mode) | Next.js App Router | No SSR/SEO requirement (family app behind Google OAuth). Next.js App Router adds React Server Components complexity, two execution contexts (server + client), and a heavier dev story. PROJECT.md already locks this in. |
| **Router** | React Router v7 Data mode | React Router v6 / v7 Declarative / TanStack Router | v6 is feature-frozen; v7 is non-breaking upgrade. Declarative mode gives up loaders/errorElement that pay off for protected routes. TanStack Router is excellent but a second TanStack library + new mental model isn't worth the switch cost. |
| **Server state** | TanStack Query v5 | SWR / Zustand / Redux Toolkit Query | TanStack Query has the strongest optimistic-update story, best devtools, and largest community. SWR is leaner but lacks built-in mutation infrastructure. RTK Query couples you to Redux. Zustand is client-state, not server-state — different problem. |
| **PWA plugin** | vite-plugin-pwa 1.3 (injectManifest) | Hand-rolled SW + manifest | Re-inventing Workbox precaching is wasted effort. vite-plugin-pwa handles dev-mode SW, manifest injection, and asset hashing. |
| **Push service** | Self-hosted via web-push + Supabase Edge Functions | Firebase Cloud Messaging | FCM adds Google project setup, separate config, and a dependency we don't need. Web Push Protocol with VAPID hits the same browser push services FCM uses, just without the FCM middle layer. Supabase's official guide leans FCM/Expo, but only because they don't ship a Web Push helper — the protocol is standard. |
| **DB** | Supabase Postgres | Firebase Firestore / Convex / PlanetScale | Supabase already in v1 with real data. RLS gives auth-aware queries. Postgres > document store for relational family data (members → chores → completions). |
| **Auth** | Supabase Auth (Google OAuth) | Auth0 / Clerk | Bundled with Supabase, free at this scale, RLS already keys off `auth.uid()`. No reason to add another vendor. |
| **Styling** | CSS variables + CSS Modules | Tailwind / Stitches / Emotion | v1's CSS-variable theme system works. Adding Tailwind to a rewrite is mostly aesthetic preference; doesn't solve a real problem. |
| **UUID generation** | `crypto.randomUUID()` on client | `gen_random_uuid()` on server / `uuid` package | Client-gen enables optimistic updates without temp-id reconciliation. The `uuid` npm package is unnecessary — browsers ship the API natively now. |
## Installation
# Core
# PWA
# Dev dependencies
### One-time setup commands
# Generate VAPID keys (store in .env / Supabase secrets, never commit)
# Initialize Supabase project (if new project)
# Scaffold edge function
## Quality Gate Verification
- [x] **Versions are current** — verified via `npm view <pkg> version` against npm registry, not training data. All pins reflect packages published within the last 90 days.
- [x] **Rationale explains WHY** — each table entry justifies the choice, not just names it.
- [x] **Push notification stack fully specified** — schema, VAPID setup, client subscribe flow, SW push handler, Edge Function sender, deletion-on-expiry, iOS gotchas all covered end-to-end.
- [x] **Supabase Realtime patterns current** — `channel().on(...).subscribe()` with `removeChannel()` cleanup; postgres_changes filter usage; broadcast-vs-changes scaling note; v2 private channels mentioned for future.
## Sources
### Authoritative (HIGH confidence)
- [vite-plugin-pwa — injectManifest guide](https://vite-pwa-org.netlify.app/guide/inject-manifest)
- [vite-plugin-pwa GitHub releases](https://github.com/vite-pwa/vite-plugin-pwa/releases)
- [@supabase/supabase-js npm](https://www.npmjs.com/package/@supabase/supabase-js) — v2.106.0 confirmed
- [Supabase Realtime — Subscribing to Database Changes](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes)
- [Supabase Realtime — removeChannel](https://supabase.com/docs/reference/javascript/removechannel)
- [Supabase Realtime — Authorization (private channels)](https://supabase.com/docs/guides/realtime/authorization)
- [Supabase Realtime — Broadcast from Database (April 2025)](https://supabase.com/blog/realtime-broadcast-from-database)
- [Supabase — Choosing a Postgres Primary Key](https://supabase.com/blog/choosing-a-postgres-primary-key)
- [Supabase — Edge Functions](https://supabase.com/docs/guides/functions)
- [TanStack Query v5 — Optimistic Updates](https://tanstack.com/query/v5/docs/framework/react/guides/optimistic-updates)
- [React Router — Picking a Mode (Declarative / Data / Framework)](https://reactrouter.com/start/modes)
- [React Router — Upgrading from v6](https://reactrouter.com/upgrading/v6)
- [React Router — SPA Mode How-To](https://reactrouter.com/how-to/spa)
- [MDN — Crypto.randomUUID()](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID)
- [MDN — PushSubscription](https://developer.mozilla.org/en-US/docs/Web/API/PushSubscription)
- [Can I Use — randomUUID browser support](https://caniuse.com/mdn-api_crypto_randomuuid)
### Supporting (MEDIUM confidence — verified against multiple sources)
- [Sending Web Push messages with Deno](https://www.negrel.dev/blog/deno-web-push-notifications/) — Edge Function pattern with web-push npm package
- [Supabase Push Notifications (Expo/FCM examples)](https://supabase.com/docs/guides/functions/examples/push-notifications) — note: official docs cover Expo/FCM, not raw Web Push; we use web-push directly
- [Web Push notifications guide — implementation patterns](https://blog.openreplay.com/implementing-push-notifications-web-push-api/)
- [iOS PWA Push — Safari 16.4+ install-from-home-screen requirement](https://brainhub.eu/library/pwa-on-ios)
- [Supabase Realtime in Practice — WebSocket connection management](https://eastondev.com/blog/en/posts/dev/20260512-supabase-realtime-practice/)
- [TanStack Query v5 Optimistic Updates discussion](https://github.com/TanStack/query/discussions/6333)
### Gaps / Open Questions
- **Service worker update flow during deploy** — vite-plugin-pwa supports `registerType: 'autoUpdate'` but the UX of "new version available" needs to be designed in a later phase (when offline scope expands).
- **Push payload encryption** — web-push handles it, but if we ever send sensitive data (kid's location, etc.), revisit. For now: chore titles, event names — not sensitive.
- **pg_cron cadence for scheduled notifications** — needs phase-level decision on whether reminders fire from pg_cron + DB webhook, or from a cron-triggered edge function.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
