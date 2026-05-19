# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-18)

**Core value:** A workout session — from opening the app to tapping Complete — must be frictionless, accurate, and smart enough that you never need to reach for your phone clock, a separate notes app, or a calculator.
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 1 of 6 (Foundation)
Plan: 0 of ? in current phase
Status: Ready to plan — discuss-phase complete
Last activity: 2026-05-19 — Phase 1 discuss-phase complete; CONTEXT.md written with all design decisions

Progress: [░░░░░░░░░░] 0%

```
Phase 1: Foundation          [ ] Not started
Phase 2: Core Session Loop   [ ] Not started
Phase 3: Templates, Programs & Progress  [ ] Not started
Phase 4: Premium & AI        [ ] Not started
Phase 5: Wearables & Notifications      [ ] Not started
Phase 6: Polish & Platform   [ ] Not started
```

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: — min
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 — Foundation | 0/? | — | — |
| 2 — Core Session Loop | 0/? | — | — |
| 3 — Templates, Programs & Progress | 0/? | — | — |
| 4 — Premium & AI | 0/? | — | — |
| 5 — Wearables & Notifications | 0/? | — | — |
| 6 — Polish & Platform | 0/? | — | — |

**Recent Trend:**
- Last 5 plans: none yet
- Trend: —

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Key decisions relevant to Phase 1:

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

Last session: 2026-05-18
Stopped at: Roadmap created and written to disk. REQUIREMENTS.md traceability table populated. Ready to begin Phase 1 planning via `/gsd:plan-phase 1`.
