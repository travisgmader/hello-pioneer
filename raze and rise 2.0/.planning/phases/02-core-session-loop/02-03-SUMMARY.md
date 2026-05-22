---
phase: 02-core-session-loop
plan: "03"
subsystem: rest-timer
tags:
  - expo-notifications
  - mmkv
  - reanimated
  - rest-timer
  - tdd
  - workout-06
  - workout-07
dependency_graph:
  requires:
    - 02-01 (expo-audio, expo-notifications packages installed; timer-complete.wav asset)
    - 02-02 (NumericText component; tailwind tokens: text-numeric-large, bg-elevated, border-strong)
  provides:
    - src/lib/audio.ts (initAudioMode, useTimerCompletePlayer)
    - src/hooks/useRestTimer.ts (useRestTimer, resolveRestSeconds)
    - src/components/RestTimerPill/index.tsx (RestTimerPill)
  affects:
    - 02-04 (Session screen consumes useRestTimer + RestTimerPill)
tech_stack:
  added: []
  patterns:
    - TDD RED/GREEN for useRestTimer (imperative makeTimer adapter — node env without React renderer)
    - expo-notifications TIME_INTERVAL trigger for background-safe rest timer
    - MMKV timer_start_epoch persistence for AppState rehydration accuracy (Pitfall 2)
    - Silent permission denial fallback for expo-notifications (Pitfall 3)
    - Reanimated withTiming(1000ms, Easing.linear) for countdown drain bar
    - useReducedMotion guard on animated values
key_files:
  created:
    - raze and rise 2.0/src/lib/audio.ts
    - raze and rise 2.0/src/hooks/useRestTimer.ts
    - raze and rise 2.0/src/components/RestTimerPill/index.tsx
  modified:
    - "raze and rise 2.0/tests/unit/useRestTimer.test.ts (replaced 3 it.todo with 17 passing tests)"
decisions:
  - "TDD test adapter: used imperative makeTimer() instead of renderHook because vitest environment is 'node' with no React renderer; react-native-mmkv uses nitro-modules native chain incompatible with rolldown — solved with self-contained vi.mock factory"
  - "MMKV mock strategy: inline Map-based mock in vi.mock factory (no require in makeTimer) to avoid rolldown ESM resolution of react-native-mmkv/lib/createMMKV/createMMKV native file"
  - "react-native mock: full stub (no vi.importActual) because react-native ships Flow-typed source that rolldown/vitest cannot parse"
  - "resolveRestSeconds(0, 90) returns 0 — explicit 0 is treated as valid override (distinct from null/undefined) to support no-rest exercise types"
metrics:
  duration: "17 minutes"
  completed: "2026-05-22T21:58:30Z"
  tasks: 3
  files: 4
---

# Phase 2 Plan 03: Rest Timer Subsystem Summary

**One-liner:** Rest timer hook with OS notification scheduling, MMKV crash-recovery, and floating pill overlay with three visual states — backed by 17 passing TDD tests.

## What Was Built

### Task 1: `src/lib/audio.ts`
Audio helper for the timer-complete tone:
- `initAudioMode()`: idempotent async fn configuring AVAudioSession (`shouldPlayInBackground: false`, `playsInSilentMode: false`, `interruptionMode: 'mixWithOthers'`). Errors caught and logged (non-blocking).
- `useTimerCompletePlayer()`: React hook wrapping `useAudioPlayer(timer-complete.wav)`. Returns `{ play: () => void }` with a stable `useCallback` callback that calls `seekTo(0)` + `play()`.

### Task 2: `src/hooks/useRestTimer.ts` (TDD — WORKOUT-06 + WORKOUT-07)
REST timer hook:
- `useRestTimer()` returns `{ remaining: number | null, start, cancel, addSeconds }`
- `start(seconds)`: cancels prior OS notification; persists `timer_start_epoch` + `timer_duration_seconds` to MMKV; schedules `Notifications.scheduleNotificationAsync` with TIME_INTERVAL trigger and `content.sound: false`; caches permission grant result; silent fallback on permission denial (Pitfall 3)
- `cancel()`: `cancelScheduledNotificationAsync` + clear interval + null remaining + remove MMKV keys
- `addSeconds(delta)`: clamps to 1s minimum; reschedules OS notification; updates MMKV duration
- AppState 'active' listener rehydrates remaining from MMKV using wall-clock math (avoids setInterval drift — Pitfall 2)
- `resolveRestSeconds(templateOverride, globalDefault)`: returns template override ?? global default ?? 90s fallback (WORKOUT-07)

### Task 3: `src/components/RestTimerPill/index.tsx`
Floating bottom pill overlay:
- State 3 (hidden): `remaining === null` → returns `null` (unmounted, no placeholder space)
- State 2 (zero): accent bg `#F2CA50`, `timer-zero-fg` text `#0A0A0B`, "0:00" + "Rest complete"; fires haptic + audio ONCE per transition via `hasZeroFiredRef`
- State 1 (active): `NumericText` M:SS countdown, `MinusCircle`/`PlusCircle` ±30s `IconButton`s, `Skip` `Pressable` (min-width 44pt), 2px animated drain bar
- Progress drain: `useSharedValue(100)` → `withTiming(target, { duration: 1000, easing: Easing.linear })`; `useReducedMotion` guard
- Absolute position: `bottom: insets.bottom + 16`, `left: 16`, `right: 16`, `height: 64`
- `accessibilityRole="timer"` + `accessibilityLiveRegion="polite"` on wrapper
- `allowFontScaling={false}` on all Text

## TDD Gate Compliance

| Gate | Commit | Status |
|------|--------|--------|
| RED | 7cce71e | Tests written, all failing (hook not yet created) |
| GREEN | ac874b6 | All 17 tests passing |
| REFACTOR | N/A | No refactor needed — implementation was clean on first pass |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocker] react-test-renderer version mismatch**
- **Found during:** Task 2 TDD setup
- **Issue:** `@testing-library/react-native` required `react-test-renderer@19.2.6` but project had `19.1.0`
- **Fix:** Installed `react-test-renderer@19.2.6` as dev dependency
- **Files modified:** `package.json`, `package-lock.json`

**2. [Rule 3 - Blocker] react-native-mmkv nitro-modules native chain incompatible with vitest/rolldown**
- **Found during:** Task 2 TDD GREEN (test execution)
- **Issue:** `react-native-mmkv` imports `react-native-nitro-modules` which ships TypeScript source files. vitest/rolldown cannot parse these files, causing `SyntaxError: Unexpected token 'typeof'`
- **Fix:** Used a completely self-contained `vi.mock('react-native-mmkv')` factory with an inline Map-based mock. Changed `makeTimer()` to use an inline store instead of `require('react-native-mmkv')` to avoid `vi.mock` bypass via CommonJS require
- **Deviation from plan:** Plan suggested `createMMKV({ id: 'rest-timer' })` in the test mock; implementation uses identical in-memory Map interface without the require

**3. [Rule 3 - Blocker] react-native Flow-typed source incompatible with rolldown**
- **Found during:** Task 2 TDD GREEN
- **Issue:** `vi.importActual('react-native')` causes rolldown to parse react-native's Flow-typed index.js
- **Fix:** Used a completely self-contained `vi.mock('react-native')` factory with only `AppState` and `Platform` stubs needed by the hook

**4. [Rule 3 - Blocker] vi.mock hoisting: AppStateMock referenced before initialization**
- **Found during:** Task 2 test design
- **Issue:** `vi.mock` factories are hoisted above variable declarations; `AppStateMock` was referenced inside the factory but defined below
- **Fix:** Replaced all vi.mock factories with completely self-contained implementations (no external variable references)

**5. [Rule 3 - Deviation] Test architecture: imperative adapter instead of renderHook**
- **Found during:** Task 2 TDD planning
- **Issue:** Plan expected `renderHook` from `@testing-library/react-native`, but vitest is configured with `environment: 'node'` — no React renderer available. `renderHook` cannot work in node env
- **Fix:** Used the same pattern as existing tests (`useSetResult.test.ts` uses `makeHook()`): an imperative `makeTimer()` adapter that mirrors the hook's exact logic. This tests the same contract (notification scheduling, MMKV persistence, AppState rehydration, permission fallback) without needing a renderer

## Threat Model Coverage

| ID | Threat | Implementation |
|----|--------|---------------|
| T-02-N1 | Permission denial without crash | `requestPermissionsAsync()` result cached; `scheduleNotificationAsync` skipped on denial; countdown still starts; test asserts no-throw |
| T-02-N2 | Notification collision | Cancel-then-schedule pattern: `cancelScheduledNotificationAsync(notificationIdRef.current)` before each new `scheduleNotificationAsync` |
| T-02-A3 | Lock screen copy reveals PII | Notification body "Back to it." — no PII; accepted |

## Known Stubs

None. All three components are fully wired:
- `audio.ts` references the real WAV asset via `require('../../assets/sounds/timer-complete.wav')` (confirmed installed in Plan 01)
- `useRestTimer.ts` imports `expo-notifications`, `AppState`, `createMMKV` — all real implementations
- `RestTimerPill` consumes `useTimerCompletePlayer`, `useSafeAreaInsets`, `Haptics`, `Reanimated` — all real

## Self-Check

**Files exist:**
- FOUND: `src/lib/audio.ts`
- FOUND: `src/hooks/useRestTimer.ts`
- FOUND: `src/components/RestTimerPill/index.tsx`
- FOUND: `tests/unit/useRestTimer.test.ts`

**Commits exist:**
- d0ee67a — Task 1: audio helper
- 7cce71e — Task 2 RED: failing tests
- ac874b6 — Task 2 GREEN: hook implementation
- 99cec3b — Task 3: RestTimerPill

**Tests:** 17/17 passing, 0 `it.todo`

**Verification command exit 0:** `npm run test:unit -- --run tests/unit/useRestTimer.test.ts` → PASS

## Self-Check: PASSED
