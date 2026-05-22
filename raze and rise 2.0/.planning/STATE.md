---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: in_progress
stopped_at: Phase 2 executing — wave 1 complete (02-01, 02-02, 02-03 done)
last_updated: "2026-05-22T22:06:00.000Z"
last_activity: 2026-05-22
progress:
  total_phases: 6
  completed_phases: 1
  total_plans: 18
  completed_plans: 12
  percent: 28
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-18)

**Core value:** A workout session — from opening the app to tapping Complete — must be frictionless, accurate, and smart enough that you never need to reach for your phone clock, a separate notes app, or a calculator.
**Current focus:** Phase 2 — Core Session Loop

## Current Position

Phase: 2 of 6 (Core Session Loop)
Plan: 0 of 9 in current phase (planning complete — ready to execute)
Status: Ready to execute
Last activity: 2026-05-20

Progress: [█░░░░░░░░░] 17%

```
Phase 1: Foundation          [x] Complete (9/9 plans)
Phase 2: Core Session Loop   [>] Planned (9 plans, 8 waves — ready to execute)
Phase 3: Templates, Programs & Progress  [ ] Not started
Phase 4: Premium & AI        [ ] Not started
Phase 5: Wearables & Notifications      [ ] Not started
Phase 6: Polish & Platform   [ ] Not started
```

## Performance Metrics

**Velocity:**

- Total plans completed: 8
- Average duration: 13 min
- Total execution time: ~1.4 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 — Foundation | 9/9 | ~120 min | 13 min |
| 2 — Core Session Loop | 0/? | — | — |
| 3 — Templates, Programs & Progress | 0/? | — | — |
| 4 — Premium & AI | 0/? | — | — |
| 5 — Wearables & Notifications | 0/? | — | — |
| 6 — Polish & Platform | 0/? | — | — |

**Recent Trend:**

- Last 5 plans: 01a (13 min), 01b (25 min), 01c (6 min), 01d (7 min), 01-03 (8 min)
- Trend: fast and consistent — auth services + full AuthScreen implemented cleanly; 2 minor Rule 1 auto-fixes

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Key decisions relevant to Phase 1 (01a additions):

- **SQLite driver:** @op-engineering/op-sqlite chosen over @journeyapps/react-native-quick-sqlite (user-approved; current PowerSync recommendation)
- **react-native version:** 0.82.1 (not 0.81.5 from template) — required by react-native-screens@4.25.1 in expo-router@55
- **TypeScript version:** 6.x installed; ignoreDeprecations: '6.0' added to tsconfig for baseUrl compatibility
- **Install flags:** --legacy-peer-deps required for all installs due to React 19/ecosystem peer dep gaps

Key decisions relevant to Phase 1 (01-03 auth additions):

- **Auth errors:** Inline HelperText only — zero toast/snackbar; single Alert.alert exception for sign-out confirmation
- **Apple Sign-In platform guard:** Platform.OS !== 'ios' throws in apple.ts; renders null in AuthScreen (never shows error on Android)
- **Google OAuth token parsing:** Hash fragment (not query string) per T-03-S-03 threat mitigation
- **ForgotPassword generic copy:** Never confirm whether email exists in system (T-03-I-01)
- **react-hook-form validation timing:** onBlur + reValidateMode: onBlur — no on-change validation
- **Shimmer animation:** Deferred to Phase 2 — solid accent color used for wordmark

Key decisions relevant to Phase 1 (01d additions):

- **CSS module declaration:** `declare module '*.css' {}` added to nativewind-env.d.ts — TypeScript 6 strict raises TS2882 for side-effect CSS imports without this declaration
- **SyncStatus API:** `.status` string property does not exist on SyncStatus; use `.connected`/`.connecting` boolean flags to derive readable status labels
- **signOut stub pattern:** No-op async function + TODO comment for pre-existing stubs awaiting later plans — avoids broken import before auth plan ships
- **tabBarButton haptics:** Use `listeners.tabPress` on Tabs.Screen instead of tabBarButton wrapper for haptic feedback — cleaner, avoids type complexity with Expo Router's tabBarButton prop

Key decisions relevant to Phase 1 (01c additions):

- **ActivityIndicator hex exception:** #F2CA50 (accent) and #0A0A0B (bg) used only in Spinner.tsx color prop — ActivityIndicator does not accept NativeWind className on color prop. Documented in component comments.
- **ProgressBar Animated.View style:** NativeWind cannot drive animated percentage widths — reanimated useAnimatedStyle required for withTiming interpolation on width.
- **TextInput placeholderTextColor:** Uses #99907C (fg-muted token value) — React Native's placeholderTextColor prop does not accept NativeWind className strings.

Key decisions relevant to Phase 1 (01b additions):

- **MMKV v4 API:** createMMKV() replaces new MMKV(); .remove(key) replaces .delete(key) — confirmed from @types in node_modules
- **PowerSync fetchCredentials returns null:** Not throw — when session is absent, null signals PowerSync to retry; throwing causes spurious error logs
- **Supabase Session type:** Exported as AuthSession from @supabase/supabase-js (aliased internally from @supabase/auth-js Session)
- **@types/react:** Missing from 01a install; added in 01b as devDependency — required for TypeScript strict in React hooks

Key decisions relevant to Phase 1 (pre-existing):

- **Billing architecture:** Use RevenueCat (`react-native-purchases`) wrapping StoreKit (iOS) and Google Play Billing (Android); Stripe for web billing only. Stripe-only on iOS violates App Store guidelines and triggers rejection. RevenueCat is the correct abstraction per PITFALLS.md.
- **Workflow:** Expo SDK 55 managed workflow with EAS Build (not bare workflow). Bare workflow eject deferred until Apple Watch companion app phase — which is explicitly out of scope for v2.
- **Offline sync:** PowerSync (`@powersync/react-native`) over WatermelonDB. Reads Postgres WAL directly; no manual sync functions to maintain; official Supabase integration.
- **Session storage:** MMKV + SecureStore hybrid. SecureStore cannot hold a full Supabase session (2048-byte limit). MMKV stores the session; SecureStore stores only the MMKV encryption key.
- **MyFitnessPal:** MFP public API is closed to new developers (deprecated 2020). Integration replaced with Apple Health nutrition read (HealthKit) as primary path. NUTRITION-02 reflects this.
- **Apple Watch:** Explicitly out of scope for v2. Apple Watch requires native Swift/SwiftUI and is a post-v2 milestone. Not in any phase.
- **MFP integration scope:** Downgraded to HealthKit nutrition aggregation read. Any app (MFP, Cronometer) that writes to Apple Health feeds the integration automatically.
- **AI proxy:** All Claude API calls route through Supabase Edge Functions. The `@anthropic-ai/sdk` requires Node.js globals absent from Hermes runtime and must never run client-side.
- **ExerciseDB:** Cache-first strategy only. The RapidAPI free tier is capped at 10 requests/day — unusable for real-time calls. Seed exercise library to Supabase at build time; never call ExerciseDB during a workout session.
- **Wearables priority:** HealthKit (iOS native, free, reads from all connected wearables) first; Health Connect (Android) second; Terra API for Garmin/Whoop/Fitbit/Suunto as unified third-party integration.
- **Expo workflow:** Bare workflow from day one (not managed). Required for HealthKit, widgets, RevenueCat. STATE.md previously had a stale "managed" note — bare is correct per FOUND-01.
- **Onboarding:** All steps required (profile + split + template); practice set is optional/skippable. Full-screen stack — tab nav hidden until onboarding complete.
- **Auth screen:** Single screen with Sign In / Sign Up toggle. Email/password + Google + Apple all visible at once.
- **v1 migration:** Auto-runs silently on first v2 login for existing users. Edge Function, idempotent, progress indicator. New users skip migration entirely.

### Pending Todos

- Apply for Garmin developer program access during Phase 3 (2–4 week approval lead time; needed before Phase 5 Terra API work)
- Apply for Whoop developer API access during Phase 3 (same lead time constraint)
- Verify `react-native-health` New Architecture compatibility before integrating in Phase 5 (SDK 55 mandates New Architecture)
- Confirm Terra API per-user pricing before committing to it as the wearables abstraction in Phase 5
- Confirm ExerciseDB data licensing terms before bundling exercise data into Supabase Storage
- Resolve RevenueCat free tier revenue threshold limits before Phase 4 launch
- Supabase point-in-time backup must be taken before running v1 migration script

### Blockers / Concerns

- Garmin and Whoop API access require developer program applications with 2–4 week approval windows. Must be initiated in Phase 3 to avoid blocking Phase 5.
- `expo-widgets` (iOS home screen widgets) is alpha as of May 2026. Pin the version; test on each SDK upgrade.
- FlashList (`@shopify/flash-list`) must be used for workout history and exercise library screens from Phase 2/3 onward. FlatList causes JS thread spikes on dense set-row lists.
- RLS + Supabase Realtime: every table with a Realtime subscription must have an explicit SELECT policy or events are silently dropped (GitHub issue supabase/supabase#35282). Always add RLS and policies in the same migration.
- Smart notification timing for Android must be server-side only (pg_cron + Edge Function). Client-side scheduling is silently killed by Samsung/Xiaomi/Huawei OEM battery optimizers.

## Deferred Items

Items carried forward from pre-v2 planning and explicitly deferred:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Platform | Apple Watch companion app | v3 milestone — native Swift required | Roadmap creation |
| Platform | Android home screen widgets | Post-iOS widget — native Kotlin required | Roadmap creation |
| Billing | Annual Stripe pricing | After 6 months of retention data | Roadmap creation |
| Nutrition | MyFitnessPal direct API | MFP API closed; replaced by HealthKit read | Roadmap creation |
| Wearables | Suunto direct API (beyond Terra) | Low priority; Terra covers it | Roadmap creation |
| AI | AI form video analysis | Out of scope — complexity too high | Roadmap creation |

## Session Continuity

Last session: 2026-05-21T03:20:40.776Z
Stopped at: Phase 2 context gathered
