# Requirements — Raze and Rise v2

> REQ-ID format: `[CATEGORY]-[NUMBER]`
> Status: `[ ]` = pending · `[x]` = done · `[-]` = deferred

---

## v1 Requirements

### Foundation & Infrastructure (FOUND)

- [ ] **FOUND-01**: App is initialized as an Expo SDK 55 bare workflow project (not managed — required for HealthKit, widgets, and RevenueCat native modules)
- [ ] **FOUND-02**: TypeScript strict mode is enabled across the entire codebase
- [ ] **FOUND-03**: Expo Router v3 provides file-based navigation for tabs and screens
- [ ] **FOUND-04**: NativeWind v4 provides styling with a dark-first design token system
- [ ] **FOUND-05**: EAS Build is configured with development, preview, and production profiles; `expo-dev-client` is the development target (not Expo Go)
- [ ] **FOUND-06**: PowerSync is configured as the offline-first local database, syncing with Supabase via Postgres WAL
- [ ] **FOUND-07**: Supabase normalized schema replaces the v1 single JSON blob; RLS is enabled on every table at creation time, with all four CRUD policies created in the same migration
- [ ] **FOUND-08**: MMKV stores the Supabase session; SecureStore holds only the MMKV encryption key (solves the 2048-byte AsyncStorage truncation bug)
- [ ] **FOUND-09**: A runtime version strategy is configured in `eas.json` to control when OTA updates require a native rebuild

### Authentication & Account (AUTH)

- [ ] **AUTH-01**: User can create an account with email and password
- [ ] **AUTH-02**: User can sign in with Google OAuth
- [ ] **AUTH-03**: User can sign in with Apple Sign-In (required for App Store alongside Google OAuth)
- [ ] **AUTH-04**: User can request a password reset link sent to their email
- [ ] **AUTH-05**: User can change their password from the Settings screen while logged in
- [ ] **AUTH-06**: User can enable SMS two-factor authentication via Supabase
- [ ] **AUTH-07**: User can export all their data (history, templates, measurements, settings) as JSON and CSV
- [ ] **AUTH-08**: User can sign out from any screen

### Onboarding (ONBOARD)

- [ ] **ONBOARD-01**: New user sees a multi-step onboarding flow on first launch (shown when `onboarded = false`)
- [ ] **ONBOARD-02**: Step 1 — User sets profile and measurements (name, age, height, sex, weight, body fat %) so the bodyweight exercise type and macro calculator work immediately
- [ ] **ONBOARD-03**: Step 3 — User chooses a split type with a visual calendar showing what the weekly schedule looks like for each option
- [ ] **ONBOARD-04**: Step 3 — User creates or customizes their first workout template before leaving onboarding
- [ ] **ONBOARD-05**: Step 4 — User walks through a practice set (marking go/no-go, seeing the rest timer fire) so the UX feels familiar before their first real session
- [ ] **ONBOARD-06**: User sets a preferred workout notification time during onboarding; app uses this as the seed while smart timing learns from history

### Navigation (NAV)

- [ ] **NAV-01**: Five-tab bottom navigation: Dashboard / Workouts / Split / Progress / Settings
- [ ] **NAV-02**: Split has its own dedicated tab (not nested inside Settings as in v1)
- [ ] **NAV-03**: Active tab is visually highlighted; navigation works offline

### Core Workout Session (WORKOUT)

- [ ] **WORKOUT-01**: User can start a workout session for today's day in the split rotation
- [ ] **WORKOUT-02**: Each exercise card shows: name, set count × rep range, previous session's weight and results per set row (tappable to auto-fill current session)
- [ ] **WORKOUT-03**: User can mark each set as go / no-go (toggleable: null → go → no-go → null)
- [ ] **WORKOUT-04**: User can optionally log RPE (1–10) per set; not mandatory, surfaces as a secondary tap
- [ ] **WORKOUT-05**: User can flag a set as a warm-up set; warm-up sets are excluded from go-rate and PR calculations
- [ ] **WORKOUT-06**: Rest timer auto-starts when a working set is marked; shows visible countdown with sound and vibration at zero; fires a local notification so it works when the app is backgrounded
- [ ] **WORKOUT-07**: Rest timer duration uses a global default (set in Settings) with per-exercise overrides configured in the template builder
- [ ] **WORKOUT-08**: User can add quick-tag notes (easy, hard, good form, bad form, pain) and optional free text to any set
- [ ] **WORKOUT-09**: User can add a session-level free text note at the top of the active session
- [ ] **WORKOUT-10**: User can flag muscle groups as sore or in pain on a body map before starting a session
- [ ] **WORKOUT-11**: Supersets display as paired exercise cards; tapping "complete set" on exercise A auto-scrolls to exercise B; rest timer fires after both sets are marked; then scrolls back to A for the next set pair (sequential alternating)
- [ ] **WORKOUT-12**: Bodyweight exercise type auto-pulls current body weight from measurements; user adds or subtracts an offset (e.g. +45 for weighted pull-ups, −50 for assisted dips)
- [ ] **WORKOUT-13**: Run exercise type (AF PT Prep) defaults to pulling GPS data from Apple Health or Garmin; a toggle in Settings switches to device GPS as fallback
- [ ] **WORKOUT-14**: App shows a progressive overload suggestion after a session where all sets were completed at the current weight ("+2.5–5 lbs next time")
- [ ] **WORKOUT-15**: User can swap any exercise during a session via a searchable modal grouped by muscle category; swap persists only to the session (not the template)
- [ ] **WORKOUT-16**: User can skip the current day if no template exists for it
- [ ] **WORKOUT-17**: Tapping "Complete Workout" triggers the Anubis loading screen animation, commits the session to history, and advances the rotation pointer
- [ ] **WORKOUT-18**: Session state is persisted locally (PowerSync) so a crash or backgrounding does not lose logged sets

### Templates & Exercise Library (TEMPLATE)

- [ ] **TEMPLATE-01**: User can create a workout template by selecting a day label and choosing exercises from the library
- [ ] **TEMPLATE-02**: Exercise library is a curated built-in set with muscle group tags, searchable by name or muscle group
- [ ] **TEMPLATE-03**: User can add custom exercises to the library; custom exercises are scoped to their account
- [ ] **TEMPLATE-04**: Each exercise in the library shows a demonstration video or GIF sourced from ExerciseDB API
- [ ] **TEMPLATE-05**: User can set sets, rep range (low–high), exercise type (standard / bodyweight / run), rest time override, and superset pairing per exercise in the template builder
- [ ] **TEMPLATE-06**: User can edit an existing template; changes do not retroactively alter completed sessions
- [ ] **TEMPLATE-07**: User can delete a template; active session is cleared if it matches the deleted template
- [ ] **TEMPLATE-08**: User can share a template via a link; recipients can import the template into their own account
- [ ] **TEMPLATE-09**: Admin user (email-gated) can bulk upload templates via Excel, JSON, or CSV

### Programs & Periodization (PROGRAM)

- [ ] **PROGRAM-01**: User can create a multi-week program manually: name, duration in weeks, assign a template to each week (with deload week flag per week)
- [ ] **PROGRAM-02**: User can generate a multi-week program via AI (Claude API): input goal, available equipment, current lifts; Claude returns a structured program
- [ ] **PROGRAM-03**: Active program auto-advances the template assignment week over week
- [ ] **PROGRAM-04**: Split phase system (Hypertrophy / Strength / Power) is retained from v1 and shown in the Split tab
- [ ] **PROGRAM-05**: Deload detection: app surfaces a deload suggestion after N consecutive weeks in the same phase (configurable N, default 4)
- [ ] **PROGRAM-06**: Manual deload toggle in Split settings overrides the auto-detection
- [ ] **PROGRAM-07**: When deload mode is active, suggested weights are automatically reduced to 60–70% of normal working weight

### Progress & Analytics (PROGRESS)

- [ ] **PROGRESS-01**: Progress page shows total workouts, current weekly streak, go-rate %, and personal records grid
- [ ] **PROGRESS-02**: Weight progression chart for any selected exercise, filterable by date range (last 30 / 90 days / year / all time) using a real chart library (Victory Native XL)
- [ ] **PROGRESS-03**: Volume bar chart (sets × weight per week) with date range filter
- [ ] **PROGRESS-04**: Every update to weight, body fat, and body measurements is timestamped and plotted on a measurement history chart
- [ ] **PROGRESS-05**: Recent workouts list shows date, day label, and go-rate per session
- [ ] **PROGRESS-06**: Post-workout heart rate data is pulled from Apple Health after session completion and stored with the history record

### History & Editing (HISTORY)

- [ ] **HISTORY-01**: User can view all completed workout sessions in a scrollable history list
- [ ] **HISTORY-02**: User can fully edit any completed session: add or remove exercises, change set counts, correct weights, change go/no-go results, edit notes
- [ ] **HISTORY-03**: Edits to history are synced to Supabase and reflected in progress charts immediately

### Progress Photos (PHOTO)

- [ ] **PHOTO-01**: User can upload or take a date-stamped progress photo stored in Supabase Storage
- [ ] **PHOTO-02**: Photos are displayed in a chronological timeline view
- [ ] **PHOTO-03**: User can select any two dates for a side-by-side before/after comparison view

### Nutrition (NUTRITION)

- [ ] **NUTRITION-01**: Macro calculator (Mifflin-St Jeor BMR → TDEE with activity multiplier → goal adjustment) is retained and improved from v1; LBM-based protein target
- [ ] **NUTRITION-02**: App reads today's consumed macros (calories, protein, carbs, fat) from Apple Health; any app that writes to Apple Health (MFP, Cronometer, etc.) feeds this automatically
- [ ] **NUTRITION-03**: User can generate a weekly meal plan via AI (Claude API, premium): inputs are macro targets, dietary restrictions, meals-per-day preference, cuisine preferences, and workout schedule for pre/post-workout timing
- [ ] **NUTRITION-04**: Generated meal plan displays each meal with name, macro breakdown, and ingredient list
- [ ] **NUTRITION-05**: User can send the full week's ingredient list to Instacart via MCP integration; integration generates a shareable Instacart shopping list page URL (not a direct cart — "Order on Instacart" CTA)
- [ ] **NUTRITION-06**: Current week's generated meal plan is cached locally for offline access
- [ ] **NUTRITION-07**: User can set up a supplement checklist: add supplement name and timing; check off supplements daily; optional reminder notifications
- [ ] **NUTRITION-08**: Meal plan UI is workout-aware: carb-heavier meals are scheduled around workout time, protein-first post-workout

### AI Features (AI)

- [ ] **AI-01**: All Claude API calls are proxied through a Supabase Edge Function; the API key is never shipped in the client bundle
- [ ] **AI-02**: AI coach chat (premium): open-ended chat interface powered by Claude; context includes a structured workout summary bundle (last 20 messages + computed stats, ~6000 tokens per request) for relevant, personalized responses
- [ ] **AI-03**: AI coach chat enforces a rate limit (Upstash Redis, configurable cap per user per day) and validates premium subscription status on every request
- [ ] **AI-04**: AI workout generation: user specifies goal and available equipment; Claude generates a complete session; user can accept, regenerate, or edit before starting
- [ ] **AI-05**: AI program generation: user specifies goal, current lifts, and duration; Claude generates a full multi-week program structure
- [ ] **AI-06**: AI meal plan generation (premium): Claude returns a structured weekly plan with per-meal recipes and ingredient lists
- [ ] **AI-07**: Claude streaming responses are displayed progressively in the chat UI (Supabase Edge Function SSE → React Native streaming fetch reader)

### Wearables & Health (WEARABLE)

- [ ] **WEARABLE-01**: App connects to Apple HealthKit (iOS) to read: HRV, sleep hours, step count, post-workout heart rate
- [ ] **WEARABLE-02**: App connects to Health Connect (Android — not Google Fit, which is deprecated) to read sleep and step count
- [ ] **WEARABLE-03**: Terra API is used as the unified integration layer for Garmin, Whoop, Fitbit, and Suunto; user authenticates each wearable through Terra's widget flow
- [ ] **WEARABLE-04**: Recovery score (from connected wearable HRV or Whoop strain) is surfaced on the Dashboard above today's workout
- [ ] **WEARABLE-05**: Completed workouts are pushed to Apple Health and Garmin as workout records
- [ ] **WEARABLE-06**: Wearable sync status and connected devices are visible and manageable in Settings

### Notifications (NOTIFY)

- [ ] **NOTIFY-01**: Workout reminder notification fires at the user's preferred time with today's day label ("Today is Push day"); timing seed is set during onboarding and refined by learning from actual workout timestamps
- [ ] **NOTIFY-02**: All push notification scheduling runs server-side via Supabase pg_cron dispatching to Expo's FCM/APNs push service (client-side schedulers are silently killed on most Android devices)
- [ ] **NOTIFY-03**: PR alert notification fires when a personal record is broken during or immediately after a session
- [ ] **NOTIFY-04**: Weekly summary notification fires Sunday evening: workouts completed, macros hit, PRs set that week
- [ ] **NOTIFY-05**: Meal reminder notifications fire at each meal time from the generated meal plan (if enabled)
- [ ] **NOTIFY-06**: User can toggle each notification type on or off independently in Settings

### Gamification (GAMIFY)

- [ ] **GAMIFY-01**: Badge system: user unlocks achievement badges for milestones (100 workouts, 10,000 lbs lifted total, 30-day streak, first PR, etc.); displayed in a dedicated achievements section of Progress
- [ ] **GAMIFY-02**: Challenge system: time-limited goals (e.g. "30 workouts in 30 days"); user opts in; progress tracked automatically
- [ ] **GAMIFY-03**: Weekly streak counter is retained from v1 and visible on Dashboard and Progress

### Sharing & Export (SHARE)

- [ ] **SHARE-01**: User can share a completed workout as a generated image card (workout name, exercises, PRs, duration) suitable for social media
- [ ] **SHARE-02**: Each completed session has a public read-only link (e.g. `raze-and-rise.app/w/[id]`) viewable in a browser without an account
- [ ] **SHARE-03**: User can share a workout template via a unique link; recipient can import the template into their own account
- [ ] **SHARE-04**: Completed workouts are logged as calendar events in Apple Calendar and Google Calendar (duration, day label, exercises)
- [ ] **SHARE-05**: User can export all data (history, templates, measurements, settings, meal plans) as JSON or CSV from Settings

### Platform & PWA (PLATFORM)

- [ ] **PLATFORM-01**: Web build (via Expo for Web) is a Progressive Web App: installable, offline-capable, runs in standalone mode without browser chrome
- [ ] **PLATFORM-02**: iOS home screen widget shows today's day label, exercise count, and a Start button; powered by `expo-widgets` (alpha — iOS first, Android deferred)
- [ ] **PLATFORM-03**: App passes App Store (iOS) and Play Store (Android) review requirements; Apple Sign-In, subscription disclosure, HealthKit permission wording all compliant

### Monetization (MONETIZE)

- [ ] **MONETIZE-01**: Free tier includes: core workout tracking, session logging, templates, splits, programs, progress charts, history editing, wearable sync, all notifications, gamification, and sharing
- [ ] **MONETIZE-02**: Premium tier ($9.99/month) gates: AI coach chat, AI workout generation, AI program generation, AI meal planning, and Instacart ordering
- [ ] **MONETIZE-03**: RevenueCat (`react-native-purchases`) wraps StoreKit (iOS) and Google Play Billing (Android) for native subscription management; Stripe handles web billing
- [ ] **MONETIZE-04**: Supabase Auth Hook injects `app_metadata.subscription_tier` into the JWT at token issuance; RLS policies and Edge Functions check this claim — client-side gates are UI only
- [ ] **MONETIZE-05**: Upgrade prompts appear at premium feature entry points with clear value proposition; no paywalls during an active workout session

### Data Architecture & Migration (DATA)

- [ ] **DATA-01**: v1 user data (single JSON blob in `user_state`) is migrated to normalized v2 tables using the expand-and-contract pattern: v2 tables created first, backfill script populates them, `user_state` kept as read-only backup for 60 days then dropped
- [ ] **DATA-02**: Offline conflict resolution uses session-ID-based merging: each session UUID is generated client-side before the session starts; `session_sets` have their own UUIDs; completed sessions are immutable (idempotent upserts); soft deletes only
- [ ] **DATA-03**: v2 deploys to a separate Vercel URL; v1 remains live at raze-and-rise.vercel.app until v2 is stable; cutover is deliberate, not automatic
- [ ] **DATA-04**: Admin panel (email-gated to `travis.g.mader@gmail.com`) reads all users' states and shows email, total workouts, last active date, top exercises

### Design (DESIGN)

- [ ] **DESIGN-01**: Dark/light mode toggle in Settings; dark mode is the default
- [ ] **DESIGN-02**: Visual aesthetic targets Whoop and Strong app: dark, data-dense, serious athlete feel — not gamified or lifestyle-forward
- [ ] **DESIGN-03**: Anubis loading screen animation is kept and polished; it is the app's splash/loading screen, not a separate product
- [ ] **DESIGN-04**: Transitions on interactive elements (150ms ease minimum); rest timer countdown is smooth

---

## v2 Requirements (Deferred)

- Apple Watch companion app — native Swift/SwiftUI, separate milestone; `react-native-watch-connectivity` bridge is the communication layer
- Android home screen widgets — native Kotlin, deferred after iOS widget ships
- Whoop direct API (if Terra partnership doesn't cover it) — Whoop API is invite-only beta; degrade gracefully at launch
- Annual Stripe pricing — monthly only at launch, annual added when product is proven
- AI form video analysis — out of scope
- Localization / i18n — English only; app structured for i18n but not implemented

## Out of Scope

- Coaching / trainer accounts — personal use only
- Social leaderboards or friend feeds — share button covers the social need
- Water / hydration tracking — deferred
- Plate calculator — not needed
- Own food logging / barcode scanner — Apple Health read covers this via MFP/Cronometer
- Google Fit — deprecated May 2024, replaced by Health Connect
- MyFitnessPal direct API — closed to new developers; HealthKit nutrition read is the replacement
- Stripe-only billing on iOS — App Store policy requires StoreKit; RevenueCat is the correct abstraction

---

## Traceability

*Populated by roadmapper — maps each REQ-ID to its phase.*

| REQ-ID | Phase | Status |
|--------|-------|--------|
| FOUND-01 | Phase 1 | Pending |
| FOUND-02 | Phase 1 | Pending |
| FOUND-03 | Phase 1 | Pending |
| FOUND-04 | Phase 1 | Pending |
| FOUND-05 | Phase 1 | Pending |
| FOUND-06 | Phase 1 | Pending |
| FOUND-07 | Phase 1 | Pending |
| FOUND-08 | Phase 1 | Pending |
| FOUND-09 | Phase 1 | Pending |
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| AUTH-05 | Phase 1 | Pending |
| AUTH-06 | Phase 1 | Pending |
| AUTH-07 | Phase 4 | Pending |
| AUTH-08 | Phase 1 | Pending |
| ONBOARD-01 | Phase 1 | Pending |
| ONBOARD-02 | Phase 1 | Pending |
| ONBOARD-03 | Phase 1 | Pending |
| ONBOARD-04 | Phase 1 | Pending |
| ONBOARD-05 | Phase 1 | Pending |
| ONBOARD-06 | Phase 1 | Pending |
| NAV-01 | Phase 1 | Pending |
| NAV-02 | Phase 1 | Pending |
| NAV-03 | Phase 1 | Pending |
| WORKOUT-01 | Phase 2 | Pending |
| WORKOUT-02 | Phase 2 | Pending |
| WORKOUT-03 | Phase 2 | Pending |
| WORKOUT-04 | Phase 2 | Pending |
| WORKOUT-05 | Phase 2 | Pending |
| WORKOUT-06 | Phase 2 | Pending |
| WORKOUT-07 | Phase 2 | Pending |
| WORKOUT-08 | Phase 2 | Pending |
| WORKOUT-09 | Phase 2 | Pending |
| WORKOUT-10 | Phase 2 | Pending |
| WORKOUT-11 | Phase 2 | Pending |
| WORKOUT-12 | Phase 2 | Pending |
| WORKOUT-13 | Phase 2 | Pending |
| WORKOUT-14 | Phase 2 | Pending |
| WORKOUT-15 | Phase 2 | Pending |
| WORKOUT-16 | Phase 2 | Pending |
| WORKOUT-17 | Phase 2 | Pending |
| WORKOUT-18 | Phase 2 | Pending |
| TEMPLATE-01 | Phase 3 | Pending |
| TEMPLATE-02 | Phase 3 | Pending |
| TEMPLATE-03 | Phase 3 | Pending |
| TEMPLATE-04 | Phase 3 | Pending |
| TEMPLATE-05 | Phase 3 | Pending |
| TEMPLATE-06 | Phase 3 | Pending |
| TEMPLATE-07 | Phase 3 | Pending |
| TEMPLATE-08 | Phase 3 | Pending |
| TEMPLATE-09 | Phase 3 | Pending |
| PROGRAM-01 | Phase 3 | Pending |
| PROGRAM-02 | Phase 3 | Pending |
| PROGRAM-03 | Phase 3 | Pending |
| PROGRAM-04 | Phase 3 | Pending |
| PROGRAM-05 | Phase 3 | Pending |
| PROGRAM-06 | Phase 3 | Pending |
| PROGRAM-07 | Phase 3 | Pending |
| PROGRESS-01 | Phase 3 | Pending |
| PROGRESS-02 | Phase 3 | Pending |
| PROGRESS-03 | Phase 3 | Pending |
| PROGRESS-04 | Phase 3 | Pending |
| PROGRESS-05 | Phase 3 | Pending |
| PROGRESS-06 | Phase 5 | Pending |
| HISTORY-01 | Phase 3 | Pending |
| HISTORY-02 | Phase 3 | Pending |
| HISTORY-03 | Phase 3 | Pending |
| PHOTO-01 | Phase 3 | Pending |
| PHOTO-02 | Phase 3 | Pending |
| PHOTO-03 | Phase 3 | Pending |
| NUTRITION-01 | Phase 4 | Pending |
| NUTRITION-02 | Phase 4 | Pending |
| NUTRITION-03 | Phase 4 | Pending |
| NUTRITION-04 | Phase 4 | Pending |
| NUTRITION-05 | Phase 4 | Pending |
| NUTRITION-06 | Phase 4 | Pending |
| NUTRITION-07 | Phase 4 | Pending |
| NUTRITION-08 | Phase 4 | Pending |
| AI-01 | Phase 4 | Pending |
| AI-02 | Phase 4 | Pending |
| AI-03 | Phase 4 | Pending |
| AI-04 | Phase 4 | Pending |
| AI-05 | Phase 4 | Pending |
| AI-06 | Phase 4 | Pending |
| AI-07 | Phase 4 | Pending |
| WEARABLE-01 | Phase 5 | Pending |
| WEARABLE-02 | Phase 5 | Pending |
| WEARABLE-03 | Phase 5 | Pending |
| WEARABLE-04 | Phase 5 | Pending |
| WEARABLE-05 | Phase 5 | Pending |
| WEARABLE-06 | Phase 5 | Pending |
| NOTIFY-01 | Phase 5 | Pending |
| NOTIFY-02 | Phase 5 | Pending |
| NOTIFY-03 | Phase 5 | Pending |
| NOTIFY-04 | Phase 5 | Pending |
| NOTIFY-05 | Phase 5 | Pending |
| NOTIFY-06 | Phase 5 | Pending |
| GAMIFY-01 | Phase 3 | Pending |
| GAMIFY-02 | Phase 3 | Pending |
| GAMIFY-03 | Phase 3 | Pending |
| SHARE-01 | Phase 6 | Pending |
| SHARE-02 | Phase 6 | Pending |
| SHARE-03 | Phase 6 | Pending |
| SHARE-04 | Phase 6 | Pending |
| SHARE-05 | Phase 6 | Pending |
| PLATFORM-01 | Phase 6 | Pending |
| PLATFORM-02 | Phase 6 | Pending |
| PLATFORM-03 | Phase 6 | Pending |
| MONETIZE-01 | Phase 4 | Pending |
| MONETIZE-02 | Phase 4 | Pending |
| MONETIZE-03 | Phase 4 | Pending |
| MONETIZE-04 | Phase 4 | Pending |
| MONETIZE-05 | Phase 4 | Pending |
| DATA-01 | Phase 1 | Pending |
| DATA-02 | Phase 1 | Pending |
| DATA-03 | Phase 1 | Pending |
| DATA-04 | Phase 6 | Pending |
| DESIGN-01 | Phase 1 | Pending |
| DESIGN-02 | Phase 2 | Pending |
| DESIGN-03 | Phase 2 | Pending |
| DESIGN-04 | Phase 1 | Pending |
