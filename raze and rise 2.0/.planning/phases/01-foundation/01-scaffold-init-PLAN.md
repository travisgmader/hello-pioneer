---
phase: 01-foundation
plan: 01a
type: execute
wave: 1
depends_on: []
files_modified:
  - app.config.ts
  - tsconfig.json
  - tailwind.config.js
  - global.css
  - nativewind-env.d.ts
  - metro.config.js
  - babel.config.js
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
  - FOUND-05
  - FOUND-09

must_haves:
  truths:
    - "App launches on iOS simulator and Android emulator without crash"
    - "npx tsc --noEmit exits 0 with strict mode enabled"
    - "NativeWind dark theme tokens defined in tailwind.config.js; no raw hex values"
    - "EAS build profiles (development/preview/production) configured with fingerprint runtime version"
    - "All Wave 0 test files exist and vitest runs without fatal errors"
    - "CI workflow runs tsc and vitest on pull_request trigger"
  artifacts:
    - path: "app.config.ts"
      provides: "Expo config: bare workflow, scheme razeandrise, EAS profiles, fingerprint runtimeVersion"
      contains: "runtimeVersion, ios.usesAppleSignIn, newArchEnabled"
    - path: "tailwind.config.js"
      provides: "ALL Phase 1 design tokens (bg, fg, accent, border, danger, success, spacing, typography)"
      contains: "colors.bg, colors.accent, colors.fg, colors.border, colors.danger, colors.success"
    - path: "eas.json"
      provides: "EAS Build profiles: development, preview, production"
      contains: "runtimeVersion"
    - path: "vitest.config.ts"
      provides: "Vitest configuration for unit + integration tests"
  key_links:
    - from: "tailwind.config.js"
      to: "global.css"
      via: "@tailwind directives consume tailwind.config.js token system"
      pattern: "@tailwind"
    - from: "metro.config.js"
      to: "global.css"
      via: "withNativeWind wraps metro config pointing to global.css"
      pattern: "withNativeWind"

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
      - task: "Run eas login and eas build:configure before Task 2"
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
This plan scaffolds the Expo bare workflow project, configures TypeScript + NativeWind + EAS, and establishes the complete Wave 0 test infrastructure. This is the first of four scaffold sub-plans (init → lib → ui → routing) that replace the original monolithic 01-scaffold-PLAN.md.

Purpose: Every subsequent Phase 1 plan builds on this config foundation. Architecture decisions locked here (bare workflow, NativeWind token system, EAS fingerprint policy, test framework) cannot be changed without a major rewrite.

Output: Runnable bare workflow app with TypeScript strict, NativeWind full token system, EAS build configured, and all Wave 0 test infrastructure in place.
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
<!-- Design tokens from 01-UI-SPEC.md — tailwind.config.js MUST define these exact names -->
Colors: bg=#0A0A0B (bg), bg-elevated=#141416 (bg-elevated), bg-input=#1C1B1B (bg-input),
  border=rgba(212,175,55,0.22) (border), border-strong=rgba(212,175,55,0.45) (border-strong),
  fg=#E5E2E1 (fg), fg-muted=#99907C (fg-muted), fg-subtle=#5C564B (fg-subtle),
  accent=#F2CA50 (accent), accent-deep=#D4AF37 (accent-deep), accent-dim=rgba(212,175,55,0.10) (accent-dim),
  danger=#EF4444 (danger), danger-dim=rgba(239,68,68,0.12) (danger-dim),
  success=#10B981 (success), success-dim=rgba(16,185,129,0.12) (success-dim)

Spacing: xs=4px, sm=8px, md=16px, lg=24px, xl=32px, 2xl=48px, 3xl=64px

Typography roles:
  caption: 12px Manrope 400 (lh 1.4)
  body: 16px Manrope 400 (lh 1.5)
  body-emphasis: 16px Manrope 700 (lh 1.5)
  heading: 24px Noto Serif 700 (lh 1.25)
  display: 32px Noto Serif 700 (lh 1.2)

Border radius: none=0, sm=2px, md=4px, lg=8px, full=9999px
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
  <name>Task 1: Scaffold project + configure TypeScript/NativeWind/EAS + Wave 0 test infrastructure</name>
  <read_first>
    .planning/phases/01-foundation/01-RESEARCH.md (Project Scaffold section, Standard Stack, Package Legitimacy Audit, Validation Architecture section)
    .planning/phases/01-foundation/01-VALIDATION.md (Wave 0 Requirements section)
    .planning/phases/01-foundation/01-SKELETON.md (Directory Layout)
    .planning/phases/01-foundation/01-UI-SPEC.md (Design System section — full token values)
  </read_first>
  <behavior>
    - vitest.config.ts correctly resolves @/* path alias (same as tsconfig.json paths)
    - tests/unit/router.test.tsx: renders a stub that matches Expo Router route structure — test passes
    - tests/unit/theme.test.tsx: tailwind.config.js colors.bg.DEFAULT exists and equals '#0A0A0B' — test passes
    - tests/unit/auth/reset.test.ts: resetPassword is an exportable async function — test passes (placeholder)
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
    Create app.config.ts (replace app.json). Set: name "Raze and Rise", slug "raze-and-rise", scheme "razeandrise" (for OAuth deep links), newArchEnabled: true (mandatory SDK 55), ios.bundleIdentifier "com.razeandrise.app", ios.usesAppleSignIn: true, android.package "com.razeandrise.app". Plugins: ["expo-router", "expo-apple-authentication", "@powersync/react-native", ["react-native-mmkv", {}]]. Add runtimeVersion: { policy: "fingerprint" } and updates.url placeholder. Add updates.url as the EAS project URL once eas build:configure runs.

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
    - `grep "0A0A0B" tailwind.config.js` returns a match (bg token defined)
    - `grep "accent" tailwind.config.js | grep "F2CA50"` returns a match
    - `grep '"strict": true' tsconfig.json` returns a match
    - `grep "fingerprint" eas.json` returns a match (runtimeVersion policy)
    - `ls tests/unit/ tests/integration/ .maestro/ .github/workflows/` all exist
    - `grep "test:unit" package.json` returns a match
    - Wave 0 files exist: vitest.config.ts, .github/workflows/test.yml, playwright.config.ts
  </acceptance_criteria>
  <done>Bare workflow project scaffolded. All dependencies installed. TypeScript strict passes. NativeWind configured with full Phase 1 token system. EAS configured with fingerprint runtime version policy. Wave 0 test infrastructure installed and passing (placeholder tests green). CI workflow created.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| npm registry → installed packages | All packages are [ASSUMED] — Task 0 gates installs on human verification |
| EAS Build env vars | EXPO_PUBLIC_* are public-safe; service role key NEVER in client bundle |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-01a-T-01 | Tampering | npm installs — [ASSUMED] packages not verified | mitigate | Task 0 is a non-skippable blocking checkpoint; all packages verified on npmjs.com before install |
| T-01a-I-01 | Information Disclosure | EXPO_PUBLIC_SUPABASE_ANON_KEY in bundle | accept | Anon key is designed to be public; RLS enforces all authorization server-side; service role key NEVER in EXPO_PUBLIC_* |
| T-01a-SC | Tampering | npm/pip/cargo installs | mitigate | slopcheck + blocking human checkpoint (Task 0) for all [ASSUMED] / [SUS] packages |
</threat_model>

<verification>
After both tasks complete:
1. `npx tsc --noEmit` exits 0
2. `npm run test:unit -- --run` — all placeholder tests pass
3. `grep "strict" tsconfig.json` — confirms `"strict": true`
4. `grep "fingerprint" eas.json` — confirms runtimeVersion policy
5. `grep -c "0A0A0B" tailwind.config.js` — at least 1 match (bg token defined)
</verification>

<success_criteria>
- Expo SDK 55 bare workflow project created with ios/ and android/ committed (FOUND-01)
- TypeScript strict passes across entire codebase (FOUND-02)
- EAS build profiles (development/preview/production) configured with fingerprint runtime version (FOUND-05, FOUND-09)
- NativeWind v4 configured with full Phase 1 token system; no raw hex in components
- All Wave 0 test files created; vitest runs without fatal error; CI workflow created
</success_criteria>

<output>
Create `.planning/phases/01-foundation/01-scaffold-init-SUMMARY.md` when done.
</output>
