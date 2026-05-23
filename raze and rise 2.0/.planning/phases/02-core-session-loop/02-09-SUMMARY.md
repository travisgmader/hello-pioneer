---
phase: 02-core-session-loop
plan: "09"
subsystem: exercise-type-variants
tags:
  - body-map
  - react-native-svg
  - zustand
  - powersync
  - healthkit
  - workout-10
  - workout-12
  - workout-13
  - design-02
dependency_graph:
  requires:
    - 02-04 (sessionStore, ExerciseCard scaffold, useSessionData, sessionService)
    - 02-08 (SessionNoteSheet pattern, SessionHeader note button, sessionStore Plan 08 extensions)
  provides:
    - src/components/BodyMap/index.tsx (anatomy SVG + selection state + chips list)
    - src/components/BodyMap/anatomy.tsx (path data for front/back anatomy)
    - src/components/BodyweightOffsetInput/index.tsx (bodyweight + offset stepper)
    - src/components/RunExerciseRow/index.tsx (distance/time row + Apple Health pull)
    - src/lib/healthkit.ts (readLastRunDistance stub — Phase 5 TODO)
    - app/(session)/body-map.tsx (pre/mid session body map route)
  affects:
    - src/stores/sessionStore.ts (soreMuscles, distanceMeters/durationSeconds)
    - src/components/SetRow/index.tsx (exerciseType polymorphism)
    - src/components/ExerciseCard/index.tsx (userId + useLatestBodyweight)
    - src/components/SupersetPair/index.tsx (userId pass-through)
    - src/components/SessionHeader/index.tsx (Activity IconButton for mid-session body map)
    - app/(session)/_layout.tsx (body-map Stack.Screen)
    - app/(tabs)/workouts.tsx (Start workout → body-map first)
    - app/(tabs)/settings.tsx (Workout section + GPS toggle)
tech_stack:
  added: []
  patterns:
    - react-native-svg Path + onPress for tappable anatomy muscle regions
    - exerciseType polymorphism in SetRow (standard | bodyweight | run)
    - MMKV key-value persistence for Settings toggle (settings.useDeviceGpsForRun)
    - Sessions.notes JSON shape extended: { text, soreMuscles } for WORKOUT-10
    - HealthKit stub pattern — Phase 2 null return, Phase 5 real implementation
key_files:
  created:
    - src/components/BodyMap/anatomy.tsx
    - src/components/BodyMap/index.tsx
    - src/components/BodyweightOffsetInput/index.tsx
    - src/components/RunExerciseRow/index.tsx
    - src/lib/healthkit.ts
    - app/(session)/body-map.tsx
  modified:
    - src/stores/sessionStore.ts (soreMuscles[], toggleMuscle, setSoreMuscles, distanceMeters, durationSeconds, setSetDistance, setSetDuration)
    - src/hooks/useSessionData.ts (useLatestBodyweight + distanceMeters/durationSeconds in set initialization)
    - src/components/SetRow/index.tsx (exerciseType + bodyweightKg props; BodyweightOffsetInput + RunExerciseRow branches)
    - src/components/ExerciseCard/index.tsx (userId prop + useLatestBodyweight)
    - src/components/SupersetPair/index.tsx (userId prop pass-through)
    - src/components/SessionHeader/index.tsx (Activity IconButton + onOpenBodyMap prop)
    - app/(session)/_layout.tsx (body-map Stack.Screen)
    - app/(tabs)/workouts.tsx (Start workout routes to body-map first)
    - app/(tabs)/settings.tsx (Workout section + useDeviceGpsForRun Switch + MMKV)
    - app/(session)/index.tsx (soreMuscles serialized in sessions.notes, onOpenBodyMap handler, userId to ExerciseCard/SupersetPair)
decisions:
  - "BodyMap uses custom react-native-svg paths (not react-native-body-highlighter) per Pitfall 7 — New Architecture compatibility ensured"
  - "soreMuscles serialized into sessions.notes JSON as { text: string, soreMuscles: string[] } — no Phase 2 schema migration needed"
  - "HealthKit readLastRunDistance() is a null stub in Phase 2; Phase 5 (WEARABLE-01) wires real HealthKit read"
  - "SetRow exerciseType polymorphism: standard→WeightInput, bodyweight→BodyweightOffsetInput, run→RunExerciseRow — caller (ExerciseCard) passes exerciseType from ExerciseState"
  - "useLatestBodyweight added to ExerciseCard (not SetRow) to avoid per-set PowerSync query duplication"
  - "T-02-16 mitigated: BodyweightOffsetInput clamps offset to [-bodyweightKg, 999] preventing total < 0"
  - "Run distance/duration persisted via notes JSON path (no Phase 2 schema migration): { run: { distanceMeters, durationSeconds } }"
  - "Settings GPS toggle stored in separate MMKV instance (id: 'settings') — isolated from active-session MMKV instance"
metrics:
  duration: "21 min"
  completed: "2026-05-22"
  tasks_completed: 3
  files_changed: 16
---

# Phase 2 Plan 09: BodyMap + Bodyweight + Run Exercise Types Summary

**One-liner:** Custom react-native-svg BodyMap with front/back toggle + sore-muscle chips; BodyweightOffsetInput stepper pulling from measurements table; RunExerciseRow with HealthKit null stub; Settings GPS toggle — SetRow polymorphism routes all three exercise types from a single exerciseType prop.

## Performance

- **Duration:** ~21 min
- **Completed:** 2026-05-22
- **Tasks:** 3 automatable (Task 4 = manual device verification — deferred)
- **Files modified:** 16

## What Was Built

### Task 1: BodyMap component + pre-session route (WORKOUT-10)

**`src/components/BodyMap/anatomy.tsx`:**
- `MUSCLE_GROUPS` — 10 front + 8 back muscle regions (viewBox 0 0 200 400)
- Front: chest, left/right shoulder, left/right bicep, abs, left/right quad, left/right calf
- Back: traps, left/right lat, lower back, left/right glute, left/right hamstring
- Simplified SVG path data (stylized silhouette — anatomically approximated, not traced)
- Exports: `MUSCLE_GROUPS`, `FrontAnatomy`, `BackAnatomy`

**`src/components/BodyMap/index.tsx`:**
- Props: `{ selected: string[]; onToggle: (muscleId: string) => void }`
- Front/Back toggle (reuses Phase 2 Toggle component)
- react-native-svg Svg + Path per muscle; onPress via react-native-svg's native onPress prop
- Selected: fill #F2CA50 (accent-dim), stroke #D4AF37 (border-strong), strokeWidth 2
- Chips row (horizontal ScrollView) for selected muscles — tap chip to deselect
- Haptics.impactAsync(Light) on each muscle tap

**`app/(session)/body-map.tsx`:**
- mode param: `pre` (default) → "Start workout" CTA; `mid` → "Save and resume" + router.back()
- Heading: "Flag sore muscles" | Body: "Optional — helps you train smart today."
- Reads soreMuscles + toggleMuscle from sessionStore

**`app/(session)/_layout.tsx`:**
- Added `<Stack.Screen name="body-map" options={{ animation: 'slide_from_bottom' }} />`

**`app/(tabs)/workouts.tsx`:**
- Start workout → `/(session)/body-map` (body-map first, body-map CTA navigates to `/(session)/`)

**`src/components/SessionHeader/index.tsx`:**
- Added Activity IconButton + `onOpenBodyMap` prop
- Mid-session body-map: routes to `/(session)/body-map?mode=mid`

**`src/stores/sessionStore.ts` extensions:**
- `soreMuscles: string[]` — array of muscle IDs flagged as sore
- `toggleMuscle(muscleId)` — adds/removes from soreMuscles
- `setSoreMuscles(ids)` — full replacement

**`app/(session)/index.tsx`:**
- soreMuscles serialized into sessions.notes as `JSON.stringify({ text: sessionNotes, soreMuscles })`
- onOpenBodyMap handler routes to body-map with mode=mid

### Task 2: Bodyweight exercise type — BodyweightOffsetInput (WORKOUT-12)

**`src/components/BodyweightOffsetInput/index.tsx`:**
- Props: `{ bodyweightKg, offsetKg, onOffsetChange }`
- Layout: [bodyweight kg] ± [MinusCircle] [offset kg] [PlusCircle] = [total kg]
- T-02-16: offset clamped to `[-bodyweightKg, 999]` — total cannot go below 0
- Haptics.selectionAsync() on each ± tap; all Text allowFontScaling={false}

**`src/hooks/useSessionData.ts`:**
- `useLatestBodyweight(userId)` — PowerSync query: `SELECT weight_kg FROM measurements WHERE user_id = ? ORDER BY logged_at DESC LIMIT 1`

**`src/stores/sessionStore.ts` extensions:**
- `distanceMeters: number | null` + `durationSeconds: number | null` added to SetState
- `setSetDistance(setId, meters)` + `setSetDuration(setId, seconds)` actions

**`src/components/SetRow/index.tsx`:**
- `exerciseType?: 'standard' | 'bodyweight' | 'run'` + `bodyweightKg?: number | null` props
- Branches: standard → WeightInput (unchanged), bodyweight → BodyweightOffsetInput, run → RunExerciseRow
- PrevPerformanceLink hidden for bodyweight/run (only for standard)

**`src/components/ExerciseCard/index.tsx`:**
- `userId` prop added; `useLatestBodyweight(userId)` called once per card
- Passes `exerciseType` + `bodyweightKg` to SetRow

**`src/components/SupersetPair/index.tsx`:**
- `userId` prop added; passed through to ExerciseCard A + B

### Task 3: Run exercise type + HealthKit pull + Settings toggle (WORKOUT-13)

**`src/lib/healthkit.ts`:**
- `readLastRunDistance(): Promise<RunSample | null>`
- Phase 2 stub: returns null on Android (Platform.OS !== 'ios') and null on iOS
- Phase 5 (WEARABLE-01) will replace with react-native-health query
- T-02-17: null return is documented and caller treats as silent no-op

**`src/components/RunExerciseRow/index.tsx`:**
- Props: `{ setId, distanceMeters, durationSeconds, onPullFromHealth }`
- No data: "Tap to pull from Apple Health" inline CTA with Activity icon
- With data: distance km (2 decimal) + duration M:SS + compact Pull button
- All Text allowFontScaling={false}

**SetRow `exerciseType === 'run'` branch:**
- Renders RunExerciseRow; onPullFromHealth calls readLastRunDistance()
- On success: setSetDistance + setSetDuration + commitSet with run notes JSON
- On null (Phase 2 stub): silent no-op per UI-SPEC.md error pattern

**`app/(tabs)/settings.tsx`:**
- New "Workout" section before Two-factor Authentication
- "Use device GPS for runs" Switch — bound to MMKV key `settings.useDeviceGpsForRun` (default false)
- Caption: "Apple Health is the default source. Device GPS fallback coming in a future update."
- Uses separate `new MMKV({ id: 'settings' })` instance

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 63f860f | feat(02-09): BodyMap component + pre-session route + soreMuscles store (WORKOUT-10) |
| 2 | c699e1e | feat(02-09): BodyweightOffsetInput + SetRow exerciseType polymorphism (WORKOUT-12) |
| 3 | 3b1b6db | feat(02-09): RunExerciseRow + HealthKit stub + Settings GPS toggle (WORKOUT-13) |

## Manual Verification Gates — DEFERRED

Task 4 is a `checkpoint:human-verify` that requires physical device testing. The following items cannot be verified in the Node/Vitest environment:

| Gate | Verification needed | Status |
|------|--------------------|----|
| BodyMap muscle highlight | Tap SVG Path → fill changes to #F2CA50 | DEFERRED — requires iOS device |
| Front/Back toggle | SVG swaps between FrontAnatomy/BackAnatomy | DEFERRED — requires device |
| Chip deselect | Tap chip → muscle deselects on SVG | DEFERRED — requires device |
| Mid-session body map | SessionHeader Activity button → body-map opens | DEFERRED — requires device |
| Bodyweight exercise row | exerciseType='bodyweight' SetRow → BodyweightOffsetInput renders | DEFERRED — requires seeded template |
| ± stepper updates total | Tap ± → total updates correctly | DEFERRED — requires device |
| Run exercise row | exerciseType='run' SetRow → RunExerciseRow renders | DEFERRED — requires seeded template |
| Apple Health pull | onPullFromHealth → null no-op on Phase 2 iOS | DEFERRED — requires iOS simulator/device |
| Settings GPS toggle | Toggle persists across app restart via MMKV | DEFERRED — requires device restart |

## Deviations from Plan

**1. [Rule 2 - Missing functionality] Passed userId through SupersetPair → ExerciseCard**
- **Found during:** Task 2 implementation
- **Issue:** ExerciseCard needed userId to call useLatestBodyweight, but SupersetPair (which renders two ExerciseCards) didn't have userId in its props
- **Fix:** Added userId prop to SupersetPair and passed it through to both ExerciseCard A and B
- **Files modified:** src/components/SupersetPair/index.tsx
- **Commit:** c699e1e

**2. [Rule 2 - Missing functionality] Added distanceMeters/durationSeconds to set initialization**
- **Found during:** Task 2/3 implementation
- **Issue:** SetState had no distanceMeters/durationSeconds fields; addSet() would create sets without these fields which TypeScript would flag
- **Fix:** Added both fields (null initial value) to SetState interface, addSet() initializer, and useSessionData.ts exercise initialization
- **Files modified:** src/stores/sessionStore.ts, src/hooks/useSessionData.ts
- **Commit:** c699e1e

**3. [Rule 1 - Bug] Removed accidentally-added duplicate router import**
- **Found during:** Task 1 implementation (editing session/index.tsx)
- **Issue:** Added a duplicate `import { router } from 'expo-router'` when editing; router was already imported at line 52
- **Fix:** Removed the duplicate import
- **Files modified:** app/(session)/index.tsx
- **Commit:** c699e1e

## Threat Model Coverage

| ID | Threat | Implementation |
|----|--------|---------------|
| T-02-15 | Info Disclosure: sore-muscle IDs in sessions.notes | Accepted — muscle IDs are non-PII enum strings; sessions.notes is user-owned |
| T-02-16 | Tampering: bodyweight offset underflow | Mitigated — BodyweightOffsetInput clamps offset to [-bodyweightKg, 999]; total cannot go below 0 |
| T-02-17 | Spoofing: HealthKit read on non-iOS returns null | Accepted — Platform.OS check is explicit; null return is documented and callers treat as no-op |
| T-02-18 | Elevation of Privilege: react-native-body-highlighter | Mitigated — Plan 09 uses custom react-native-svg approach per Pitfall 7; no third-party body-highlighter dependency added |

## Known Stubs

**HealthKit (src/lib/healthkit.ts):**
- `readLastRunDistance()` returns null on all platforms in Phase 2
- Intentional: Phase 5 (WEARABLE-01) will implement the real HealthKit read
- The stub enables the RunExerciseRow UI and onPullFromHealth handler to exist and be tested structurally; actual data reading deferred
- MMKV `settings.useDeviceGpsForRun` persists user preference for Phase 5 to consume

This stub does NOT prevent the plan's goal from being achieved: WORKOUT-13 requires "Settings toggle + Apple Health pull stub + RunExerciseRow" — all three are present. The "full GPS implementation" is explicitly deferred per CONTEXT.md.

## Threat Flags

None — no new network endpoints, new auth paths, or schema changes beyond the plan's threat model.

## Self-Check: PASSED

**Files verified to exist:**
- FOUND: src/components/BodyMap/index.tsx
- FOUND: src/components/BodyMap/anatomy.tsx
- FOUND: app/(session)/body-map.tsx
- FOUND: src/components/BodyweightOffsetInput/index.tsx
- FOUND: src/components/RunExerciseRow/index.tsx
- FOUND: src/lib/healthkit.ts

**Commits verified in git log:**
- FOUND: 63f860f — Task 1: BodyMap + pre-session route + soreMuscles
- FOUND: c699e1e — Task 2: BodyweightOffsetInput + SetRow polymorphism
- FOUND: 3b1b6db — Task 3: RunExerciseRow + HealthKit + Settings

**Test suite:** 238 passed, 4 skipped (0 failed) — baseline unchanged from Plan 08
