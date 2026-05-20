# Phase 1: Foundation - Research

**Researched:** 2026-05-19
**Domain:** Expo SDK 55 bare workflow + Supabase + PowerSync + auth + onboarding scaffold (greenfield)
**Confidence:** HIGH for core stack and patterns; MEDIUM for v1 migration mapping (depends on actual v1 blob shape inspection); LOW for slopcheck (tool unavailable — all packages tagged `[ASSUMED]`)

---

## Summary

Phase 1 is the architectural foundation for v2. It is a greenfield React Native app — no existing v2 code to evolve. The phase must deliver a working bare-workflow Expo SDK 55 shell with TypeScript strict, Expo Router v3 file-based navigation, NativeWind v4 styling, Supabase auth (email/password + Google + Apple), a normalized Postgres schema with RLS on every table, PowerSync offline sync against that schema, MMKV+SecureStore hybrid session storage, an EAS Build configuration with three profiles, an onboarding stack that gates the tab navigator, and a v1 migration Edge Function that auto-runs on first login.

The Walking Skeleton is the single most important deliverable: a thin end-to-end vertical slice that proves all layers compose correctly. That slice is: `open app → sign up with email → complete required onboarding → land on Dashboard → log one set offline → set syncs to Supabase via PowerSync when reconnected`. If that slice passes, the architecture is validated. Every subsequent phase builds on these layers without revisiting them.

The single biggest risk is layer interaction failure: each library (PowerSync, NativeWind, Expo Router, Supabase, MMKV) is individually well-documented, but combining them in bare workflow with New Architecture (mandatory in SDK 55) surfaces edge cases that don't appear in isolation. The phase plan should sequence integration risk early — verify the skeleton works end-to-end before building onboarding UX polish.

**Primary recommendation:** Sequence the phase as **(1) Scaffold + dev client → (2) Schema + RLS → (3) Auth providers → (4) PowerSync wiring → (5) Onboarding stack + tab nav → (6) v1 migration Edge Function → (7) Walking Skeleton verification**. Each step is independently testable; failures don't compound.

---

## User Constraints (from CONTEXT.md)

### Locked Decisions

1. **Expo Workflow: Bare (not managed)** — Required for HealthKit (Phase 5), iOS widgets (Phase 6), RevenueCat native StoreKit (Phase 4). `ios/` and `android/` directories committed. EAS Build with dev/preview/prod profiles. No `expo-modules-core` managed-only APIs. Do not require `expo-dev-client` workarounds — use development builds directly.

2. **Onboarding Strictness: All steps required, practice set optional**
   - Auth screen → account created
   - Profile (display name, units lbs/kg, primary goal) — required
   - Split selection (PPL / Upper-Lower / Full Body / etc.) — required
   - Template creation (build or select a starter template) — required
   - Practice set (log a sample set) — skippable
   - → Dashboard
   - Separate Expo Router stack (NOT inside tab navigator)
   - Each step a distinct screen with progress indicator (1/4, 2/4, …)
   - State persisted to MMKV so partial progress survives app kill
   - Back navigation within onboarding allowed; back from step 1 returns to auth
   - "Skip" button ONLY on practice-set screen

3. **Auth Screen: Single screen, all 3 providers**
   - Sign In / Sign Up tab toggle at top
   - Email/password fields → Continue button → divider → "Continue with Google" → "Continue with Apple"
   - Sign Up adds "Confirm password" field
   - Forgot password link under Continue (Sign In tab only)
   - Google OAuth via `expo-auth-session` + Supabase Google provider
   - Apple Sign-In via `expo-apple-authentication` + Supabase Apple provider (mandatory on iOS per App Store)
   - Errors inline (not toasts) — invalid email, wrong password, network error
   - Deep link redirect URI configured for OAuth callbacks

4a. **v1 Migration: Auto-run silently on first login**
   - Detect v1 data by querying `user_state` table for `user_id = auth.uid()`
   - If found: run Supabase Edge Function with progress indicator; user cannot proceed until success or retry
   - Idempotent (expand-and-contract pattern; safe to re-run)
   - 60-day read-only window on `user_state` before drop
   - `migration_status` enum on profile: `none | pending | in_progress | complete | failed`
   - New users (no v1 data) → `migration_status = none` → skip migration → straight to onboarding
   - v1 Supabase project ID: `jmtogdlsgpfoefbgdubm` (same project as v2)

4b. **Tab Nav During Onboarding: Hidden — full-screen flow**
   - Root layout checks `onboardingComplete` MMKV flag
   - If `false` → render onboarding stack; if `true` → render tab navigator
   - No partial tab visibility during onboarding
   - On final required step: set `onboardingComplete = true` and navigate to tabs

### Inherited Decisions (from STATE.md)

| Decision | Value |
|----------|-------|
| Offline sync library | PowerSync (`@powersync/react-native`) |
| Session storage | MMKV + SecureStore hybrid |
| Supabase schema | Normalized (NOT single JSON blob) |
| Navigation | Expo Router v3 |
| Styling | NativeWind v4 |
| Language | TypeScript strict |
| Build | EAS Build (dev / preview / prod) |
| Billing | RevenueCat — Phase 4, placeholder only in Phase 1 |
| Claude API | Supabase Edge Functions only |
| ExerciseDB | Cache-first to Supabase at build time |

### Claude's Discretion

- Exact SQL migration file structure (one big migration vs. multiple per-table)
- Specific theme token names and dark-mode color palette
- Onboarding screen visual layout details (progress indicator style, step transitions)
- Whether to use `expo-router` typed routes (TS) — recommend yes
- Edge Function language/structure (TypeScript + Deno is standard)

### Deferred Ideas (OUT OF SCOPE for Phase 1)

- Biometric auth (Face ID / fingerprint) — Phase 2+
- Social login via Facebook or X — never planned
- v1 table cleanup / `user_state` drop — post-Phase 1 (after 60-day window)
- Onboarding analytics / funnel tracking — Phase 6

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOUND-01 | Expo SDK 55 bare workflow | Scaffold section; bare workflow rationale per CONTEXT.md decision 1 |
| FOUND-02 | TypeScript strict mode | tsconfig section in Project Scaffold |
| FOUND-03 | Expo Router v3 file-based nav | Navigation Setup section |
| FOUND-04 | NativeWind v4 dark-first design tokens | Styling section |
| FOUND-05 | EAS Build dev/preview/prod, `expo-dev-client` (not Expo Go) | EAS Build section |
| FOUND-06 | PowerSync offline-first, syncs via Postgres WAL | Offline Sync section |
| FOUND-07 | Normalized Supabase schema with RLS on every table (all 4 CRUD policies in same migration) | Database Schema section |
| FOUND-08 | MMKV stores session; SecureStore holds MMKV key only | Session Storage section |
| FOUND-09 | Runtime version strategy in eas.json | EAS Build section |
| AUTH-01 | Email + password account creation | Authentication section |
| AUTH-02 | Google OAuth sign-in | Authentication section |
| AUTH-03 | Apple Sign-In (App Store mandatory alongside Google) | Authentication section |
| AUTH-04 | Password reset link via email | Authentication section |
| AUTH-05 | Change password from Settings (logged in) | Authentication section |
| AUTH-06 | SMS 2FA via Supabase | Authentication section (note: Supabase MFA phone factor) |
| AUTH-08 | Sign out from any screen | Authentication section (header button + Settings) |
| NAV-01 | 5-tab bottom nav (Dashboard / Workouts / Split / Progress / Settings) | Navigation Setup section |
| NAV-02 | Split has dedicated tab (not nested in Settings) | Navigation Setup section |
| NAV-03 | Active tab highlighted; navigation works offline | Navigation Setup section |
| ONBOARD-01 | Multi-step onboarding on first launch (`onboarded = false`) | Onboarding Stack pattern |
| ONBOARD-02 | Step 1 — profile + measurements (name, age, height, sex, weight, body-fat) | Onboarding screens; measurements table schema |
| ONBOARD-03 | Step 2 — split type with visual weekly schedule | Onboarding screens; split_settings schema |
| ONBOARD-04 | Step 3 — create/customize first template | Onboarding screens; templates + template_exercises schema |
| ONBOARD-05 | Step 4 — practice set (optional) | Onboarding screens; can defer set-logging logic to Phase 2 stub |
| ONBOARD-06 | Preferred workout notification time set during onboarding | notification_preferences schema |
| DATA-01 | v1 user_state JSON blob migrated to normalized v2 tables (expand-and-contract) | v1 Migration section |
| DATA-02 | Offline conflict resolution by session-ID; soft deletes only | PowerSync + Database Schema |
| DATA-03 | v2 deploys to separate Vercel URL; v1 remains live | Out of phase-1 scope — but DB tables coexist in same Supabase project |
| DESIGN-01 | Dark/light mode toggle in Settings; dark default | Styling section + Settings screen |
| DESIGN-04 | Transitions on interactive elements (150ms ease min); rest timer smooth | Styling — react-native-reanimated baseline |

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Account creation (email/password, OAuth) | Supabase Auth (backend) | RN client (UI + OAuth widget) | Auth state is the source of truth; client only initiates and stores session |
| Session persistence | RN client (MMKV) | SecureStore (encryption key) | Session lives on-device; SecureStore can't fit full JWT (2048-byte limit) |
| Workout data writes | Local SQLite (PowerSync) | Supabase Postgres (after sync) | Offline-first means local DB is write target; sync engine pushes upstream |
| Workout data reads | Local SQLite (PowerSync) | — | All reads come from local SQLite; sync engine keeps it fresh |
| RLS authorization | Supabase Postgres (server) | — | Cannot trust client; every table policy is `auth.uid() = user_id` |
| OAuth provider callback | RN client (deep link handler) | Supabase Auth (token exchange) | Apple/Google return to app via custom URL scheme; client exchanges code for Supabase session |
| Onboarding gating | RN client (MMKV flag) | Supabase profile row (mirror) | MMKV flag drives root layout; profile row backs it up server-side |
| v1 migration execution | Supabase Edge Function (server) | RN client (trigger + poll) | Migration uses service-role key to read v1 blob + write v2 rows; client polls status |
| Theme + UI styling | RN client (NativeWind) | — | Pure presentation; no backend involvement |
| Navigation routing | RN client (Expo Router file system) | — | Routing is client-only |
| Tab visibility (during onboarding) | RN client (root layout conditional) | — | Conditional render based on MMKV `onboardingComplete` |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `expo` | 55.x | Bare workflow + tooling | SDK 55 current stable; New Architecture mandatory (no opt-out) [CITED: expo.dev/changelog/sdk-55] |
| `expo-router` | 55.x | File-based navigation | Default for new Expo projects since SDK 50 [ASSUMED] |
| `react-native` | 0.83 (bundled with Expo 55) | Native runtime | Pinned by Expo SDK version |
| `typescript` | 5.x | Type safety | Via `expo/tsconfig.base` |
| `@supabase/supabase-js` | 2.x | Backend client | No v3 yet; current Supabase SDK [ASSUMED] |
| `nativewind` | 4.x | Tailwind-style styling | v4 is stable; v5 is pre-release [ASSUMED] |
| `tailwindcss` | 3.x | Tailwind core (peer dep of NativeWind v4) | NativeWind v4 requires Tailwind v3 [CITED: nativewind.dev] |
| `@powersync/react-native` | 1.x | Offline-first sync engine | Official Supabase integration [CITED: docs.powersync.com/integration-guides/supabase-+-powersync] |
| `@journeyapps/react-native-quick-sqlite` | 2.x | SQLite driver for PowerSync | Required peer dep of `@powersync/react-native` [ASSUMED] |
| `react-native-mmkv` | 4.x | Encrypted KV storage (session) | ~30x faster than AsyncStorage; supports encryption key [ASSUMED] |
| `expo-secure-store` | 14.x | Keychain / Keystore for the MMKV encryption key | Native secure storage, 2048-byte limit (fine for a UUID key) [ASSUMED] |
| `expo-crypto` | 14.x | Generate UUID for MMKV encryption key | Cryptographically secure random source [ASSUMED] |
| `expo-apple-authentication` | 7.x | Apple Sign-In native widget | Required on iOS — Apple's native SDK [ASSUMED] |
| `expo-auth-session` | 6.x | Google OAuth via in-app browser | Recommended Expo pattern for OAuth providers [ASSUMED] |
| `expo-linking` | bundled | Deep link parsing | OAuth callbacks return via custom URL scheme |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@tanstack/react-query` | 5.x | Server state caching | All Supabase reads/writes that aren't through PowerSync's reactive queries (e.g., profile, migration status) |
| `zustand` | 5.x | Client UI state | Active session state (Phase 2), modals, UI flags |
| `react-native-reanimated` | 4.x (Expo SDK 55) | Animations | Required for NativeWind v4 transitions, rest timer (Phase 2), screen transitions |
| `react-native-gesture-handler` | bundled | Touch gestures | Required peer dep of Reanimated + several other libs |
| `react-hook-form` + `zod` | 7.x / 3.x | Forms + validation | Auth screen, onboarding profile step (DESIGN-04 inline errors) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| PowerSync | WatermelonDB | WatermelonDB requires writing your own sync server + RPCs. PowerSync reads Postgres WAL directly — zero sync code. Locked decision: PowerSync. |
| MMKV + SecureStore | AsyncStorage alone | AsyncStorage is unencrypted; SecureStore alone can't hold Supabase JWT (2048 bytes). Locked decision: hybrid. |
| Expo Router | React Navigation standalone | React Navigation is what Expo Router builds on; using it directly loses file-based routing + automatic deep linking. Locked decision: Expo Router. |
| NativeWind v4 | Tamagui | Tamagui has a compiler benefit but adds build complexity and SDK conflicts. Locked decision: NativeWind. |
| `@journeyapps/react-native-quick-sqlite` | `@op-engineering/op-sqlite` | OP-SQLite is the newer, more actively maintained option. PowerSync docs reference both; recent demos use the JourneyApps driver as the default. **OP-SQLite is the path forward** — verify PowerSync's current recommendation at integration time. |

**Installation (verified versions as of 2026-05-19 via `npm view`):**

```bash
# Note: all packages below are [ASSUMED] — slopcheck is unavailable in this env.
# Planner: gate each install behind a `checkpoint:human-verify` task.

# Scaffold
npx create-expo-app@latest raze-and-rise-v2 --template bare-minimum
cd raze-and-rise-v2

# Expo CLI install will pin compatible versions:
npx expo install expo-router expo-linking expo-constants expo-status-bar expo-system-ui expo-splash-screen

# TypeScript (Expo will auto-add when it detects .tsx)
npm install --save-dev typescript @types/react

# Supabase + session
npx expo install @supabase/supabase-js react-native-mmkv expo-secure-store expo-crypto

# PowerSync (verify the SQLite driver against PowerSync's current docs at install time)
npx expo install @powersync/react-native @journeyapps/react-native-quick-sqlite

# Auth providers
npx expo install expo-apple-authentication expo-auth-session expo-web-browser

# Styling
npx expo install nativewind react-native-reanimated react-native-gesture-handler react-native-safe-area-context
npm install --save-dev tailwindcss@3

# State + forms
npm install @tanstack/react-query zustand react-hook-form zod

# EAS
npm install --global eas-cli@19
```

**Version verification (run at install time, do not hardcode):**

```bash
npm view expo version                                  # 55.0.25 confirmed 2026-05-19
npm view expo-router version                           # 55.0.15
npm view @supabase/supabase-js version                 # 2.106.0
npm view @powersync/react-native version               # 1.35.1
npm view @journeyapps/react-native-quick-sqlite version  # 2.5.2
npm view nativewind version                            # 4.2.4
npm view react-native-mmkv version                     # 4.3.1
npm view expo-secure-store version                     # 55.0.14
npm view expo-apple-authentication version             # 55.0.13
npm view expo-auth-session version                     # 55.0.16
npm view expo-crypto version                           # 55.0.15
```

---

## Package Legitimacy Audit

**slopcheck was NOT available** in this environment (`command -v slopcheck` returned not-installed). Per the Package Legitimacy Gate protocol, **every package below is tagged `[ASSUMED]`** even though `npm view` confirms each exists on the registry. The planner MUST insert a `checkpoint:human-verify` task before each install in Phase 1.

| Package | Registry | Verified Version | Source Repo | slopcheck | Disposition |
|---------|----------|------------------|-------------|-----------|-------------|
| `expo` | npm | 55.0.25 | github.com/expo/expo | UNAVAILABLE | `[ASSUMED]` — verify before install |
| `expo-router` | npm | 55.0.15 | github.com/expo/expo (router/) | UNAVAILABLE | `[ASSUMED]` |
| `@supabase/supabase-js` | npm | 2.106.0 | github.com/supabase/supabase-js | UNAVAILABLE | `[ASSUMED]` |
| `@powersync/react-native` | npm | 1.35.1 | github.com/powersync-ja/powersync-js | UNAVAILABLE | `[ASSUMED]` |
| `@journeyapps/react-native-quick-sqlite` | npm | 2.5.2 | github.com/journeyapps/react-native-quick-sqlite | UNAVAILABLE | `[ASSUMED]` |
| `nativewind` | npm | 4.2.4 | github.com/nativewind/nativewind | UNAVAILABLE | `[ASSUMED]` |
| `tailwindcss` (v3 pinned) | npm | 3.x | github.com/tailwindlabs/tailwindcss | UNAVAILABLE | `[ASSUMED]` |
| `react-native-mmkv` | npm | 4.3.1 | github.com/mrousavy/react-native-mmkv | UNAVAILABLE | `[ASSUMED]` |
| `expo-secure-store` | npm | 55.0.14 | github.com/expo/expo (packages/expo-secure-store) | UNAVAILABLE | `[ASSUMED]` |
| `expo-crypto` | npm | 55.0.15 | github.com/expo/expo (packages/expo-crypto) | UNAVAILABLE | `[ASSUMED]` |
| `expo-apple-authentication` | npm | 55.0.13 | github.com/expo/expo (packages/expo-apple-authentication) | UNAVAILABLE | `[ASSUMED]` |
| `expo-auth-session` | npm | 55.0.16 | github.com/expo/expo (packages/expo-auth-session) | UNAVAILABLE | `[ASSUMED]` |
| `@tanstack/react-query` | npm | 5.x | github.com/TanStack/query | UNAVAILABLE | `[ASSUMED]` |
| `zustand` | npm | 5.x | github.com/pmndrs/zustand | UNAVAILABLE | `[ASSUMED]` |
| `react-native-reanimated` | npm | 4.x | github.com/software-mansion/react-native-reanimated | UNAVAILABLE | `[ASSUMED]` |
| `react-hook-form` | npm | 7.x | github.com/react-hook-form/react-hook-form | UNAVAILABLE | `[ASSUMED]` |
| `zod` | npm | 3.x | github.com/colinhacks/zod | UNAVAILABLE | `[ASSUMED]` |
| `eas-cli` (global) | npm | 19.0.1 | github.com/expo/eas-cli | UNAVAILABLE | `[ASSUMED]` |

**Packages removed due to slopcheck [SLOP] verdict:** none (slopcheck unavailable)
**Packages flagged as suspicious [SUS]:** none (slopcheck unavailable)

> **Planner directive:** Insert a `checkpoint:human-verify` task before each install action. User must confirm package legitimacy. The names above were sourced from official Expo / Supabase / PowerSync documentation, which lowers risk, but registry existence alone does not confer `[VERIFIED]` status.

---

## 1. Project Scaffold

### Scaffold Command

Use the bare-minimum template (no Expo Router pre-installed — we add it explicitly):

```bash
npx create-expo-app@latest raze-and-rise-v2 --template bare-minimum
cd raze-and-rise-v2

# Verify SDK 55 was pulled (it should be — bare-minimum is updated alongside SDK release)
npx expo install --check
```

The bare-minimum template generates:

```
raze-and-rise-v2/
  ios/                  # COMMITTED to repo (bare workflow)
  android/              # COMMITTED to repo
  app.json
  package.json
  index.js              # Entry point
  App.tsx               # Will be replaced by Expo Router's app/ tree
  babel.config.js
  metro.config.js
  tsconfig.json
  .gitignore
```

### Initial File Structure (target after Phase 1)

```
raze-and-rise-v2/
  app/                              # Expo Router file-based routes
    _layout.tsx                     # Root layout — auth guard + onboarding gate
    (auth)/
      _layout.tsx
      index.tsx                     # Auth screen (Sign In / Sign Up toggle)
      forgot-password.tsx
    (onboarding)/
      _layout.tsx                   # Onboarding stack (no tab bar)
      profile.tsx                   # Step 1
      split.tsx                     # Step 2
      template.tsx                  # Step 3
      practice-set.tsx              # Step 4 (skippable)
    (tabs)/
      _layout.tsx                   # 5-tab bottom navigator
      index.tsx                     # Dashboard
      workouts.tsx
      split.tsx
      progress.tsx
      settings.tsx
    migration.tsx                   # v1 migration progress screen
    +not-found.tsx
  src/
    components/
      AuthScreen/
      OnboardingStepLayout/
      TabBar/
      MigrationProgress/
    lib/
      supabase.ts                   # Supabase client (uses storage adapter)
      storage.ts                    # MMKV + SecureStore hybrid
      powersync.ts                  # PowerSync database instance
      schema.ts                     # PowerSync schema definition (mirrors Supabase)
      connector.ts                  # PowerSync Supabase backend connector
    hooks/
      useSession.ts                 # Wraps Supabase auth state
      useOnboardingState.ts         # MMKV-backed onboarding progress
      useMigrationStatus.ts         # Polls profile.migration_status
    services/
      auth/
        email.ts                    # signUp, signIn, resetPassword
        google.ts                   # expo-auth-session flow
        apple.ts                    # expo-apple-authentication flow
      migration.ts                  # Triggers Edge Function, polls status
    types/
      database.ts                   # Generated from Supabase (npm run gen:types)
      navigation.ts                 # Typed Expo Router routes
    theme/
      tokens.ts                     # Dark/light token definitions
      tailwind.config.js            # NativeWind config
  supabase/
    migrations/
      20260519000000_initial_schema.sql
      20260519000100_rls_policies.sql
      20260519000200_storage_buckets.sql
      20260519000300_realtime_publication.sql
    functions/
      migrate-v1-user/
        index.ts                    # Reads user_state, writes normalized tables
  global.css                        # NativeWind v4 entry CSS
  nativewind-env.d.ts
  tailwind.config.js
  metro.config.js                   # Wrapped with withNativeWind
  babel.config.js                   # nativewind/babel preset
  eas.json                          # dev/preview/prod profiles
  app.config.ts                     # Replaces app.json (for env vars in plugins)
  tsconfig.json                     # extends expo/tsconfig.base; strict: true
```

### TypeScript Configuration

```json
// tsconfig.json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/app/*": ["./app/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts", "nativewind-env.d.ts"]
}
```

**Path alias warning (PITFALLS.md #14):** Use Expo's built-in `baseUrl` + `paths` (SDK 49+). Do NOT add `babel-plugin-module-resolver` — it conflicts with Expo's built-in support and causes EAS local builds to fail. Run `eas build --profile development --local` before merging the scaffold to catch any path-alias issues.

---

## 2. Navigation Setup

### Expo Router v3 Directory Structure

The `app/` directory IS the router. Files map to routes. Groups (parenthesized names) don't affect URLs — they organize layout.

```
app/
  _layout.tsx                # Root: session check + onboarding gate
  (auth)/
    _layout.tsx              # Stack navigator for auth screens
    index.tsx                # /auth — single screen, Sign In/Sign Up toggle
    forgot-password.tsx
  (onboarding)/
    _layout.tsx              # Stack navigator, header hidden, no tabs
    profile.tsx              # /onboarding/profile (step 1)
    split.tsx                # /onboarding/split (step 2)
    template.tsx             # /onboarding/template (step 3)
    practice-set.tsx         # /onboarding/practice-set (step 4, skippable)
  (tabs)/
    _layout.tsx              # Bottom Tabs navigator
    index.tsx                # / (Dashboard)
    workouts.tsx             # /workouts
    split.tsx                # /split — DEDICATED TAB (NAV-02)
    progress.tsx             # /progress
    settings.tsx             # /settings
  migration.tsx              # /migration (full-screen, blocks all nav)
  +not-found.tsx
```

### Root Layout (auth + onboarding + migration gate)

```typescript
// app/_layout.tsx
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useSession } from '@/hooks/useSession';
import { useOnboardingState } from '@/hooks/useOnboardingState';
import { useMigrationStatus } from '@/hooks/useMigrationStatus';
import '../global.css';

export default function RootLayout() {
  const { session, loading: sessionLoading } = useSession();
  const { onboardingComplete } = useOnboardingState();
  const { migrationStatus, loading: migrationLoading } = useMigrationStatus(session?.user.id);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (sessionLoading || migrationLoading) return;

    const inAuth = segments[0] === '(auth)';
    const inOnboarding = segments[0] === '(onboarding)';
    const inMigration = segments[0] === 'migration';

    if (!session) {
      if (!inAuth) router.replace('/(auth)');
      return;
    }

    // Migration gate — overrides everything else
    if (migrationStatus === 'pending' || migrationStatus === 'in_progress' || migrationStatus === 'failed') {
      if (!inMigration) router.replace('/migration');
      return;
    }

    // Onboarding gate
    if (!onboardingComplete) {
      if (!inOnboarding) router.replace('/(onboarding)/profile');
      return;
    }

    // Authenticated + migrated + onboarded — main app
    if (inAuth || inOnboarding || inMigration) router.replace('/(tabs)');
  }, [session, sessionLoading, onboardingComplete, migrationStatus, migrationLoading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="migration" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
```

### Tab Navigator (5 tabs)

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
// import icons from your icon set, e.g. lucide-react-native

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: { backgroundColor: '#0a0a0a', borderTopColor: '#1a1a1a' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="workouts" options={{ title: 'Workouts' }} />
      <Tabs.Screen name="split" options={{ title: 'Split' }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
```

### Onboarding Stack (no tab bar)

```typescript
// app/(onboarding)/_layout.tsx
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true, // allow swipe-back between steps
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="profile" />
      <Stack.Screen name="split" />
      <Stack.Screen name="template" />
      <Stack.Screen name="practice-set" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
```

### Plugin Setup (app.config.ts)

```typescript
// app.config.ts
import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Raze and Rise',
  slug: 'raze-and-rise',
  scheme: 'razeandrise', // for OAuth deep links
  newArchEnabled: true,  // SDK 55: mandatory, no opt-out
  ios: {
    bundleIdentifier: 'com.razeandrise.app',
    usesAppleSignIn: true,
    supportsTablet: false,
  },
  android: {
    package: 'com.razeandrise.app',
  },
  plugins: [
    'expo-router',
    'expo-apple-authentication',
    [
      '@powersync/react-native',
      {
        // Plugin options if any — verify against current docs at install time
      },
    ],
    [
      'react-native-mmkv',
      {
        // Plugin options if any
      },
    ],
  ],
};

export default config;
```

---

## 3. Styling — NativeWind v4

### Setup Steps

NativeWind v4 uses Tailwind v3 (Tailwind v4 support is in the pre-release NativeWind v5).

```bash
npx expo install nativewind react-native-reanimated react-native-safe-area-context
npm install --save-dev tailwindcss@3
npx tailwindcss init
```

### Configuration Files

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Dark-first tokens (DESIGN-01)
        bg: {
          DEFAULT: '#0a0a0a',     // app background
          elevated: '#141414',    // cards
          input: '#1a1a1a',
        },
        fg: {
          DEFAULT: '#ffffff',
          muted: '#a1a1aa',
          subtle: '#71717a',
        },
        accent: {
          DEFAULT: '#ff6b35',     // brand orange — adjust to match Anubis aesthetic
          muted: '#cc5429',
        },
        success: '#22c55e',
        danger: '#ef4444',
        warning: '#f59e0b',
        border: '#27272a',
      },
      transitionDuration: {
        DEFAULT: '150ms',  // DESIGN-04
      },
    },
  },
};
```

```javascript
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
```

```javascript
// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
```

```css
/* global.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

```typescript
// nativewind-env.d.ts
/// <reference types="nativewind/types" />
```

### Dark/light Toggle (DESIGN-01)

Wire Tailwind's `dark:` variant to `useColorScheme()` plus a Settings override.

```typescript
// src/hooks/useTheme.ts
import { useColorScheme } from 'react-native';
import { useMMKVString } from 'react-native-mmkv';

export function useTheme() {
  const systemTheme = useColorScheme(); // 'light' | 'dark' | null
  const [override] = useMMKVString('theme.override'); // 'light' | 'dark' | 'system' | undefined
  const effective =
    override === 'light' ? 'light' :
    override === 'dark' ? 'dark' :
    (systemTheme ?? 'dark'); // default to dark
  return effective;
}
```

NativeWind v4's `dark:` variant follows the device color scheme by default. To force-override programmatically, use the `vars()` API at the root layout, or apply the `dark` class to a top-level wrapper.

---

## 4. Offline Sync — PowerSync + Supabase

### Architecture Recap

```
Device
  └── App writes to local SQLite (instant, offline-capable)
        └── PowerSync upload queue
              └── Background sync to Supabase Postgres
        └── PowerSync reactive queries (UI subscribes to SQLite)

Supabase Postgres
  └── Postgres WAL → PowerSync Cloud → device SQLite (read sync stream)
```

### Setup Steps (server-side, one-time)

1. **Create Postgres replication role** in Supabase SQL Editor:

   ```sql
   CREATE ROLE powersync_role WITH REPLICATION LOGIN PASSWORD '<strong-password>';
   GRANT USAGE ON SCHEMA public TO powersync_role;
   GRANT SELECT ON ALL TABLES IN SCHEMA public TO powersync_role;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO powersync_role;

   CREATE PUBLICATION powersync FOR ALL TABLES;
   ```

2. **Create PowerSync instance** at dashboard.powersync.com:
   - Connect to source DB: paste Supabase Direct Connection string
   - Enable Supabase Auth in Client Auth settings
   - Define Sync Rules (YAML) — for this single-user app, scope everything by `auth.uid()`:

   ```yaml
   # PowerSync sync_rules.yaml
   bucket_definitions:
     by_user:
       parameters: SELECT request.user_id() as user_id
       data:
         - SELECT * FROM profiles WHERE user_id = bucket.user_id
         - SELECT * FROM split_settings WHERE user_id = bucket.user_id
         - SELECT * FROM templates WHERE user_id = bucket.user_id
         - SELECT * FROM template_exercises WHERE template_id IN (SELECT id FROM templates WHERE user_id = bucket.user_id)
         - SELECT * FROM sessions WHERE user_id = bucket.user_id AND is_deleted = false
         - SELECT * FROM session_sets WHERE session_id IN (SELECT id FROM sessions WHERE user_id = bucket.user_id)
         - SELECT * FROM measurements WHERE user_id = bucket.user_id
         - SELECT * FROM notification_preferences WHERE user_id = bucket.user_id
     shared_exercises:
       data:
         - SELECT * FROM exercises WHERE is_custom = false OR created_by = request.user_id()
   ```

### Client-side Setup

```typescript
// src/lib/powersync.ts
import { PowerSyncDatabase } from '@powersync/react-native';
import { AppSchema } from './schema';
import { Connector } from './connector';

export const powersync = new PowerSyncDatabase({
  schema: AppSchema,
  database: { dbFilename: 'razeandrise.db' },
});

await powersync.init();
await powersync.connect(new Connector());
```

```typescript
// src/lib/schema.ts — mirrors Supabase tables
import { column, Schema, Table } from '@powersync/react-native';

export const AppSchema = new Schema({
  profiles: new Table({
    user_id: column.text,
    display_name: column.text,
    units: column.text,          // 'kg' | 'lbs'
    primary_goal: column.text,
    age: column.integer,
    height_cm: column.real,
    sex: column.text,
    onboarded: column.integer,   // boolean as 0/1
    migration_status: column.text,
    created_at: column.text,
    updated_at: column.text,
  }, { indexes: { user_id: ['user_id'] } }),

  split_settings: new Table({
    user_id: column.text,
    split_type: column.text,
    rotation_pointer: column.integer,
    phase: column.integer,
    global_rest_seconds: column.integer,
    deload_active: column.integer,
    updated_at: column.text,
  }),

  templates: new Table({
    id: column.text,             // PK
    user_id: column.text,
    day_label: column.text,
    name: column.text,
    created_at: column.text,
    updated_at: column.text,
  }, { indexes: { user_id: ['user_id'] } }),

  template_exercises: new Table({
    id: column.text,
    template_id: column.text,
    exercise_id: column.text,
    position: column.integer,
    sets: column.integer,
    rep_low: column.integer,
    rep_high: column.integer,
    superset_group: column.integer,
    default_rest_seconds: column.integer,
  }),

  exercises: new Table({
    id: column.text,
    name: column.text,
    muscle_group: column.text,
    equipment: column.text,
    type: column.text,
    exercisedb_video_id: column.text,
    is_custom: column.integer,
    created_by: column.text,
  }),

  sessions: new Table({
    id: column.text,             // session UUID — conflict key (DATA-02)
    user_id: column.text,
    template_id: column.text,
    day_label: column.text,
    started_at: column.text,
    completed_at: column.text,
    notes: column.text,
    is_deleted: column.integer,
  }, { indexes: { user_id: ['user_id'] } }),

  session_sets: new Table({
    id: column.text,
    session_id: column.text,
    exercise_id: column.text,
    exercise_name: column.text,  // snapshot
    set_number: column.integer,
    weight_kg: column.real,
    reps_target: column.integer,
    result: column.text,         // 'go' | 'no-go' | null
    rpe: column.integer,
    is_warmup: column.integer,
    notes: column.text,
    logged_at: column.text,
  }),

  measurements: new Table({
    id: column.text,
    user_id: column.text,
    measured_at: column.text,
    weight_kg: column.real,
    body_fat_pct: column.real,
    chest_cm: column.real,
    waist_cm: column.real,
  }),

  notification_preferences: new Table({
    user_id: column.text,
    workout_reminder_enabled: column.integer,
    workout_reminder_time: column.text,
    updated_at: column.text,
  }),
});
```

```typescript
// src/lib/connector.ts
import {
  AbstractPowerSyncDatabase,
  PowerSyncBackendConnector,
  PowerSyncCredentials,
  UpdateType,
} from '@powersync/react-native';
import { supabase } from './supabase';

export class Connector implements PowerSyncBackendConnector {
  async fetchCredentials(): Promise<PowerSyncCredentials> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No Supabase session');
    return {
      endpoint: process.env.EXPO_PUBLIC_POWERSYNC_URL!,
      token: session.access_token,
    };
  }

  async uploadData(db: AbstractPowerSyncDatabase): Promise<void> {
    const tx = await db.getNextCrudTransaction();
    if (!tx) return;
    try {
      for (const op of tx.crud) {
        const record = { ...op.opData, id: op.id };
        switch (op.op) {
          case UpdateType.PUT:
            await supabase.from(op.table).upsert(record, { onConflict: 'id' });
            break;
          case UpdateType.PATCH:
            await supabase.from(op.table).update(record).eq('id', op.id);
            break;
          case UpdateType.DELETE:
            // Soft delete (DATA-02) — never hard delete
            await supabase.from(op.table).update({ is_deleted: true }).eq('id', op.id);
            break;
        }
      }
      await tx.complete();
    } catch (err) {
      // Don't call tx.complete() — PowerSync will retry
      throw err;
    }
  }
}
```

### Conflict Resolution (DATA-02)

- Every `sessions` row has a client-generated UUID created at session start.
- All upserts use `onConflict: 'id'` — idempotent.
- Completed sessions (`completed_at IS NOT NULL`) are treated as immutable; subsequent uploads with the same ID become no-ops.
- Deletes are soft (set `is_deleted = true`) — required for PowerSync convergence.

---

## 5. Session Storage — MMKV + SecureStore Hybrid

Supabase JWT sessions exceed SecureStore's 2048-byte limit. Pattern: generate a UUID encryption key with `expo-crypto`, store the key in SecureStore, use the key as MMKV's encryption key, then store the Supabase session in encrypted MMKV.

```typescript
// src/lib/storage.ts
import { MMKV } from 'react-native-mmkv';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const ENCRYPTION_KEY_NAME = 'mmkv.encryption.key';

async function getOrCreateEncryptionKey(): Promise<string> {
  let key = await SecureStore.getItemAsync(ENCRYPTION_KEY_NAME);
  if (!key) {
    key = Crypto.randomUUID(); // 36 chars, fits well under 2048-byte limit
    await SecureStore.setItemAsync(ENCRYPTION_KEY_NAME, key);
  }
  return key;
}

// MUST be awaited at app startup BEFORE Supabase client is created
let storageInstance: MMKV | null = null;

export async function initStorage(): Promise<MMKV> {
  if (storageInstance) return storageInstance;
  const encryptionKey = await getOrCreateEncryptionKey();
  storageInstance = new MMKV({ id: 'razeandrise.session', encryptionKey });
  return storageInstance;
}

export function getStorage(): MMKV {
  if (!storageInstance) throw new Error('Storage not initialized — call initStorage() first');
  return storageInstance;
}

// Adapter shape Supabase expects
export const supabaseStorageAdapter = {
  getItem: (key: string) => getStorage().getString(key) ?? null,
  setItem: (key: string, value: string) => getStorage().set(key, value),
  removeItem: (key: string) => getStorage().delete(key),
};
```

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';
import { supabaseStorageAdapter } from './storage';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: supabaseStorageAdapter as any,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // mobile — handle via deep links manually
    },
  },
);

// Required for mobile (STACK.md): refresh token while foreground only
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
```

**Offline-launch bug guard (STACK.md):** wrap session-restore with try/catch — if `startAutoRefresh()` fires while offline, the network error must be suppressed without clearing the session.

---

## 6. Database Schema (Normalized + RLS)

### Phase 1 Tables

Only the tables needed in Phase 1. Phase 2+ adds programs, photos, supplements, AI tables.

```sql
-- supabase/migrations/20260519000000_initial_schema.sql

-- 1. Profiles (one per auth user)
CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name text,
  units text NOT NULL DEFAULT 'lbs' CHECK (units IN ('lbs', 'kg')),
  primary_goal text,                  -- 'strength' | 'hypertrophy' | 'fat-loss' | 'general'
  age int,
  height_cm real,
  sex text CHECK (sex IN ('male', 'female', 'other', NULL)),
  onboarded boolean NOT NULL DEFAULT false,
  migration_status text NOT NULL DEFAULT 'none' CHECK (migration_status IN ('none', 'pending', 'in_progress', 'complete', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_profiles_user_id ON public.profiles (user_id);

-- 2. Split settings (one per user)
CREATE TABLE public.split_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  split_type text NOT NULL,           -- 'ppl' | 'upper-lower' | 'full-body' | 'body-part' | 'af-pt'
  rotation_pointer int NOT NULL DEFAULT 0,
  phase int NOT NULL DEFAULT 0,
  phase_started_at timestamptz,
  weeks_in_phase int NOT NULL DEFAULT 0,
  deload_active boolean NOT NULL DEFAULT false,
  global_rest_seconds int NOT NULL DEFAULT 90,
  weight_method text NOT NULL DEFAULT 'manual',
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_split_settings_user_id ON public.split_settings (user_id);

-- 3. Exercises (shared library + custom per user)
CREATE TABLE public.exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  muscle_group text,
  equipment text,
  type text NOT NULL DEFAULT 'strength' CHECK (type IN ('strength', 'bodyweight', 'run', 'cardio')),
  exercisedb_video_id text,
  is_custom boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_exercises_created_by ON public.exercises (created_by);
CREATE INDEX idx_exercises_muscle_group ON public.exercises (muscle_group);

-- 4. Templates
CREATE TABLE public.templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  day_label text NOT NULL,
  name text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_templates_user_id ON public.templates (user_id);

-- 5. Template exercises
CREATE TABLE public.template_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.templates ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES public.exercises ON DELETE RESTRICT,
  position int NOT NULL,
  sets int NOT NULL,
  rep_low int,
  rep_high int,
  superset_group int,
  default_rest_seconds int,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_template_exercises_template_id ON public.template_exercises (template_id);

-- 6. Sessions (each workout is one row)
CREATE TABLE public.sessions (
  id uuid PRIMARY KEY,                -- CLIENT-GENERATED for conflict resolution
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  template_id uuid REFERENCES public.templates ON DELETE SET NULL,
  day_label text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  notes text,
  is_deleted boolean NOT NULL DEFAULT false
);
CREATE INDEX idx_sessions_user_id ON public.sessions (user_id);
CREATE INDEX idx_sessions_started_at ON public.sessions (started_at DESC);

-- 7. Session sets
CREATE TABLE public.session_sets (
  id uuid PRIMARY KEY,                -- CLIENT-GENERATED
  session_id uuid NOT NULL REFERENCES public.sessions ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES public.exercises ON DELETE RESTRICT,
  exercise_name text,                 -- snapshot at log time
  set_number int NOT NULL,
  weight_kg real,
  reps_target int,
  result text CHECK (result IN ('go', 'no-go') OR result IS NULL),
  rpe int CHECK (rpe BETWEEN 1 AND 10),
  is_warmup boolean NOT NULL DEFAULT false,
  notes text,
  logged_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_session_sets_session_id ON public.session_sets (session_id);

-- 8. Measurements (timestamped history per user)
CREATE TABLE public.measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  measured_at timestamptz NOT NULL DEFAULT now(),
  weight_kg real,
  body_fat_pct real,
  chest_cm real,
  waist_cm real,
  hips_cm real,
  arms_cm real,
  thighs_cm real,
  notes text
);
CREATE INDEX idx_measurements_user_id ON public.measurements (user_id);
CREATE INDEX idx_measurements_measured_at ON public.measurements (user_id, measured_at DESC);

-- 9. Notification preferences (one per user)
CREATE TABLE public.notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  workout_reminder_enabled boolean NOT NULL DEFAULT true,
  workout_reminder_time time,
  pr_alerts_enabled boolean NOT NULL DEFAULT true,
  weekly_summary_enabled boolean NOT NULL DEFAULT true,
  meal_reminders_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 10. Trigger: profile auto-created on auth.user insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### RLS Policies — One Migration, All CRUD Operations (FOUND-07)

```sql
-- supabase/migrations/20260519000100_rls_policies.sql

-- Helper: cached auth.uid() — PITFALLS.md #6
-- Use (SELECT auth.uid()) inside policies to cache per-query.

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (user_id = (SELECT auth.uid()));

-- Split settings
ALTER TABLE public.split_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "split_settings_select_own" ON public.split_settings FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "split_settings_insert_own" ON public.split_settings FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "split_settings_update_own" ON public.split_settings FOR UPDATE USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "split_settings_delete_own" ON public.split_settings FOR DELETE USING (user_id = (SELECT auth.uid()));

-- Exercises (built-in: all read; custom: only creator)
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exercises_select_visible" ON public.exercises FOR SELECT USING (is_custom = false OR created_by = (SELECT auth.uid()));
CREATE POLICY "exercises_insert_custom" ON public.exercises FOR INSERT WITH CHECK (is_custom = true AND created_by = (SELECT auth.uid()));
CREATE POLICY "exercises_update_own_custom" ON public.exercises FOR UPDATE USING (is_custom = true AND created_by = (SELECT auth.uid())) WITH CHECK (is_custom = true AND created_by = (SELECT auth.uid()));
CREATE POLICY "exercises_delete_own_custom" ON public.exercises FOR DELETE USING (is_custom = true AND created_by = (SELECT auth.uid()));

-- Templates
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "templates_select_own" ON public.templates FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "templates_insert_own" ON public.templates FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "templates_update_own" ON public.templates FOR UPDATE USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "templates_delete_own" ON public.templates FOR DELETE USING (user_id = (SELECT auth.uid()));

-- Template exercises (via parent template ownership)
ALTER TABLE public.template_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "template_exercises_select_via_parent" ON public.template_exercises FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.templates t WHERE t.id = template_exercises.template_id AND t.user_id = (SELECT auth.uid()))
);
CREATE POLICY "template_exercises_insert_via_parent" ON public.template_exercises FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.templates t WHERE t.id = template_exercises.template_id AND t.user_id = (SELECT auth.uid()))
);
CREATE POLICY "template_exercises_update_via_parent" ON public.template_exercises FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.templates t WHERE t.id = template_exercises.template_id AND t.user_id = (SELECT auth.uid()))
);
CREATE POLICY "template_exercises_delete_via_parent" ON public.template_exercises FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.templates t WHERE t.id = template_exercises.template_id AND t.user_id = (SELECT auth.uid()))
);

-- Sessions
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_select_own" ON public.sessions FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "sessions_insert_own" ON public.sessions FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "sessions_update_own" ON public.sessions FOR UPDATE USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "sessions_delete_own" ON public.sessions FOR DELETE USING (user_id = (SELECT auth.uid()));

-- Session sets (via parent session)
ALTER TABLE public.session_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "session_sets_select_via_parent" ON public.session_sets FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.sessions s WHERE s.id = session_sets.session_id AND s.user_id = (SELECT auth.uid()))
);
CREATE POLICY "session_sets_insert_via_parent" ON public.session_sets FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.sessions s WHERE s.id = session_sets.session_id AND s.user_id = (SELECT auth.uid()))
);
CREATE POLICY "session_sets_update_via_parent" ON public.session_sets FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.sessions s WHERE s.id = session_sets.session_id AND s.user_id = (SELECT auth.uid()))
);
CREATE POLICY "session_sets_delete_via_parent" ON public.session_sets FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.sessions s WHERE s.id = session_sets.session_id AND s.user_id = (SELECT auth.uid()))
);

-- Measurements
ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "measurements_select_own" ON public.measurements FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "measurements_insert_own" ON public.measurements FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "measurements_update_own" ON public.measurements FOR UPDATE USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "measurements_delete_own" ON public.measurements FOR DELETE USING (user_id = (SELECT auth.uid()));

-- Notification preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_prefs_select_own" ON public.notification_preferences FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "notif_prefs_insert_own" ON public.notification_preferences FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "notif_prefs_update_own" ON public.notification_preferences FOR UPDATE USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "notif_prefs_delete_own" ON public.notification_preferences FOR DELETE USING (user_id = (SELECT auth.uid()));
```

**Critical rule (PITFALLS.md #6 + STATE.md blocker):** RLS + policies in the SAME migration. Realtime subscriptions silently drop events when SELECT policies are missing (`supabase/supabase#35282`).

---

## 7. Authentication

### Supabase Configuration (one-time, in dashboard)

1. **Email/password auth:** enabled by default
2. **Google OAuth:** Auth → Providers → Google → enable; Client ID from Google Cloud Console; redirect URL `https://<project>.supabase.co/auth/v1/callback`
3. **Apple Sign-In:** Auth → Providers → Apple → enable; Services ID, Key ID, Team ID, private key from Apple Developer Portal
4. **SMS MFA (AUTH-06):** Auth → MFA → Phone → enable; provider (Twilio/Vonage) configured
5. **Redirect URLs for native:** add `razeandrise://**` and `exp://**` to Auth → URL Configuration

### Email/Password (AUTH-01, AUTH-04, AUTH-05)

```typescript
// src/services/auth/email.ts
import { supabase } from '@/lib/supabase';

export async function signUpEmail(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function signInEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function resetPassword(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'razeandrise://reset-password',
  });
}

// AUTH-05: change password while logged in
export async function changePassword(newPassword: string) {
  return supabase.auth.updateUser({ password: newPassword });
}
```

### Google OAuth (AUTH-02)

```typescript
// src/services/auth/google.ts
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

const redirectTo = AuthSession.makeRedirectUri({ scheme: 'razeandrise', path: 'auth-callback' });

export async function signInGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data.url) throw error ?? new Error('No OAuth URL');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success' || !result.url) return null;

  // Parse access_token and refresh_token from result.url fragment
  const url = new URL(result.url);
  const params = new URLSearchParams(url.hash.substring(1)); // hash, not search
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (!access_token || !refresh_token) throw new Error('Missing tokens in callback');
  return supabase.auth.setSession({ access_token, refresh_token });
}
```

### Apple Sign-In (AUTH-03)

```typescript
// src/services/auth/apple.ts
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

export async function signInApple() {
  if (Platform.OS !== 'ios') throw new Error('Apple Sign-In iOS only');

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) throw new Error('Apple did not return an identity token');

  return supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });
}
```

### Deep Link Handler (in `app/_layout.tsx`)

```typescript
import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

useEffect(() => {
  const sub = Linking.addEventListener('url', async ({ url }) => {
    // Handle password-reset deep links and any non-OAuth flows
    const parsed = new URL(url);
    const params = new URLSearchParams(parsed.hash.substring(1));
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (access_token && refresh_token) {
      await supabase.auth.setSession({ access_token, refresh_token });
    }
  });
  return () => sub.remove();
}, []);
```

### Sign Out (AUTH-08) — accessible everywhere

A "Sign Out" item in Settings → Account is the canonical location. The session.endSession()-style call clears MMKV via the Supabase storage adapter.

```typescript
export async function signOut() {
  await supabase.auth.signOut();
  // RootLayout's useEffect will pick up null session and route to (auth)
}
```

### App Store Compliance

Apple App Store **requires** Sign in with Apple whenever any third-party OAuth (Google included) is present. Both must ship together. Cannot release with Google-only.

---

## 8. EAS Build

### app.config.ts (already shown in section 1)

### eas.json (FOUND-05, FOUND-09)

```json
{
  "cli": {
    "version": ">= 19.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "channel": "development",
      "ios": { "simulator": false, "resourceClass": "m-medium" },
      "android": { "buildType": "apk" },
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://jmtogdlsgpfoefbgdubm.supabase.co",
        "EXPO_PUBLIC_POWERSYNC_URL": "https://<instance>.powersync.journeyapps.com"
      }
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview",
      "ios": { "simulator": false, "resourceClass": "m-medium" },
      "android": { "buildType": "apk" }
    },
    "production": {
      "channel": "production",
      "ios": { "resourceClass": "m-medium" },
      "android": { "buildType": "app-bundle" },
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": { "appleId": "travis.g.mader@gmail.com", "ascAppId": "TBD" },
      "android": { "serviceAccountKeyPath": "./play-service-account.json" }
    }
  }
}
```

### Runtime Version Policy (FOUND-09)

Add to `app.config.ts` under expo config:

```typescript
runtimeVersion: { policy: 'fingerprint' },
updates: {
  url: 'https://u.expo.dev/<project-id>',
  fallbackToCacheTimeout: 0,
},
```

`fingerprint` is the SDK 55-recommended policy — recomputes based on native project state. OTA updates only delivered to compatible binaries. Adding a new native module changes the fingerprint and forces a new native build, preventing the OTA-breaks-native pitfall (PITFALLS.md #4).

### Bundle Identifiers (locked in Phase 1, painful to change)

- iOS: `com.razeandrise.app`
- Android: `com.razeandrise.app`

Apple Sign-In requires entitlement linkage to the bundle ID — set this in `app.config.ts` (`usesAppleSignIn: true`) and `eas credentials` will provision it.

### Development Workflow

```bash
# First-time setup
eas login
eas build:configure
eas credentials   # provision Apple Sign-In, Google OAuth, push certs

# Each developer builds the dev client once per native dep change
eas build --profile development --platform ios
eas build --profile development --platform android

# Daily dev loop (after dev client installed on device)
npx expo start --dev-client

# OTA push (only JS/asset changes)
eas update --branch development
```

**Critical:** Never test in Expo Go. Push notifications, HealthKit, Apple Sign-In, MMKV, PowerSync all require a custom dev client (PITFALLS.md #3).

---

## 9. v1 Migration — Edge Function (DATA-01)

### v1 Data Shape

Single table `user_state` in the same Supabase project (`jmtogdlsgpfoefbgdubm`):

```sql
-- v1 (existing, untouched)
user_state (
  user_id uuid PRIMARY KEY REFERENCES auth.users,
  state jsonb,
  updated_at timestamptz
)
```

`state` JSON blob contains (inferred from PROJECT.md + ARCHITECTURE.md):

```typescript
{
  profile: { name, age, height, sex },
  measurements: { weight, bodyFat, /* possibly more */ },
  settings: { split, splitPhase, ... },
  rotation: { pointer },
  templates: { [dayLabel: string]: { exercises: [...] } },
  history: [
    { id: uuid, day_label, started_at, completed_at, sets: [...] }
  ],
  // possibly: oneRepMaxes, notes
}
```

**Action item for planner:** Phase 1 should include a discovery task — actually query the v1 `user_state` table (admin user only, `travis.g.mader@gmail.com`) and dump one real blob to disk. Build the migration function against the actual schema, not the inferred one.

### Migration Function Design

```typescript
// supabase/functions/migrate-v1-user/index.ts
// Triggered by client on first login
// Uses SERVICE_ROLE_KEY to bypass RLS

import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response('Unauthorized', { status: 401 });

  // Validate user JWT
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  // Service role client for the migration writes
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    // 1. Mark in-progress (idempotent)
    await admin.from('profiles')
      .update({ migration_status: 'in_progress' })
      .eq('user_id', user.id);

    // 2. Fetch v1 blob
    const { data: v1Row, error } = await admin
      .from('user_state')
      .select('state, updated_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    if (!v1Row) {
      // New user — no migration needed
      await admin.from('profiles')
        .update({ migration_status: 'none' })
        .eq('user_id', user.id);
      return new Response(JSON.stringify({ status: 'none' }), { status: 200 });
    }

    const state = v1Row.state;
    const updatedAt = v1Row.updated_at;

    // 3. Profile (upsert — idempotent)
    await admin.from('profiles').upsert({
      user_id: user.id,
      display_name: state.profile?.name ?? null,
      age: state.profile?.age ? parseInt(state.profile.age, 10) : null,
      height_cm: parseHeight(state.profile?.height),
      sex: state.profile?.sex ?? null,
      units: state.settings?.units ?? 'lbs',
      // onboarded stays false — user may want to skim through onboarding to set defaults
      // OR: set onboarded = true if v1 user already had a split + template
      onboarded: !!(state.settings?.split && Object.keys(state.templates ?? {}).length > 0),
    }, { onConflict: 'user_id' });

    // 4. Latest measurement snapshot
    if (state.measurements?.weight) {
      await admin.from('measurements').upsert({
        id: deterministicUuid(user.id, 'm-initial'),
        user_id: user.id,
        measured_at: updatedAt,
        weight_kg: kgFromLbs(parseFloat(state.measurements.weight)),
        body_fat_pct: state.measurements.bodyFat ? parseFloat(state.measurements.bodyFat) : null,
      }, { onConflict: 'id' });
    }

    // 5. Split settings
    if (state.settings?.split) {
      await admin.from('split_settings').upsert({
        user_id: user.id,
        split_type: state.settings.split,
        rotation_pointer: state.rotation?.pointer ?? 0,
        phase: state.settings.splitPhase ?? 0,
        global_rest_seconds: state.settings.restSeconds ?? 90,
      }, { onConflict: 'user_id' });
    }

    // 6. Templates + template_exercises
    for (const [dayLabel, template] of Object.entries(state.templates ?? {})) {
      const templateId = deterministicUuid(user.id, `t-${dayLabel}`);
      await admin.from('templates').upsert({
        id: templateId,
        user_id: user.id,
        day_label: dayLabel,
        name: dayLabel,
      }, { onConflict: 'id' });

      // For each exercise: ensure it exists in `exercises` (create as custom if not)
      // then insert template_exercises row
      // ... (full implementation in plan)
    }

    // 7. History → sessions + session_sets
    for (const entry of state.history ?? []) {
      // session.id = entry.id — PRESERVE the UUID for idempotency
      await admin.from('sessions').upsert({
        id: entry.id,
        user_id: user.id,
        day_label: entry.day_label,
        started_at: entry.started_at,
        completed_at: entry.completed_at,
        notes: entry.notes ?? null,
      }, { onConflict: 'id' });

      // session_sets — each set keyed by deterministic UUID
      for (const set of entry.sets ?? []) {
        await admin.from('session_sets').upsert({
          id: deterministicUuid(entry.id, `s-${set.exercise_id}-${set.set_number}`),
          session_id: entry.id,
          exercise_id: set.exercise_id, // assumes v1 already has exercise UUIDs
          exercise_name: set.exercise_name,
          set_number: set.set_number,
          weight_kg: kgFromLbs(set.weight),
          result: set.result,
        }, { onConflict: 'id' });
      }
    }

    // 8. Mark complete
    await admin.from('profiles')
      .update({ migration_status: 'complete' })
      .eq('user_id', user.id);

    return new Response(JSON.stringify({ status: 'complete' }), { status: 200 });
  } catch (err) {
    await admin.from('profiles')
      .update({ migration_status: 'failed' })
      .eq('user_id', user.id);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});

// Helpers
function deterministicUuid(...parts: string[]): string {
  // Use a UUID v5 with a fixed namespace so re-runs produce the same IDs (idempotency)
  // crypto.subtle.digest in Deno + uuid v5 namespace, or hand-roll
  // ... see uuid module
}
function kgFromLbs(lbs: number): number { return lbs * 0.45359237; }
function parseHeight(h: string | undefined): number | null { /* parse "5'10\"" or "70" */ return null; }
```

### Idempotency Rules

1. All inserts are upserts with deterministic IDs (either preserve v1 UUIDs or derive UUIDv5 from stable inputs)
2. `migration_status` is the single source of truth for re-run safety
3. Service role bypasses RLS — never expose this key to the client
4. `user_state` is read but never written

### Client-side Trigger + Polling

```typescript
// src/services/migration.ts
import { supabase } from '@/lib/supabase';

export async function startMigration(userId: string) {
  // 1. Mark profile as pending
  await supabase.from('profiles').update({ migration_status: 'pending' }).eq('user_id', userId);

  // 2. Invoke Edge Function (don't await — it runs in background)
  supabase.functions.invoke('migrate-v1-user'); // fire-and-poll

  // 3. Poll profiles.migration_status every 1s
  return new Promise<'complete' | 'failed'>(async (resolve) => {
    while (true) {
      await new Promise(r => setTimeout(r, 1000));
      const { data } = await supabase.from('profiles').select('migration_status').eq('user_id', userId).single();
      if (data?.migration_status === 'complete') return resolve('complete');
      if (data?.migration_status === 'failed') return resolve('failed');
    }
  });
}
```

### Migration Trigger Logic (in RootLayout)

On every fresh sign-in:
1. Fetch `profiles.migration_status` for the user
2. If `migration_status === 'none'` AND `user_state` row exists for this user → set to `pending` and route to `/migration`
3. If `migration_status === 'complete'` → continue normal flow
4. If `migration_status === 'failed'` → show retry UI on `/migration`
5. If `migration_status === 'pending'` or `'in_progress'` → continue polling

**Pre-flight (deferred but tracked in STATE.md):** take a Supabase point-in-time backup before running migration in production.

---

## 10. Walking Skeleton

> The thinnest end-to-end vertical slice that proves the architecture works. Phase 1 success = this slice passes.

### Slice Definition

> A new user opens the app → signs up with email/password → completes minimal onboarding (profile + split + template) → lands on Dashboard → starts a session and logs one set with airplane mode ON → set is visible in active session immediately → reconnects → set syncs to Supabase Postgres → set is visible in `session_sets` table in Supabase dashboard.

### Layers Exercised

| Layer | Verified By |
|-------|-------------|
| Bare workflow scaffold | App actually launches on iOS simulator + Android emulator |
| Expo Router file-based nav | Routes load: `(auth) → (onboarding) → (tabs)` |
| TypeScript strict | `tsc --noEmit` passes |
| NativeWind v4 | Dark theme applied; one component uses utility classes |
| Supabase auth (email) | Sign-up succeeds; session persists across app restart |
| MMKV + SecureStore | After kill + relaunch, session restored without re-login |
| Normalized schema | Tables created; RLS visible in Supabase dashboard |
| RLS works | User A cannot read User B's rows (test with two accounts) |
| Onboarding flow | All 3 required steps completable; profile + split + template rows in Supabase |
| Onboarding gate | New user can't reach Dashboard without finishing required steps |
| Tab nav | All 5 tabs render and are visually highlighted on active |
| PowerSync client | Local SQLite database created on app launch |
| PowerSync sync down | After logging in, profile row appears in local SQLite from server |
| PowerSync sync up | Set logged offline appears in Supabase after reconnect |
| v1 migration | Existing v1 user logs in → migration runs → history visible in `sessions` table |
| Apple Sign-In + Google | Both providers reach a Supabase session (test on real iOS device) |
| EAS dev build | Custom dev client installable on physical iOS + Android device |

### What's NOT in the Walking Skeleton

- Beautiful UI / animations / DESIGN polish beyond dark theme
- The full set of onboarding measurements (just enough to validate the flow)
- Settings screens (placeholders OK)
- Practice-set step UX polish (just a "Skip" button is fine)
- Password reset, password change, SMS MFA (can be stubs that lead to "coming soon" if needed for Phase 1 scope — planner decides)

### Skeleton Success Criteria (maps to ROADMAP success criteria 1–5)

1. ✅ User creates account with email/password, Google OAuth, or Apple — all reach the app
2. ✅ New user completes onboarding (profile → split → template → practice set) and lands on Dashboard with split + template configured
3. ✅ User can start a session and log a set offline; set visible immediately; syncs when online
4. ✅ All 5 tabs work offline; active tab visually highlighted
5. ✅ v1 user data queryable from normalized v2 tables after migration

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Offline-first sync with conflict resolution | Custom Supabase REST polling + outbox | PowerSync | Reads Postgres WAL directly; locked decision |
| Encrypted local KV storage | AsyncStorage + custom encryption | MMKV with encryption key | 30x faster; built-in encryption; locked decision |
| OAuth in WebView | Hand-rolled WebView + URL parsing | `expo-auth-session` | Handles PKCE, state token, in-app browser correctly |
| Apple Sign-In | OAuth flow simulated | `expo-apple-authentication` (native widget) | Apple rejects non-native Sign-In implementations |
| File-based routing | Custom route guards + stack management | Expo Router v3 | Deep linking, type-safe routes, web compat all free |
| Tailwind-style RN styling | StyleSheet + token system from scratch | NativeWind v4 | Locked decision; `dark:` variant; utilities |
| JWT refresh on mobile | Manual token refresh + AppState listener | `supabase.auth.startAutoRefresh()` (gated on AppState) | Documented Supabase pattern |
| Edge functions (Claude, migration) | Server-side TypeScript via custom Express | Supabase Edge Functions (Deno) | Built-in JWT validation, serverless, free tier covers needs |
| Form validation | useState + manual validation | `react-hook-form` + `zod` | Schema-driven; tiny bundle; great DX |
| Migration UUIDs | Random UUIDs (would re-create rows on re-run) | UUIDv5 with stable namespace OR preserve v1 UUIDs | Idempotency requires deterministic IDs |
| Custom theme switcher | Context provider + manual updates | NativeWind `dark:` + `useColorScheme()` | Built-in; honors OS setting |

---

## Common Pitfalls

### Pitfall 1: Path aliases break EAS builds (PITFALLS.md #14)

**What goes wrong:** `tsconfig.json` paths work in `expo start` but fail with "module not found" in `eas build`.
**Why it happens:** Conflict between Expo's built-in baseUrl support (SDK 49+) and `babel-plugin-module-resolver`.
**How to avoid:** Use Expo's built-in support (`baseUrl: "."` + `paths`); do NOT add `babel-plugin-module-resolver`. Run `eas build --profile development --local` before committing the scaffold.
**Warning signs:** Aliases work locally but EAS bundle fails; both `tsconfig.json` paths AND babel module resolver configured.

### Pitfall 2: RLS-enabled table with no SELECT policy = silent empty queries (PITFALLS.md #6)

**What goes wrong:** UPDATE queries succeed but SELECT returns empty — no error.
**Why it happens:** Postgres applies RLS; missing SELECT policy denies all reads.
**How to avoid:** Add all four CRUD policies in the same migration as `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`. Test from a non-admin client (the SQL Editor bypasses RLS).
**Warning signs:** Empty results with no error; Realtime subscriptions show "subscribed" but no events arrive.

### Pitfall 3: Supabase session lost on offline launch (STACK.md #3)

**What goes wrong:** App launches offline; `startAutoRefresh()` fires; network error → session cleared → user signed out.
**Why it happens:** Supabase JS treats refresh failure as invalid session.
**How to avoid:** Wrap auth init in try/catch; suppress network errors; check `NetInfo.isConnected` before refresh. Track via Supabase Discussion #36906.
**Warning signs:** Users report being "randomly signed out"; behavior reproduces in airplane mode.

### Pitfall 4: Apple Sign-In missing → App Store rejection (PITFALLS.md #1)

**What goes wrong:** Ship Google-only auth → App Store rejects under guideline 4.8.
**Why it happens:** Apple mandates Sign in with Apple whenever any third-party OAuth is present.
**How to avoid:** Both Google AND Apple ship in Phase 1. Test on real iOS device (Apple Sign-In doesn't work in simulator before iOS 15).
**Warning signs:** Apple Sign-In deferred to "later phase"; only Google OAuth visible on the auth screen.

### Pitfall 5: MMKV encryption key regenerated on reinstall = session lost

**What goes wrong:** App reinstalled (or SecureStore cleared) → new MMKV key → existing encrypted session unreadable → user signed out.
**Why it happens:** MMKV cannot decrypt without the key. SecureStore on iOS is keychain-backed and may or may not survive reinstall depending on entitlements.
**How to avoid:** This is acceptable for a fresh install — but document the behavior. Do not rely on cross-install session survival. Use `SecureStoreOptions.keychainAccessible = AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`.
**Warning signs:** Reinstall scenarios produce "decryption failed" MMKV errors.

### Pitfall 6: Migration runs while v2 schema not deployed = profile auto-insert trigger crashes

**What goes wrong:** Migration writes to `profiles` but the trigger from `auth.users` insert also writes → unique key conflict → migration fails.
**Why it happens:** `handle_new_user` trigger fires on `auth.users` insert; if migration upserts profile first, conflict.
**How to avoid:** Trigger uses `INSERT ... ON CONFLICT DO NOTHING`; migration uses `UPSERT ON CONFLICT (user_id)`. Both safe.
**Warning signs:** "duplicate key value violates unique constraint" errors during migration.

### Pitfall 7: PowerSync schema drift from Supabase schema = sync errors

**What goes wrong:** Add a column to Supabase but forget to update PowerSync client schema → sync fails or column is silently null on client.
**Why it happens:** Two separate schema definitions (Postgres DDL + `AppSchema` in `src/lib/schema.ts`).
**How to avoid:** Schema changes ALWAYS modify both files in the same commit. Add a CI check that compares column lists.
**Warning signs:** Newly added column reads as `undefined` on client but exists in Postgres.

### Pitfall 8: Native module added without rebuild = production crash on OTA (PITFALLS.md #4)

**What goes wrong:** `npm install <new-native-lib>` then ship `eas update` → app crashes on launch on user devices.
**Why it happens:** OTA updates only ship JS/assets, not native binaries.
**How to avoid:** Configure `runtimeVersion: { policy: 'fingerprint' }` in app.config. Any native dep change requires a new `eas build` and store distribution.
**Warning signs:** Native lib added the same day an OTA is shipped; no runtime version policy in eas.json.

### Pitfall 9: Onboarding flag stored only in MMKV → lost on reinstall

**What goes wrong:** User onboards, reinstalls app → MMKV cleared → onboarding shown again even though their profile is complete in Supabase.
**Why it happens:** MMKV is local-only.
**How to avoid:** Mirror `onboardingComplete` in `profiles.onboarded` server-side. Check the server flag in RootLayout if MMKV flag is missing.
**Warning signs:** Users report repeated onboarding after reinstall.

### Pitfall 10: Bare-workflow developers accidentally run `expo prebuild` and lose customizations

**What goes wrong:** Running `expo prebuild` regenerates `ios/` and `android/` from `app.config.ts`, wiping any hand-edited Xcode/Gradle files.
**Why it happens:** Bare workflow can still have native customizations applied via config plugins OR manual editing; prebuild discards manual edits.
**How to avoid:** Either commit to config-plugin-only customizations OR add `prebuild` to a `.gitignore` reminder. In bare workflow we keep `ios/` and `android/` committed (CONTEXT.md decision 1) — DO NOT run `expo prebuild` after the initial scaffold unless you intentionally regenerate.
**Warning signs:** Apple Sign-In entitlement vanishes; custom Info.plist keys missing; native logs show "Module not found" for previously-working modules.

---

## Code Examples

Verified patterns referenced from official sources. Many of these are duplicated in the sections above; this consolidates the critical snippets.

### Supabase client with MMKV adapter

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { supabaseStorageAdapter } from './storage';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { storage: supabaseStorageAdapter as any, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false } },
);
```

### PowerSync hook (reactive query) in a component

```typescript
// In a component
import { usePowerSync, usePowerSyncQuery } from '@powersync/react-native';

function RecentSessions() {
  const { rows } = usePowerSyncQuery<Session>(
    'SELECT * FROM sessions WHERE is_deleted = 0 ORDER BY started_at DESC LIMIT 10',
  );
  return <List data={rows} />;
}
```

### Logging a set offline (the Walking Skeleton's critical write)

```typescript
import { powersync } from '@/lib/powersync';
import * as Crypto from 'expo-crypto';

async function logSet(sessionId: string, exerciseId: string, weight_kg: number, set_number: number) {
  await powersync.execute(
    `INSERT INTO session_sets (id, session_id, exercise_id, set_number, weight_kg, result, logged_at)
     VALUES (?, ?, ?, ?, ?, 'go', ?)`,
    [Crypto.randomUUID(), sessionId, exerciseId, set_number, weight_kg, new Date().toISOString()],
  );
  // Written to local SQLite immediately. PowerSync background-syncs to Supabase when online.
}
```

### Apple Sign-In + Supabase

```typescript
const credential = await AppleAuthentication.signInAsync({
  requestedScopes: [
    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
    AppleAuthentication.AppleAuthenticationScope.EMAIL,
  ],
});
await supabase.auth.signInWithIdToken({ provider: 'apple', token: credential.identityToken! });
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Expo Managed only | Bare workflow + EAS + Config Plugins | SDK 50+ | Bare workflow is now first-class — no native complexity penalty |
| AsyncStorage for sessions | MMKV + SecureStore hybrid | Always (SecureStore 2048-byte limit known since RN 0.60+) | Supabase sessions never fit in SecureStore alone |
| Legacy Architecture | New Architecture (mandatory) | SDK 55 (Feb 2026) | Every lib must be New Architecture compatible |
| `babel-plugin-module-resolver` for path aliases | Expo built-in `baseUrl` + `paths` | SDK 49+ | Causes EAS build failures if both are configured |
| Custom offline sync (WatermelonDB + manual RPCs) | PowerSync (reads Postgres WAL directly) | Stable since 2024 | Eliminates entire class of sync code |
| Google Fit (Android) | Health Connect | Google Fit deprecated May 2024 | Future Phase 5 wearables work — not Phase 1 |
| NativeWind v3 className compiler | NativeWind v4 (Babel-only, no compiler) | Late 2024 | Simpler setup; v4 stable, v5 pre-release |
| `expo-router` v2 (typed routes opt-in) | v3 (typed routes default) | Bundled with SDK 53+ | Better DX; type-safe `<Link href="">` |

**Deprecated / outdated (do NOT use):**

- Expo Go for testing native modules (PITFALLS.md #3)
- AsyncStorage as the Supabase session store
- `babel-plugin-module-resolver` on SDK 49+
- Google Fit REST API on Android
- Stripe alone for iOS digital subscriptions (PITFALLS.md #1) — Phase 4 concern
- WatermelonDB (would have been an alternative; PowerSync chosen)
- `react-native-google-fit` (deprecated; use `react-native-health-connect` in Phase 5)
- `@anthropic-ai/sdk` directly from React Native — Phase 4 concern

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework (unit/component) | Vitest 2.x + `@testing-library/react-native` 13.x |
| Framework (E2E mobile) | Maestro (YAML-based, no native build changes) |
| Framework (E2E web) | Playwright (against Vercel preview URL) |
| Config files | `vitest.config.ts`, `.maestro/*.yaml`, `playwright.config.ts` — all created in Wave 0 |
| Quick run command | `npm run test:unit` (Vitest watch) |
| Full suite command | `npm run test:all` (Vitest + Maestro + Playwright if web build exists) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOUND-01 | App scaffold launches | smoke | `eas build --profile development --platform ios --local` (smoke build) | ❌ Wave 0 |
| FOUND-02 | TypeScript strict passes | unit | `npx tsc --noEmit` | ❌ Wave 0 |
| FOUND-03 | Expo Router renders all routes | unit | `vitest run tests/unit/router.test.tsx` | ❌ Wave 0 |
| FOUND-04 | NativeWind compiles dark theme | unit | `vitest run tests/unit/theme.test.tsx` | ❌ Wave 0 |
| FOUND-05 | EAS profiles validate | smoke | `eas build:configure --check` (config validation) | ❌ Wave 0 |
| FOUND-06 | PowerSync local SQLite created | integration | `maestro test .maestro/powersync-init.yaml` | ❌ Wave 0 |
| FOUND-07 | RLS denies cross-user access | integration | `vitest run tests/integration/rls.test.ts` (two-user fixture) | ❌ Wave 0 |
| FOUND-08 | Session survives kill + relaunch | E2E | `maestro test .maestro/session-persistence.yaml` | ❌ Wave 0 |
| FOUND-09 | OTA delivers only to compatible fingerprints | manual | document procedure in PLAN | manual-only |
| AUTH-01 | Sign up + sign in with email | E2E | `maestro test .maestro/auth-email.yaml` | ❌ Wave 0 |
| AUTH-02 | Google OAuth completes | E2E (manual-only on physical device) | `maestro test .maestro/auth-google.yaml` (requires real device) | ❌ Wave 0 |
| AUTH-03 | Apple Sign-In completes | E2E (manual-only — Apple's anti-automation) | document procedure | manual-only |
| AUTH-04 | Password reset link sent | unit + manual | `vitest run tests/unit/auth/reset.test.ts` + manual email check | ❌ Wave 0 |
| AUTH-05 | Change password from Settings | E2E | `maestro test .maestro/change-password.yaml` | ❌ Wave 0 |
| AUTH-06 | SMS MFA enrolls + challenges | manual-only | document procedure | manual-only |
| AUTH-08 | Sign out clears session | E2E | `maestro test .maestro/sign-out.yaml` | ❌ Wave 0 |
| NAV-01,02,03 | All 5 tabs render; active highlighted; offline navigation works | E2E | `maestro test .maestro/tabs.yaml` (airplane mode toggle) | ❌ Wave 0 |
| ONBOARD-01–06 | Onboarding flow completable | E2E | `maestro test .maestro/onboarding.yaml` | ❌ Wave 0 |
| DATA-01 | v1 migration produces v2 rows | integration | `vitest run tests/integration/migrate.test.ts` (against test fixture blob) | ❌ Wave 0 |
| DATA-02 | Idempotent re-run | integration | same file, runs migration twice | ❌ Wave 0 |
| DATA-03 | v2 deploy URL parallel to v1 | manual | document procedure | manual-only |
| DESIGN-01 | Dark default + Settings toggle | E2E | `maestro test .maestro/theme-toggle.yaml` | ❌ Wave 0 |
| DESIGN-04 | 150ms transitions | manual / visual | document procedure | manual-only |

### Sampling Rate

- **Per task commit:** `npm run test:unit -- --run` (Vitest single-run, < 30s)
- **Per wave merge:** `npm run test:unit && npm run test:integration` (adds RLS + migration tests)
- **Phase gate:** Full Vitest + Maestro E2E + manual checklist green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `vitest.config.ts` — Vitest configuration
- [ ] `tests/unit/router.test.tsx` — Expo Router snapshot tests
- [ ] `tests/unit/theme.test.tsx` — NativeWind dark mode test
- [ ] `tests/unit/auth/*.test.ts` — Auth service unit tests
- [ ] `tests/integration/rls.test.ts` — Two-user RLS verification (requires test Supabase project or seeded local)
- [ ] `tests/integration/migrate.test.ts` — Migration function test against fixture v1 blob
- [ ] `.maestro/*.yaml` — E2E test files (auth, onboarding, tabs, session persistence)
- [ ] `playwright.config.ts` — Web E2E config (placeholder until web build exists)
- [ ] Framework install: `npm install --save-dev vitest @testing-library/react-native @vitest/browser` + `brew install maestro`
- [ ] `package.json` test scripts (`test:unit`, `test:integration`, `test:e2e`, `test:all`)
- [ ] CI workflow (`.github/workflows/test.yml`) — runs Vitest + tsc on PR

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | YES | Supabase Auth (PBKDF2 password hashing managed by Supabase); MFA via Supabase phone factor (AUTH-06); password reset via signed email links |
| V3 Session Management | YES | Supabase JWT (1h access token + refresh); MMKV encrypted storage; AppState-gated auto-refresh; cleared on `signOut` |
| V4 Access Control | YES | RLS policies on every table (FOUND-07); `(SELECT auth.uid()) = user_id` predicate; service role used only in Edge Functions |
| V5 Input Validation | YES | `zod` schemas validate all form input; Supabase enforces column types + CHECK constraints; Edge Function validates JWT before any work |
| V6 Cryptography | YES | MMKV encryption via AES-256 (built-in); SecureStore (Keychain/Keystore) for the encryption key; never hand-roll crypto |
| V7 Error Handling | YES | Inline auth errors (not toasts per CONTEXT.md); no stack traces shown to user; Edge Function errors logged server-side |
| V8 Data Protection | YES | HTTPS-only Supabase; pgcrypto-encrypted PII not in scope for Phase 1; OAuth tokens for wearables (Phase 5) get separate encryption |
| V13 Configuration | YES | Env vars via Expo `EXPO_PUBLIC_*` for public values; Supabase service role key NEVER in client bundle; `eas.json` env per profile |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL injection via Supabase client | Tampering | Use `supabase.from()` builder methods only (never raw SQL on the client); PowerSync uses parameterized queries |
| RLS bypass via metadata manipulation | Elevation | Subscription tier (Phase 4) stored in `subscriptions` table, NOT `raw_user_meta_data`; RLS reads from `app_metadata` set by auth hook |
| OAuth state tampering | Spoofing | `expo-auth-session` includes PKCE + state parameter automatically |
| Apple identity token replay | Spoofing | Supabase validates Apple's signed identity token via JWKS; per-request nonce |
| Session theft from device | Information Disclosure | MMKV AES-256 encrypted at rest with key from Keychain (iOS) / Keystore (Android) |
| MMKV encryption key extraction (rooted/jailbroken device) | Information Disclosure | Accepted residual risk; Keychain `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY` reduces accessibility |
| Migration replay → duplicate rows | Tampering | Idempotent UPSERTs with stable IDs (preserved or UUIDv5-derived) |
| Deep link injection (auth callback) | Spoofing | Validate URL scheme matches `razeandrise://`; Supabase verifies tokens server-side before issuing session |
| Service role key leak | Elevation | Service role only in Edge Functions; never in `.env` shipped in EAS build; never in `EXPO_PUBLIC_*` |

---

## Runtime State Inventory

**Phase classification:** This is a **greenfield** phase. The v2 codebase does not yet exist. No prior runtime state to inventory in the v2 app itself.

**However**, there IS shared external state because v1 and v2 share the Supabase project (`jmtogdlsgpfoefbgdubm`). The v1 migration is precisely a runtime-state operation.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data (v1) | `user_state` table in Supabase project `jmtogdlsgpfoefbgdubm` — one JSON blob per existing v1 user | Read-only access in Edge Function; write derived rows into v2 normalized tables; do NOT modify or delete `user_state` rows during Phase 1 |
| Live service config | Supabase Auth providers (Google, Apple) must be enabled in dashboard before code can use them; PowerSync instance must be created in PowerSync dashboard before client connects | Manual one-time setup tasks in the plan |
| OS-registered state | None — bare workflow scaffold creates fresh `ios/` and `android/` directories; no Task Scheduler / launchd / etc. involved | None — verified by Phase 1 being greenfield |
| Secrets / env vars | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_POWERSYNC_URL` (public — bundle-safe); `SUPABASE_SERVICE_ROLE_KEY` (Edge Function only — never in client); Google OAuth credentials in Supabase dashboard; Apple Sign-In key in Supabase dashboard; PowerSync instance auth secret | EAS secret manager: `eas secret:create --name SUPABASE_SERVICE_ROLE_KEY --value <key>` |
| Build artifacts | None pre-existing — first build will produce iOS `.ipa` + Android `.aab` via EAS; dev clients (`.app`/`.apk`) per developer device | None — created fresh by EAS |

**v1 app continues running** at https://raze-and-rise.vercel.app and continues writing to `user_state`. This is intentional (DATA-03) — cutover is deliberate after v2 is stable.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js 20+ | Expo scaffold, npm, tsc | ✓ (assumed — required for any modern Expo project) | TBD per dev machine | — |
| npm or pnpm | Package management | ✓ | TBD | — |
| Xcode 16+ | iOS native builds (bare workflow) | macOS only — required on at least one dev machine | TBD | EAS Build cloud (no local Xcode needed for cloud builds) |
| Android Studio + JDK 17 | Android native builds | TBD per dev machine | — | EAS Build cloud |
| EAS CLI (`eas-cli`) | All build + submit operations | ✓ (latest 19.0.1 verified) | 19.0.1 | None — required |
| Expo Account | EAS Build, EAS Update | ✓ (assumed — user has Vercel account, likely has Expo too — confirm in Phase 1 first task) | — | None — required |
| Apple Developer Account | iOS signing, Apple Sign-In, TestFlight | TBD — confirm before Phase 1 starts | — | None — required (paid, $99/yr) |
| Google Play Developer Account | Android signing, internal testing | TBD — confirm before Phase 1 starts | — | None — required (paid, one-time $25) |
| Supabase project (jmtogdlsgpfoefbgdubm) | Auth, database, storage, Edge Functions | ✓ (live in v1) | current | — |
| PowerSync account + instance | Offline sync | NOT YET CREATED | — | None — must create in Phase 1 |
| Maestro CLI | E2E testing | `brew install maestro` — install during Wave 0 | — | Manual checklist |
| Physical iOS device | Apple Sign-In testing (simulator unreliable pre-iOS 17) | TBD | — | iOS 17 simulator for development; real device required for AUTH-03 verification |
| Physical Android device | Google OAuth testing on real Android | TBD | — | Android emulator with Google Play services |

**Missing dependencies with no fallback (must address in Phase 1 first task):**

- Apple Developer Account membership ($99/yr) — required for Apple Sign-In, TestFlight, App Store
- Google Play Developer Account ($25 one-time) — required for Play Store, internal testing
- Expo organization / account confirmation
- PowerSync instance creation in PowerSync dashboard

**Missing dependencies with fallback:**

- Local Xcode / Android Studio — fallback to EAS Build cloud (slower iteration, but no local install needed)

---

## Project Constraints (from CLAUDE.md)

No `CLAUDE.md` exists in the project root (`/Users/travismader/Desktop/Pioneer/raze and rise 2.0/CLAUDE.md` not found) — no project-specific directives beyond what's in CONTEXT.md, STATE.md, and PROJECT.md.

**Cross-cutting auto-memory constraints (from user MEMORY.md, informational only):**

- Production deploy pattern (v1, not Phase 1 relevant): `vercel --prod` from `/Users/travismader/Desktop/Pioneer/` (NOT from inside the project folder). Phase 1 ships a native mobile app, not a Vercel deploy — this is for context only.
- Ship process: feature branch → tests → push for preview → merge to main → deploy. Applies to Phase 1: each Phase 1 wave is a feature branch with tests green before merge.

---

## Assumptions Log

> Every claim tagged `[ASSUMED]` in this research. The planner and discuss-phase use this to know what needs user confirmation.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | All package versions tagged `[ASSUMED]` because slopcheck unavailable | Package Legitimacy Audit | Mistyped or hallucinated package name → install fails OR malicious package installed. **Mitigation:** planner inserts `checkpoint:human-verify` before each install. Names are from official docs/changelogs, not invented. |
| A2 | Expo SDK 55 is the current stable as of 2026-05-19 | Standard Stack | If 56 is now stable, version pins shift. Confirm with `npx create-expo-app@latest --version` before scaffold. |
| A3 | NativeWind v4 is current stable; v5 still pre-release | Standard Stack / Styling | If v5 has stabilized, setup steps differ (Tailwind v4 instead of v3). Run `npm view nativewind dist-tags` to confirm. |
| A4 | PowerSync uses `@journeyapps/react-native-quick-sqlite` as default driver | Offline Sync | PowerSync may have migrated to `@op-engineering/op-sqlite`. **Verify against current PowerSync docs at install time.** Either works — the choice doesn't affect higher-level code. |
| A5 | Apple Sign-In via `expo-apple-authentication` + Supabase `signInWithIdToken` is current pattern | Authentication | Pattern verified via search results; Supabase official docs confirm. Risk: low. |
| A6 | Google OAuth pattern via `expo-auth-session` + URL fragment parsing | Authentication | Working but verbose. Supabase blog confirms; if better pattern exists (e.g., native Google Sign-In SDK), refactor in Phase 1 wave 0. |
| A7 | v1 `user_state.state` blob shape inferred from PROJECT.md context | v1 Migration | **HIGH RISK** — the inferred shape may not match real v1 data. Planner MUST add a Phase 1 task: query v1 `user_state` (admin user, single row), persist sample to `.planning/phases/01-foundation/v1-sample-state.json`, and design migration against that real shape. |
| A8 | `runtimeVersion: { policy: 'fingerprint' }` is the SDK 55 recommended policy | EAS Build | If `sdkVersion` is still the recommendation, semantics change. Confirm in current Expo docs at config time. |
| A9 | Dark theme color palette suggested (`#0a0a0a`, `#ff6b35` accent) | Styling | Cosmetic — Travis can override. Marked as Claude's discretion in CONTEXT.md. |
| A10 | Onboarding flag mirrored to `profiles.onboarded` server-side | Pitfall 9 / Database Schema | Recommendation, not a locked decision. Without server-side mirror, reinstall loses onboarding completion. |
| A11 | Sync Rules YAML structure as shown | Offline Sync | Format is from PowerSync docs but subject to versioning. Verify against current PowerSync docs. |
| A12 | Supabase phone MFA (AUTH-06) requires SMS provider (Twilio/Vonage) configured in dashboard | Authentication | Standard Supabase pattern. Costs real money per SMS. Travis may opt to defer AUTH-06 to Phase 2 if MFA UX isn't critical. |
| A13 | Apple App Store mandates Sign in with Apple alongside any third-party OAuth (Guideline 4.8) | Authentication / App Store Compliance | Verified in PITFALLS.md. Risk low — well-established App Store policy. |

---

## Open Questions (RESOLVED)

1. **v1 blob exact shape** — (GATED — resolved in Phase 1 migration plan Task 1 human checkpoint)
   - What we know: PROJECT.md lists fields; v1 admin panel shows top-level keys
   - What's unclear: Exact nested shape of `history[].sets[]`, exact `templates` structure, presence/absence of optional fields
   - Resolution: Real blob must be inspected via Supabase SQL Editor before the migration function can be finalized. The 01-migration-PLAN.md Task 1 is a blocking human checkpoint that captures the real blob into `.planning/phases/01-foundation/v1-sample-state.json`. Task 2 of that plan is gated on the result.

2. **PowerSync free tier sufficiency** — RESOLVED: Use free tier for Phase 1 development. Decide paid plan before Phase 1 production launch.
   - What we know: 2GB synced / 500MB hosted on free tier; free projects deactivate after 1 week inactivity
   - What's unclear: Will single-user dev usage trigger deactivation? Does Travis want to pay $49/month from day one?
   - Resolution: Free tier during development. Project will be kept active by regular development usage. Upgrade decision deferred to production launch milestone.

3. **OP-SQLite vs JourneyApps SQLite driver for PowerSync** — RESOLVED: Verified at install time in scaffold plan Task 0 (package legitimacy checkpoint). Use whichever PowerSync current docs recommend; the scaffold plan action text includes both options with an explicit conditional.
   - What we know: Both work; OP-SQLite is newer and more actively maintained
   - What's unclear: PowerSync's current officially recommended choice
   - Resolution: Human checkpoint in 01-scaffold-init-PLAN.md Task 0 verifies against current PowerSync docs before npm install runs.

4. **Onboarding "primary goal" enum values** — RESOLVED: `['strength', 'hypertrophy', 'fat-loss', 'general']`
   - What we know: Goal is collected during onboarding (CONTEXT.md decision 2)
   - What's unclear: Specific options (`strength | hypertrophy | fat-loss | general`? `cut | bulk | maintain`?)
   - Resolution: Values are `strength`, `hypertrophy`, `fat-loss`, `general`. Used in profiles.primary_goal CHECK constraint and MMKV onboarding.goal key.

5. **Split type enum values for v2** — RESOLVED: Keep v1 values plus `upper-lower`. Enum: `ppl` | `upper-lower` | `full-body` | `body-part` | `af-pt`.
   - What we know: v1 supports `PPL`, `Body-Part`, `Hybrid`, `Full Body`, `AF PT Prep`
   - What's unclear: Whether v2 keeps the same set and labels
   - Resolution: v2 uses lowercase slugs: `ppl`, `upper-lower`, `full-body`, `body-part`, `af-pt`. The `Hybrid` v1 value maps to `full-body` during migration.

6. **Starter templates content** — RESOLVED: Seed 3 starter templates per common split type. The 01-schema-PLAN.md Task 3 seeds exercises and creates `supabase/starter-templates.json` containing pre-defined configurations for ppl, upper-lower, full-body, body-part, and af-pt.
   - What we know: ONBOARD-04 requires the user to create or select a template
   - What's unclear: Do we seed any starter templates (e.g., a pre-built PPL) for new users to choose from, or is "create" the only path?
   - Resolution: Seed built-in exercises (is_custom=false) + starter-templates.json static config. Onboarding step 3 filters by selected split and lets user pick one.

7. **AUTH-06 SMS MFA scope for Phase 1** — RESOLVED: Dashboard enablement only. No MFA enrollment/challenge UX in Phase 1. Settings screen shows a stub section with instructions to manage MFA in Supabase account settings. Full UX deferred to Phase 2+.
   - What we know: REQ-AUTH-06 is in Phase 1
   - What's unclear: Is full SMS MFA enrollment+challenge UX in scope, or is "enabling Supabase phone factor in dashboard" enough?
   - Resolution: Phase 1 delivers: (1) Supabase dashboard phone factor enabled per user_setup instructions; (2) Settings screen has an "SMS verification" section with manual instructions. No in-app MFA enrollment flow.

8. **Sign-out from "any screen" (AUTH-08)** — RESOLVED: Settings → Account → Sign Out only. No header sign-out button on every screen.
   - What we know: Required; Settings is canonical
   - What's unclear: Does "any screen" mean a header button on every screen, or just "no dead-ends"?
   - Resolution: Settings tab → Account section → "Sign out" (text-danger) with Alert.alert confirmation. This is the single sign-out entry point. No header button on other screens.

---

## Sources

### Primary (HIGH confidence)

- [Expo SDK 55 Changelog](https://expo.dev/changelog/sdk-55) — New Architecture mandatory, Hermes v1 opt-in
- [Expo: React Native's New Architecture](https://docs.expo.dev/guides/new-architecture/) — Cannot disable in SDK 55+
- [PowerSync: Supabase Integration Guide](https://docs.powersync.com/integration-guides/supabase-+-powersync) — Postgres role setup, sync rules, connector
- [PowerSync React Native demos GitHub](https://github.com/powersync-ja/powersync-js) — Reference implementation source
- [NativeWind Installation Docs](https://www.nativewind.dev/docs/getting-started/installation) — Babel + Metro config
- [Supabase: Login with Apple](https://supabase.com/docs/guides/auth/social-login/auth-apple) — `signInWithIdToken` pattern
- [Supabase: Native Mobile Deep Linking](https://supabase.com/docs/guides/auth/native-mobile-deep-linking) — Redirect URI patterns
- [Supabase: Using Supabase with Expo](https://docs.expo.dev/guides/using-supabase/) — Official Expo+Supabase guide
- Existing `.planning/research/STACK.md` (HIGH confidence per its own self-assessment) — Stack research already done by user
- Existing `.planning/research/ARCHITECTURE.md` — Schema design + offline sync architecture
- Existing `.planning/research/PITFALLS.md` — 15 pitfalls with prevention strategies

### Secondary (MEDIUM confidence)

- [Ignite Cookbook: PowerSync + Supabase](https://ignitecookbook.com/docs/recipes/LocalFirstDataWithPowerSync/) — Walkthrough
- [Applighter: Complete Guide to Supabase Auth in React Native](https://www.applighter.com/blog/the-complete-guide-to-supabase-auth-in-react-native-email-o-auth-apple-sign) — End-to-end auth example
- [Onix React: What's New in Expo SDK 55 (Medium)](https://medium.com/@onix_react/whats-new-in-expo-sdk-55-6eac1553cee8) — Migration notes
- [React Native Relay: SDK 55 Migration Guide](https://reactnativerelay.com/article/expo-sdk-55-migration-guide-breaking-changes-sdk-53-to-55) — Breaking changes

### Tertiary (LOW confidence — flag for validation)

- DEV.to and Medium tutorials referenced for setup patterns — verify against official docs at implementation time

---

## Metadata

**Confidence breakdown:**

- Standard stack — HIGH — locked decisions in CONTEXT.md + STACK.md verified against current docs
- Architecture patterns — HIGH — ARCHITECTURE.md already detailed; this research synthesizes it for Phase 1
- Schema + RLS — HIGH — patterns are standard Supabase practice
- PowerSync integration — MEDIUM — PowerSync API surface verified via docs; exact React Native config may evolve, verify at install time
- v1 migration — LOW — depends on inspecting real v1 blob shape; current design is against inferred shape
- Apple Sign-In + Google OAuth — HIGH — well-documented Supabase patterns
- EAS Build configuration — HIGH — standard Expo workflow
- Onboarding flow design — HIGH — captured directly from CONTEXT.md decisions
- Pitfalls — HIGH — extensive PITFALLS.md research already complete
- Package legitimacy — LOW (forced) — slopcheck unavailable; all packages tagged `[ASSUMED]` per protocol

**Research date:** 2026-05-19
**Valid until:** 2026-06-19 (30 days; Expo SDK ecosystem moves slowly enough between releases; refresh if a new SDK ships)
