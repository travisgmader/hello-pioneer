# Walking Skeleton — Phase 1: Foundation

> Phase 1 of 6 — this skeleton is the thinnest end-to-end vertical slice that proves all architectural layers compose correctly in Expo bare workflow with New Architecture (SDK 55).

---

## Slice Definition

> User opens app → creates account (email/password) → completes required onboarding (profile + split + template, practice set skipped) → lands on Dashboard → starts a session and logs one set with airplane mode ON → set is visible in the active session immediately → reconnects → set syncs to Supabase via PowerSync when connectivity returns.

---

## Architectural Decisions (Locked for Phases 2–6)

| Layer | Decision | Rationale |
|-------|----------|-----------|
| **Runtime** | Expo SDK 55 bare workflow — `ios/` and `android/` committed | Required for HealthKit (Phase 5), widgets (Phase 6), RevenueCat (Phase 4). Cannot be changed without full rewrite. |
| **Navigation** | Expo Router v3 file-based (`app/` directory) | Locked: file-based routing, typed routes, deep linking, web compat all free. |
| **Styling** | NativeWind v4 with Tailwind v3 (NOT Tailwind v4) | NativeWind v5 still pre-release. Token system defined in `tailwind.config.js`. All components use token classes — no raw hex. |
| **Offline DB** | PowerSync + Supabase (reads Postgres WAL) | No manual sync functions. All writes go to local SQLite first; PowerSync uploads to Supabase on reconnect. |
| **Session storage** | MMKV encrypted with key from SecureStore | Supabase JWT exceeds SecureStore 2048-byte limit. MMKV stores session; SecureStore stores only the MMKV encryption key (UUID). |
| **Backend** | Supabase (auth + DB + Edge Functions + storage) | Same project `jmtogdlsgpfoefbgdubm` as v1. v1 `user_state` table coexists — read-only until 60-day window expires. |
| **Auth** | Email + Google OAuth (`expo-auth-session`) + Apple Sign-In (`expo-apple-authentication`) | All three required simultaneously. Apple Sign-In mandatory per App Store Guideline 4.8 when any other OAuth is present. |
| **DB schema** | Normalized (10 tables with RLS). NOT single JSON blob. | Per DATA-01: expand-and-contract migration from v1 `user_state` blob. |
| **Conflict resolution** | Session-ID-based merging; soft deletes only | Sessions have client-generated UUIDs. Completed sessions immutable (idempotent upserts). No hard deletes — `is_deleted = true`. |
| **Animation** | react-native-reanimated v4 | Required for NativeWind v4 transitions (DESIGN-04). `useReducedMotion()` wired from day one. |
| **Forms** | react-hook-form + zod | Schema-driven validation. Same zod schema mirrors in Edge Functions. |
| **State** | TanStack Query v5 (server state) + Zustand v5 (UI state) | TanStack Query for Supabase reads not in PowerSync reactive queries; Zustand for UI flags. |
| **New Architecture** | Enabled (mandatory in SDK 55) | Cannot opt out. Every library must be New Architecture compatible. |

---

## Directory Layout (after Phase 1)

```
raze-and-rise-v2/
  ios/                                  # bare workflow — COMMITTED
  android/                              # bare workflow — COMMITTED
  app/
    _layout.tsx                         # root layout: session gate + onboarding gate + migration gate
    (auth)/
      _layout.tsx
      index.tsx                         # AuthScreen: Sign In / Sign Up toggle, all 3 providers
      forgot-password.tsx
    (onboarding)/
      _layout.tsx                       # stack with slide_from_right animation
      profile.tsx                       # Step 1: display name + units + goal (required)
      split.tsx                         # Step 2: split type picker with weekly schedule (required)
      template.tsx                      # Step 3: starter template picker (required)
      practice-set.tsx                  # Step 4: sample set demo (skippable)
    (tabs)/
      _layout.tsx                       # 5-tab bottom nav: Dashboard / Workouts / Split / Progress / Settings
      index.tsx                         # Dashboard stub ("Welcome, {displayName}")
      workouts.tsx                      # Workouts placeholder
      split.tsx                         # Split tab (dedicated — not inside Settings)
      progress.tsx                      # Progress placeholder
      settings.tsx                      # Settings with: Change password + Sign out + Theme toggle
    migration.tsx                       # full-screen migration progress (no tab bar)
    +not-found.tsx
  src/
    components/
      Button/index.tsx                  # primary / secondary / ghost / social-google / social-apple
      TextInput/index.tsx               # text / email / password (with show/hide)
      Label/index.tsx
      HelperText/index.tsx              # default / error / success
      Divider/index.tsx                 # horizontal / with-label
      IconButton/index.tsx              # default / back (ChevronLeft)
      Toggle/index.tsx                  # binary (Sign In/Up, lbs/kg)
      Chip/index.tsx                    # goal options (Strength / Hypertrophy / Fat Loss / General Fitness)
      ProgressBar/index.tsx             # onboarding step indicator
      Spinner/index.tsx
      AuthScreen/index.tsx
      OnboardingStepLayout/index.tsx
      ProfileStep/index.tsx
      SplitSelector/index.tsx
      TemplateBuilder/index.tsx         # stub: starter template picker
      PracticeSetCard/index.tsx
      DashboardEmpty/index.tsx
      MigrationProgress/index.tsx
    lib/
      supabase.ts                       # Supabase client with MMKV storage adapter
      storage.ts                        # MMKV + SecureStore hybrid init
      powersync.ts                      # PowerSync DB instance
      schema.ts                         # PowerSync AppSchema (mirrors Supabase tables)
      connector.ts                      # PowerSync Supabase backend connector
    hooks/
      useSession.ts                     # wraps supabase.auth.onAuthStateChange
      useOnboardingState.ts             # MMKV-backed onboardingComplete flag
      useMigrationStatus.ts             # TanStack Query: polls profiles.migration_status
      useTheme.ts                       # MMKV override + useColorScheme() fallback
    services/
      auth/
        email.ts                        # signUp, signIn, resetPassword, changePassword
        google.ts                       # expo-auth-session flow
        apple.ts                        # expo-apple-authentication flow
        signOut.ts
      migration.ts                      # calls Edge Function, polls status
    types/
      database.ts                       # Supabase-generated (npm run gen:types)
      navigation.ts                     # Typed Expo Router routes
    theme/
      tokens.ts                         # Design token definitions (matches tailwind.config.js)
  supabase/
    migrations/
      20260519000000_initial_schema.sql
      20260519000100_rls_policies.sql
      20260519000200_powersync_setup.sql
    functions/
      migrate-v1-user/
        index.ts                        # Edge Function: reads user_state, writes v2 rows
  global.css                            # NativeWind entry (@tailwind base/components/utilities)
  nativewind-env.d.ts
  tailwind.config.js                    # ALL tokens declared here; no raw values in components
  metro.config.js                       # withNativeWind wrapper
  babel.config.js                       # nativewind/babel preset
  eas.json                              # dev / preview / production profiles
  app.config.ts                         # newArchEnabled: true; scheme: razeandrise; plugins
  tsconfig.json                         # extends expo/tsconfig.base; strict: true; paths: @/*
  vitest.config.ts                      # Wave 0 test infrastructure
  playwright.config.ts                  # Web E2E placeholder
  .github/workflows/test.yml            # CI: Vitest + tsc on PR
  .maestro/                             # Maestro E2E YAML files
  tests/
    unit/
      router.test.tsx
      theme.test.tsx
      auth/reset.test.ts
    integration/
      rls.test.ts
      migrate.test.ts
```

---

## Skeleton Slice — Layer-by-Layer Exercise

| Layer | Skeleton Exercise | Verified By |
|-------|------------------|-------------|
| Bare workflow scaffold | App launches on iOS simulator + Android emulator | `eas build --profile development --local` passes |
| Expo Router file-based nav | Routes load: `(auth)` → `(onboarding)` → `(tabs)` | `vitest run tests/unit/router.test.tsx` |
| TypeScript strict | `tsc --noEmit` exits 0 | CI gate |
| NativeWind v4 | Dark theme applied; one component uses `bg-bg text-fg` classes | `vitest run tests/unit/theme.test.tsx` |
| Supabase auth (email) | Sign-up returns session; session persists across app restart | `maestro test .maestro/auth-email.yaml` |
| MMKV + SecureStore | After kill + relaunch, session restored without re-login | `maestro test .maestro/session-persistence.yaml` |
| Normalized schema | 10 tables with RLS visible in Supabase dashboard | `supabase db push` + `vitest run tests/integration/rls.test.ts` |
| RLS correctness | User A cannot read User B's session_sets rows | `vitest run tests/integration/rls.test.ts` |
| Onboarding flow | All 3 required steps completable; profile + split + template rows written to Supabase | `maestro test .maestro/onboarding.yaml` |
| Onboarding gate | No access to Dashboard without completing required steps | Root layout logic |
| Tab nav | All 5 tabs render; active tab visually highlighted with accent color | `maestro test .maestro/tabs.yaml` |
| PowerSync client | Local SQLite DB created at app launch; profile row syncs down after login | `maestro test .maestro/powersync-init.yaml` |
| PowerSync sync up | Set logged offline (airplane mode) appears in Supabase `session_sets` after reconnect | Walking Skeleton E2E test |
| v1 migration | Existing v1 user logs in → Edge Function runs → history visible in `sessions` table | `vitest run tests/integration/migrate.test.ts` (fixture) |
| Apple Sign-In | Completes on real iOS device; Supabase session created | Manual: sign in on physical iOS device |
| Google OAuth | Completes on real device; Supabase session created | `maestro test .maestro/auth-google.yaml` (real device) |
| EAS dev build | Custom dev client installable on physical iOS + Android | `eas build --profile development` |

---

## Token System Stability Contract

Defined in Phase 1 `tailwind.config.js`. Phases 2–6 MUST NOT:
- Redefine any Phase 1 token
- Use raw hex/px values in component code
- Introduce a second sans-serif (Manrope is the body font; Noto Serif is display-only)
- Override the inline-only error pattern (no toasts, snackbars, or `Alert.alert` except the sign-out destructive confirmation)
- Use `accent` color outside its explicit reserved list (CTA bg, active tab, onboarding progress bar, focused input, selected option border, wordmark, links)

Phases 2–6 MAY add new tokens following the same naming pattern.

---

## What the Skeleton Deliberately Excludes

These are real Phase 1 requirements but excluded from the skeleton's minimum proof-of-concept:
- Beautiful UI polish beyond dark theme tokens
- Full measurements input (just display name + units + goal is enough for skeleton)
- Settings screens beyond Change Password, Sign Out, and Theme toggle
- Practice-set step UX polish (Skip button is sufficient)
- Password reset, change password, SMS MFA full UX (stubs acceptable in skeleton; must be real by Phase 1 completion)

---

## Phase-to-Phase Build Contract

```
Phase 1 (this skeleton) outputs:
  - Bare workflow app with all native modules installed
  - Supabase schema (10 tables, RLS, migration) deployed to jmtogdlsgpfoefbgdubm
  - PowerSync instance connected and syncing
  - Auth (email + Google + Apple) working
  - Onboarding flow complete
  - 5-tab nav operational
  - v1 migration Edge Function deployed

Phase 2 reads:
  - powersync.ts, schema.ts, connector.ts — extends schema with no breaking changes
  - useSession.ts, useOnboardingState.ts — session is guaranteed valid on any Phase 2 screen
  - supabase/migrations/* — adds new migration files without touching Phase 1 migrations
  - (tabs)/_layout.tsx — adds badge support; does NOT change tab structure
  - tailwind.config.js — adds set-go, set-nogo, timer-fg tokens WITHOUT touching Phase 1 tokens
```
