---
phase: 01-foundation
plan: 04
subsystem: onboarding
tags: [onboarding, navigation, supabase, mmkv, reanimated, haptics, maestro]
dependency_graph:
  requires:
    - 01-auth-SUMMARY.md
    - 01-schema-SUMMARY.md
    - 01-scaffold-routing-SUMMARY.md
  provides:
    - Full 4-step onboarding flow (profile → split → template → practice-set → Dashboard)
    - OnboardingStepLayout reusable shell
    - ProfileStep, SplitSelector, TemplateBuilder, PracticeSetCard components
    - Dashboard stub with TanStack Query profile fetch
    - Maestro E2E YAML flows for onboarding, tabs, theme-toggle
  affects:
    - app/(onboarding)/* (all 4 step screens implemented)
    - app/(tabs)/index.tsx (Dashboard stub updated)
    - Supabase: profiles, measurements, split_settings, templates, template_exercises, notification_preferences
tech_stack:
  added: []
  patterns:
    - Controlled form state via useState (no react-hook-form usage in onboarding screens)
    - ProgressBar animation via reanimated useSharedValue + withTiming + useReducedMotion guard
    - MMKV-backed onboarding step progress for app-kill recovery
    - Supabase writes on each step completion (idempotent upserts where applicable)
    - signOut stub pattern: Plan 03 real implementation used (already existed)
key_files:
  created:
    - src/components/OnboardingStepLayout/index.tsx
    - src/components/ProfileStep/index.tsx
    - src/components/SplitSelector/index.tsx
    - src/components/TemplateBuilder/index.tsx
    - src/components/PracticeSetCard/index.tsx
    - src/components/DashboardEmpty/index.tsx
  modified:
    - app/(onboarding)/profile.tsx
    - app/(onboarding)/split.tsx
    - app/(onboarding)/template.tsx
    - app/(onboarding)/practice-set.tsx
    - app/(tabs)/index.tsx
    - .maestro/onboarding.yaml
    - .maestro/tabs.yaml
    - .maestro/theme-toggle.yaml
decisions:
  - signOut stub not needed — Plan 03 already created real implementation in src/services/auth/signOut.ts
  - JSON import path for starter-templates.json fixed from ../../../ to ../../ (app/(onboarding)/ is 2 levels deep)
  - DashboardEmpty extracted as standalone component per plan files_modified list
  - Practice-set workout time uses TextInput (HH:MM) since @react-native-community/datetimepicker not in package.json
  - Template step defaults to first day pre-selected (continueEnabled from mount) per UX guidance
  - measurements insert is non-blocking (warns on failure, does not halt onboarding)
  - template_exercises insert is non-blocking (warns on failure)
  - Dashboard updated to pass userId to useQuery queryKey for proper cache invalidation
metrics:
  duration: ~35 minutes
  completed: 2026-05-20T03:42:00Z
  tasks_completed: 2
  files_created: 6
  files_modified: 8
---

# Phase 1 Plan 04: Navigation + Onboarding Summary

**One-liner:** 4-step onboarding (profile/split/template/practice-set) with per-step Supabase writes, MMKV-backed progress, animated ProgressBar via reanimated, and Dashboard stub showing user's display name.

## Status: Complete

## What Was Built

### Task 1: OnboardingStepLayout + all 4 onboarding screens

**OnboardingStepLayout** (`src/components/OnboardingStepLayout/index.tsx`):
- SafeAreaView shell with invisible placeholder (step 1) or ChevronLeft back button (steps 2–4)
- ProgressBar animates from 0 to step/4 using ProgressBar component (which uses reanimated + useReducedMotion guard)
- "Step N of 4" caption below progress bar
- ScrollView for content (keyboardShouldPersistTaps="handled")
- KeyboardAvoidingView ("padding" iOS, "height" Android) for sticky CTA
- secondaryCTA support: flex-row ghost (1/3) + primary (2/3) layout for practice-set step

**ProfileStep** (`src/components/ProfileStep/index.tsx`):
- Display name TextInput (required — gates Continue)
- Units Toggle (lbs/kg, haptics via selectionAsync)
- Primary goal 2×2 Chip grid (Strength/Hypertrophy/Fat Loss/General Fitness, Lucide icons)
- Age (number-pad) + Sex (3-chip: Male/Female/Other) in 2-column row
- Height + Weight in 2-column row (labels update with units)
- Body fat % (decimal-pad, optional)
- Exports heightToCm() and weightToKg() conversion utilities

**profile.tsx** (`app/(onboarding)/profile.tsx`):
- Calls signOut() + router.replace('/(auth)') on back (step 1 only)
- Writes profiles.update (display_name, units, primary_goal, age, height_cm, sex)
- Inserts measurements row (weight_kg, body_fat_pct) if either entered (ONBOARD-02)
- Updates MMKV onboarding.step = "1" on success
- Error displayed via HelperText in ProfileStep

**SplitSelector** (`src/components/SplitSelector/index.tsx`):
- 5 split cards (PPL, Upper-Lower, Full Body, Body Part, AF PT Prep)
- 7-cell WeekPreview (Mon–Sun): filled circles = bg-accent-dim, rest = bg-border
- Selected: border-border-strong + bg-bg-elevated + Check icon (accent)
- Haptics.impactAsync(Light) on each tap

**split.tsx** (`app/(onboarding)/split.tsx`):
- Upserts split_settings (split_type, rotation_pointer=0, phase=0, global_rest_seconds=90)
- Writes MMKV onboarding.splitType for template step

**TemplateBuilder** (`src/components/TemplateBuilder/index.tsx`):
- Day cards: day_label + first 3 exercises + "and N more" + exercise count
- Selected: border-border-strong + bg-bg-elevated + Check icon
- Haptics.impactAsync(Light) on tap

**template.tsx** (`app/(onboarding)/template.tsx`):
- Reads MMKV onboarding.splitType, filters starter-templates.json
- Defaults to first day pre-selected
- Looks up exercise IDs from exercises table by name
- Inserts templates row + template_exercises rows
- Stores templateId in MMKV onboarding.selectedTemplateId

**PracticeSetCard** (`src/components/PracticeSetCard/index.tsx`):
- Demo set: Bench Press, 8–10 reps, 185 lbs
- Go/No-go toggle buttons: null → go → no-go → null cycling
- Haptics.impactAsync(Light) on each tap
- Visual only — no real data written

**practice-set.tsx** (`app/(onboarding)/practice-set.tsx`):
- Both "Skip for now" (ghost) and "Try it" (primary) call completeOnboarding()
- Upserts notification_preferences (workout_reminder_time, workout_reminder_enabled: true)
- Updates profiles.onboarded = true
- Calls setOnboardingComplete(true) — writes MMKV + Supabase mirror
- Haptics.notificationAsync(Success) on completion
- router.replace('/(tabs)')

### Task 2: Dashboard stub + Maestro flows

**Dashboard** (`app/(tabs)/index.tsx`):
- TanStack Query fetching profiles.display_name (queryKey: ['profile', userId])
- "Welcome, {displayName}" heading (Noto Serif 700, text-fg — not accent)
- "Today is a rest day." body (Manrope 400, text-fg-muted)
- Empty state card: "No workout scheduled." + "Real workout logging ships in Phase 2."
- No action button (per UI-SPEC: non-functional buttons read as broken)

**Maestro flows:**
- onboarding.yaml: full sign-up → 4 steps → Skip for now → Welcome assertion
- tabs.yaml: all 5 tabs with tap + assertVisible for each (Dashboard/Workouts/Split/Progress/Settings)
- theme-toggle.yaml: Settings → Appearance → Dark mode toggle

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] JSON import path incorrect**
- **Found during:** Task 1 TypeScript check
- **Issue:** `app/(onboarding)/template.tsx` used `../../../supabase/starter-templates.json` (3 levels) but the file is only 2 directory levels deep from the project root
- **Fix:** Changed to `../../supabase/starter-templates.json`
- **Files modified:** `app/(onboarding)/template.tsx`
- **Commit:** 7592d9c

### Non-deviations (expected findings)

- **signOut.ts already existed:** Plan 03 ran in parallel and created the real implementation. The plan's stub creation instruction was skipped — the real implementation was used directly.
- **@react-native-community/datetimepicker not installed:** Per the plan spec, fell back to TextInput (HH:MM format) for workout time input. This is the documented fallback.
- **Template step defaults to first day:** Pre-selects the first day card so continueEnabled=true from mount, reducing friction. The acceptance criteria require "selected card" state works — it does.

## Verification Results

```
npx tsc --noEmit → exit 0 (PASS)
npm run test:unit -- --run → 132 passed | 4 skipped | 4 todo (PASS)
```

All acceptance criteria grep checks passed:
- "Skip for now" in practice-set.tsx ✓
- No "skip" in profile.tsx, split.tsx, template.tsx ✓
- Haptics.impactAsync in SplitSelector ✓
- onboarded: true in practice-set.tsx ✓
- workout_reminder_time in practice-set.tsx ✓
- useReducedMotion in OnboardingStepLayout ✓
- age, height_cm, sex in ProfileStep ✓
- measurements.insert in profile.tsx ✓
- 0.45359237 in ProfileStep ✓
- "Welcome" in index.tsx ✓
- No "Start workout" in index.tsx ✓
- "Real workout logging ships in Phase 2" in index.tsx ✓
- Maestro onboarding.yaml has "Skip for now" ✓
- Maestro tabs.yaml has all 5 tab names ✓
- Maestro theme-toggle.yaml has "Appearance" ✓

## Commits

- `7592d9c` feat(01-04): implement 4-step onboarding flow with Supabase writes
- `0d8545b` feat(01-04): Dashboard stub + complete Maestro E2E flows

## Known Stubs

- **Dashboard "Today is a rest day."** — hardcoded body text. Real rest-day logic (checking split rotation and schedule) ships in Phase 2.
- **TemplateBuilder** — labelled as stub in plan; full template customization ships in Phase 2 (Split tab).
- **Maestro tabs.yaml** — "Workouts", "Split", "Progress", "Settings" screens show placeholder headings; real content ships in Phase 2+.

## Threat Flags

None — no new network endpoints or auth paths introduced beyond what the plan's threat model covers.

## Self-Check: PASSED

Files created verified:
- src/components/OnboardingStepLayout/index.tsx ✓
- src/components/ProfileStep/index.tsx ✓
- src/components/SplitSelector/index.tsx ✓
- src/components/TemplateBuilder/index.tsx ✓
- src/components/PracticeSetCard/index.tsx ✓
- src/components/DashboardEmpty/index.tsx ✓

Commits verified:
- 7592d9c ✓
- 0d8545b ✓
