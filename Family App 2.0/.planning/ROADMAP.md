# Roadmap: Family Hub 2.0

## Overview

Family Hub 2.0 is a mobile-first multi-tenant PWA for shared household management. The build follows a strict ordering: a hardened foundation (multi-tenant schema, RLS, realtime bridge, walking skeleton) is laid before any domain feature ships; members are stood up before any domain row exists (every domain table FKs to `members.id`); each domain feature ships as a vertical slice with optimistic mutations and realtime invalidation; push notifications are layered on after the domain tables and triggers exist; cross-cutting concerns (settings, search, member pages, compliance) follow once domains are stable; premium-tier features come after the free tier is solid; and data migration from the v1 family-hub project runs last, after the v2 schema has stopped moving.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Walking Skeleton** - Multi-tenant schema with RLS, realtime bridge, auth, routing, error boundaries, and an empty but deployable PWA shell
- [ ] **Phase 2: Members, Onboarding & Billing** - Family creation, member CRUD (real + virtual), invitations, Stripe billing infrastructure, and trial enrollment
- [ ] **Phase 3: Chores** - Templates + `chore_completions` event log + Duolingo-style streaks with freezes
- [ ] **Phase 4: Calendar & Custody** - Month grid with layer toggles, RRULE events, iCal export, custody pattern + overrides model, linked family view
- [ ] **Phase 5: Meals, Groceries & Notes** - Week meal planner with voting/history, shared real-time grocery list with Walmart/Instacart, family notes
- [ ] **Phase 6: Push Notifications & PWA** - injectManifest service worker, iOS install coach, push subscriptions, notifications queue, Edge Function dispatcher, pg_cron
- [ ] **Phase 7: Cross-Cutting — Settings, Search, Member Pages, Compliance** - Member pages with streaks/stats, global search, theme + timezone + push prefs, GDPR/COPPA/CAN-SPAM controls
- [ ] **Phase 8: Premium — Co-Parent & Info Bank** - Defensible DM record, family announcements, expense tracking, child medical/school/document storage
- [ ] **Phase 9: Premium — Rewards, Routines, Journal, AI Meals, Recipes** - Allowance + custom rewards, morning/evening routines with separate streaks, photo journal, Claude-powered meal suggestions, recipe storage linked to meal cells
- [ ] **Phase 10: Data Migration & Production Hardening** - Dry-run v1 → v2 transform on branch DB, single-transaction cutover, error tracking, perf budget

## Phase Details

### Phase 1: Foundation & Walking Skeleton
**Goal:** A deployable PWA shell where an authenticated user reaches an empty but routable app over an RLS-protected multi-tenant schema with realtime + audit + offline plumbing already wired.
**Mode:** mvp
**Depends on:** Nothing (first phase)
**Requirements:** ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, ARCH-06, ARCH-07, ARCH-08, ARCH-09, ARCH-10, ARCH-11, ARCH-13, ONBD-01
**Success Criteria** (what must be TRUE):
  1. A user can sign in with Google, land on an authenticated route, and a `RequireAuth` boundary redirects unauthenticated users to login
  2. Every table (`families`, `members`, `family_settings`, `chores`, `chore_completions`, `events`, `meals`, `groceries`, `notes`, `push_subscriptions`, `notifications_queue`) exists with `family_id`, UUID PKs, `updated_at` / `updated_by` audit columns, and RLS enabled with `family_id` + `auth_is_parent()` policies — no row is readable across families
  3. A single `useRealtimeBridge()` hook at app root subscribes to `postgres_changes` and translates them into targeted `queryClient.invalidateQueries` (verified against a manual insert)
  4. The first signed-in parent can create a family space (sets family name + emoji avatar) and a `families` row + matching `family_settings` row with timezone are written under their `family_id`
  5. The app is installed as a PWA from Vercel, error boundaries on every route catch render failures, and writes made while offline queue in IndexedDB and flush on reconnect
**Plans:** 6 plans
- [ ] 01-01-PLAN.md — Vite + React 19 + TypeScript scaffold, v1 CSS theme port, RED test stubs
- [ ] 01-02-PLAN.md — Supabase schema + RLS + helpers + allowlist bootstrap + [BLOCKING] db push
- [ ] 01-03-PLAN.md — Supabase client + Google OAuth + allowlist gate + /login + /access-denied
- [ ] 01-04-PLAN.md — TanStack Query + Router + RequireAuth/Family + RootLayout + nav + offline banner + realtime bridge + theme
- [ ] 01-05-PLAN.md — Family Creation Wizard + computeTrialEnd + Stripe Customer Edge Function + Stripe webhook
- [ ] 01-06-PLAN.md — vite-plugin-pwa + custom service worker + Vercel preview deploy + E2E smoke

### Phase 2: Members, Onboarding & Billing
**Goal:** A parent can invite, manage, and "act as" real or virtual family members; new families enter a 7-day premium trial; Stripe billing is wired and enforcing free vs premium tier.
**Mode:** mvp
**Depends on:** Phase 1
**Requirements:** ONBD-02, ONBD-03, ONBD-04, ONBD-05, MEMB-01, MEMB-02, MEMB-03, MEMB-04, MEMB-05, MEMB-06, MEMB-07
**Success Criteria** (what must be TRUE):
  1. A parent can add, edit, and delete members with custom name, emoji, color, and `visible_sections` JSONB controlling which app sections each member sees
  2. A parent can create a virtual member with no Google account (`auth_user_id = NULL`) and toggle the "Acting as" picker to attribute actions to that virtual member with the parent's `auth.users.id` recorded in the audit log
  3. A parent can invite a member by email link or share a 6-digit family code; when an invited user signs in with Google, the `handle_new_user()` Postgres trigger auto-links them to the pre-seeded member row by lowercase email
  4. A parent can create an account on behalf of a child under 13 through a COPPA-compliant parental-consent flow before any child data is recorded
  5. Every new family automatically enters a 7-day premium trial tracked in Stripe; premium-only features are gated by a `useTier()` hook driven by the Stripe subscription state
**Plans:** TBD

### Phase 3: Chores
**Goal:** Parents assign recurring chores; members one-tap complete them with optimistic update; streaks track consecutive completions DST-safely and survive a single miss via auto-replenishing freezes.
**Mode:** mvp
**Depends on:** Phase 2
**Requirements:** CHOR-01, CHOR-02, CHOR-03, CHOR-04, CHOR-05, CHOR-06, CHOR-07
**Success Criteria** (what must be TRUE):
  1. A parent can add a chore with title, assignee (member), and frequency (once / daily / weekly / monthly) and flag it as "requires parent approval" or not
  2. A member can one-tap mark a chore complete — a `chore_completions` row is inserted optimistically and rolled back on server error; un-completing deletes that row
  3. Per-chore streak count is displayed on the member page and chore card, computed in `family_settings.timezone` via Luxon, and survives one miss using a freeze (1 auto-replenished weekly, max 2 stockpiled, neutral reset copy)
  4. A `chore_due` row is written to `notifications_queue` at the configured lead time before each chore's due moment, and a `chore_completed` row is written to `notifications_queue` routed to parents-only when a kid marks complete (dispatch wiring lands in Phase 6)
  5. Recurring logic correctly advances a chore across the March 14 2026 spring-forward and November 7 2026 fall-back DST boundaries in a `family_settings.timezone` that is not the device's timezone
**Plans:** TBD
**UI hint:** yes

### Phase 4: Calendar & Custody
**Goal:** A single month grid shows events, meals, and custody blocks under user-controlled density toggles; custody is modeled as a recurring pattern with per-day overrides; iCal export is timezone-correct; linked families share a read-only custody view.
**Mode:** mvp
**Depends on:** Phase 3
**Requirements:** CALE-01, CALE-02, CALE-03, CALE-04, CALE-05, CALE-06, CALE-07, CUST-01, CUST-02, CUST-03, CUST-04, CUST-05, CUST-06, CUST-07
**Success Criteria** (what must be TRUE):
  1. A user can browse a month grid with 2-dot overflow and toggle Events / Meals / Custody layer chips to control density on mobile; calendar density does not break under the busiest realistic week
  2. A parent can create a single event or a repeating event stored as an RRULE; assignees receive an `event_reminder` push at the configurable lead time (queued in Phase 4, dispatched in Phase 6)
  3. A parent can pick a custody preset (2-2-3, alternating weeks, every other weekend) or define a custom cycle; day cells render with custodial-parent color tint and split-fill on handoff days; per-day overrides swap individual dates without touching the pattern
  4. Handoff details (dropoff parent, pickup parent, times) attach to handoff events; when the schedule pattern is modified a `custody_change` notification is queued to adult members only
  5. A parent can subscribe to an iCal export URL that emits VEVENTs in `family_settings.timezone` (not hardcoded America/Chicago), import events from Google or Apple Calendar (one-time or periodic), start a family poll with options and deadline, and view a read-only custody calendar shared from a linked family space
**Plans:** TBD
**UI hint:** yes

### Phase 5: Meals, Groceries & Notes
**Goal:** A weekly meal grid with member voting and history, a single shared real-time grocery list with auto-categorization and Walmart/Instacart links, and shared family notes — all editable from any member's device with proper edit/delete authorization.
**Mode:** mvp
**Depends on:** Phase 4
**Requirements:** MEAL-01, MEAL-02, MEAL-03, MEAL-04, GROC-01, GROC-02, GROC-03, GROC-04, GROC-05, GROC-06, NOTE-01, NOTE-02
**Success Criteria** (what must be TRUE):
  1. A parent can edit any cell of the week meal planner (Mon–Sun × Breakfast/Lunch/Dinner); any member can suggest a meal, family taps to vote (normalized `meal_votes` rows, not JSONB array), and a parent assigns a winning meal to a week cell
  2. A user can navigate backwards through past weeks of meal history and see what was planned + voted
  3. Two devices editing the grocery list see each other's adds/removes within a second over Supabase Realtime; new items are auto-categorized via a static ~200-item map, with sticky input at top and "recents" chips for quick add
  4. Each grocery item has a Walmart search link, an "Add to Instacart" per-item action, and a "Send all to Instacart" bulk button for the full list
  5. Any member can post a family note (title + body) appearing in reverse chronological order; members can edit and delete their own notes, parents can edit or delete any note, and the change appears on other devices immediately via realtime
**Plans:** TBD
**UI hint:** yes

### Phase 6: Push Notifications & PWA
**Goal:** The end-to-end push pipeline works on iOS (post-install-coach) and Android — domain events trigger Postgres → notifications_queue → Edge Function → web-push → device — with per-device opt-in, quiet hours, and a notification inbox in the nav.
**Mode:** mvp
**Depends on:** Phase 5
**Requirements:** NOTF-01, NOTF-02, NOTF-03, NOTF-04, NOTF-05, NOTF-06, NOTF-07, NOTF-08, NOTF-09
**Success Criteria** (what must be TRUE):
  1. On iOS, an install-coach screen guides Share → Add to Home Screen before any permission request; an in-app value-prop dialog (the "double-permission" pattern) precedes `Notification.requestPermission()` and the prompt only fires inside a direct user gesture
  2. A successful subscribe inserts one row in `push_subscriptions` keyed on `endpoint UNIQUE` (one row per device per member); a 404/410 response from web-push prunes the dead subscription
  3. The Postgres triggers on `chores`, `chore_completions`, `events`, and `custody_overrides` enqueue rows in `notifications_queue`; a `pg_cron` job fires the `dispatch-notifications` Edge Function every minute and `web-push.sendNotification()` actually reaches the device
  4. Push targeting is member-aware: chore-completed reaches parents only; event-reminder reaches event assignees only; custody-change reaches adult members only
  5. A user can open the notification inbox (bell icon in nav) and see recent alerts with timestamps and deep links; per-device opt-in, per-trigger toggles, quiet hours, and CAN-SPAM marketing unsubscribe controls are all functional
**Plans:** TBD
**UI hint:** yes

### Phase 7: Cross-Cutting — Settings, Search, Member Pages, Compliance
**Goal:** Settings, search, richer member pages, and compliance controls bring the free tier to ship-readiness.
**Mode:** mvp
**Depends on:** Phase 6
**Requirements:** PAGE-01, PAGE-02, PAGE-03, PAGE-04, SRCH-01, SETT-01, SETT-02, SETT-03, SETT-04, SETT-05, COMP-01, COMP-02, COMP-03, COMP-04
**Success Criteria** (what must be TRUE):
  1. A user can open their member page and see current streak count + freeze status per chore, an activity feed (recent completions, events, notes posted), upcoming events assigned to them, and stats (completion rate, total completions, longest streak)
  2. A user can search across chores, events, groceries, and notes from a single input and tap a result to deep-link to the source
  3. A parent can change family timezone (single source of truth for streaks, recurrence, and iCal export), pick Lavender or Midnight theme, manage members + link/unlink Google accounts, configure per-device + per-trigger push preferences, and open the Stripe billing portal to upgrade / downgrade / cancel
  4. A user can request a full data export and trigger account deletion (GDPR), and a child under 13 cannot be onboarded without the parental-consent flow recorded (COPPA)
  5. The privacy policy and terms of service are linked from login and settings; every marketing email and notification stream has an unsubscribe / opt-out path (CAN-SPAM)
**Plans:** TBD
**UI hint:** yes

### Phase 8: Premium — Co-Parent & Info Bank
**Goal:** Two premium pillars aimed at separated-parent and child-management use cases — a defensible, immutable DM channel + family announcement feed + expense ledger, and a structured per-child info bank with documents.
**Mode:** mvp
**Depends on:** Phase 7
**Requirements:** COPR-01, COPR-02, COPR-03, COPR-04, INFO-01, INFO-02, INFO-03, INFO-04
**Success Criteria** (what must be TRUE):
  1. Two co-parents can DM in a private channel where messages are timestamped, immutable (no edit, no delete), with read receipts — producing a defensible record
  2. A parent can post to a family-wide announcement feed visible to every member of the family
  3. A co-parent can log a child-related expense, request reimbursement from the other co-parent, and a running balance is tracked per co-parent
  4. A parent can record per-child medical info (allergies, medications, doctor contacts, insurance) and per-child school info (school name, teacher, grade, important dates), and maintain a shared emergency-contacts list (doctors, teachers, coaches, babysitters)
  5. A parent can upload PDFs (shot records, school forms, custody orders) to Supabase Storage scoped to their family, and any family member with the right `visible_sections` can view them
**Plans:** TBD
**UI hint:** yes

### Phase 9: Premium — Rewards, Routines, Journal, AI Meals, Recipes
**Goal:** The "delight" premium tier — allowance & custom rewards on top of chores, ordered routines with their own streaks, a private family photo feed, Claude-powered meal suggestions, and recipe storage linked into the meal planner.
**Mode:** mvp
**Depends on:** Phase 8
**Requirements:** RWRD-01, RWRD-02, ROUT-01, ROUT-02, ROUT-03, JOUR-01, JOUR-02, AIME-01, AIME-02, RECP-01, RECP-02
**Success Criteria** (what must be TRUE):
  1. A parent can assign a dollar value per chore, approve withdrawals, and the app tracks a running balance per member; parents can also define custom rewards (e.g., "choose dinner," "extra screen time") that kids redeem with earned credits
  2. A parent can build an ordered step checklist (e.g., "brush teeth → pack backpack → shoes on") and a kid can swipe through the steps; individual steps can be flagged "requires parent approval"; routine streaks are tracked separately from chore streaks
  3. A family member can post a photo with a caption to a private family feed; other members can leave comments and emoji reactions
  4. The Claude API generates a personalized weekly meal-suggestion set scoped to that family's food preferences, dietary restrictions, and past meal history, and these suggestions appear as meal recommendations the family can vote on
  5. A parent can store a full recipe (ingredients, steps, serving size) in the app and link that recipe to any planned meal cell in the week grid
**Plans:** TBD
**UI hint:** yes

### Phase 10: Data Migration & Production Hardening
**Goal:** v1 family-hub data is transformed and loaded into the v2 schema in a single-transaction cutover after a successful dry-run on a branch DB, and the app is production-hardened (error tracking, Playwright vs preview URL, perf budget).
**Mode:** mvp
**Depends on:** Phase 9 (schema must be stable)
**Requirements:** ARCH-12
**Success Criteria** (what must be TRUE):
  1. A dry-run transform script reads every row from the v1 Supabase project (members, chores, events, meals, groceries, notes, custody) and writes them to a v2 branch DB through parallel `new_id UUID` columns populated via id-map join — no FK violations, no row loss
  2. The cutover plan executes in a single Postgres transaction with `old_id` retained for one release, a full `pg_dump` taken before touching prod, and rollback documented
  3. Post-migration, every v1 record is queryable in v2 under the correct `family_id`, all RLS policies still pass, and a Playwright smoke run against the migrated preview URL is green
  4. Error tracking is wired (every unhandled error surfaces with breadcrumbs), a perf budget is enforced in CI, and the Playwright suite runs against the Vercel preview URL on every push
  5. v1 custody data is correctly interpreted — if periodic, derived into a `custody_patterns` row; if irregular, imported as `custody_overrides` — and a single `family_settings.timezone` is set per migrated family
**Plans:** TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Walking Skeleton | 0/6 | Not started | - |
| 2. Members, Onboarding & Billing | 0/TBD | Not started | - |
| 3. Chores | 0/TBD | Not started | - |
| 4. Calendar & Custody | 0/TBD | Not started | - |
| 5. Meals, Groceries & Notes | 0/TBD | Not started | - |
| 6. Push Notifications & PWA | 0/TBD | Not started | - |
| 7. Cross-Cutting — Settings, Search, Member Pages, Compliance | 0/TBD | Not started | - |
| 8. Premium — Co-Parent & Info Bank | 0/TBD | Not started | - |
| 9. Premium — Rewards, Routines, Journal, AI Meals, Recipes | 0/TBD | Not started | - |
| 10. Data Migration & Production Hardening | 0/TBD | Not started | - |

---

*Roadmap created: 2026-05-19*
*Granularity: standard*
*Mode: mvp (vertical slices)*
*Coverage: 100 / 100 v1 requirements mapped (88 listed; counts in REQUIREMENTS.md restated below for accuracy)*
