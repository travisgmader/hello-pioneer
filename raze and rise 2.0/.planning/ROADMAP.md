# Roadmap — Raze and Rise v2

> 6 phases · 123 requirements mapped · MVP mode (vertical slices)
> Granularity: standard · Created: 2026-05-18

---

## Phases

- [>] **Phase 1: Foundation** — Expo bare workflow, normalized schema + RLS, PowerSync offline sync, MMKV session, all auth providers, EAS Build, v1 migration script, 5-tab nav, onboarding (4/9 plans complete)
- [ ] **Phase 2: Core Session Loop** — Rest timer (background notification), previous performance column, set types, RPE, warm-up flag, supersets, bodyweight exercise, session notes, injury map, Anubis overlay, offline persistence
- [ ] **Phase 3: Templates, Programs & Progress** — Searchable exercise library + ExerciseDB videos, template builder with supersets, editable history, manual + AI program builder, deload system, progress charts, measurement history, progress photos, gamification
- [ ] **Phase 4: Premium & AI** — RevenueCat billing (StoreKit + Google Play + Stripe web), premium JWT auth hook, AI coach chat (streaming, rate-limited), AI workout generation, AI meal planning, Instacart MCP, supplement checklist, meal reminders, nutrition from Apple Health
- [ ] **Phase 5: Wearables & Notifications** — HealthKit (iOS), Health Connect (Android), Terra API (Garmin/Whoop/Fitbit/Suunto), recovery score on Dashboard, server-side push notifications via pg_cron, smart timing, PR alerts, weekly summary
- [ ] **Phase 6: Polish & Platform** — Onboarding improvements, sharing (workout card + public link + template links + calendar sync), full data export, home screen widgets (iOS), PWA, admin panel, App Store/Play Store submission

---

## Phase Details

### Phase 1: Foundation

**Goal:** The app exists as a native Expo shell with authenticated access, a normalized Supabase schema, offline sync running, all three auth providers working (email + Google + Apple), v1 data migrated, 5-tab navigation in place, and a first-run onboarding flow that leaves a new user with a profile, split type, and first workout template before they reach the Dashboard.
**Mode:** mvp
**Depends on:** Nothing
**Requirements:** FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, FOUND-06, FOUND-07, FOUND-08, FOUND-09, AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-08, NAV-01, NAV-02, NAV-03, ONBOARD-01, ONBOARD-02, ONBOARD-03, ONBOARD-04, ONBOARD-05, ONBOARD-06, DATA-01, DATA-02, DATA-03, DESIGN-01, DESIGN-04
**Success Criteria:**

1. User can create an account with email/password, sign in with Google OAuth, or sign in with Apple — all three paths reach the app without errors
2. A new user who completes onboarding (profile → split → template → practice set) lands on the Dashboard with their split type and first template already configured
3. The app can start and log a set with no network connection; the set is visible in the active session immediately and syncs to Supabase when connectivity returns
4. Navigating to all five tabs (Dashboard / Workouts / Split / Progress / Settings) works offline and the active tab is visually highlighted
5. Existing v1 user data (workout history, templates, split settings, measurements) is queryable from the normalized v2 tables after the migration script runs

**Plans:** 6 plans
Plans:
**Wave 1**

- [x] 01-scaffold-init-PLAN.md — Bare Expo scaffold, NativeWind tokens, EAS build, Wave 0 test infra (complete — 35db137)
- [x] 01-scaffold-lib-PLAN.md — MMKV+SecureStore, Supabase client, PowerSync schema/connector, core hooks (complete — 7344562)
- [x] 01-schema-PLAN.md — 9-table schema + RLS + PowerSync publication, 36 exercises seeded (complete — ccbbf73)

**Wave 2**

- [x] 01-scaffold-ui-PLAN.md — 10 design-system atom components (Button, TextInput, Label, HelperText, Divider, IconButton, Toggle, Chip, ProgressBar, Spinner) (complete — 3bb7c74)
- [ ] 01-scaffold-routing-PLAN.md — Expo Router layout files, root layout gate, tab navigator, onboarding stack

**Wave 3** *(blocked on Wave 1 completion)*

- [ ] 01-auth-PLAN.md — Email auth, Google OAuth, Apple Sign-In, password reset, change password, SMS MFA, sign-out
- [ ] 01-navigation-onboarding-PLAN.md — 5-tab nav, onboarding stack (profile + split + template + practice set + Dashboard), notification preference
- [ ] 01-migration-PLAN.md — v1 migration Edge Function, client trigger + polling, migration progress screen

**Wave 4** *(blocked on Wave 3 completion)*

- [ ] 01-skeleton-verification-PLAN.md — End-to-end Walking Skeleton test, EAS dev build verification, VERIFICATION.md

---

### Phase 2: Core Session Loop

**Goal:** The primary workout logging experience — starting a session, logging sets with the previous-performance column visible, rest timer auto-firing with a background notification, marking warm-up sets, adding RPE and notes, pairing exercises as supersets, logging bodyweight exercises — works end-to-end offline, survives app backgrounding without data loss, and triggers the Anubis animation on completion.
**Mode:** mvp
**Depends on:** Phase 1
**Requirements:** WORKOUT-01, WORKOUT-02, WORKOUT-03, WORKOUT-04, WORKOUT-05, WORKOUT-06, WORKOUT-07, WORKOUT-08, WORKOUT-09, WORKOUT-10, WORKOUT-11, WORKOUT-12, WORKOUT-13, WORKOUT-14, WORKOUT-15, WORKOUT-16, WORKOUT-17, WORKOUT-18, DESIGN-02, DESIGN-03
**Success Criteria:**

1. User starts a workout, logs all sets (with weights and go/no-go), and the previous session's weight and result appear per set row — tapping the previous value auto-fills the current input
2. Completing a working set auto-starts a countdown rest timer; when the timer reaches zero, the device vibrates and a notification fires even when the app is backgrounded or the screen is locked
3. User can flag any set as a warm-up and add an RPE (1–10) to any set; warm-up sets are excluded from go-rate totals and PR detection
4. Two exercises can be paired as a superset: completing a set on exercise A auto-scrolls to exercise B; the rest timer fires only after both exercises in the round are marked; then scrolls back to A
5. Completing a workout triggers the Anubis loading animation, commits the session to history in PowerSync, and advances the split rotation pointer — even if the device loses network before or during completion

**Plans:** TBD
**UI hint**: yes

---

### Phase 3: Templates, Programs & Progress

**Goal:** Users can build, manage, and share templates from a searchable exercise library with demo videos; create or AI-generate multi-week programs; edit completed sessions retroactively; view per-exercise progression charts and measurement history; upload progress photos; and see deload suggestions — all of which drives engagement between sessions, not just during them. Note: Apply for Garmin and Whoop developer access during this phase (2–4 week approval lead time needed before Phase 5).
**Mode:** mvp
**Depends on:** Phase 2
**Requirements:** TEMPLATE-01, TEMPLATE-02, TEMPLATE-03, TEMPLATE-04, TEMPLATE-05, TEMPLATE-06, TEMPLATE-07, TEMPLATE-08, TEMPLATE-09, PROGRAM-01, PROGRAM-02, PROGRAM-03, PROGRAM-04, PROGRAM-05, PROGRAM-06, PROGRAM-07, PROGRESS-01, PROGRESS-02, PROGRESS-03, PROGRESS-04, PROGRESS-05, HISTORY-01, HISTORY-02, HISTORY-03, PHOTO-01, PHOTO-02, PHOTO-03, GAMIFY-01, GAMIFY-02, GAMIFY-03
**Success Criteria:**

1. User can search the exercise library by name or muscle group, view a demonstration video/GIF per exercise, create a custom exercise, and build a new template with sets, rep ranges, rest overrides, and superset pairings — without leaving the template builder
2. User can create a multi-week training program manually or ask Claude to generate one from a goal, current lifts, and equipment; the app advances the program week-over-week automatically
3. After N weeks in a phase (default: 4), the app surfaces a deload suggestion; toggling deload mode reduces all suggested weights to 60–70% of normal; the manual deload toggle in Split settings overrides auto-detection
4. Progress page shows per-exercise weight progression chart, volume bar chart, and measurement history chart — all filterable by date range; editing a completed session's weights or results is reflected in charts immediately
5. User can upload a progress photo, view them in chronological order, and select any two dates for side-by-side comparison; achievement badges unlock for real milestones (first workout, 100 workouts, 30-day streak)

**Plans:** TBD
**UI hint**: yes

---

### Phase 4: Premium & AI

**Goal:** RevenueCat subscription billing is live on iOS (StoreKit), Android (Google Play Billing), and web (Stripe); the premium JWT claim gates AI features at the server layer; AI coach chat streams responses through a rate-limited Edge Function; AI workout and program generation work from user history; AI meal planning returns a full weekly plan with recipes cached offline for the current week; and the Instacart MCP integration produces a shareable shopping list URL from the ingredient list.
**Mode:** mvp
**Depends on:** Phase 3
**Requirements:** MONETIZE-01, MONETIZE-02, MONETIZE-03, MONETIZE-04, MONETIZE-05, AI-01, AI-02, AI-03, AI-04, AI-05, AI-06, AI-07, NUTRITION-01, NUTRITION-02, NUTRITION-03, NUTRITION-04, NUTRITION-05, NUTRITION-06, NUTRITION-07, NUTRITION-08, AUTH-07
**Success Criteria:**

1. Free user tapping a premium feature (AI chat, AI meal plan, AI program generation) sees an upgrade prompt with clear value copy; tapping "Unlock Coach" initiates the native StoreKit/Google Play purchase sheet — Stripe web checkout is the path on web
2. After subscribing, the JWT carries the `premium` claim on the next token refresh; the AI coach chat is immediately accessible without re-launch; Edge Function rejects AI requests from non-premium users with a 402 before any Claude API call is made
3. AI coach chat streams responses progressively (first token visible within 3 seconds on LTE); rate limit counter resets daily; exceeding the daily cap shows a clear "come back tomorrow" message rather than an error
4. User can specify goal + equipment and receive an AI-generated workout ready to start; user can specify goal + current lifts + weeks and receive a full multi-week program structure they can accept, regenerate, or edit
5. User can generate a weekly meal plan; each day shows meals with macro breakdown and ingredient list; tapping "Order on Instacart" opens the Instacart-generated shopping list URL in the browser; the current week's plan is readable offline after first load

**Plans:** TBD
**UI hint**: yes

---

### Phase 5: Wearables & Notifications

**Goal:** HealthKit (iOS) and Health Connect (Android) sync HRV, sleep, steps, and post-workout heart rate; Terra API connects Garmin, Whoop, Fitbit, and Suunto through a single OAuth widget flow; a recovery score from the connected wearable appears above today's workout on the Dashboard; all push notifications are dispatched server-side via pg_cron (never client-scheduled on Android); workout reminders use smart timing that learns from actual session timestamps; and PR alerts and weekly summaries fire reliably.
**Mode:** mvp
**Depends on:** Phase 4
**Requirements:** WEARABLE-01, WEARABLE-02, WEARABLE-03, WEARABLE-04, WEARABLE-05, WEARABLE-06, NOTIFY-01, NOTIFY-02, NOTIFY-03, NOTIFY-04, NOTIFY-05, NOTIFY-06, PROGRESS-06
**Success Criteria:**

1. On iOS, granting HealthKit permission makes HRV, sleep hours, and step count appear in the app within the same session; after completing a workout, post-workout heart rate data is pulled from Apple Health and stored with the session record
2. On Android, Health Connect authorization makes sleep and step count visible in the app; the app does not use the deprecated Google Fit API
3. User can connect Garmin, Whoop, Fitbit, or Suunto through the Terra widget flow; Settings → Connections shows each device with connection status, last sync time, and a Disconnect button; Garmin and Whoop developer access applications are submitted (note: 2–4 week approval lead time)
4. A recovery score (from connected wearable HRV or Whoop strain) appears on the Dashboard above today's workout card; if no wearable is connected the tile is hidden, not broken
5. Workout reminder fires at the user's learned optimal time (not just the seed time set during onboarding) with today's day label; PR alerts fire during or immediately after a session when a record is broken; weekly summary fires Sunday evening; each notification type can be toggled independently in Settings

**Plans:** TBD

---

### Phase 6: Polish & Platform

**Goal:** The app is App Store and Play Store ready: a polished onboarding flow, sharing features (workout image card, public session link, shareable template links, calendar sync), full data export, iOS home screen widgets, an installable PWA on web, the admin panel for reviewing all user activity, and all platform compliance requirements (HealthKit permission wording, subscription disclosure, Apple Sign-In compliance) verified and passing review.
**Mode:** mvp
**Depends on:** Phase 5
**Requirements:** SHARE-01, SHARE-02, SHARE-03, SHARE-04, SHARE-05, PLATFORM-01, PLATFORM-02, PLATFORM-03, DATA-04
**Success Criteria:**

1. After completing a workout, user can share a generated image card (exercises, PRs, duration) to social media and copy a public read-only link to the session viewable in a browser without an account
2. User can share a template via a unique link; a recipient opening the link can import the template into their own account; completed workouts are logged as events in Apple Calendar and Google Calendar with duration, day label, and exercises
3. User can export all data (history, templates, measurements, settings, meal plans) as JSON or CSV from Settings — export includes all historical records
4. iOS home screen widget shows today's day label, exercise count, and a Start button that deep-links into the active session; if today's workout is already complete, the widget shows a checkmark and session duration
5. The web build installs as a PWA (add to home screen, standalone mode, offline-capable) and the app passes App Store (iOS) and Play Store (Android) review with no guideline violations on first submission

**Plans:** TBD
**UI hint**: yes

---

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/6 | Not started | - |
| 2. Core Session Loop | 0/? | Not started | - |
| 3. Templates, Programs & Progress | 0/? | Not started | - |
| 4. Premium & AI | 0/? | Not started | - |
| 5. Wearables & Notifications | 0/? | Not started | - |
| 6. Polish & Platform | 0/? | Not started | - |

---

## Coverage Map

| REQ-ID | Phase |
|--------|-------|
| FOUND-01 | 1 |
| FOUND-02 | 1 |
| FOUND-03 | 1 |
| FOUND-04 | 1 |
| FOUND-05 | 1 |
| FOUND-06 | 1 |
| FOUND-07 | 1 |
| FOUND-08 | 1 |
| FOUND-09 | 1 |
| AUTH-01 | 1 |
| AUTH-02 | 1 |
| AUTH-03 | 1 |
| AUTH-04 | 1 |
| AUTH-05 | 1 |
| AUTH-06 | 1 |
| AUTH-07 | 4 |
| AUTH-08 | 1 |
| ONBOARD-01 | 1 |
| ONBOARD-02 | 1 |
| ONBOARD-03 | 1 |
| ONBOARD-04 | 1 |
| ONBOARD-05 | 1 |
| ONBOARD-06 | 1 |
| NAV-01 | 1 |
| NAV-02 | 1 |
| NAV-03 | 1 |
| WORKOUT-01 | 2 |
| WORKOUT-02 | 2 |
| WORKOUT-03 | 2 |
| WORKOUT-04 | 2 |
| WORKOUT-05 | 2 |
| WORKOUT-06 | 2 |
| WORKOUT-07 | 2 |
| WORKOUT-08 | 2 |
| WORKOUT-09 | 2 |
| WORKOUT-10 | 2 |
| WORKOUT-11 | 2 |
| WORKOUT-12 | 2 |
| WORKOUT-13 | 2 |
| WORKOUT-14 | 2 |
| WORKOUT-15 | 2 |
| WORKOUT-16 | 2 |
| WORKOUT-17 | 2 |
| WORKOUT-18 | 2 |
| TEMPLATE-01 | 3 |
| TEMPLATE-02 | 3 |
| TEMPLATE-03 | 3 |
| TEMPLATE-04 | 3 |
| TEMPLATE-05 | 3 |
| TEMPLATE-06 | 3 |
| TEMPLATE-07 | 3 |
| TEMPLATE-08 | 3 |
| TEMPLATE-09 | 3 |
| PROGRAM-01 | 3 |
| PROGRAM-02 | 3 |
| PROGRAM-03 | 3 |
| PROGRAM-04 | 3 |
| PROGRAM-05 | 3 |
| PROGRAM-06 | 3 |
| PROGRAM-07 | 3 |
| PROGRESS-01 | 3 |
| PROGRESS-02 | 3 |
| PROGRESS-03 | 3 |
| PROGRESS-04 | 3 |
| PROGRESS-05 | 3 |
| PROGRESS-06 | 5 |
| HISTORY-01 | 3 |
| HISTORY-02 | 3 |
| HISTORY-03 | 3 |
| PHOTO-01 | 3 |
| PHOTO-02 | 3 |
| PHOTO-03 | 3 |
| NUTRITION-01 | 4 |
| NUTRITION-02 | 4 |
| NUTRITION-03 | 4 |
| NUTRITION-04 | 4 |
| NUTRITION-05 | 4 |
| NUTRITION-06 | 4 |
| NUTRITION-07 | 4 |
| NUTRITION-08 | 4 |
| AI-01 | 4 |
| AI-02 | 4 |
| AI-03 | 4 |
| AI-04 | 4 |
| AI-05 | 4 |
| AI-06 | 4 |
| AI-07 | 4 |
| WEARABLE-01 | 5 |
| WEARABLE-02 | 5 |
| WEARABLE-03 | 5 |
| WEARABLE-04 | 5 |
| WEARABLE-05 | 5 |
| WEARABLE-06 | 5 |
| NOTIFY-01 | 5 |
| NOTIFY-02 | 5 |
| NOTIFY-03 | 5 |
| NOTIFY-04 | 5 |
| NOTIFY-05 | 5 |
| NOTIFY-06 | 5 |
| GAMIFY-01 | 3 |
| GAMIFY-02 | 3 |
| GAMIFY-03 | 3 |
| SHARE-01 | 6 |
| SHARE-02 | 6 |
| SHARE-03 | 6 |
| SHARE-04 | 6 |
| SHARE-05 | 6 |
| PLATFORM-01 | 6 |
| PLATFORM-02 | 6 |
| PLATFORM-03 | 6 |
| MONETIZE-01 | 4 |
| MONETIZE-02 | 4 |
| MONETIZE-03 | 4 |
| MONETIZE-04 | 4 |
| MONETIZE-05 | 4 |
| DATA-01 | 1 |
| DATA-02 | 1 |
| DATA-03 | 1 |
| DATA-04 | 6 |
| DESIGN-01 | 1 |
| DESIGN-02 | 2 |
| DESIGN-03 | 2 |
| DESIGN-04 | 1 |

**Coverage: 123 / 123 requirements mapped**
