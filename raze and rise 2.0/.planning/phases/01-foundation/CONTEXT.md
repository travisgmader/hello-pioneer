# Phase 1 Context — Foundation

> Captured: 2026-05-19
> Purpose: Decisions for downstream researcher and planner agents. Do not re-ask these questions.

---

## Phase Summary

**Goal:** Expo bare workflow shell with Supabase auth (email + Google + Apple), normalized schema + RLS, PowerSync offline sync, MMKV + SecureStore session storage, v1 data migration, 5-tab navigation, and a first-run onboarding flow that leaves every new user with a profile, split type, and template before they reach the Dashboard.

**Mode:** MVP + Walking Skeleton (Phase 1 of 6 — first phase, no prior plans)

**Requirements:** FOUND-01–09, AUTH-01–08, NAV-01–03, ONBOARD-01–06, DATA-01–03, DESIGN-01, DESIGN-04

---

## Decisions

### 1. Expo Workflow: Bare (not managed)

**Decision:** Bare workflow from day one.

**Rationale:** HealthKit (Phase 5), iOS home screen widgets (Phase 6), and RevenueCat native StoreKit integration (Phase 4) all require native code access unavailable in managed workflow. Bare workflow is required; ejecting later would be painful. STATE.md had a stale note — FOUND-01 is correct.

**Implications for planner:**
- Project scaffold uses `npx create-expo-app --template bare-minimum` or equivalent
- `ios/` and `android/` directories are committed to the repo
- EAS Build configured with development / preview / production profiles
- All native modules are installed via `expo install` with Config Plugins where available, otherwise bare native linking
- Do NOT use `expo-modules-core` managed-only APIs that require `expo-dev-client` workarounds

---

### 2. Onboarding Strictness: All steps required, practice set optional

**Decision:** New users must complete profile → split selection → template creation before reaching the Dashboard. The practice set step (ONBOARD-05) is optional and can be skipped.

**Flow:**
1. Auth screen → account created/logged in
2. Profile step: display name, units (lbs/kg), primary goal — required
3. Split selection: choose a split type (e.g., PPL, Upper/Lower, Full Body) — required
4. Template creation: build or select a starter template — required
5. Practice set: log a sample set to learn the interface — skippable
6. → Dashboard

**Implications for planner:**
- Onboarding navigator is a separate Expo Router stack, not the main tab navigator
- Each step is a distinct screen with a progress indicator (step 1/4, 2/4, etc.)
- State persisted via MMKV so partial progress survives app kill
- Back navigation within onboarding is allowed; back from step 1 returns to auth
- No "Skip" button except on the practice set screen

---

### 3. Auth Screen Layout: Single screen, all 3 providers

**Decision:** Single auth screen with Sign In / Sign Up tab toggle. Email/password fields at top, "Continue with Google" and "Continue with Apple" buttons below a divider.

**Layout:**
```
[ Sign In ]  [ Sign Up ]

Email: ________________
Password: _____________

[ Continue ]

───── or ─────

[  Continue with Google  ]
[  Continue with Apple   ]
```

Sign Up adds a "Confirm password" field. Forgot password link under the Continue button on Sign In tab.

**Implications for planner:**
- One `AuthScreen` component handles both sign-in and sign-up via `mode` state
- Google OAuth via `expo-auth-session` + Supabase Google provider
- Apple Sign-In via `expo-apple-authentication` + Supabase Apple provider
- Apple Sign-In is mandatory on iOS per App Store guidelines (required whenever any other OAuth provider is present)
- Error states inline (not toasts) — invalid email, wrong password, network error
- Deep link redirect URI configured for OAuth callbacks

---

### 4a. v1 Migration Trigger: Auto-run silently on first login

**Decision:** On first v2 login, detect whether the user has v1 data (check `user_state` table in v1 Supabase project). If found, run the migration automatically with a progress indicator. No user action required. Fails gracefully with a retry option.

**Migration approach:** Expand-and-contract pattern
- v2 schema exists in parallel to v1 tables
- Backfill script reads `user_state` JSON blob and writes normalized v2 rows
- 60-day read-only v1 backup window before v1 tables are dropped
- Migration is idempotent — safe to re-run if it fails mid-way

**Failure handling:**
- If migration fails, show an error screen with "Retry" and "Contact Support" options
- User cannot reach onboarding or Dashboard until migration succeeds (for existing users)
- New users (no v1 data detected) skip migration entirely and go straight to onboarding

**Implications for planner:**
- Migration runs as a Supabase Edge Function, not client-side
- Client calls the Edge Function on first login, polls for status, shows progress
- Migration status stored in a `migration_status` column on the user profile table
- `migration_status` values: `none` (new user) | `pending` | `in_progress` | `complete` | `failed`
- v1 Supabase project ID: `jmtogdlsgpfoefbgdubm`

---

### 4b. Tab Nav During Onboarding: Hidden — full-screen flow

**Decision:** The 5-tab navigator is hidden entirely during onboarding. Onboarding uses its own full-screen stack navigator. Tabs appear only after all required onboarding steps are complete.

**Implications for planner:**
- Expo Router layout: root layout checks `onboardingComplete` flag (stored in MMKV)
- If `onboardingComplete === false`, render onboarding stack; otherwise render tab navigator
- No partial tab state visible during onboarding — user sees a clean, focused flow
- After the final required step, set `onboardingComplete = true` in MMKV and navigate to tab navigator

---

## Inherited Decisions (from STATE.md / prior phases)

These are already locked — planner should not revisit:

| Decision | Value |
|----------|-------|
| Offline sync library | PowerSync (`@powersync/react-native`) |
| Session storage | MMKV + SecureStore hybrid (MMKV holds session; SecureStore holds MMKV encryption key only) |
| Supabase schema | Normalized (replacing v1 single JSON blob per user) |
| Navigation | Expo Router v3 |
| Styling | NativeWind v4 |
| Language | TypeScript |
| Build | EAS Build (development / preview / production profiles) |
| Billing | RevenueCat — out of scope for Phase 1; placeholder only |
| Claude API | Via Supabase Edge Functions only (never client-side) |
| ExerciseDB | Cache-first to Supabase at build time; no runtime calls |

---

## Deferred Ideas

Items raised during discuss-phase that are out of scope for Phase 1:

- Biometric auth (Face ID / fingerprint) — Phase 2+ consideration
- Social login via Facebook or X — not planned; only Google + Apple
- v1 table cleanup / schema drop — deferred until 60-day backup window expires (post-Phase 1)
- Onboarding analytics / funnel tracking — Phase 6

---

## Walking Skeleton Requirement

Phase 1 is the first phase. The planner must emit a `SKELETON.md` alongside PLAN.md describing the end-to-end walking skeleton — the thinnest vertical slice that proves the architecture works:

> User opens app → creates account → completes onboarding → lands on Dashboard → logs one set offline → set syncs when connectivity returns

Every architectural layer (auth, nav, offline sync, DB schema) must be exercised by this slice.
