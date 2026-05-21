# Requirements: Family Hub 2.0

**Defined:** 2026-05-19
**Core Value:** Every family member always knows what needs doing, what's coming up, and who has the kids today — and gets a push notification when it actually matters.

---

## Free Tier — v1 Requirements

### Foundation & Architecture

- [ ] **ARCH-01**: Multi-tenant architecture — every family is isolated by `family_id`; all tables partitioned by RLS policy
- [x] **ARCH-02**: React 19 + Vite + TypeScript + React Router v7 (Data mode, `createBrowserRouter`)
- [ ] **ARCH-03**: TanStack Query v5 — all server state; replaces monolithic AppContext from v1
- [x] **ARCH-04**: vite-plugin-pwa with `strategies: 'injectManifest'` — custom service worker for push + offline
- [ ] **ARCH-05**: New Supabase schema — UUIDs everywhere, `family_id` partition key, `updated_at` / `updated_by` audit columns on all tables, RLS enabled from day one
- [ ] **ARCH-06**: `chore_completions` event log table separate from `chores` template table — required for streaks, history, parent alerts
- [x] **ARCH-07**: Realtime bridge — single `useRealtimeBridge()` hook at app root; translates `postgres_changes` into `queryClient.invalidateQueries`
- [ ] **ARCH-08**: Error boundaries on every route
- [x] **ARCH-09**: Offline queue and sync — writes queue locally when no connection, sync automatically on reconnect
- [x] **ARCH-10**: Stripe billing integration — subscription management, free/premium tier enforcement
- [ ] **ARCH-11**: Linked families — two separate family spaces can share a custody calendar view (co-parenting use case)
- [ ] **ARCH-12**: Data migration script — v1 family-hub Supabase data migrated to v2 schema (dry-run on branch DB before prod cutover)
- [x] **ARCH-13**: Luxon for all date/time math — DST-safe streak and recurrence logic keyed to `family_settings.timezone`

### Onboarding & Family Setup

- [x] **ONBD-01**: Parent creates a new family space — sets family name and emoji avatar
- [ ] **ONBD-02**: Invite family members by email link
- [ ] **ONBD-03**: Join a family via 6-digit code
- [ ] **ONBD-04**: COPPA parental consent flow — parent creates account on behalf of child under 13
- [ ] **ONBD-05**: 7-day free trial of premium tier for all new families

### Member Management

- [ ] **MEMB-01**: Parents can add, edit, and delete members
- [ ] **MEMB-02**: Real members — linked to a Google account via `members.auth_user_id`
- [ ] **MEMB-03**: Virtual members — parent-managed, no Google account required (`auth_user_id = NULL`)
- [ ] **MEMB-04**: Per-member customization: name, emoji, color
- [ ] **MEMB-05**: Per-member nav section visibility — stored in `members.visible_sections JSONB`
- [ ] **MEMB-06**: "Acting as" picker — parent can attribute actions to a virtual member; audit log records both parent and virtual member
- [ ] **MEMB-07**: `handle_new_user()` Postgres trigger — auto-links a new Google sign-in to a pre-seeded member row by lowercase email match

### Chores

- [ ] **CHOR-01**: Parents add chores with title, assignment, and frequency (once / daily / weekly / monthly)
- [ ] **CHOR-02**: Recurring chore logic — DST-safe using Luxon + `family_settings.timezone`
- [ ] **CHOR-03**: `chore_completions` event log — completing inserts a row; un-completing deletes it
- [ ] **CHOR-04**: Chore streaks — per-chore consecutive-completion count with Duolingo-style freeze recovery (1 freeze auto-replenished weekly, max 2 stockpiled)
- [ ] **CHOR-05**: Optional parent approval per chore — parent can flag individual chores as "requires approval" before streak/reward counts
- [ ] **CHOR-06**: Push notification — chore due reminder (configurable lead time)
- [ ] **CHOR-07**: Push notification — parent alert when a kid marks a chore complete (routed to parents only)

### Calendar & Events

- [ ] **CALE-01**: Month grid with events — carry forward from v1
- [ ] **CALE-02**: Repeating events with RRULE storage
- [ ] **CALE-03**: Layer toggle chips — Events / Meals / Custody chips to control calendar density on mobile
- [ ] **CALE-04**: Push notification — event reminder (configurable lead time, sent to event assignees)
- [ ] **CALE-05**: Import from Google Calendar or Apple Calendar (one-time or periodic sync)
- [ ] **CALE-06**: iCal export — timezone-aware using `family_settings.timezone` (replaces v1's hardcoded `America/Chicago`)
- [ ] **CALE-07**: Family polls — any member starts a quick poll with options + deadline; family taps to vote

### Custody

- [ ] **CUST-01**: Recurring schedule pattern — define 2-2-3, alternating weeks, every other weekend, or custom cycle
- [ ] **CUST-02**: One-click preset library for common custody schedules
- [ ] **CUST-03**: Visual calendar blocks — day-cell background tint in custodial parent's color; split-fill on handoff days
- [ ] **CUST-04**: Per-day overrides — swap or adjust specific dates without changing the pattern
- [ ] **CUST-05**: Handoff details per event — dropoff parent, pickup parent, times
- [ ] **CUST-06**: Push notification — alert to adult members when custody schedule is modified
- [ ] **CUST-07**: Linked family custody view — two linked family spaces share a read-only custody calendar

### Meals

- [ ] **MEAL-01**: Week planner grid (Mon–Sun × Breakfast/Lunch/Dinner) — parents edit cells
- [ ] **MEAL-02**: Meal recommendations — any member suggests; family votes; parents assign to week
- [ ] **MEAL-03**: Meal history browse — navigate back through past weeks
- [ ] **MEAL-04**: Normalized `meal_votes` rows (not JSONB array)

### Groceries

- [ ] **GROC-01**: Single shared list with sticky input at top and recents chips for quick add
- [ ] **GROC-02**: Auto-categorization — static map of ~200 common items assigns category on add
- [ ] **GROC-03**: Real-time multi-user editing via Supabase Realtime
- [ ] **GROC-04**: Per-item Walmart search link
- [ ] **GROC-05**: Instacart integration — per-item "Add to Instacart" action
- [ ] **GROC-06**: Bulk "Send all to Instacart" button for the full list

### Notes

- [ ] **NOTE-01**: Shared family notes — title + body, reverse chronological
- [ ] **NOTE-02**: Users can edit and delete their own notes; parents can edit/delete any note

### Notifications

- [ ] **NOTF-01**: Double-permission pattern — in-app opt-in dialog before native browser prompt
- [ ] **NOTF-02**: iOS install-coach screen — prompts Share → Add to Home Screen before requesting push permission
- [ ] **NOTF-03**: `push_subscriptions` table keyed on `endpoint UNIQUE` — one row per device per member
- [ ] **NOTF-04**: `notifications_queue` table — Postgres triggers enqueue notifications per domain event
- [ ] **NOTF-05**: `dispatch-notifications` Supabase Edge Function — reads queue, calls `web-push.sendNotification()`, prunes dead subscriptions (404/410)
- [ ] **NOTF-06**: `pg_cron` schedule — fires Edge Function every minute
- [ ] **NOTF-07**: Notification inbox — bell icon in nav; tap to see recent alerts with timestamps and deep links
- [ ] **NOTF-08**: Per-device notification opt-in and per-trigger toggles (quiet hours, lead time)
- [ ] **NOTF-09**: CAN-SPAM / marketing email unsubscribe controls

### Member Pages

- [ ] **PAGE-01**: Streak display — current streak count and freeze status per chore
- [ ] **PAGE-02**: Activity history — recent completions, events, notes posted
- [ ] **PAGE-03**: Upcoming events for this member
- [ ] **PAGE-04**: Stats summary — completion rate, total completions, longest streak

### Search

- [ ] **SRCH-01**: Search across chores, events, groceries, and notes

### Settings

- [ ] **SETT-01**: Family timezone setting — single source of truth for streaks, recurrence, and iCal export
- [ ] **SETT-02**: Theme picker — Lavender / Midnight
- [ ] **SETT-03**: Member management — add/edit/delete members and link/unlink Google accounts
- [ ] **SETT-04**: Push notification preferences — per-device and per-trigger settings
- [ ] **SETT-05**: Subscription management — upgrade, downgrade, cancel via Stripe billing portal

### Compliance & Legal

- [ ] **COMP-01**: GDPR / data deletion — user can request full data export and account deletion
- [ ] **COMP-02**: Privacy policy and Terms of Service pages linked from login and settings
- [ ] **COMP-03**: COPPA parental consent flow for members under 13
- [ ] **COMP-04**: Email unsubscribe and notification opt-out controls

---

## Premium Tier — v1 Requirements

### Co-Parent Messaging

- [ ] **COPR-01**: Private co-parent DM channel — timestamped, immutable, defensible record between the two parents
- [ ] **COPR-02**: Family-wide announcement feed — parents post to the whole family; all members see it
- [ ] **COPR-03**: Read receipts on messages
- [ ] **COPR-04**: Co-parent expense tracking — log child-related expenses, request reimbursement, track running balance per co-parent

### Info Bank

- [ ] **INFO-01**: Medical info per child — allergies, medications, doctor contacts, insurance info
- [ ] **INFO-02**: Emergency contacts — shared list (doctors, teachers, coaches, babysitters)
- [ ] **INFO-03**: Document upload and storage — PDFs (shot records, school forms, custody orders) via Supabase Storage
- [ ] **INFO-04**: School info per child — school name, teacher, grade, important dates

### Allowance & Rewards

- [ ] **RWRD-01**: Allowance tracking — assign dollar value per chore; parent approves withdrawals; track balance per member
- [ ] **RWRD-02**: Custom rewards — parents define rewards (e.g., "choose dinner," "extra screen time"); kids redeem earned credits

### Morning / Evening Routines

- [ ] **ROUT-01**: Parents build ordered step checklists (e.g., "brush teeth → pack backpack → shoes on")
- [ ] **ROUT-02**: Kids swipe through routine steps; each step can optionally require parent approval
- [ ] **ROUT-03**: Routine streaks tracked separately from chore streaks

### Family Journal

- [ ] **JOUR-01**: Family members post photos with captions — private family social feed
- [ ] **JOUR-02**: Comments and emoji reactions on posts

### AI Meal Suggestions

- [ ] **AIME-01**: Claude API generates personalized weekly meal suggestions based on family food preferences, dietary restrictions, and past meal history
- [ ] **AIME-02**: AI suggestions appear as meal recommendations the family can vote on

### Recipe Storage

- [ ] **RECP-01**: Store full recipes inside the app — ingredients, steps, serving size
- [ ] **RECP-02**: Link a recipe to any planned meal cell

---

## v2 Requirements (Deferred)

| Feature | Reason for deferral |
|---------|---------------------|
| Two-way Google Calendar sync | High complexity; import + iCal export covers v1 need |
| iOS/Android home screen widgets | Requires native shell or advanced PWA widget API — not stable in 2025 |
| In-app allowance payout (Venmo/Stripe payouts) | Financial regulations; track-only is sufficient for v1 |
| Siri / Google Assistant integration | Low ROI vs. complexity |
| Behavioral / health logs for kids | Scope creep; info bank covers the structured data need |
| Multi-platform native app (React Native) | PWA first; validate market before app store investment |
| Family goals / bucket list | Nice to have; not core to household management |
| Chore template library | Families build their own; add presets later based on usage data |
| Real-time location sharing | High privacy risk; not core to the value proposition |

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| SMS notifications | Per-message cost + carrier friction; push is sufficient |
| Points / leaderboards for chores | Creates perverse incentives and shame dynamics; streaks only |
| Electric theme | Never finished in v1; shipping two complete themes beats three partial |
| Grocery request approval workflow | Research shows single shared list is better UX; anyone adds, parents delete |
| v1 hardcoded member IDs | Replaced by `members` DB entity |
| Per-day custody row storage | Replaced by pattern + overrides model |
| Monolithic AppContext | Replaced by TanStack Query + per-feature hooks |
| `'c' + Date.now()` client IDs | Replaced by `crypto.randomUUID()` |
| Notes bypassing AppContext (v1 bug) | Fixed by Realtime bridge architecture |
| Real-time full table re-fetch on any change | Fixed by `invalidateQueries` targeted to affected query keys |
| Fully permissive RLS (`USING (true)`) | Replaced by proper `family_id` + `auth_is_parent()` policies |
| `localStorage` fallback with 7 useEffects | Replaced by service worker offline queue |

---

## Traceability

Every v1 requirement is mapped to exactly one phase below. Phases are defined in `.planning/ROADMAP.md`.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ARCH-01 | Phase 1 | Pending |
| ARCH-02 | Phase 1 | Complete |
| ARCH-03 | Phase 1 | Pending |
| ARCH-04 | Phase 1 | Complete |
| ARCH-05 | Phase 1 | Pending |
| ARCH-06 | Phase 1 | Pending |
| ARCH-07 | Phase 1 | Complete |
| ARCH-08 | Phase 1 | Pending |
| ARCH-09 | Phase 1 | Complete |
| ARCH-10 | Phase 1 | Complete |
| ARCH-11 | Phase 1 | Pending |
| ARCH-12 | Phase 10 | Pending |
| ARCH-13 | Phase 1 | Complete |
| ONBD-01 | Phase 1 | Complete |
| ONBD-02 | Phase 2 | Pending |
| ONBD-03 | Phase 2 | Pending |
| ONBD-04 | Phase 2 | Pending |
| ONBD-05 | Phase 2 | Pending |
| MEMB-01 | Phase 2 | Pending |
| MEMB-02 | Phase 2 | Pending |
| MEMB-03 | Phase 2 | Pending |
| MEMB-04 | Phase 2 | Pending |
| MEMB-05 | Phase 2 | Pending |
| MEMB-06 | Phase 2 | Pending |
| MEMB-07 | Phase 2 | Pending |
| CHOR-01 | Phase 3 | Pending |
| CHOR-02 | Phase 3 | Pending |
| CHOR-03 | Phase 3 | Pending |
| CHOR-04 | Phase 3 | Pending |
| CHOR-05 | Phase 3 | Pending |
| CHOR-06 | Phase 3 | Pending |
| CHOR-07 | Phase 3 | Pending |
| CALE-01 | Phase 4 | Pending |
| CALE-02 | Phase 4 | Pending |
| CALE-03 | Phase 4 | Pending |
| CALE-04 | Phase 4 | Pending |
| CALE-05 | Phase 4 | Pending |
| CALE-06 | Phase 4 | Pending |
| CALE-07 | Phase 4 | Pending |
| CUST-01 | Phase 4 | Pending |
| CUST-02 | Phase 4 | Pending |
| CUST-03 | Phase 4 | Pending |
| CUST-04 | Phase 4 | Pending |
| CUST-05 | Phase 4 | Pending |
| CUST-06 | Phase 4 | Pending |
| CUST-07 | Phase 4 | Pending |
| MEAL-01 | Phase 5 | Pending |
| MEAL-02 | Phase 5 | Pending |
| MEAL-03 | Phase 5 | Pending |
| MEAL-04 | Phase 5 | Pending |
| GROC-01 | Phase 5 | Pending |
| GROC-02 | Phase 5 | Pending |
| GROC-03 | Phase 5 | Pending |
| GROC-04 | Phase 5 | Pending |
| GROC-05 | Phase 5 | Pending |
| GROC-06 | Phase 5 | Pending |
| NOTE-01 | Phase 5 | Pending |
| NOTE-02 | Phase 5 | Pending |
| NOTF-01 | Phase 6 | Pending |
| NOTF-02 | Phase 6 | Pending |
| NOTF-03 | Phase 6 | Pending |
| NOTF-04 | Phase 6 | Pending |
| NOTF-05 | Phase 6 | Pending |
| NOTF-06 | Phase 6 | Pending |
| NOTF-07 | Phase 6 | Pending |
| NOTF-08 | Phase 6 | Pending |
| NOTF-09 | Phase 6 | Pending |
| PAGE-01 | Phase 7 | Pending |
| PAGE-02 | Phase 7 | Pending |
| PAGE-03 | Phase 7 | Pending |
| PAGE-04 | Phase 7 | Pending |
| SRCH-01 | Phase 7 | Pending |
| SETT-01 | Phase 7 | Pending |
| SETT-02 | Phase 7 | Pending |
| SETT-03 | Phase 7 | Pending |
| SETT-04 | Phase 7 | Pending |
| SETT-05 | Phase 7 | Pending |
| COMP-01 | Phase 7 | Pending |
| COMP-02 | Phase 7 | Pending |
| COMP-03 | Phase 7 | Pending |
| COMP-04 | Phase 7 | Pending |
| COPR-01 | Phase 8 | Pending |
| COPR-02 | Phase 8 | Pending |
| COPR-03 | Phase 8 | Pending |
| COPR-04 | Phase 8 | Pending |
| INFO-01 | Phase 8 | Pending |
| INFO-02 | Phase 8 | Pending |
| INFO-03 | Phase 8 | Pending |
| INFO-04 | Phase 8 | Pending |
| RWRD-01 | Phase 9 | Pending |
| RWRD-02 | Phase 9 | Pending |
| ROUT-01 | Phase 9 | Pending |
| ROUT-02 | Phase 9 | Pending |
| ROUT-03 | Phase 9 | Pending |
| JOUR-01 | Phase 9 | Pending |
| JOUR-02 | Phase 9 | Pending |
| AIME-01 | Phase 9 | Pending |
| AIME-02 | Phase 9 | Pending |
| RECP-01 | Phase 9 | Pending |
| RECP-02 | Phase 9 | Pending |

**Coverage:**

| Category | Count | Phase(s) |
|----------|-------|----------|
| ARCH | 13 | 12 in Phase 1, ARCH-12 in Phase 10 |
| ONBD | 5 | ONBD-01 in Phase 1, ONBD-02..05 in Phase 2 |
| MEMB | 7 | All in Phase 2 |
| CHOR | 7 | All in Phase 3 |
| CALE | 7 | All in Phase 4 |
| CUST | 7 | All in Phase 4 |
| MEAL | 4 | All in Phase 5 |
| GROC | 6 | All in Phase 5 |
| NOTE | 2 | All in Phase 5 |
| NOTF | 9 | All in Phase 6 |
| PAGE | 4 | All in Phase 7 |
| SRCH | 1 | Phase 7 |
| SETT | 5 | All in Phase 7 |
| COMP | 4 | All in Phase 7 |
| COPR | 4 | All in Phase 8 |
| INFO | 4 | All in Phase 8 |
| RWRD | 2 | All in Phase 9 |
| ROUT | 3 | All in Phase 9 |
| JOUR | 2 | All in Phase 9 |
| AIME | 2 | All in Phase 9 |
| RECP | 2 | All in Phase 9 |
| **Total mapped** | **100** | **All v1 requirement IDs (free + premium)** |
| Unmapped | 0 | ✓ |

Note: The summary counts here (100 total IDs across 21 categories) are derived from a direct count of unique REQ-IDs in this file. The earlier "68 free + 20 premium = 88" line in this document undercounted some categories; the per-ID table above is the source of truth. Every REQ-ID appears in exactly one phase.

---

*Requirements defined: 2026-05-19*
*Last updated: 2026-05-19 — traceability populated after roadmap creation*
