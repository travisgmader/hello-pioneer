---
phase: 01-foundation
plan: 04
type: execute
wave: 3
depends_on:
  - 01-auth-PLAN.md
  - 01-schema-PLAN.md
files_modified:
  - app/(onboarding)/profile.tsx
  - app/(onboarding)/split.tsx
  - app/(onboarding)/template.tsx
  - app/(onboarding)/practice-set.tsx
  - app/(tabs)/index.tsx
  - src/components/OnboardingStepLayout/index.tsx
  - src/components/ProfileStep/index.tsx
  - src/components/SplitSelector/index.tsx
  - src/components/TemplateBuilder/index.tsx
  - src/components/PracticeSetCard/index.tsx
  - src/components/DashboardEmpty/index.tsx
  - src/hooks/useOnboardingState.ts
  - .maestro/onboarding.yaml
  - .maestro/tabs.yaml
  - .maestro/theme-toggle.yaml
autonomous: true
requirements:
  - NAV-01
  - NAV-02
  - NAV-03
  - ONBOARD-01
  - ONBOARD-02
  - ONBOARD-03
  - ONBOARD-04
  - ONBOARD-05
  - ONBOARD-06
  - DESIGN-01
  - DESIGN-04

must_haves:
  truths:
    - "New user sees onboarding full-screen (no tabs visible) on first launch"
    - "Profile step (step 1 of 4) requires display name before Continue is enabled"
    - "Split step (step 2 of 4) requires selecting a split type"
    - "Template step (step 3 of 4) requires selecting a starter template"
    - "Practice set step (step 4 of 4) has a Skip button — the ONLY Skip button in onboarding"
    - "After completing/skipping step 4, user lands on Dashboard and sees their display name"
    - "Profile + split + template rows exist in Supabase after onboarding completes"
    - "Back navigation within onboarding works; back from step 1 signs out and returns to auth"
    - "Onboarding complete flag (onboarding.complete in MMKV + profiles.onboarded in Supabase) set on finish"
    - "Notification preference time is saved during onboarding (step 4 or profile step)"
    - "All 5 tabs render with correct Lucide icons and labels; active tab is accent-colored"
  artifacts:
    - path: "app/(onboarding)/profile.tsx"
      provides: "Step 1: display name + units + primary goal"
    - path: "app/(onboarding)/split.tsx"
      provides: "Step 2: split type picker with weekly schedule previews"
    - path: "app/(onboarding)/template.tsx"
      provides: "Step 3: starter template picker filtered by selected split"
    - path: "app/(onboarding)/practice-set.tsx"
      provides: "Step 4: optional practice set demo with Skip button"
    - path: "src/components/OnboardingStepLayout/index.tsx"
      provides: "Reusable shell: SafeArea + back button + ProgressBar + ScrollView + sticky CTA"
    - path: "src/hooks/useOnboardingState.ts"
      provides: "MMKV-backed onboarding state + Supabase profile sync"
      exports: ["useOnboardingState", "setOnboardingComplete", "updateOnboardingStep"]
  key_links:
    - from: "app/(onboarding)/profile.tsx"
      to: "supabase.from('profiles').update"
      via: "profile row updated with display_name, units, primary_goal on step 1 complete"
      pattern: "profiles.*update"
    - from: "app/(onboarding)/split.tsx"
      to: "supabase.from('split_settings').upsert"
      via: "split_settings row created/updated on step 2 complete"
      pattern: "split_settings.*upsert"
    - from: "app/(onboarding)/template.tsx"
      to: "supabase.from('templates').insert"
      via: "template + template_exercises rows created on step 3 complete"
      pattern: "templates.*insert"
---

<objective>
This plan implements the 5-step onboarding flow (profile → split → template → practice set → Dashboard) and the Dashboard stub. Onboarding uses the full-screen stack (no tab bar visible). Each step is a distinct screen with a progress indicator. On completion, MMKV + Supabase are both updated, the root layout routes to (tabs), and the Dashboard shows the user's display name.

Also completes the 5-tab navigator interaction layer (icons, active state, haptics) and wires the notification preference time collection (ONBOARD-06).

Purpose: Onboarding gates the entire tab navigator. No Phase 2 feature is accessible until this gate works correctly. This plan also writes real profile, split_settings, templates, and notification_preferences rows to Supabase — which are consumed by all Phase 2+ plans.

Output: Full onboarding flow completable end-to-end. Dashboard renders with user's display name. All 5 tabs functional.
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
@.planning/phases/01-foundation/01-scaffold-SUMMARY.md
@.planning/phases/01-foundation/01-schema-SUMMARY.md
@.planning/phases/01-foundation/01-auth-SUMMARY.md

<interfaces>
<!-- Onboarding state shape (MMKV + Supabase mirror) -->
MMKV keys:
  "onboarding.complete" → "true" | "false" (string)
  "onboarding.step" → "1" | "2" | "3" | "4" (last completed step — for resume on app kill)
  "onboarding.displayName" → string
  "onboarding.units" → "lbs" | "kg"
  "onboarding.goal" → "strength" | "hypertrophy" | "fat-loss" | "general"
  "onboarding.splitType" → "ppl" | "upper-lower" | "full-body" | "body-part" | "af-pt"
  "onboarding.selectedTemplateId" → uuid string

Supabase rows written by onboarding:
  profiles: display_name, units, primary_goal, onboarded (set to true on completion)
  split_settings: split_type, rotation_pointer=0, phase=0
  templates + template_exercises: from starter-templates.json, inserted for user
  notification_preferences: workout_reminder_time (from ONBOARD-06)

<!-- OnboardingStepLayout props -->
interface OnboardingStepLayoutProps {
  step: 1 | 2 | 3 | 4;
  totalSteps: 4;
  onBack?: () => void;  // step 1: signs out; steps 2-4: navigate back
  onContinue: () => void;
  continueEnabled: boolean;
  continueLabel?: string;  // default "Continue"
  secondaryCTA?: React.ReactNode;  // practice-set step has ghost Skip button
  children: React.ReactNode;
}

<!-- SplitSelector options per UI-SPEC Onboarding Step 2 Copywriting -->
Options:
  id: "ppl", label: "Push / Pull / Legs", subtitle: "6 days · classic hypertrophy split"
  id: "upper-lower", label: "Upper / Lower", subtitle: "4 days · balanced volume and recovery"
  id: "full-body", label: "Full Body", subtitle: "3 days · time-efficient, beginner-friendly"
  id: "body-part", label: "Body Part", subtitle: "5 days · bodybuilder-style focus per day"
  id: "af-pt", label: "AF PT Prep", subtitle: "Run, push-ups, pull-ups, sit-ups"

Weekly schedule preview (per UI-SPEC SplitSelector component):
  7-cell row of Day dots: filled (workout day) in accent-dim, empty (rest day) in border color
  PPL: MTWFSS with Wed+Sun rest = 6 filled, 1 empty (or M-Sat workout, Sun rest)
  Upper-Lower: MTWF workout, rest Thu+Sat+Sun = 4 filled, 3 empty
  Full Body: MWF workout = 3 filled, 4 empty
  Body Part: MTWRF workout, rest Sat+Sun = 5 filled, 2 empty
  AF PT Prep: alternating run/strength, 5 days = 5 filled, 2 empty

<!-- Notification preference input for ONBOARD-06 -->
Added to Step 4 (PracticeSetCard) layout: Label "Preferred workout time" + a time picker
  Use @react-native-community/datetimepicker or a simple TextInput for HH:MM
  Value saved to notification_preferences.workout_reminder_time
  Default: "07:00"
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: OnboardingStepLayout + all 4 onboarding screens (profile, split, template, practice-set)</name>
  <read_first>
    .planning/phases/01-foundation/01-UI-SPEC.md (Onboarding Step Layout wireframe, Step 1-4 content, Component Inventory — ProfileStep, SplitSelector, TemplateBuilder stub, PracticeSetCard, Copywriting Contract onboarding sections)
    .planning/phases/01-foundation/CONTEXT.md (Decision 2 — all steps required, practice set optional; Decision 4b — no tabs during onboarding)
    supabase/starter-templates.json (created in 01-schema-PLAN.md — read the structure before writing template.tsx)
    src/hooks/useOnboardingState.ts (current implementation from 01-scaffold-PLAN.md)
  </read_first>
  <behavior>
    - OnboardingStepLayout: step 1 hides back button; steps 2-4 show ChevronLeft back button
    - OnboardingStepLayout: ProgressBar width animates from (step-1)/4 to step/4 on mount (200ms ease-out)
    - OnboardingStepLayout: "Step {N} of 4" caption in fg-muted below progress bar
    - OnboardingStepLayout: Continue button disabled when continueEnabled=false (opacity-60)
    - OnboardingStepLayout: primary CTA stays above keyboard (KeyboardAvoidingView)
    - ProfileStep: Continue enabled only when displayName.trim().length >= 1
    - SplitSelector: Continue enabled only when a split option is selected; selected card has border-strong + accent-dim bg + Check icon
    - TemplateBuilder stub: Continue enabled only when a template is selected
    - PracticeSetCard: has both "Skip for now" (ghost) and "Try it" (primary) CTAs — the ONLY screen with Skip
    - Completing profile step: writes to MMKV onboarding.displayName/units/goal AND calls supabase.from('profiles').update
    - Completing split step: writes to MMKV onboarding.splitType AND calls supabase.from('split_settings').upsert
    - Completing template step: writes template + template_exercises rows to Supabase AND stores template UUID in MMKV
    - Completing practice-set (or Skip): sets MMKV onboarding.complete="true" AND updates profiles.onboarded=true in Supabase
    - Back from step 1: calls signOut() then navigate to (auth)
    - useReducedMotion(): if ON, ProgressBar width snaps to final value without animation
  </behavior>
  <action>
    src/components/OnboardingStepLayout/index.tsx:
    Full implementation per UI-SPEC layout. Stack (top to bottom):
    SafeAreaView (bg-bg, flex-1)
    Padding px-md. At top: row with IconButton back (shown for steps 2-4; invisible placeholder for step 1 to maintain layout height). sm gap below.
    ProgressBar component — width is `${(step / totalSteps) * 100}%` animated on mount.
    sm gap. Caption "Step {step} of {totalSteps}" (12px Manrope 400, fg-muted, text-right).
    2xl gap.
    ScrollView (flex-1) containing {children}.
    Bottom-pinned area: KeyboardAvoidingView (behavior="padding" on iOS, "height" on Android).
    If secondaryCTA is provided (practice-set step only): flex-row, ghost button (narrow, 1/3 width) + primary button (2/3 width). Otherwise: full-width primary Button.
    Primary Button: label={continueLabel ?? "Continue"}, disabled={!continueEnabled}, loading=false (loading wired by each step screen).
    Safe area bottom padding.

    app/(onboarding)/profile.tsx + src/components/ProfileStep/index.tsx:
    Renders inside OnboardingStepLayout (step=1, onBack=signOut+navigate). Content:
    - Label "Display name" + TextInput (text variant, placeholder "What should we call you?") — react-hook-form field, value persists to MMKV onboarding.displayName on change
    - Label "Preferred units" + Toggle binary ("lbs" | "kg") — default "lbs", persists to MMKV onboarding.units, fires Haptics.selectionAsync() on toggle
    - Label "Primary goal" + 2×2 grid of Chip components: Strength (Dumbbell icon), Hypertrophy (Flame icon), Fat Loss (TrendingDown icon), General Fitness (Activity icon) — selected chip persists to MMKV onboarding.goal; Haptics.impactAsync(Light) on selection
    Continue enabled when displayName.trim().length >= 1. On Continue:
    1. Set MMKV onboarding.step="1"
    2. Update supabase profiles: { display_name: displayName, units, primary_goal: goal } — handle error (show HelperText error)
    3. Navigate to (onboarding)/split

    app/(onboarding)/split.tsx + src/components/SplitSelector/index.tsx:
    Renders inside OnboardingStepLayout (step=2). Content:
    - Heading "Choose your split" (24px Noto Serif 700)
    - Body subtitle (16px Manrope 400, fg-muted)
    - ScrollView list of 5 SplitSelector option cards. Each card: Title (Body emphasis 16px 700), Subtitle (Caption 12px fg-muted), 7-cell weekly schedule preview row. Selected: border-border-strong + bg-accent-dim + Check icon (Lucide Check 16px accent color top-right). On tap: Haptics.impactAsync(Light).
    Continue enabled when splitType is selected. On Continue:
    1. MMKV onboarding.splitType = selected split id
    2. supabase.from('split_settings').upsert({ user_id, split_type, rotation_pointer:0, phase:0, global_rest_seconds:90 }, { onConflict:'user_id' })
    3. Navigate to (onboarding)/template

    app/(onboarding)/template.tsx + src/components/TemplateBuilder/index.tsx (stub):
    Renders inside OnboardingStepLayout (step=3). Content:
    - Heading "Pick a starter template"
    - Body "You can fully customize this later in the Split tab."
    - Read supabase/starter-templates.json (import as static JSON), filter by the MMKV onboarding.splitType. Display matching template options as cards: Title (day label + exercise list summary), Subtitle "{N} exercises · {N} sets per exercise". Selected: border-border-strong + bg-accent-dim.
    On Continue:
    1. Read the selected template's exercise list from starter-templates.json
    2. Insert templates row: { id: Crypto.randomUUID(), user_id, day_label: selected template's day_label, name: selected template's name }
    3. Insert template_exercises rows for each exercise (look up exercise IDs from the exercises table — match by name, or use known UUIDs seeded in 01-schema-PLAN.md seed.sql)
    4. Store template UUID in MMKV onboarding.selectedTemplateId
    5. Navigate to (onboarding)/practice-set

    app/(onboarding)/practice-set.tsx + src/components/PracticeSetCard/index.tsx:
    Renders inside OnboardingStepLayout (step=4, secondaryCTA=ghost Skip button). Content:
    - Heading "Try logging a set"
    - Body "This is what every set looks like during a real workout. Tap go or no-go to mark it."
    - Animated set-row demo: a static-looking set row with a "go / no-go" visual — Pressable buttons that toggle state between null → "go" → "no-go" → null, firing Haptics.impactAsync(Light) on each. This is purely visual demo; no real data written to PowerSync/Supabase.
    - Label "Preferred workout time" + a time display Pressable that opens a time picker on press (use @react-native-community/datetimepicker in time mode, or if not installed, a simple TextInput accepting "HH:MM" format). Default "07:00". Value stored in local state then written to notification_preferences on completion. (ONBOARD-06)
    Both "Skip for now" (ghost) and "Try it" (primary) complete the same action:
    1. If workout time was set, upsert notification_preferences: { user_id, workout_reminder_time, workout_reminder_enabled: true }
    2. Update supabase profiles: { onboarded: true }
    3. Set MMKV "onboarding.complete" = "true"
    4. Haptics.notificationAsync(NotificationFeedbackType.Success)
    5. navigate to (tabs) — root layout picks this up automatically

    Update src/hooks/useOnboardingState.ts to expose:
    setOnboardingComplete(): writes MMKV + updates Supabase profiles.onboarded=true
    updateOnboardingStep(step: number): writes MMKV onboarding.step
    The hook already reads onboardingComplete from MMKV — no change to the read side.
  </action>
  <verify>
    <automated>npx tsc --noEmit && npm run test:unit -- --run</automated>
  </verify>
  <acceptance_criteria>
    - `npx tsc --noEmit` exits 0
    - `npm run test:unit -- --run` passes
    - `grep "Skip for now" app/\(onboarding\)/practice-set.tsx` returns a match (only Skip button location)
    - `grep "Skip\|skip" app/\(onboarding\)/profile.tsx` returns NO matches (no Skip on step 1)
    - `grep "Skip\|skip" app/\(onboarding\)/split.tsx` returns NO matches
    - `grep "Skip\|skip" app/\(onboarding\)/template.tsx` returns NO matches
    - `grep "Haptics.selectionAsync\|Haptics.impactAsync" src/components/SplitSelector/index.tsx` returns a match
    - `grep "onboarded.*true\|onboarded:.*true" app/\(onboarding\)/practice-set.tsx` returns a match
    - `grep "workout_reminder_time" app/\(onboarding\)/practice-set.tsx` returns a match (ONBOARD-06)
    - `grep "useReducedMotion" src/components/OnboardingStepLayout/index.tsx` returns a match
  </acceptance_criteria>
  <done>All 4 onboarding screens implemented. OnboardingStepLayout shell reusable. ProfileStep, SplitSelector, TemplateBuilder stub, PracticeSetCard all fully implemented per UI-SPEC. Supabase rows written on each step completion. Notification preference time collected (ONBOARD-06). OnboardingComplete flag set in MMKV + Supabase on finish.</done>
</task>

<task type="auto">
  <name>Task 2: Dashboard stub + complete Maestro E2E flows for onboarding + tabs + theme</name>
  <read_first>
    .planning/phases/01-foundation/01-UI-SPEC.md (Dashboard Stub layout, Tab Bar layout, Copywriting Contract — Dashboard, Tab Labels)
    .planning/phases/01-foundation/01-VALIDATION.md (Per-Task Verification Map — NAV-01,02,03 and ONBOARD entries)
    src/hooks/useSession.ts (session.user.id available after auth)
  </read_first>
  <action>
    app/(tabs)/index.tsx (Dashboard):
    Full implementation per UI-SPEC Dashboard Stub section.
    - SafeAreaView (bg-bg, flex-1)
    - xl (32pt) padding-top
    - TanStack Query to fetch profile: supabase.from('profiles').select('display_name').eq('user_id', session.user.id).single(). Fallback display name: "athlete".
    - Heading "Welcome, {displayName}" (24px Noto Serif 700, fg color). NOT in accent color (accent is reserved — per UI-SPEC reserved list).
    - sm (8pt) gap
    - Body "Today is a rest day." (16px Manrope 400, fg-muted) — placeholder text for Phase 1 stub
    - 2xl (48pt) gap
    - Empty state card (bg-elevated, rounded-lg, p-lg):
      - Body emphasis "No workout scheduled." (16px Manrope 700)
      - sm gap
      - Caption "Real workout logging ships in Phase 2." (12px Manrope 400, fg-muted)
    - No "Start workout" button in Phase 1 (per UI-SPEC: showing a non-functional button reads as broken)

    Update .maestro/onboarding.yaml:
    Full flow: launchApp → assertVisible Sign In screen → tapOn Sign Up → fill email/password/confirm → tapOn Create account → (root layout routes to onboarding) → assertVisible "Set up your profile" → fillText display name → tapOn Continue → assertVisible "Choose your split" → tapOn "Push / Pull / Legs" → tapOn Continue → assertVisible "Pick a starter template" → tapOn first template card → tapOn Continue → assertVisible "Try logging a set" → tapOn "Skip for now" → assertVisible "Welcome" (Dashboard). Flow should complete without assertions failing.

    Update .maestro/tabs.yaml:
    Full flow: assumes user already logged in and onboarded. launchApp → assertVisible Dashboard → tapOn Workouts tab → assertVisible "Workouts" heading → tapOn Split tab → assertVisible "Split" heading → tapOn Progress tab → assertVisible "Progress" heading → tapOn Settings tab → assertVisible "Settings" heading → tapOn Dashboard tab → assertVisible "Welcome". Add: takeScreenshot before and after each tab tap. Add airplane-mode comment: "# TODO: run with airplane mode ON to verify NAV-03 offline navigation — requires device manual step".

    Update .maestro/theme-toggle.yaml:
    Flow: launchApp (assumes logged in + onboarded) → navigate to Settings tab → assertVisible "Appearance" section → tapOn "Dark" toggle → assertScreenContains (some indicator of light mode change) → tapOn "Dark" toggle again → returns to dark. Add comment "# Note: MMKV theme override verified by asserting Settings toggle state, not visual color (visual contrast verified manually)".
  </action>
  <verify>
    <automated>npx tsc --noEmit && npm run test:unit -- --run</automated>
  </verify>
  <acceptance_criteria>
    - `npx tsc --noEmit` exits 0
    - `npm run test:unit -- --run` passes
    - `grep "Welcome" app/\(tabs\)/index.tsx` returns a match (greeting copy correct)
    - `grep "Start workout\|startWorkout" app/\(tabs\)/index.tsx` returns NO matches (disabled button not rendered per UI-SPEC)
    - `grep "Real workout logging ships in Phase 2" app/\(tabs\)/index.tsx` returns a match (stub copy correct per UI-SPEC)
    - .maestro/onboarding.yaml contains "Skip for now" (complete flow)
    - .maestro/tabs.yaml contains all 5 tab names: "Dashboard", "Workouts", "Split", "Progress", "Settings"
    - .maestro/theme-toggle.yaml contains "Appearance" (Settings section heading reference)
  </acceptance_criteria>
  <done>Dashboard stub implemented with display name from profile query. All 3 Maestro YAML files (onboarding, tabs, theme-toggle) updated to real test flows. Dashboard shows correct Phase 1 stub copy. TypeScript strict passes.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Onboarding form → Supabase | User-supplied display name and units written to profiles table |
| MMKV onboarding state | Local gate for root layout routing; mirrored to Supabase to survive reinstall |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-04-T-01 | Tampering | MMKV onboarding flag manipulation — skip onboarding by manually setting flag | accept | MMKV is encrypted (AES-256 key in SecureStore). Technically savvy user on jailbroken device could bypass; accepted for fitness app threat model. Supabase profiles.onboarded provides server-side mirror as secondary check. |
| T-04-T-02 | Tampering | Template exercises referencing exercise IDs not owned by user | mitigate | Template insertion runs as authenticated user; RLS template_exercises policy checks parent template ownership. Cannot insert exercises not visible to user (is_custom = false OR created_by = user). |
| T-04-I-01 | Information Disclosure | Display name written to Supabase profiles — minimal PII | accept | Display name is intentionally user-supplied public-facing data. Not a sensitive field. RLS ensures only the owning user can read it. |
| T-04-D-01 | Denial of Service | Duplicate onboarding completion writes | mitigate | profiles update uses .eq('user_id') targeting own row only; split_settings uses upsert ON CONFLICT user_id; idempotent. |
| T-04-SC | Tampering | npm/pip/cargo installs | mitigate | All new packages (@react-native-community/datetimepicker if used) must be verified at install time; see scaffold plan Task 0 pattern |
</threat_model>

<verification>
1. `npx tsc --noEmit` exits 0
2. `npm run test:unit -- --run` passes
3. Manual: Fresh install on iOS simulator → sign up → see onboarding step 1 → tabs NOT visible → complete all 4 steps → land on Dashboard with display name
4. Manual: Kill app mid-onboarding (after step 2), relaunch — should resume at step 2 (MMKV state preserved)
5. Manual: Back from step 2 → goes to step 1. Back from step 1 → signed out, auth screen shown.
6. Manual: After completing onboarding → Supabase Dashboard shows profile row (display_name, units, primary_goal, onboarded=true) + split_settings row + template row + template_exercises rows + notification_preferences row
7. `maestro test .maestro/onboarding.yaml` (real device, email already signed up) — full flow runs to Dashboard
8. `maestro test .maestro/tabs.yaml` — all 5 tabs navigate without crash
</verification>

<success_criteria>
- 5-tab nav renders Dashboard / Workouts / Split / Progress / Settings with Lucide icons and active accent state (NAV-01, NAV-02, NAV-03)
- Onboarding shown on first launch; tab nav hidden until complete (ONBOARD-01)
- Profile step collects display name + units + goal (ONBOARD-02)
- Split step shows 5 options with weekly schedule previews (ONBOARD-03)
- Template step creates real template + template_exercises rows (ONBOARD-04)
- Practice set has Skip button; both Skip and "Try it" complete onboarding (ONBOARD-05)
- Notification preference time collected and saved to notification_preferences (ONBOARD-06)
- Dark/light mode toggle in Settings writes MMKV override (DESIGN-01)
- Progress bar and transitions use react-native-reanimated with useReducedMotion() guard (DESIGN-04)
</success_criteria>

<output>
Create `.planning/phases/01-foundation/01-navigation-onboarding-SUMMARY.md` when done.
</output>
