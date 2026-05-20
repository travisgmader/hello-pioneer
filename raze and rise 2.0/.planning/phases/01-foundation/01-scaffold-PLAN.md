---
phase: 01-foundation
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app.config.ts
  - app/_layout.tsx
  - app/(auth)/_layout.tsx
  - app/(auth)/index.tsx
  - app/(auth)/forgot-password.tsx
  - app/(onboarding)/_layout.tsx
  - app/(tabs)/_layout.tsx
  - app/(tabs)/index.tsx
  - app/(tabs)/workouts.tsx
  - app/(tabs)/split.tsx
  - app/(tabs)/progress.tsx
  - app/(tabs)/settings.tsx
  - app/migration.tsx
  - app/+not-found.tsx
  - src/lib/storage.ts
  - src/lib/supabase.ts
  - src/lib/powersync.ts
  - src/lib/schema.ts
  - src/lib/connector.ts
  - src/hooks/useSession.ts
  - src/hooks/useOnboardingState.ts
  - src/hooks/useMigrationStatus.ts
  - src/hooks/useTheme.ts
  - src/components/Button/index.tsx
  - src/components/TextInput/index.tsx
  - src/components/Label/index.tsx
  - src/components/HelperText/index.tsx
  - src/components/Divider/index.tsx
  - src/components/IconButton/index.tsx
  - src/components/Toggle/index.tsx
  - src/components/Chip/index.tsx
  - src/components/ProgressBar/index.tsx
  - src/components/Spinner/index.tsx
  - tailwind.config.js
  - global.css
  - nativewind-env.d.ts
  - metro.config.js
  - babel.config.js
  - tsconfig.json
  - eas.json
  - package.json
  - vitest.config.ts
  - playwright.config.ts
  - .github/workflows/test.yml
  - tests/unit/router.test.tsx
  - tests/unit/theme.test.tsx
  - tests/unit/auth/reset.test.ts
  - tests/integration/rls.test.ts
  - tests/integration/migrate.test.ts
  - .maestro/auth-email.yaml
  - .maestro/auth-google.yaml
  - .maestro/change-password.yaml
  - .maestro/sign-out.yaml
  - .maestro/tabs.yaml
  - .maestro/onboarding.yaml
  - .maestro/session-persistence.yaml
  - .maestro/powersync-init.yaml
  - .maestro/theme-toggle.yaml
autonomous: false
requirements:
  - FOUND-01
  - FOUND-02
  - FOUND-03
  - FOUND-04
  - FOUND-05
  - FOUND-06
  - FOUND-08
  - FOUND-09
  - NAV-01
  - NAV-02
  - NAV-03
  - DESIGN-01
  - DESIGN-04

must_haves:
  truths:
    - "App launches on iOS simulator and Android emulator without crash"
    - "npx tsc --noEmit exits 0 with strict mode enabled"
    - "Expo Router routes load in correct order: (auth) → (onboarding) → (tabs)"
    - "NativeWind dark theme tokens applied; no raw hex values in component code"
    - "5-tab nav renders with correct icons and labels; active tab highlighted in accent color"
    - "Session persists in MMKV across app kill and relaunch"
    - "PowerSync database initializes at app startup (local SQLite file created)"
    - "All Wave 0 test files exist and vitest runs without fatal errors"
  artifacts:
    - path: "app/_layout.tsx"
      provides: "Root layout: session gate + onboarding gate + migration gate"
      contains: "useSession, useOnboardingState, useMigrationStatus, router.replace"
    - path: "src/lib/storage.ts"
      provides: "MMKV + SecureStore hybrid init"
      exports: ["initStorage", "getStorage", "supabaseStorageAdapter"]
    - path: "src/lib/supabase.ts"
      provides: "Supabase client with MMKV adapter"
      exports: ["supabase"]
    - path: "tailwind.config.js"
      provides: "ALL Phase 1 design tokens (bg, fg, accent, border, danger, success, spacing, typography)"
      contains: "colors.bg, colors.accent, colors.fg, colors.border, colors.danger, colors.success"
    - path: "eas.json"
      provides: "EAS Build profiles: development, preview, production"
      contains: "runtimeVersion"
    - path: "vitest.config.ts"
      provides: "Vitest configuration for unit + integration tests"
  key_links:
    - from: "app/_layout.tsx"
      to: "src/hooks/useSession.ts"
      via: "session state → routing decision"
      pattern: "useSession"
    - from: "src/lib/supabase.ts"
      to: "src/lib/storage.ts"
      via: "supabaseStorageAdapter passed to createClient"
      pattern: "supabaseStorageAdapter"
    - from: "app/(tabs)/_layout.tsx"
      to: "src/components/Button"
      via: "NativeWind tokens consumed"
      pattern: "bg-bg|text-fg|text-accent"

user_setup:
  - service: expo
    why: "EAS Build requires Expo account login"
    env_vars:
      - name: EXPO_PUBLIC_SUPABASE_URL
        source: "Supabase Dashboard → Settings → API → Project URL"
      - name: EXPO_PUBLIC_SUPABASE_ANON_KEY
        source: "Supabase Dashboard → Settings → API → anon (public) key"
      - name: EXPO_PUBLIC_POWERSYNC_URL
        source: "PowerSync Dashboard → Project → Instance URL"
    dashboard_config:
      - task: "Run eas login and eas build:configure before Task 3"
        location: "Terminal"
      - task: "Apple Developer Account membership ($99/yr) required before Apple Sign-In can be provisioned"
        location: "developer.apple.com"
  - service: powersync
    why: "PowerSync instance must be created before client can connect"
    dashboard_config:
      - task: "Create PowerSync instance at dashboard.powersync.com, connect to Supabase project jmtogdlsgpfoefbgdubm"
        location: "dashboard.powersync.com"
      - task: "Enable Supabase Auth in PowerSync Client Auth settings"
        location: "PowerSync Dashboard → Project → Auth"
---

<objective>
This plan scaffolds the entire Expo bare workflow project, wires NativeWind + PowerSync + MMKV + Expo Router, creates all design-system atom components, builds the root navigation shell (auth gate + onboarding gate + migration gate), creates the 5-tab navigator stub, and establishes the complete Wave 0 test infrastructure — all in parallel with the schema plan (01-schema-PLAN.md).

Purpose: Every subsequent Phase 1 plan and all Phase 2–6 plans build on this scaffold. The architecture decisions locked here (bare workflow, Expo Router file structure, NativeWind token system, MMKV+SecureStore pattern, PowerSync schema interface) cannot be changed without a major rewrite.

Output: Runnable bare workflow app that navigates auth → onboarding → tabs (all stubs), loads without crash, passes tsc --noEmit, and has all Wave 0 test infrastructure in place.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/01-foundation/CONTEXT.md
@.planning/phases/01-foundation/01-RESEARCH.md
@.planning/phases/01-foundation/01-UI-SPEC.md
@.planning/phases/01-foundation/01-VALIDATION.md
@.planning/phases/01-foundation/01-SKELETON.md

<interfaces>
<!-- Design tokens from 01-UI-SPEC.md — all components MUST use these names, no raw values -->
Colors: bg=#0A0A0B (bg), bg-elevated=#141416 (bg-elevated), bg-input=#1C1B1B (bg-input),
  border=rgba(212,175,55,0.22) (border), border-strong=rgba(212,175,55,0.45) (border-strong),
  fg=#E5E2E1 (fg), fg-muted=#99907C (fg-muted), fg-subtle=#5C564B (fg-subtle, decorative only — never text),
  accent=#F2CA50 (accent), accent-deep=#D4AF37 (accent-deep), accent-dim=rgba(212,175,55,0.10) (accent-dim),
  danger=#EF4444 (danger), danger-dim=rgba(239,68,68,0.12) (danger-dim),
  success=#10B981 (success), success-dim=rgba(16,185,129,0.12) (success-dim)

Spacing: xs=4px, sm=8px, md=16px, lg=24px, xl=32px, 2xl=48px, 3xl=64px

Typography roles:
  caption: 12px Manrope 400 (lh 1.4) — helper text, tab labels, progress step counter
  body: 16px Manrope 400 (lh 1.5) — input text, paragraph, labels above inputs
  body-emphasis: 16px Manrope 700 (lh 1.5) — primary CTA button text, selected state labels
  heading: 24px Noto Serif 700 (lh 1.25) — onboarding step titles, Settings section headers
  display: 32px Noto Serif 700 (lh 1.2) — auth wordmark ONLY

Border radius: none=0, sm=2px, md=4px (buttons, cards), lg=8px (modals), full=9999px (avatar)

Accent is ONLY used for: primary CTA bg, active tab, onboarding progress bar fill, focused input border/caret, selected option border, wordmark gradient, links (Forgot password / Sign up / Sign in). Never in body text, card bg, unfocused borders, or passive icons.

Motion tokens: fast=150ms ease-out, default=200ms ease-out, slow=300ms ease-in-out
  useReducedMotion() from react-native-reanimated MUST wrap all screen-slide animations.

Root layout routing logic (from 01-RESEARCH.md):
  no session → (auth)
  session + migration pending/in_progress/failed → /migration
  session + not onboarded → (onboarding)/profile
  session + onboarded → (tabs)

MMKV storage pattern (src/lib/storage.ts):
  initStorage(): awaited at app startup before Supabase client created
  getStorage(): throws if called before initStorage
  supabaseStorageAdapter: { getItem, setItem, removeItem } wrapping MMKV instance

PowerSync AppSchema defined in src/lib/schema.ts — 9 tables:
  profiles, split_settings, exercises, templates, template_exercises, sessions, session_sets, measurements, notification_preferences
</interfaces>
</context>

<tasks>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 0: Package Legitimacy Checkpoint (BLOCKING — all [ASSUMED] packages)</name>
  <read_first>
    .planning/phases/01-foundation/01-RESEARCH.md (Package Legitimacy Audit section)
  </read_first>
  <what-built>
    All Phase 1 npm packages are tagged [ASSUMED] in 01-RESEARCH.md because slopcheck was unavailable during research. Before any npm install runs, the following packages must be verified as legitimate on npmjs.com:
    expo (55.0.25), expo-router (55.0.15), @supabase/supabase-js (2.106.0), @powersync/react-native (1.35.1), @journeyapps/react-native-quick-sqlite (2.5.2), nativewind (4.2.4), tailwindcss (v3), react-native-mmkv (4.3.1), expo-secure-store (55.0.14), expo-crypto (55.0.15), expo-apple-authentication (55.0.13), expo-auth-session (55.0.16), @tanstack/react-query (5.x), zustand (5.x), react-native-reanimated (4.x), react-hook-form (7.x), zod (3.x), eas-cli (19.0.1), lucide-react-native.
  </what-built>
  <how-to-verify>
    For each package above, visit npmjs.com/package/[package-name] and confirm:
    1. The package exists (not 404)
    2. The owner matches the expected org (expo, supabase, powersync-ja, mrousavy, TanStack, pmndrs, etc.)
    3. The version listed in RESEARCH.md is present in the version history
    4. Weekly downloads are non-trivially positive (indicates real usage, not a squatted package)

    Critical check: @journeyapps/react-native-quick-sqlite — verify against current PowerSync docs (docs.powersync.com) whether this is still the recommended SQLite driver vs @op-engineering/op-sqlite. Use whichever current PowerSync docs recommend.
  </how-to-verify>
  <resume-signal>Type "packages verified" when all packages checked and confirmed legitimate, or list any packages that failed verification so they can be replaced.</resume-signal>
</task>

<task type="auto" tdd="true">
  <name>Task 1: Scaffold bare workflow project + install dependencies + Wave 0 test infrastructure</name>
  <read_first>
    .planning/phases/01-foundation/01-RESEARCH.md (Project Scaffold section, Standard Stack, Package Legitimacy Audit, Validation Architecture section)
    .planning/phases/01-foundation/01-VALIDATION.md (Wave 0 Requirements section)
    .planning/phases/01-foundation/01-SKELETON.md (Directory Layout)
  </read_first>
  <behavior>
    - vitest.config.ts correctly resolves @/* path alias (same as tsconfig.json paths)
    - tests/unit/router.test.tsx: renders a stub that matches Expo Router route structure — test passes (placeholder assertions acceptable for Wave 0)
    - tests/unit/theme.test.tsx: NativeWind dark theme token names resolve — test passes
    - tests/unit/auth/reset.test.ts: signUpEmail, signInEmail, resetPassword are exportable functions — test passes
    - tests/integration/rls.test.ts: skeleton file with describe block — not yet executable without DB
    - tests/integration/migrate.test.ts: skeleton file with describe block
    - CI workflow runs tsc --noEmit and vitest on pull_request trigger
  </behavior>
  <action>
    Step 1 — Scaffold project (run AFTER package legitimacy checkpoint):
    Use `npx create-expo-app@latest raze-and-rise-v2 --template bare-minimum` to create the project. Confirm SDK 55 was pulled by running `npx expo install --check`. The template produces ios/, android/, app.json, package.json, index.js, App.tsx, babel.config.js, metro.config.js, tsconfig.json, .gitignore.

    Step 2 — Install all dependencies using expo install for native modules (per RESEARCH.md Standard Stack):
    Core: `npx expo install expo-router expo-linking expo-constants expo-status-bar expo-system-ui expo-splash-screen`
    Supabase + session: `npx expo install @supabase/supabase-js react-native-mmkv expo-secure-store expo-crypto`
    PowerSync (use the SQLite driver confirmed in Task 0 checkpoint): `npx expo install @powersync/react-native @journeyapps/react-native-quick-sqlite` (or @op-engineering/op-sqlite if PowerSync docs now recommend it)
    Auth providers: `npx expo install expo-apple-authentication expo-auth-session expo-web-browser`
    Styling: `npx expo install nativewind react-native-reanimated react-native-gesture-handler react-native-safe-area-context react-native-svg`
    Tailwind v3 (NOT v4 — NativeWind v4 requires Tailwind v3): `npm install --save-dev tailwindcss@3`
    State + forms: `npm install @tanstack/react-query zustand react-hook-form zod`
    Icons: `npm install lucide-react-native`
    Test infrastructure: `npm install --save-dev vitest @testing-library/react-native @vitest/coverage-v8`
    Maestro: `brew install maestro` (run separately, may require user password)

    Step 3 — Configure TypeScript (tsconfig.json):
    Extend `expo/tsconfig.base`. Add `compilerOptions.strict: true`, `baseUrl: "."`, `paths: { "@/*": ["./src/*"] }`. Include: `["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts", "nativewind-env.d.ts"]`. DO NOT add babel-plugin-module-resolver (causes EAS build failures per RESEARCH.md Pitfall 1).

    Step 4 — Configure Expo (app.config.ts):
    Create app.config.ts (replace app.json). Set: name "Raze and Rise", slug "raze-and-rise", scheme "razeandrise" (for OAuth deep links), newArchEnabled: true (mandatory SDK 55), ios.bundleIdentifier "com.razeandrise.app", ios.usesAppleSignIn: true, android.package "com.razeandrise.app". Plugins: ["expo-router", "expo-apple-authentication", "@powersync/react-native", ["react-native-mmkv", {}]]. Add runtimeVersion: { policy: "fingerprint" } and updates.url (per RESEARCH.md FOUND-09). Add updates.url as the EAS project URL once eas build:configure runs.

    Step 5 — Configure NativeWind + Tailwind (per RESEARCH.md Styling section):
    Run `npx tailwindcss init` to create tailwind.config.js. Then overwrite with the full token system from 01-UI-SPEC.md Design System section. Content paths: `["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"]`. Presets: `[require("nativewind/preset")]`. Theme.extend.colors: bg (DEFAULT #0A0A0B, elevated #141416, input #1C1B1B), fg (DEFAULT #E5E2E1, muted #99907C, subtle #5C564B), accent (DEFAULT #F2CA50, deep #D4AF37, dim rgba(212,175,55,0.10)), border (DEFAULT rgba(212,175,55,0.22), strong rgba(212,175,55,0.45)), danger (#EF4444, dim rgba(239,68,68,0.12)), success (#10B981, dim rgba(16,185,129,0.12)). Theme.extend.spacing: xs 4, sm 8, md 16, lg 24, xl 32, 2xl 48, 3xl 64. Theme.extend.fontFamily: sans ["Manrope", "system-ui"], serif ["Noto Serif", "Georgia"]. Theme.extend.fontSize: caption [12, {lineHeight: "17"}], body [16, {lineHeight: "24"}], heading [24, {lineHeight: "30"}], display [32, {lineHeight: "38"}]. Theme.extend.borderRadius: none 0, sm 2, md 4, lg 8, full 9999.
    Create global.css with `@tailwind base; @tailwind components; @tailwind utilities;`.
    Create nativewind-env.d.ts with `/// <reference types="nativewind/types" />`.
    Wrap metro.config.js with withNativeWind pointing to global.css.
    Update babel.config.js to use `['babel-preset-expo', { jsxImportSource: 'nativewind' }]` and `'nativewind/babel'`.

    Step 6 — Configure EAS Build (eas.json):
    Create eas.json with development (developmentClient: true, distribution: internal, channel: development, ios.simulator: false, android.buildType: apk, env with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_POWERSYNC_URL placeholders), preview (distribution: internal, channel: preview), production (channel: production, ios.resourceClass: m-medium, android.buildType: app-bundle, autoIncrement: true). CLI section: version ">= 19.0.0", appVersionSource: "remote". Submit section for ios (appleId: travis.g.mader@gmail.com, ascAppId: TBD) and android (serviceAccountKeyPath: ./play-service-account.json).

    Step 7 — Create Wave 0 test infrastructure:
    vitest.config.ts: configure to resolve @/* → src/* using the same paths as tsconfig; set environment to "node" for unit tests; include tests/**/*.test.{ts,tsx}.
    package.json scripts: add "test:unit": "vitest run", "test:integration": "vitest run tests/integration", "test:e2e": "maestro test .maestro", "test:all": "npm run test:unit && npm run test:integration", "gen:types": "supabase gen types typescript --project-id jmtogdlsgpfoefbgdubm > src/types/database.ts".
    tests/unit/router.test.tsx: placeholder describe block — imports from expo-router, renders a stub, asserts it is defined.
    tests/unit/theme.test.tsx: placeholder — imports tailwind.config.js, asserts colors.bg.DEFAULT exists and equals '#0A0A0B'.
    tests/unit/auth/reset.test.ts: placeholder — imports from src/services/auth/email, asserts resetPassword is a function.
    tests/integration/rls.test.ts: placeholder skeleton — describe("RLS isolation") with a todo test.
    tests/integration/migrate.test.ts: placeholder skeleton — describe("v1 migration idempotency") with a todo test.
    .maestro/*.yaml: create stub YAML files for auth-email, auth-google, change-password, sign-out, tabs, onboarding, session-persistence, powersync-init, theme-toggle. Each file has: appId: com.razeandrise.app, a flows section with a single launchApp step, and a comment "# TODO: complete in auth/onboarding plans".
    .github/workflows/test.yml: trigger on pull_request. Steps: checkout, setup-node 20, npm ci, npx tsc --noEmit, npm run test:unit.
    playwright.config.ts: minimal placeholder — baseURL set to http://localhost:8081, empty test file glob.
  </action>
  <verify>
    <automated>npx tsc --noEmit && npm run test:unit -- --run</automated>
  </verify>
  <acceptance_criteria>
    - `npx tsc --noEmit` exits 0 with no errors
    - `npm run test:unit -- --run` passes (placeholder tests do not throw)
    - `ls ios/ android/` both exist and contain native project files
    - `cat tailwind.config.js | grep -c "bg-bg\|#0A0A0B"` — wait, grep for literal token: `grep "0A0A0B" tailwind.config.js` returns a match
    - `grep "accent" tailwind.config.js | grep "F2CA50"` returns a match
    - `cat tsconfig.json | grep '"strict": true'` returns a match
    - `cat eas.json | grep "fingerprint"` returns a match (runtimeVersion policy)
    - `ls tests/unit/ tests/integration/ .maestro/ .github/workflows/` all exist
    - `cat package.json | grep "test:unit"` returns a match
    - Wave 0 files exist: vitest.config.ts, .github/workflows/test.yml, playwright.config.ts
  </acceptance_criteria>
  <done>Bare workflow project scaffolded. All dependencies installed. TypeScript strict passes. NativeWind configured with full Phase 1 token system. EAS configured with fingerprint runtime version policy. Wave 0 test infrastructure installed and passing (placeholder tests green). CI workflow created.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Core library layer (storage + supabase + powersync) + design-system atoms + routing shell</name>
  <read_first>
    .planning/phases/01-foundation/01-RESEARCH.md (Session Storage section, Offline Sync section, Navigation Setup section, Code Examples section)
    .planning/phases/01-foundation/01-UI-SPEC.md (Component Inventory — Atoms section, Screen Layouts section, Interaction Patterns section)
    .planning/phases/01-foundation/CONTEXT.md (Decision 4b — Tab Nav During Onboarding)
    .planning/phases/01-foundation/01-SKELETON.md
  </read_first>
  <behavior>
    - src/lib/storage.ts: initStorage() returns MMKV instance; calling getStorage() before initStorage() throws with message "Storage not initialized"
    - src/lib/supabase.ts: supabase client created with supabaseStorageAdapter; AppState listener wires startAutoRefresh/stopAutoRefresh
    - src/hooks/useSession.ts: returns { session, loading } — loading is true initially, false after auth state resolves
    - src/hooks/useOnboardingState.ts: returns { onboardingComplete } — reads MMKV key "onboarding.complete"
    - app/_layout.tsx: when session is null → navigates to (auth); when session exists + onboardingComplete is false → navigates to (onboarding)/profile; when fully authenticated + onboarded → navigates to (tabs)
    - Button primary variant has bg-accent text-bg classes; Button secondary has bg-bg-elevated border-border classes
  </behavior>
  <action>
    Step 1 — MMKV + SecureStore hybrid (src/lib/storage.ts):
    Implement initStorage() that calls SecureStore.getItemAsync("mmkv.encryption.key"), creates a UUID key via Crypto.randomUUID() if absent, stores it in SecureStore using SecureStoreOptions.keychainAccessible = AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY, then creates MMKV({ id: "razeandrise.session", encryptionKey }). Implement getStorage() that throws if storageInstance is null. Export supabaseStorageAdapter: { getItem: (k) => getStorage().getString(k) ?? null, setItem: (k,v) => getStorage().set(k,v), removeItem: (k) => getStorage().delete(k) }.

    Step 2 — Supabase client (src/lib/supabase.ts):
    Import supabaseStorageAdapter from ./storage. Create client with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY. Auth options: storage: supabaseStorageAdapter as any, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false. Wire AppState.addEventListener to start/stop auto-refresh on foreground/background. Export `supabase`.

    Step 3 — PowerSync schema + connector + database instance (src/lib/schema.ts, connector.ts, powersync.ts):
    schema.ts: Define AppSchema using Schema + Table from @powersync/react-native. Include all 9 tables from RESEARCH.md (profiles, split_settings, exercises, templates, template_exercises, sessions, session_sets, measurements, notification_preferences) with exact column types shown in the research file. Column names must match Supabase migration exactly.
    connector.ts: Implement PowerSyncBackendConnector with fetchCredentials() (reads supabase session, returns { endpoint: EXPO_PUBLIC_POWERSYNC_URL, token: session.access_token }) and uploadData() (processes CRUD transactions using supabase.from(op.table).upsert/update/update-with-is_deleted-true for PUT/PATCH/DELETE). Soft deletes only — never hard-delete (DATA-02).
    powersync.ts: Create PowerSyncDatabase({ schema: AppSchema, database: { dbFilename: "razeandrise.db" } }). Export `powersync`. Note: powersync.init() and connect() called from app startup, not at module load time.

    Step 4 — Hooks (src/hooks/):
    useSession.ts: subscribe to supabase.auth.onAuthStateChange, return { session, loading }. Handle offline-launch bug: wrap auth init in try/catch; suppress network errors without clearing the session (RESEARCH.md Pitfall 3).
    useOnboardingState.ts: read/write MMKV key "onboarding.complete" (boolean stored as string "true"/"false"). Also mirror against supabase `profiles.onboarded` on startup — if MMKV flag is missing but profiles.onboarded is true, set the MMKV flag (guards reinstall scenario per RESEARCH.md Pitfall 9).
    useMigrationStatus.ts: TanStack Query hook that polls `supabase.from("profiles").select("migration_status").eq("user_id", userId).single()` every 2 seconds when status is pending or in_progress. Returns { migrationStatus, loading }.
    useTheme.ts: read MMKV string "theme.override" (values: "light" | "dark" | "system"). Fall back to useColorScheme() ?? "dark".

    Step 5 — Root layout (app/_layout.tsx):
    Import useSession, useOnboardingState, useMigrationStatus, Linking, supabase. In useEffect watching [session, sessionLoading, onboardingComplete, migrationStatus, migrationLoading, segments]:
      - if sessionLoading or migrationLoading: return early
      - if no session and not in (auth): router.replace("/(auth)")
      - if session and migration pending/in_progress/failed and not on /migration: router.replace("/migration")
      - if session and migration is none/complete and not onboardingComplete and not in (onboarding): router.replace("/(onboarding)/profile")
      - if session and onboardingComplete and not in (tabs): router.replace("/(tabs)")
    Wire deep-link handler for OAuth callbacks (parse access_token + refresh_token from URL hash, call supabase.auth.setSession). Import global.css. Wrap with QueryClientProvider (TanStack Query) and safe area provider.

    Step 6 — Navigation layouts (app/(auth)/_layout.tsx, app/(onboarding)/_layout.tsx, app/(tabs)/_layout.tsx):
    (auth)/_layout.tsx: Stack with headerShown: false. gestureEnabled: false on root auth screen (no back from auth).
    (onboarding)/_layout.tsx: Stack with headerShown: false, animation: "slide_from_right", gestureEnabled: true (swipe-back between steps). practice-set screen: gestureEnabled: false.
    (tabs)/_layout.tsx: Tabs with headerShown: false. 5 screens: index (Dashboard), workouts (Workouts), split (Split — dedicated tab per NAV-02), progress (Progress), settings (Settings). tabBarStyle: bg-bg background (#0A0A0B), 1px top border (border color rgba(212,175,55,0.22)), height 56pt. tabBarActiveTintColor: accent (#F2CA50), tabBarInactiveTintColor: fg-muted (#99907C). Active label weight 700 (use tabBarLabelStyle or custom tab bar). Icons from lucide-react-native: Dashboard=LayoutDashboard, Workouts=Dumbbell, Split=CalendarDays, Progress=LineChart, Settings=Settings — all 24px. Trigger Haptics.selectionAsync() on tab change (FOUND-08 haptic pattern from UI-SPEC). Offline navigation must work — tabs do not fetch on mount.

    Step 7 — Screen stubs:
    app/(auth)/index.tsx: "AuthScreen placeholder — implemented in 01-auth-PLAN.md" comment, renders Text("Sign In").
    app/(auth)/forgot-password.tsx: placeholder Text("Forgot password").
    app/(onboarding)/profile.tsx, split.tsx, template.tsx, practice-set.tsx: placeholders — implemented in 01-navigation-onboarding-PLAN.md.
    app/(tabs)/index.tsx: DashboardEmpty stub — renders "Welcome, {displayName}" heading (Noto Serif 24px) and empty state card (bg-elevated) per UI-SPEC Dashboard Stub section. displayName from profiles query (TanStack Query, falls back to "athlete").
    app/(tabs)/workouts.tsx, split.tsx, progress.tsx: placeholder screens with tab label as heading.
    app/(tabs)/settings.tsx: minimal settings with Sign Out button (AUTH-08) that calls signOut() from src/services/auth/signOut.ts, preceded by Alert.alert("Sign out?", "You'll need to sign in again...", [{text:"Cancel"}, {text:"Sign out", style:"destructive"}]) — this is the ONE permitted Alert.alert exception per UI-SPEC.
    app/migration.tsx: renders MigrationProgress component — stub with three render states (in_progress/complete/failed) per UI-SPEC Migration Progress Screen section.
    app/+not-found.tsx: renders "Not found" with back link.

    Step 8 — Design system atoms (src/components/):
    All components use NativeWind className props — NO StyleSheet, NO raw hex values. All Pressable components use active:opacity-80 for press feedback. allowFontScaling={false} on all Text components (Phase 1 default per UI-SPEC Accessibility section).

    Button (primary, secondary, ghost, social-google, social-apple variants):
      primary: bg-accent text-bg font-bold rounded-md h-12 (48pt) w-full text-body-emphasis — loading state shows Spinner(bg) instead of label
      secondary: bg-bg-elevated text-fg border border-border rounded-md h-12 w-full
      ghost: transparent text-fg-muted h-12 (used ONLY for "Skip for now" on practice-set)
      social-google: bg-bg-elevated border border-border h-12 w-full flex-row items-center justify-center gap-sm
      social-apple: uses AppleAuthentication.AppleAuthenticationButton (native widget) — never custom-styled (Apple HIG)
      disabled: opacity-60 on non-loading disabled states

    TextInput (text, email, password variants):
      Base: bg-bg-elevated border border-border rounded-sm h-12 px-md text-body text-fg
      focused state: border-border-strong ring via onFocus/onBlur state (caret color accent if supported)
      error state: border-danger bg-danger-dim/10
      password variant: flex-row with TextInput (flex-1) + IconButton (Eye/EyeOff 20px, 44x44pt hitSlop)
      returnKeyType wired per form field (email→next, password→go on sign-in, password→next on sign-up, confirm-password→go)

    Label: Text, 16px Manrope 400, text-fg, allowFontScaling={false}
    HelperText (default/error/success): 12px Manrope 400. error: text-danger with AlertCircle 14px icon prefixed, bg-danger-dim/12 background. success: text-success.
    Divider with-label: flex-row with 1px bg-border lines flanking a bg-bg-input capsule containing "or" in 12px fg-muted.
    IconButton back: 44x44pt Pressable with hitSlop, ChevronLeft 24px text-fg, accessibilityRole="button" accessibilityLabel="Back".
    Toggle binary: two-pill layout. Selected pill: bg-accent-dim border-border-strong text-accent font-bold accessibilityState.selected=true. Unselected: text-fg-muted.
    Chip: Pressable card with label + optional icon. Selected: border-border-strong bg-accent-dim + Lucide Check 16px top-right. accessibilityRole="radio".
    ProgressBar: 4px height View, track bg-border, fill bg-accent, animates width using react-native-reanimated useSharedValue + withTiming(200ms ease-out). useReducedMotion() — if ON, no animation. accessibilityRole="progressbar" with accessibilityValue.
    Spinner: ActivityIndicator with color accent (#F2CA50), sizes default and inline.

    All icon-only and ambiguous controls have accessibilityLabel and accessibilityRole as specified in UI-SPEC Accessibility section.
  </action>
  <verify>
    <automated>npx tsc --noEmit && npm run test:unit -- --run</automated>
  </verify>
  <acceptance_criteria>
    - `npx tsc --noEmit` exits 0 — all imports resolve, no type errors
    - `npm run test:unit -- --run` passes — tests/unit/auth/reset.test.ts imports resetPassword without error
    - `grep -r "StyleSheet.create\|#0A0A0B\|#F2CA50\|#E5E2E1" src/components/` returns NO matches (no raw values in components)
    - `grep -r "allowFontScaling" src/components/` returns matches on Text components
    - `grep "supabaseStorageAdapter" src/lib/supabase.ts` returns a match
    - `grep "AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY" src/lib/storage.ts` returns a match
    - `grep "is_deleted" src/lib/connector.ts` returns a match (soft delete pattern)
    - app/(tabs)/_layout.tsx exists and contains 5 Tabs.Screen entries
    - app/_layout.tsx imports useSession, useOnboardingState, useMigrationStatus
    - `grep "useReducedMotion" src/components/ProgressBar/index.tsx` returns a match
  </acceptance_criteria>
  <done>Library layer (storage/supabase/powersync/hooks) implemented. Root routing shell navigates auth → onboarding → tabs correctly based on session + onboarding state. All 10 design-system atom components built using NativeWind tokens only. 5-tab navigator configured with correct icons, accent active color, haptic feedback, and offline navigation. TypeScript strict passes.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Device → Supabase API | All Supabase client calls over HTTPS; anon key is public-safe but RLS is the enforcement layer |
| Device local storage → App code | MMKV encrypted at rest; SecureStore holds encryption key in OS Keychain/Keystore |
| OAuth provider → App deep link | razeandrise:// scheme receives tokens; URL must be validated before calling setSession |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-01-S-01 | Spoofing | OAuth deep link handler (app/_layout.tsx) | mitigate | Validate URL scheme is razeandrise:// before parsing tokens; Supabase validates tokens server-side before issuing session |
| T-01-S-02 | Spoofing | Apple identity token | mitigate | expo-apple-authentication returns native Apple credential; supabase.auth.signInWithIdToken validates via Apple JWKS; per-request nonce |
| T-01-S-03 | Spoofing | Google OAuth state | mitigate | expo-auth-session includes PKCE + state parameter automatically |
| T-01-T-01 | Tampering | npm/pip/cargo installs | mitigate | slopcheck + blocking human checkpoint (Task 0) for all [ASSUMED] packages |
| T-01-I-01 | Information Disclosure | Supabase session (JWT) in device storage | mitigate | MMKV AES-256 encrypted with key from Keychain (iOS) / Keystore (Android); SecureStoreOptions.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY |
| T-01-I-02 | Information Disclosure | MMKV key extraction (rooted/jailbroken) | accept | Residual risk; Keychain AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY reduces accessibility; acceptable for fitness app threat model |
| T-01-I-03 | Information Disclosure | EXPO_PUBLIC_SUPABASE_ANON_KEY in bundle | accept | Anon key is designed to be public; RLS enforces all authorization server-side; service role key NEVER in client bundle |
| T-01-E-01 | Elevation | supabase.functions.invoke without auth header | mitigate | Edge Functions validate JWT via authHeader before any work; service role client only created inside Edge Function |
| T-01-D-01 | Denial of Service | PowerSync sync flood | accept | Single-user app; PowerSync free tier sufficient for dev; rate limits apply at Supabase level |
| T-01-SC | Tampering | npm/pip/cargo installs | mitigate | slopcheck + blocking human checkpoint for [ASSUMED] / [SUS]; Task 0 is non-skippable |
</threat_model>

<verification>
After both tasks complete:
1. `npx tsc --noEmit` exits 0
2. `npm run test:unit -- --run` — all placeholder tests pass
3. `grep "strict" tsconfig.json` — confirms `"strict": true`
4. `grep "fingerprint" eas.json` — confirms runtimeVersion policy
5. `grep -c "0A0A0B" tailwind.config.js` — at least 1 match (bg token defined)
6. Manual: Open app in Expo development build — routes render, tab nav shows 5 tabs, active tab is gold, app launches without crash
7. Manual: Kill app and relaunch — no crash on startup
</verification>

<success_criteria>
- Expo SDK 55 bare workflow project created with ios/ and android/ committed (FOUND-01)
- TypeScript strict passes across entire codebase (FOUND-02)
- Expo Router v3 file-based routing operational with all route groups (FOUND-03)
- NativeWind v4 configured with full Phase 1 token system in tailwind.config.js; no raw hex in components (FOUND-04)
- EAS build profiles (development/preview/production) configured with fingerprint runtime version (FOUND-05, FOUND-09)
- PowerSync schema (9 tables) defined in src/lib/schema.ts; connector wired (FOUND-06 partial — DB push in schema plan)
- MMKV + SecureStore hybrid initialized at startup with encryption key in SecureStore (FOUND-08)
- 5-tab nav: Dashboard / Workouts / Split / Progress / Settings with accent active state (NAV-01, NAV-02, NAV-03)
- Dark theme default with accent token system; light mode toggle wired to MMKV (DESIGN-01)
- Transitions wired with react-native-reanimated; useReducedMotion() respected on ProgressBar and screen animations (DESIGN-04)
- All Wave 0 test files created; vitest runs without fatal error; CI workflow created
</success_criteria>

<output>
Create `.planning/phases/01-foundation/01-scaffold-SUMMARY.md` when done.
</output>
