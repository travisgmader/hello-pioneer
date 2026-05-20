# Research Summary — Family Hub 2.0

**Synthesized:** 2026-05-19
**Inputs:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md
**Overall confidence:** HIGH on stack and architecture; MEDIUM-HIGH on feature priorities and pitfalls.

---

## Recommended Stack

| Layer | Choice | Version | Note |
|-------|--------|---------|------|
| Build | Vite | `^8.0.0` | Confirmed |
| UI runtime | React | `^19.2.0` | Confirmed |
| Language | TypeScript | `^5.7.0` | Recommended for rewrite |
| Router | **React Router v7 (Data mode)** | `^7.15.0` | **Deviation from PROJECT.md (said v6).** v6 is feature-frozen; v7 is the non-breaking successor. `createBrowserRouter` + `RouterProvider`. Pure SPA — no SSR. |
| Server state | TanStack Query | `^5.100.0` | Replaces v1 AppContext |
| Backend SDK | @supabase/supabase-js | `^2.106.0` | Confirmed |
| PWA | vite-plugin-pwa | `^1.3.0` | **Must use `strategies: 'injectManifest'`** — `generateSW` cannot include push event handlers |
| SW toolkit | workbox-precaching, workbox-routing | `^7.4.0` | Pulled in by injectManifest mode |
| Push (server) | web-push via Deno `npm:` specifier | `^3.6.7` | Runs in Supabase Edge Functions |
| Date math | Luxon | latest | Add — DST-safe streak math; chosen over date-fns-tz |
| Testing | Vitest + @testing-library/react + Playwright + MSW | per STACK.md | Playwright matches existing ship workflow |
| Styling | CSS variables + CSS Modules | — | Confirmed; no Tailwind |
| UUIDs | `crypto.randomUUID()` client + `gen_random_uuid()` Postgres default | — | Replaces v1's `'c' + Date.now()` |

**Key stack deviation — React Router v7 (not v6):** v6 is end-of-life and feature-frozen. v7 is the explicitly non-breaking upgrade. Code written against v6 future-flag APIs runs unchanged. Choosing v6 today means migrating again in 6–12 months. Update PROJECT.md Key Decisions to read "React Router v7."

---

## Key Architecture Decisions

**1. `members` is the join axis, not `auth.users`.**
Every domain row (chores, events, meals, groceries, notes) references `member_id`. `members.auth_user_id` is nullable for virtual members. This unlocks: virtual members as first-class citizens, email-change resilience, per-member RLS gating without coupling to auth provider.

**2. Custody = pattern + overrides, never per-day rows.**
Store the recurring rule once (`cycle_days SMALLINT[]`, `anchor_date`, `anchor_parent_member_id`). Generate dates on read. Allow per-date `custody_overrides` for swaps. v1's per-day approach requires rewriting hundreds of rows to change a schedule.

**3. Chores = template + `chore_completions` event log.**
Completing inserts a row; un-completing deletes it. Streak math, member page activity history, and parent-alert pushes all depend on completions as first-class data. **Must be in the initial schema — not retrofittable.**

**4. One Realtime bridge at app root, not per-component subscriptions.**
Single `useRealtimeBridge()` hook owns every `postgres_changes` channel and calls `queryClient.invalidateQueries`. Mutations use optimistic `setQueryData` + `onError` rollback + `onSettled` invalidate. Establish this pattern once, apply to all 7 domains.

**5. Push notifications are server-initiated.**
Browser inserts into `notifications_queue` (or Postgres trigger does it). `pg_cron` fires an Edge Function every minute. Edge Function calls `web-push.sendNotification()` + prunes dead subscriptions. Browser is never trusted to fan out.

**6. Custom service worker via `injectManifest`.**
We own `src/sw/sw-custom.ts`; vite-plugin-pwa injects the precache manifest. SW handles `push` (showNotification with `tag` for dedup) and `notificationclick` (focus or openWindow). `registerType: 'prompt'` + "New version" banner for controlled update UX.

---

## Table Stakes Features

- Per-member color coding across every surface
- Shared real-time grocery list
- Auto-categorization of grocery items (~200-item static map)
- Recurring chores with template + completions log
- Month-view calendar with 2-dot overflow + layer toggles (Events / Meals / Custody)
- Push notifications for events and chore-due times with configurable lead time
- One-tap mark chore complete with optimistic update + rollback
- Family timezone setting (single source of truth in `family_settings.timezone`)
- Custody visual identification on calendar (day-cell background tint, split-fill on handoff days)
- Offline read of today's data via service worker precache

---

## Top Differentiators

- **Streak recovery, not punishment.** Duolingo-style freezes (1 auto-replenished weekly, max 2 stockpiled). No hard reset on first miss. Neutral reset copy. Validated by research: Habitica's hard-reset model drives app abandonment.
- **Mixed real + virtual members.** No competitor solves this elegantly. `members.auth_user_id NULL` for virtual; "Acting as" picker lets a parent attribute actions to a virtual member with audit trail to actual parent.
- **Unified calendar with layer toggles.** "Events / Meals / Custody" chips let users dial density. Chores excluded from month view by design.
- **Member-aware push targeting.** "Chore complete" → parents only. "Event reminder" → assignees only. "Custody change" → adults only.
- **Per-member nav section visibility.** Stored in `members.visible_sections JSONB`. Kids don't see custody settings; a 6-year-old doesn't see groceries.
- **Custody pattern as a first-class entity.** One-click presets (2-2-3, alternating weeks, every other weekend, custom). Most family apps have no concept of a recurring custody schedule.

**Validated anti-features:** No points/leaderboards. No SMS. No grocery-request approval workflow. No engagement nag notifications.

---

## Critical Pitfalls

**1. iOS Web Push preconditions** — Foundation / Notifications phase.
Only works for PWAs installed via Share → Add to Home Screen. Requires `display: standalone` manifest. `Notification.requestPermission()` must be called inside a direct user gesture (no `setTimeout`, no `await` before call). No silent/data-only pushes. `PushSubscription` (not `Notification.permission`) is source of truth due to a WebKit bug.
**Prevention:** Build the iOS install-coach screen and "Turn on notifications" button into the foundation.

**2. Asking for notification permission on first page load** — Notifications phase.
Once denied, there is no recovery UI. **Prevention:** Double-permission pattern — own in-app dialog with value proposition first; native prompt only after user opts in. Trigger contextually, never on first paint.

**3. Streak math against the wrong timezone** — Chores phase.
UTC or device-local date math silently loses 11pm completions across day boundaries and breaks on DST and family travel.
**Prevention:** `family_settings.timezone` is the only source of truth. All timestamps as `TIMESTAMPTZ`. Luxon `setZone` for streak math. Test across DST transitions (March 14, November 7 2026) and device-vs-family-timezone mismatch.

**4. TEXT → UUID migration without parallel columns** — Migration phase.
v1's `'c' + Date.now()` IDs cannot cast to UUID. FKs and PKs cannot be altered atomically.
**Prevention:** Parallel `new_id UUID` columns populated via id-map join. Single-transaction cutover. Keep `old_id` for one release. Dry-run against branch DB. Full `pg_dump` before touching prod.

**5. Supabase Realtime + TanStack Query double-update** — every mutation phase.
**Prevention (Pattern A):** Mutations do optimistic `setQueryData` only (no invalidate). Realtime does `setQueryData` patch from payload (not invalidate). Always `cancelQueries` before optimistic update. Lock this pattern in before the first mutation hook ships.

**6. OAuth identity keyed by email instead of `auth.users.id`** — Foundation phase.
Emails change; `auth.users.id` UUID is stable.
**Prevention:** `members.auth_user_id UUID NULL` is the FK. `members.email` is a convenience field synced on login, never a key. `handle_new_user()` Postgres trigger auto-links new sign-ins by email match.

---

## Build Order

```
L0  Project setup          Vite + React 19 + TS + React Router v7 + Playwright + Vercel + empty Supabase project
L1  Walking Skeleton       Auth + Google OAuth + RequireAuth + QueryProvider + tab bar + empty routes + theme + error boundaries
L2  Data foundation        families/members migrations, RLS, audit triggers, realtime bridge, pre-seed family + members
L3  Members feature        CRUD, virtual members, nav visibility config, "Acting as" picker
L4  Domain features        Chores | Calendar | Custody | Meals | Groceries | Notes  (parallel-safe)
L5  PWA + Push             injectManifest SW, iOS install coach, push_subscriptions, notifications_queue, Edge Function, pg_cron, Postgres triggers
L6  Cross-cutting          Search, timezone-aware iCal, member page enrichment (streaks, activity history, stats)
L7  Data migration         v1 → v2 transform script, dry-run on branch DB, single-transaction cutover
L8  Production hardening   Error tracking, Playwright vs preview URL, perf budget
```

**Critical ordering rules:**
- RLS (L2) must be enabled before any L3+ data is inserted.
- Members (L3) before domain features (L4) — every domain row FKs to `members.id`.
- Migration (L7) runs last — v2 schema must be stable before migration is designed.
- Push (L5) triggers depend on L4 tables existing.

---

## Open Questions

| Question | Phase | Recommendation |
|----------|-------|----------------|
| Family timezone default — derived from Google, browser, or prompted? | Foundation | Prompt on first run after first parent signs in; default to browser-derived timezone |
| Roman (youngest kid) — own device or shared? | Members | If shared: "Acting as" header picker. If own device: virtual members need a single-member mode. Confirm before designing the picker UX. |
| Streak freeze on multi-day vacations — pause mode? | Chores | Yes, add "pause streaks" mode (mirrors OurFamilyWizard). Defer to a later phase if it adds MVP friction. |
| Chore due time — soft or hard? Same-day completion count? | Chores | Recommend soft. Notification fires at due time; same-day completion still increments streak. |
| Default landing page per role — kids to chores, parents to dashboard? | Members / Routing | Per-member-configurable; default `/chores` for kids, `/` for parents. |
| v1 custody data shape — periodic (importable as pattern) or irregular (overrides only)? | Migration | Inspect during dry-run. Derive pattern if regular; import all-overrides if not. |
| Push payload privacy — does "Layla completed: take medication" leak family info? | Push | Default to generic copy ("New chore activity from Layla"). Per-family "show details" toggle in Settings, defaulted off. |

---

*Research complete: 2026-05-19*
