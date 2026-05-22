---
phase: 02-core-session-loop
plan: "07"
subsystem: session-completion
tags:
  - powersync
  - writeTransaction
  - lottie
  - reanimated
  - mmkv
  - workout-17
  - design-03
  - tdd
dependency_graph:
  requires:
    - 02-04 (sessionService startSession + commitSet; useSessionPersistence SESSION_KEYS + clearSession)
    - 02-05 (SetRow expanded form; no direct dependency but same session screen)
    - 02-06 (SupersetPair; session screen scaffold)
  provides:
    - src/services/sessionService.ts (completeSession — atomic writeTransaction)
    - src/components/AnubisOverlay/index.tsx (full-screen Lottie completion overlay)
    - app/(session)/index.tsx (handleComplete wired; Android BackHandler; AnubisOverlay rendered)
  affects:
    - 02-08 (exercise swap + progressive overload — builds on same session screen)
tech_stack:
  added: []
  patterns:
    - PowerSync writeTransaction for atomic multi-table commit (sessions + split_settings)
    - Reanimated withTiming fade-in/fade-out (anubis-fade 600ms) for overlay lifecycle
    - useReducedMotion guard on LottieView (static frame hold + immediate transition)
    - runOnJS(callback) to bridge Reanimated worklet → JS navigation call
    - BackHandler.addEventListener for Android hardware back → Alert.alert confirmation
    - MMKV .remove() cleanup AFTER successful writeTransaction (crash-safe ordering)
key_files:
  created:
    - src/components/AnubisOverlay/index.tsx
  modified:
    - src/services/sessionService.ts (added CompleteSessionArgs, completeSession)
    - app/(session)/index.tsx (handleComplete, BackHandler, AnubisOverlay)
    - tests/unit/sessionService.test.ts (12 real tests, 0 it.todo — WORKOUT-17 GREEN)
decisions:
  - "MMKV cleanup runs AFTER writeTransaction resolves — not before. If writeTransaction throws, MMKV keys are preserved so session can be recovered on next app open"
  - "completeSession failure does NOT block navigation — Anubis plays through regardless (UI-SPEC.md Lottie fail fallback applies to write failures too)"
  - "handleLottieDone uses completedRef to prevent double-fire from both onAnimationFinish and reduced-motion setTimeout paths"
  - "BackHandler useEffect dependency includes handleComplete to avoid stale closure — subscription is re-registered on each render but immediately cleaned up via subscription.remove()"
  - "MMKV createMMKV({ id: 'active-session' }) in completeSession reuses the same instance as useSessionPersistence (MMKV instances are singletons by id within the process)"
metrics:
  duration: "10 min"
  completed: "2026-05-22"
  tasks_completed: 3
  files_changed: 4
---

# Phase 2 Plan 07: Session Completion — Anubis + Atomic Commit Summary

**One-liner:** Atomic PowerSync writeTransaction commits sessions + rotation_pointer during Lottie playback; AnubisOverlay fades in 600ms with reduce-motion fallback; Android hardware back shows UI-SPEC.md confirmation alert — WORKOUT-17 unit tests GREEN (12 passing, 0 todo).

## What Was Built

### Task 1: completeSession writeTransaction (WORKOUT-17) — TDD RED→GREEN

`tests/unit/sessionService.test.ts` (converted from 3 `it.todo` stubs to 12 real tests):
- Asserts `writeTransaction` called exactly once
- Asserts exactly 2 `tx.execute` calls inside the callback in order: (1) INSERT OR REPLACE sessions, (2) UPDATE split_settings rotation_pointer
- Asserts correct parameter bindings for each execute call
- Asserts `INSERT OR REPLACE` (not plain `INSERT`) for idempotency
- Asserts no `rowsAffected` check (PowerSync Pitfall 4)
- Asserts MMKV `.remove('active_session_id')` + `.remove('active_session_started_at')` after success
- Asserts MMKV cleanup NOT called when `writeTransaction` throws
- Asserts error propagation to caller

`src/services/sessionService.ts` (extended):
- `CompleteSessionArgs` interface: sessionId, userId, templateId, dayLabel, startedAt, sessionNotes
- `completeSession(args)`: atomic `writeTransaction` with two `tx.execute` calls
  - INSERT OR REPLACE sessions with `is_deleted = 0` (idempotent by UUID — DATA-02)
  - UPDATE split_settings `rotation_pointer = rotation_pointer + 1 WHERE user_id = ?`
  - Does NOT check `rowsAffected` (RESEARCH.md Pitfall 4)
  - MMKV cleanup via `.remove()` (v4 API) only on success
  - Errors propagate to caller (MMKV not cleared on failure — crash-safe)

### Task 2: AnubisOverlay component (DESIGN-03)

`src/components/AnubisOverlay/index.tsx`:
- Props: `{ visible: boolean; onFadeOutComplete: () => void }`
- `useSharedValue(0)` + `withTiming(1/0, { duration: 600 })` for 600ms fade-in/fade-out
- `LottieView source={require('../../../assets/animations/anubis.json')}` — local asset, no URL
- `autoPlay={!reducedMotion}` — gated by `useReducedMotion()`
- `loop={false}` — plays once
- `onAnimationFinish={handleLottieDone}` — triggers fade-out → `runOnJS(onFadeOutComplete)()`
- Reduce motion path: `opacity.value = 1` (snap), `setTimeout(handleLottieDone, 600)`
- `completedRef` prevents double-fire from both paths
- `accessibilityRole="image"` + `accessibilityLabel="Workout complete"` (VoiceOver)
- `pointerEvents="auto"` — blocks taps during playback (not dismissible)
- Background `#0A0A0B` (bg token hex, Phase 2 Animated.View inline style exception)
- Returns `null` when `!visible` — no phantom layout

### Task 3: Wire Complete Workout + Android hardware back

`app/(session)/index.tsx`:
- Added imports: `Alert`, `BackHandler`, `Haptics`, `completeSession`, `AnubisOverlay`
- `[anubisVisible, setAnubisVisible] = useState(false)` — tracks overlay visibility
- `handleComplete()` async sequence:
  1. `Haptics.notificationAsync(NotificationFeedbackType.Success)` — fires before async work
  2. `setAnubisVisible(true)` — overlay fade-in starts synchronously
  3. `cancel().catch(() => {})` — rest timer cancelled (fire-and-forget)
  4. `await completeSession({ sessionId, userId, templateId, dayLabel, startedAt, sessionNotes: null })`
  5. On error: `console.warn` + continue (navigation still fires via `onFadeOutComplete`)
- `<AnubisOverlay visible={anubisVisible} onFadeOutComplete={() => { router.replace('/(tabs)/') }} />`
- `BackHandler.addEventListener` in `useEffect`:
  - `Alert.alert('End workout?', 'Your logged sets will be saved.', [...])`
  - Cancel action: `{ text: 'Keep going', style: 'cancel' }`
  - Confirm action: `{ text: 'End workout', style: 'destructive', onPress: () => void handleComplete() }`
  - Returns `true` to consume event (T-02-11 — suppress default OS back)
  - Cleanup: `subscription.remove()` in useEffect return

`src/components/SessionHeader/index.tsx`: Already wired to `onComplete` prop in Plan 04. No changes needed.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 (RED) | b96db70 | test(02-07): add failing tests for completeSession writeTransaction (RED) |
| 1 (GREEN) | 66d0a76 | feat(02-07): implement completeSession writeTransaction (WORKOUT-17 GREEN) |
| 2 | 125c0a7 | feat(02-07): build AnubisOverlay component with Lottie + Reanimated fade (DESIGN-03) |
| 3 | b92c094 | feat(02-07): wire Complete Workout button + Anubis flow + Android hardware back |

## Deviations from Plan

None — plan executed exactly as written.

The one potential deviation considered: Plan spec action for Task 1 showed `createMMKV({ id: 'active-session' })` inline inside `completeSession`. An alternative would be to call the module-level `clearSession()` from `useSessionPersistence`. The inline approach was chosen to match the plan exactly, and it uses the same MMKV instance (MMKV instances are singletons by id).

## TDD Gate Compliance

- RED gate: commit b96db70 — 12 tests written, all failing (`completeSession is not a function`)
- GREEN gate: commit 66d0a76 — 12 tests passing, 0 failing
- REFACTOR: no refactor needed (implementation was clean as written)

## Manual Gate: DEFERRED (DESIGN-03)

**Task 4** (`type="checkpoint:human-verify"`, `gate="blocking"`) is a manual device QA gate that cannot be automated in the vitest/node environment. Lottie has no runtime in the test environment; the full animation sequence requires a physical device.

**Status: DEFERRED — awaiting device verification**

**Steps to verify on a physical device:**

1. Build an EAS preview: `eas build -p ios --profile preview` (or `-p android`)
2. **Anubis animation (DESIGN-03):**
   - Start a workout → log at least one set → tap "Complete" in the header
   - VERIFY: Anubis animation plays once, full-screen, no loop
   - VERIFY: After animation, app navigates to Dashboard
   - VERIFY: Dashboard reflects next day's workout (rotation pointer advanced)
3. **Rest timer background notification (WORKOUT-06):**
   - Start workout → tap Go (rest timer starts) → background the app
   - Wait for timer to reach zero
   - VERIFY: "Rest complete / Back to it." notification appears
4. **Android hardware back:**
   - Press hardware back → VERIFY: Alert appears ("End workout?" / "Keep going" / "End workout")
   - "Keep going" → stay on session; "End workout" → Anubis plays, navigate to Dashboard
5. **Reduce motion:**
   - iOS Settings → Accessibility → Motion → Reduce Motion ON
   - Complete a workout → VERIFY: no Lottie animation, static frame held, then Dashboard

## Threat Model Coverage

| ID | Threat | Implementation |
|----|--------|----------------|
| T-02-01 | session_sets cross-user read | completeSession passes userId from authenticated useSession(); PowerSync RLS enforced on sync |
| T-02-02 | anubis.json expressions field | Plan 01 Task 4 grep gate ran — no expressions field found. Not re-verified in Plan 07 (carries from Plan 01) |
| T-02-10 | Tampering: rotation pointer skipped | writeTransaction atomicity; test asserts both execute calls happen inside callback |
| T-02-11 | DoS: Android back-button bypass | BackHandler returns true (event consumed); Alert.alert is the only escape path |

## Self-Check: PASSED

**Files verified to exist:**
- FOUND: src/components/AnubisOverlay/index.tsx
- FOUND: src/services/sessionService.ts (exports completeSession)
- FOUND: app/(session)/index.tsx (has AnubisOverlay, completeSession, BackHandler)
- FOUND: tests/unit/sessionService.test.ts (12 passing tests, 0 it.todo)

**Tests:** 12/12 passing for sessionService.test.ts — 0 it.todo remaining (WORKOUT-17 GREEN)
**Overall test suite:** 229 passed, 4 skipped, 3 todo (0 failed)

**Commits verified in git log:**
- b96db70 — Task 1 RED: sessionService tests
- 66d0a76 — Task 1 GREEN: completeSession implementation
- 125c0a7 — Task 2: AnubisOverlay component
- b92c094 — Task 3: Session screen wiring
