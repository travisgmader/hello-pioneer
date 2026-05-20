# Family Hub 2.0

## What This Is

Family Hub 2.0 is a mobile-first PWA for shared household management — chores, calendar, meals, groceries, notes, and custody tracking — built for a family of any size. Members are dynamically managed (no hardcoded users), each with a custom name, emoji, and color. Parents get full control; kids get a streamlined experience with chore streaks to keep them engaged. Push notifications ensure nobody misses what matters.

## Core Value

Every family member always knows what needs doing, what's coming up, and who has the kids today — and gets a push notification when it actually matters.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Foundation & Architecture**
- [ ] React Router v6 — proper URL routing, deep links, browser back button
- [ ] TanStack Query — replaces monolithic AppContext; caching, optimistic updates with rollback
- [ ] vite-plugin-pwa + Web Push API — push notifications and offline support via service worker
- [ ] New Supabase schema with proper migrations, UUIDs, RLS, and audit log (updated_at / updated_by)
- [ ] Data migration from existing family-hub Supabase project
- [ ] Error boundaries on all pages

**Member Management**
- [ ] Dynamic member management — members stored in DB, no hardcoded IDs
- [ ] Members can be real (linked to Google account) or virtual (parent-managed, no login)
- [ ] Per-member customization: name, emoji, color
- [ ] Per-member nav section visibility (which app sections they see)
- [ ] Per-member profile tab visibility

**Chores**
- [ ] Carry forward: add/assign/delete chores, frequency (once/daily/weekly/monthly), recurring logic
- [ ] Chore streaks — consecutive completion tracking displayed per member
- [ ] Push notification: chore due reminder
- [ ] Push notification: parent alert when a kid marks a chore complete

**Calendar**
- [ ] Carry forward: month grid with events, custody, meals
- [ ] Calendar redesign — less dense; events, meals, and custody layered clearly, not competing
- [ ] Push notification: event reminder before scheduled event

**Custody**
- [ ] Full custody overhaul: define a recurring schedule pattern (e.g., 2-2-3)
- [ ] Visual custody blocks on month calendar (color per parent)
- [ ] Handoff details per event (dropoff parent, pickup parent, times)
- [ ] Push notification: alert when custody schedule changes

**Meals**
- [ ] Carry forward: week planner grid, recommendations, voting, week navigation
- [ ] Meal history browse — navigate back through past weeks

**Groceries**
- [ ] Carry forward: grocery list with categories, quantities, Walmart links
- [ ] Grocery request flow redesign — replace awkward two-column layout

**Notes**
- [ ] Carry forward: shared family notes, reverse chronological
- [ ] Edit and delete own notes (parents can edit/delete any)

**Member Pages**
- [ ] Carry forward: per-member profile with chores and events
- [ ] Richer member page — activity history, streak display, stats

**Search**
- [ ] Search across chores, events, groceries, and notes

**Settings / Integrations**
- [ ] Family timezone setting — iCal export uses configured timezone (not hardcoded Chicago)
- [ ] Themes: Lavender + Midnight (Electric theme dropped)

### Out of Scope

- SMS/text notifications — push only; SMS adds per-message cost and carrier friction
- Points/leaderboard gamification — streaks only; simpler and less competitive
- Electric theme — unfinished in v1, dropped to reduce styling surface area
- Next.js — React/Vite stays; familiar stack, no SSR requirement
- Incremental refactor — this is a full rewrite in `Family App 2.0/`

## Context

v1 (family-app/) is a working React/Vite + Supabase + Vercel app in production at `https://family-hub-amber.vercel.app`. It has 5 hardcoded members (dad, mom, layla, stella, roman), Google OAuth login, and 7 data tables. The existing Supabase project holds real family data that must be migrated.

Key v1 patterns to carry forward: `db.js` isolation of all Supabase calls, CSS variables + theme system, role-based UI (parent vs child), recurring chore logic, real-time subscriptions.

Key v1 patterns to discard: hardcoded member IDs in App.jsx, monolithic AppContext, `'c' + Date.now()` IDs, `page` string routing, fully permissive RLS, 7 separate localStorage useEffects, Notes bypassing context.

The schema.sql in v1 is stale — actual DB has `dropoff_parent` + `pickup_parent` columns, not the documented `transport_parent`. New schema must be derived from live DB state.

## Constraints

- **Auth**: Google OAuth only — no email/password, matches existing family Google accounts
- **Hosting**: Vercel — same deployment pipeline
- **Database**: Supabase — new project or new schema on existing project, with migration
- **Access**: Closed app — only approved family emails can log in
- **Existing data**: Real family events, chores, meals, groceries must survive migration

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Full rewrite, not refactor | v1 architectural debt (no router, monolithic context, hardcoded members) would constrain every phase | — Pending |
| React + Vite + React Router v7 (Data mode) | v6 is feature-frozen; v7 is the non-breaking successor. `createBrowserRouter` + SPA mode — no SSR | — Pending |
| TanStack Query over custom context | Handles caching, background refetch, optimistic updates w/ rollback — solves v1's biggest data reliability issues | — Pending |
| vite-plugin-pwa for push notifications | Web Push API + service worker is the right primitive; vite-plugin-pwa integrates cleanly with Vite | — Pending |
| New Supabase schema with migration | v1 schema is stale and has no RLS; starting clean is safer than patching live tables | — Pending |
| Members as DB entity | Hard-coded members in v1 made the app non-configurable; first-class member table unlocks customization | — Pending |
| Streaks only, no points | Points require a reward economy to be meaningful; streaks are self-reinforcing and simpler to build | — Pending |
| Two themes only (drop Electric) | Electric was never finished in v1; shipping two complete themes beats three partial ones | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-19 after initialization*
