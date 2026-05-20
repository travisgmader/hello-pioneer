---
phase: 01-foundation
plan: 01d
type: execute
wave: 2
depends_on:
  - 01-scaffold-init-PLAN.md
  - 01-scaffold-lib-PLAN.md
files_modified:
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
autonomous: true
requirements:
  - FOUND-03
  - FOUND-04
  - NAV-01
  - NAV-02
  - NAV-03

must_haves:
  truths:
    - "Expo Router routes load in correct order: (auth) → (onboarding) → (tabs)"
    - "5-tab nav renders with correct icons and labels; active tab highlighted in accent color"
    - "Session persists in MMKV across app kill and relaunch (routing gate works after restart)"
    - "PowerSync database initializes at app startup (local SQLite file created)"
    - "Tab bar navigates offline — no fetch on tab mount"
    - "Root layout correctly routes based on session + onboardingComplete + migrationStatus state"
  artifacts:
    - path: "app/_layout.tsx"
      provides: "Root layout: session gate + onboarding gate + migration gate + PowerSync init"
      contains: "useSession, useOnboardingState, useMigrationStatus, router.replace, powersync.init"
    - path: "app/(tabs)/_layout.tsx"
      provides: "5-tab navigator with accent active state, Lucide icons, haptic feedback"
      contains: "5 Tabs.Screen entries, tabBarActiveTintColor accent"
    - path: "app/(tabs)/settings.tsx"
      provides: "Settings stub with Sign Out + theme toggle + DEV tools placeholder"
      contains: "signOut, Alert.alert, useTheme"
  key_links:
    - from: "app/_layout.tsx"
      to: "src/hooks/useSession.ts"
      via: "session state → routing decision"
      pattern: "useSession"
    - from: "app/_layout.tsx"
      to: "src/lib/powersync.ts"
      via: "powersync.init() called on startup"
      pattern: "powersync.init"
    - from: "app/(tabs)/_layout.tsx"
      to: "src/components/Button"
      via: "NativeWind tokens consumed in tab bar"
      pattern: "bg-bg|text-fg|text-accent"
---

<objective>
This plan implements the complete Expo Router routing shell: root layout with auth/onboarding/migration gate, the three navigation layout groups ((auth), (onboarding), (tabs)), all screen stubs, and the 5-tab navigator. Depends on 01-scaffold-lib-PLAN.md (hooks and library layer must exist). Runs in Wave 2 parallel with 01-scaffold-ui-PLAN.md — no shared files.

Purpose: The routing shell is the gating layer for the entire app. The auth plan (Wave 3) replaces the auth screen stubs. The navigation-onboarding plan (Wave 4) replaces the onboarding stubs. This plan only establishes the routing skeleton.

Output: App navigates auth → onboarding → tabs correctly based on session and onboarding state. All 5 tabs functional stubs. Settings has Sign Out and theme toggle.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/01-foundation/CONTEXT.md
@.planning/phases/01-foundation/01-RESEARCH.md
@.planning/phases/01-foundation/01-UI-SPEC.md
@.planning/phases/01-foundation/01-SKELETON.md
@.planning/phases/01-foundation/01-scaffold-lib-SUMMARY.md

<interfaces>
<!-- Hooks available from 01-scaffold-lib-PLAN.md -->
useSession(): { session: Session | null, loading: boolean }
useOnboardingState(): { onboardingComplete: boolean }
useMigrationStatus(userId?: string): { migrationStatus: MigrationStatus, loading: boolean }
useTheme(): { theme: 'light' | 'dark' | 'system', setTheme: (t: string) => void }

<!-- PowerSync instance from 01-scaffold-lib-PLAN.md -->
import { powersync } from '@/lib/powersync'
powersync.init() → called once at app startup (in _layout.tsx)
powersync.connect(connector) → called after session is available

<!-- Root layout routing logic -->
no session → (auth)
session + migration_status in ('pending','in_progress','failed') → /migration
session + not onboarded → (onboarding)/profile
session + onboarded → (tabs)

<!-- Tab bar design spec (from 01-UI-SPEC.md) -->
tabBarStyle: bg-bg background (#0A0A0B), 1px top border (rgba(212,175,55,0.22)), height 56pt
tabBarActiveTintColor: accent (#F2CA50)
tabBarInactiveTintColor: fg-muted (#99907C)
Icons (lucide-react-native, 24px):
  Dashboard=LayoutDashboard, Workouts=Dumbbell, Split=CalendarDays, Progress=LineChart, Settings=Settings
Haptics.selectionAsync() on tab change (FOUND-08)
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Root layout + navigation group layouts</name>
  <read_first>
    .planning/phases/01-foundation/01-RESEARCH.md (Navigation Setup section, Code Examples — root layout routing)
    .planning/phases/01-foundation/CONTEXT.md (Decision 4a — migration gate; Decision 4b — no tabs during onboarding)
    src/hooks/useSession.ts, src/hooks/useOnboardingState.ts, src/hooks/useMigrationStatus.ts (from 01-scaffold-lib-SUMMARY.md)
    src/lib/powersync.ts, src/lib/connector.ts (powersync init pattern)
  </read_first>
  <behavior>
    - app/_layout.tsx: when session is null → navigates to (auth); when session + migration pending/in_progress/failed → navigates to /migration; when session + not onboarded → navigates to (onboarding)/profile; when fully authenticated + onboarded → navigates to (tabs)
    - app/_layout.tsx: powersync.init() called on mount; powersync.connect(connector) called when session becomes available
    - (auth)/_layout.tsx: Stack with headerShown: false; gestureEnabled: false on root auth screen
    - (onboarding)/_layout.tsx: Stack with headerShown: false, animation: slide_from_right, gestureEnabled: true
    - (tabs)/_layout.tsx: Tabs with 5 screens, accent active tint, haptics on tab change
    - app/(tabs)/_layout.tsx: offline navigation works — no fetch on tab mount, no loading state blocking tab render
  </behavior>
  <action>
    app/_layout.tsx:
    Import useSession, useOnboardingState, useMigrationStatus, Linking, supabase, powersync, AppConnector. Import global.css. Wrap with QueryClientProvider (TanStack Query) + SafeAreaProvider.
    In useEffect on mount: call powersync.init().
    In useEffect watching [session]: when session becomes available, call powersync.connect(new AppConnector()).
    In useEffect watching [session, sessionLoading, onboardingComplete, migrationStatus, migrationLoading, segments]:
      - if sessionLoading or migrationLoading: return early
      - if no session and not in (auth): router.replace("/(auth)")
      - if session and migration_status in ('pending','in_progress','failed') and not on /migration: router.replace("/migration")
      - if session and migration_status in ('none','complete') and not onboardingComplete and not in (onboarding): router.replace("/(onboarding)/profile")
      - if session and onboardingComplete and not in (tabs): router.replace("/(tabs)")
    Wire deep-link handler for OAuth callbacks (parse access_token + refresh_token from URL hash, call supabase.auth.setSession).

    app/(auth)/_layout.tsx:
    Stack with headerShown: false. gestureEnabled: false on root auth screen (no back from auth).

    app/(onboarding)/_layout.tsx:
    Stack with headerShown: false, animation: "slide_from_right", gestureEnabled: true (swipe-back between steps). practice-set screen: gestureEnabled: false.

    app/(tabs)/_layout.tsx:
    Tabs with headerShown: false. 5 screens: index (Dashboard), workouts (Workouts), split (Split — dedicated tab per NAV-02), progress (Progress), settings (Settings). tabBarStyle: background "#0A0A0B", borderTopWidth 1, borderTopColor "rgba(212,175,55,0.22)", height 56. tabBarActiveTintColor: "#F2CA50", tabBarInactiveTintColor: "#99907C". Icons from lucide-react-native: Dashboard=LayoutDashboard, Workouts=Dumbbell, Split=CalendarDays, Progress=LineChart, Settings=Settings — all 24px. Trigger Haptics.selectionAsync() on tab change via tabBarButton or listeners. Offline navigation must work — tabs do not fetch on mount.
  </action>
  <verify>
    <automated>npx tsc --noEmit && npm run test:unit -- --run</automated>
  </verify>
  <acceptance_criteria>
    - `npx tsc --noEmit` exits 0
    - `npm run test:unit -- --run` passes
    - `grep "useSession\|useOnboardingState\|useMigrationStatus" app/_layout.tsx` returns 3 matches
    - `grep "powersync.init\(\)" app/_layout.tsx` returns a match
    - `grep "powersync.connect" app/_layout.tsx` returns a match
    - app/(tabs)/_layout.tsx exists and contains 5 Tabs.Screen entries: `grep -c "Tabs.Screen" "app/(tabs)/_layout.tsx"` returns 5
    - `grep "selectionAsync" "app/(tabs)/_layout.tsx"` returns a match (haptics on tab change)
  </acceptance_criteria>
  <done>Root layout gates routing by session + onboarding + migration state. PowerSync initializes and connects on session available. Auth/onboarding/tabs navigation layout groups configured. 5-tab navigator with accent active state, Lucide icons, and haptic feedback.</done>
</task>

<task type="auto">
  <name>Task 2: Screen stubs + Settings screen</name>
  <read_first>
    .planning/phases/01-foundation/01-UI-SPEC.md (Dashboard Stub layout, Settings screen layout, Sign Out confirmation copy, Copywriting Contract)
    .planning/phases/01-foundation/CONTEXT.md (Decision 3 — one Alert.alert exception for sign-out)
    src/services/auth/signOut.ts — NOTE: this file is created in 01-auth-PLAN.md (Wave 3); stub import if not yet present
    src/hooks/useTheme.ts (from 01-scaffold-lib-SUMMARY.md)
  </read_first>
  <action>
    Screen stubs (these are replaced by later plans — keep minimal):

    app/(auth)/index.tsx: placeholder renders Text("Sign In") with comment "Implemented in 01-auth-PLAN.md".
    app/(auth)/forgot-password.tsx: placeholder renders Text("Forgot password") with comment "Implemented in 01-auth-PLAN.md".
    app/(onboarding)/profile.tsx, split.tsx, template.tsx, practice-set.tsx: each renders Text("Onboarding step N") with comment "Implemented in 01-navigation-onboarding-PLAN.md".
    app/(tabs)/workouts.tsx, split.tsx, progress.tsx: placeholder screens rendering Text(tab label as heading).
    app/migration.tsx: placeholder renders Text("Migration in progress") — replaced in 01-migration-PLAN.md.
    app/+not-found.tsx: renders Text("Not found") with back link via router.back().

    app/(tabs)/index.tsx (Dashboard stub):
    Per UI-SPEC Dashboard Stub section:
    SafeAreaView (bg-bg, flex-1). xl padding-top. TanStack Query to fetch profile display_name. Heading "Welcome, {displayName ?? 'athlete'}" (24px Noto Serif 700, text-fg — NOT text-accent). sm gap. Body "Today is a rest day." (16px Manrope 400, text-fg-muted). 2xl gap. Empty state card (bg-bg-elevated, rounded-lg, p-lg): Body emphasis "No workout scheduled." + sm gap + Caption "Real workout logging ships in Phase 2." (text-fg-muted). No "Start workout" button (per UI-SPEC: non-functional button reads as broken). If __DEV__: render Text "PowerSync: {status}" below empty state card (for 01-skeleton-verification-PLAN.md Walking Skeleton test). Also if __DEV__: nothing else yet — the "Log test set offline" button is added in 01-skeleton-verification-PLAN.md.

    app/(tabs)/settings.tsx:
    Minimal real settings screen (NOT a full placeholder — Settings has auth-required functionality):
    SafeAreaView bg-bg flex-1. ScrollView with px-md pt-xl.
    Section heading "Account" (24px Noto Serif 700, text-fg). sm gap.
    Sign Out row: Pressable with Text "Sign out" (16px Manrope 400, text-danger). On press: Alert.alert("Sign out?", "You'll need to sign in again to see your workouts.", [{text:"Cancel",style:"cancel"},{text:"Sign out",style:"destructive",onPress:()=>signOut()}]). Import signOut from src/services/auth/signOut — use a conditional import stub: if the file does not yet exist, add `// TODO: import from src/services/auth/signOut — implemented in 01-auth-PLAN.md` and use a no-op function placeholder.
    lg gap.
    Section heading "Appearance" (24px Noto Serif 700, text-fg). sm gap.
    Dark/Light mode Toggle — reads useTheme() + calls setTheme on change.
    lg gap.
    Section heading "Two-factor authentication" (24px Noto Serif 700, text-fg). sm gap.
    Text "Set up SMS verification" (16px Manrope 400, text-fg). sm gap. Text "Manage two-factor authentication in your Supabase account settings." (12px Manrope 400, text-fg-muted).
  </action>
  <verify>
    <automated>npx tsc --noEmit && npm run test:unit -- --run</automated>
  </verify>
  <acceptance_criteria>
    - `npx tsc --noEmit` exits 0
    - `npm run test:unit -- --run` passes
    - `grep "Alert.alert" "app/(tabs)/settings.tsx"` returns exactly 1 match (sign-out — only permitted Alert)
    - `grep "Sign out\|sign out\|signOut" "app/(tabs)/settings.tsx"` returns a match
    - `grep "Start workout\|startWorkout" "app/(tabs)/index.tsx"` returns NO matches (no non-functional button)
    - `grep "Real workout logging ships in Phase 2" "app/(tabs)/index.tsx"` returns a match
    - `grep "__DEV__" "app/(tabs)/index.tsx"` returns a match (PowerSync status indicator)
    - `grep "useTheme" "app/(tabs)/settings.tsx"` returns a match (theme toggle wired)
    - All 5 stub screen files exist: `ls app/(tabs)/index.tsx app/(tabs)/workouts.tsx app/(tabs)/split.tsx app/(tabs)/progress.tsx app/(tabs)/settings.tsx`
  </acceptance_criteria>
  <done>All screen stubs created. Dashboard stub displays display name + correct Phase 1 copy + __DEV__ PowerSync status. Settings has Sign Out (with Alert.alert confirmation), theme toggle, and SMS MFA stub section. Auth and onboarding stubs have clear implementation comments for subsequent plans.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| OAuth deep link → app | razeandrise:// scheme receives tokens; URL must be validated before calling setSession |
| Session gate in root layout | Client-side only; must be mirrored by RLS on every API call |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-01d-S-01 | Spoofing | OAuth deep link handler (app/_layout.tsx) | mitigate | Validate URL scheme is razeandrise:// before parsing tokens; Supabase validates tokens server-side before issuing session |
| T-01d-T-01 | Tampering | MMKV onboarding routing flag bypass | accept | MMKV encrypted; Supabase profiles.onboarded provides server-side mirror; fitness app threat model |
| T-01d-I-01 | Information Disclosure | __DEV__ PowerSync status visible in development builds | accept | __DEV__ gated — stripped by Metro in production builds |
| T-01d-SC | Tampering | npm installs | mitigate | Gated by 01-scaffold-init-PLAN.md Task 0 blocking checkpoint |
</threat_model>

<verification>
1. `npx tsc --noEmit` exits 0
2. `npm run test:unit -- --run` passes
3. Manual: Open app in Expo development build — routes render, tab nav shows 5 tabs, active tab is gold, app launches without crash
4. Manual: Kill app and relaunch — no crash on startup; session routing gate works
5. Manual: All 5 tabs navigate without crash (offline navigation)
</verification>

<success_criteria>
- Expo Router v3 file-based routing operational with all route groups (FOUND-03)
- 5-tab nav: Dashboard / Workouts / Split / Progress / Settings with accent active state (NAV-01, NAV-02, NAV-03)
- Root layout routes correctly based on session + onboarding + migration state
- PowerSync initializes on app startup
- All screen stubs provide clear implementation comments for subsequent plans
- TypeScript strict passes (FOUND-04 partial — NativeWind tokens consumed in tab nav)
</success_criteria>

<output>
Create `.planning/phases/01-foundation/01-scaffold-routing-SUMMARY.md` when done.
</output>
