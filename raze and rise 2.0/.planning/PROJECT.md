# Raze and Rise v2

## What This Is

A full-stack fitness platform built as a React Native + Expo app (iOS, Android, Web) that covers the complete training lifecycle: workout tracking, AI-generated programs and meal plans, wearable sync, nutrition via MyFitnessPal, and an AI coaching chat. It rebuilds Raze and Rise v1 from scratch — eliminating every known shortfall — and adds a layer of intelligence and integration that puts it on par with Whoop, Strong, and MyFitnessPal combined.

Built for a single user (personal use, no coaching tier), with a free/premium split monetized via Stripe and powered by the Claude API for AI features.

## Core Value

A workout session — from opening the app to tapping Complete — must be frictionless, accurate, and smart enough that you never need to reach for your phone clock, a separate notes app, or a calculator.

## Requirements

### Validated

- ✓ Auth with email/password and Supabase session management — existing
- ✓ Workout split rotation (PPL, Body-Part, Hybrid, Full Body, AF PT Prep) — existing
- ✓ Exercise templates with sets/reps, weight tracking — existing
- ✓ Session logging with go/no-go per set — existing
- ✓ History log with timestamp, day label, sets — existing
- ✓ ORM-based weight suggestion (% of 1RM) — existing
- ✓ Smart weight suggestion from last 3 sessions — existing
- ✓ Exercise swap via category-grouped modal — existing
- ✓ Macro calculator (Mifflin-St Jeor, LBM protein) — existing
- ✓ Garmin .fit export — existing
- ✓ Phase system (Hypertrophy / Strength / Power) — existing
- ✓ Admin panel (email-gated, view all user activity) — existing
- ✓ Dark theme, mobile-first, CSS Modules — existing

### Active

#### Core Workout Experience
- [ ] Rest timer: countdown per set with sound + vibrate; global default + per-exercise override in template builder
- [ ] Notes per set: quick tags (easy, hard, good form, bad form, pain) + optional free text
- [ ] Optional RPE (1–10) per set — not mandatory, surfaces as an extra tap
- [ ] Warm-up sets: flagged on exercise card, excluded from go-rate and PR calculations
- [ ] Supersets: paired exercise cards; complete all sets of both exercises, then rest timer fires
- [ ] Session-level notes: free text field at top of active session
- [ ] Injury / body map: tap muscle groups before a session to flag soreness or pain

#### Template & Program System
- [ ] Searchable exercise library: curated built-in library with muscle group tags, plus user-defined custom exercises
- [ ] Exercise demonstration videos via ExerciseDB API embedded per exercise
- [ ] Editable workout history: full edit — add/remove exercises, change set counts, correct weights and results
- [ ] Multi-week programs: manual program builder + AI-generated programs via Claude API
- [ ] Supersets supported in template builder (pair two exercises)

#### Progressive Overload
- [ ] Show last session's weight/sets/results per exercise on the active session card
- [ ] Smart overload suggestion: if all sets hit at current weight, suggest +2.5–5 lbs next session

#### Deload System
- [ ] Auto-detect deload week after N weeks in a phase and surface a suggestion
- [ ] Manual deload toggle in Split settings
- [ ] Deload mode: auto-reduce suggested weights to 60–70% of normal working weight

#### Bodyweight & Cardio
- [ ] Bodyweight exercise type: auto-pulls current body weight from measurements; user adds/subtracts offset (e.g. +45 for weighted pull-ups, -50 for assisted)
- [ ] Run exercises (AF PT Prep): default to pulling GPS data from Apple Health or Garmin; device GPS as optional fallback (toggle in Settings)

#### Auth & Account
- [ ] Forgot password: email reset link via Supabase
- [ ] Change password from Settings (logged-in flow)
- [ ] Google OAuth sign-in
- [ ] Apple Sign-In (required for App Store alongside Google OAuth)
- [ ] SMS two-factor authentication via Supabase
- [ ] Full data export: download all history, templates, measurements, and settings as JSON/CSV

#### Onboarding (rebuilt)
- [ ] Step 1: Set profile + measurements (weight, body fat, height, age, sex) — required for BW exercises and macro calc to work immediately
- [ ] Step 2: Choose split type with visual explanation of the weekly schedule
- [ ] Step 3: Create or customize first workout template
- [ ] Step 4: Walk through a practice set so UX feels familiar before the first real session
- [ ] Preferred notification time set during onboarding (smart timing learns from history over time)

#### Navigation
- [ ] 5-tab nav: Dashboard / Workouts / Split / Progress / Settings (Split gets its own tab — v1 bug fixed)

#### Progress & Analytics
- [ ] Progress charts with date range filter (real chart library — Recharts or Victory Native)
- [ ] Per-exercise weight progression chart
- [ ] Measurement history: every update to weight, body fat, and measurements is timestamped and charted
- [ ] Progress photos: date-stamped photos stored in Supabase Storage; side-by-side before/after comparison view
- [ ] Post-workout heart rate data pulled from Apple Health after session completion

#### Wearables & Sync
- [ ] Apple Health / HealthKit: HRV, sleep, steps, post-workout HR, workout logging
- [ ] Apple Watch companion app: view exercise card, log sets with go/no-go, rest timer on wrist
- [ ] Garmin: push workouts, pull recovery data
- [ ] Whoop: pull recovery score and strain
- [ ] Fitbit / Google Fit: sleep and activity
- [ ] Suunto: activity data

#### Habits & Recovery
- [ ] Daily step count (pulled from Apple Health or manual)
- [ ] Sleep hours (pulled from wearable or manual)
- [ ] Recovery score on Dashboard (sourced from connected wearable — HRV or Whoop score)

#### Nutrition
- [ ] MyFitnessPal integration (both directions): pull today's food macros in, push completed workouts out
- [ ] AI meal plan generation (Claude API, premium): driven by macro targets, dietary restrictions, meals/day preference, cuisine preferences, workout timing (pre/post-workout nutrition aware)
- [ ] One-tap Instacart ordering: meal plan generates ingredient list, tap to populate Instacart cart via MCP
- [ ] Generated meal plan cached locally for offline access (current week)
- [ ] Meal reminders: optional notification at each meal time (per-notification toggle in Settings)
- [ ] Supplement checklist: log daily supplements (name, timing), optional reminders, daily check-off

#### AI Features (Claude API)
- [ ] AI coach chat (premium): open-ended chat — modify workouts around injury, ask nutrition questions, request program adjustments
- [ ] AI workout generation: generate a session from scratch (goal + equipment) or intelligently modify existing templates based on performance data
- [ ] AI meal plan generation (premium): structured weekly plan with recipes and ingredient lists

#### Notifications
- [ ] Workout reminder: smart timing that learns from history; time collected during onboarding as seed; content is "today is [Day Label] day"
- [ ] PR alerts: celebrate a personal record mid or post-workout
- [ ] Weekly summary: Sunday recap — workouts completed, macros hit, PRs set
- [ ] Meal reminders: per-meal timing from the generated plan
- [ ] Per-notification type toggles in Settings

#### Gamification
- [ ] Badges and achievements: unlock milestones (100 workouts, 10k lbs lifted, 30-day streak, etc.)
- [ ] Challenges: time-limited goals (e.g. 30 workouts in 30 days)

#### Sharing
- [ ] Share completed workout: shareable image card (Instagram-style) + public link to session detail page
- [ ] Shareable template links: generate a link; another user can import the template into their account

#### Platform & PWA
- [ ] React Native + Expo: one codebase for iOS, Android, and Web
- [ ] Installable PWA on web (add to home screen, standalone mode)
- [ ] Home screen widgets (iOS/Android): today's workout label, exercise count, Start button
- [ ] Apple Watch companion app (log sets, rest timer on wrist)
- [ ] Calendar sync: completed workouts logged as events in Apple Calendar and Google Calendar

#### Monetization
- [ ] Free tier: core workout tracking, templates, splits, progress charts, history
- [ ] Premium tier: AI coach chat, AI meal plan generation + Instacart, advanced analytics
- [ ] Stripe monthly subscription (annual pricing deferred)
- [ ] Premium gate UI (upgrade prompts at feature boundaries)

#### Design
- [ ] Dark/light mode toggle in Settings
- [ ] Premium visual feel: Whoop/Strong aesthetic — dark, data-dense, serious athlete product
- [ ] Anubis loading screen graphic (kept and polished from v1)

#### Data Architecture (breaking change from v1)
- [ ] Normalized Supabase schema (multiple tables) replacing the single JSON blob per user
- [ ] Data migration script for v1 users (same Supabase project `jmtogdlsgpfoefbgdubm`)
- [ ] Offline-first: Service Worker + local persistence; sync on reconnect; merge by session ID on conflict
- [ ] New Vercel deployment at a separate URL; parallel with v1 until ready for cutover

### Out of Scope

- Coaching / trainer accounts — personal use only, no multi-client management
- AI form analysis via camera — too complex for now
- Own food logging / barcode scanner — rely on MFP for food tracking
- Food barcode scanning — deferred, MFP handles it
- Plate calculator — not needed
- Social leaderboards / friend feeds — share button is enough
- Water / hydration tracking — deferred
- Localization / i18n — English only for now; structure for it but don't implement
- MyFitnessPal API details — API access restricted since 2020, integration designed now and API access resolved during build
- Annual Stripe pricing — monthly only to start
- AI form video analysis — out of scope

## Context

**V1 is live** at https://raze-and-rise.vercel.app — same Supabase project (`jmtogdlsgpfoefbgdubm`, named "Clay and Steel" in dashboard). Admin email: `travis.g.mader@gmail.com`.

**Deploy pattern:** `vercel --prod` from `/Users/travismader/Desktop/Pioneer/` (NOT from inside the project folder — rootDirectory config doubles the path).

**V1 state shape:** Single `user_state` JSON blob per user in Supabase. V2 migrates this to normalized tables. A migration script must run before v2 launch. Backward-compat pattern (`{ ...defaultState(), ...data.state }`) already in v1 App.jsx.

**V1 shortfalls resolved:** All 12 items from the v1 HANDOFF.md are addressed in v2 requirements above.

**Tech stack:**
- React Native + Expo (iOS, Android, Web from one codebase)
- TypeScript throughout
- Supabase: auth + normalized data + Storage (progress photos)
- Vitest (unit/component), Playwright (E2E web), Storybook (component docs)
- Claude API (Anthropic) for AI coach, workout generation, and meal plans
- Stripe for subscription billing
- ExerciseDB API for exercise demonstration videos
- Instacart MCP for grocery ordering
- RevenueCat considered but Stripe chosen for simplicity

## Constraints

- **Data**: Must migrate existing v1 user data — no breaking changes to user history without a migration script
- **API**: MyFitnessPal public API is deprecated (2020); integration scope defined, API access to be resolved during build
- **App Store**: Apple requires "Sign in with Apple" whenever Google OAuth is present — both must ship together
- **Cost**: Claude API has real per-token cost — AI features are premium-gated; rate limiting required
- **Timeline**: A few weeks to first v2 deploy (parallel URL); GSD roadmap sequences features by value
- **Platform**: React Native + Expo chosen to share code across iOS/Android/Web — watch for web-incompatible native APIs
- **Single user**: No coaching tier, no multi-user accounts

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React Native + Expo over React web | Enables iOS/Android native + Apple Watch + widgets from one codebase | — Pending |
| Normalized Supabase tables over single JSON blob | Offline sync, editable history, analytics, and conflict resolution all require relational data | — Pending |
| Claude API for AI features | Already in-ecosystem; best reasoning for workout/nutrition coaching | — Pending |
| Premium gate on AI (not wearables or analytics) | Wearables and analytics build retention; AI has direct API cost | — Pending |
| Stripe monthly only | Simplest billing to ship; annual added when product is proven | — Pending |
| Separate Vercel URL for v2 launch | Run v1 and v2 in parallel until v2 is stable; no forced cutover | — Pending |
| Merge by session ID for offline conflicts | Prevents data loss on multi-device use; each workout is a unique atomic unit | — Pending |
| ExerciseDB API for demo videos | Fastest way to get video coverage; no self-hosting cost | — Pending |
| Apple Sign-In alongside Google OAuth | Required by App Store policy when any third-party OAuth is present | — Pending |
| Instacart via MCP | Fits the MCP tool use pattern; no custom API integration needed | — Pending |
| Name TBD | "Raze and Rise" may not fit the expanded scope; decide before App Store submission | — Pending |

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
*Last updated: 2026-05-18 after initialization*
