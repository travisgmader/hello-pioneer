---
phase: 02-core-session-loop
plan: "06"
subsystem: session-screen
tags:
  - zustand
  - flash-list
  - superset
  - workout-11
  - tdd
dependency_graph:
  requires:
    - 02-04 (sessionStore, ExerciseCard, SetRow, FlashList scaffold)
    - 02-05 (ExpandedSetForm, SetRow wired to store)
  provides:
    - src/lib/supersetLogic.ts (supersetRoundComplete, nextSupersetTarget, buildFlashListData, findFlashListIndexForExercise)
    - src/components/SupersetPair/index.tsx (bracket visual + SUPERSET caption)
    - src/stores/sessionStore.ts (flashListRef, supersetCursor, setListRef, scrollToExerciseId, advanceSupersetCursor)
    - app/(session)/index.tsx (FlashListItem data, SupersetPair render branch, handleRestSkip scroll-back)
    - src/components/SetRow/index.tsx (supersetRoundComplete gate before rest timer, scrollToExerciseId on incomplete round)
    - src/components/ExerciseCard/index.tsx (partner resolution, superset* props to SetRow)
  affects:
    - 02-07 (completeSession — superset exercises now have correct set data)
    - 02-08 (exercise swap — SupersetPair passes onSwapA/onSwapB stubs for Plan 08)
tech_stack:
  added: []
  patterns:
    - TDD RED/GREEN cycle for pure superset state machine
    - FlashListItem union type for typed FlashList data array (Pitfall 8 — never raw index)
    - Zustand store holds FlashListRef for scroll without prop drilling
    - supersetRoundComplete gate before rest timer start (deferred firing)
    - Partner exercise resolved at ExerciseCard render time via store getState()
    - buildFlashListData deduplicates pairs so each superset group appears once in FlashList
key_files:
  created:
    - src/lib/supersetLogic.ts
    - src/components/SupersetPair/index.tsx
  modified:
    - src/stores/sessionStore.ts (flashListRef, supersetCursor, setListRef, scrollToExerciseId, advanceSupersetCursor)
    - app/(session)/index.tsx (FlashListItem data, SupersetPair, handleRestSkip)
    - src/components/SetRow/index.tsx (superset props + logic in handleGo/handleNoGo)
    - src/components/ExerciseCard/index.tsx (partner resolution + superset* props to SetRow)
    - tests/unit/supersetLogic.test.ts (3 it.todo → 17 real assertions, all GREEN)
decisions:
  - "FlashListRef stored in Zustand (not passed as prop) to allow SetRow to trigger scroll without prop drilling through ExerciseCard"
  - "Partner exercise resolved via getState() in ExerciseCard/SetRow at tap time — avoids over-subscription and stale closure issues"
  - "Superset rest seconds = max(thisArm, partnerArm) — conventional superset rest is the slower side"
  - "handleRestSkip scrolls back to first arm (A) by finding first exercise in superset group — stored in supersetCursor.groupId"
  - "No-Go tap triggers same superset scroll logic as Go — No-Go is a valid result for round completion"
  - "Orphan superset exercises (no partner in array) render as single to prevent dropped exercises"
metrics:
  duration: "9 min"
  completed: "2026-05-22"
  tasks_completed: 3
  files_changed: 7
---

# Phase 2 Plan 06: Superset Pairing + WORKOUT-11 Summary

**One-liner:** Pure supersetLogic state machine (17 tests GREEN) + SupersetPair visual bracket + deferred rest-timer firing until both arms complete + FlashList auto-scroll between paired exercises via Zustand-stored ref.

## What Was Built

### Task 1: supersetLogic library (TDD RED → GREEN)

`src/lib/supersetLogic.ts`:
- `supersetRoundComplete(setsA, setsB, setNumber)` — returns true only when BOTH arms have a non-null result at that setNumber; defends against mismatched set numbers (T-02-08)
- `nextSupersetTarget(currentArm, currentSetNumber, setsA, setsB, maxSets)` — A→B same set; B→A next set (round complete); B→null (last set done)
- `buildFlashListData(exercises)` — converts raw exercises to FlashListItem[] (single | superset-pair), deduplicating pairs so each group appears exactly once
- `findFlashListIndexForExercise(data, exerciseId)` — resolves exerciseId to FlashList data array index; both A and B resolve to the pair item (RESEARCH.md Pitfall 8); returns -1 for unknown id (T-02-09 guard)

`tests/unit/supersetLogic.test.ts`:
- Converted 3 `it.todo` stubs → 17 real assertions, all GREEN
- Covers: both-arm completion, mismatched set numbers, A→B→A→null state machine, pair deduplication, orphan handling, Pitfall 8 index resolution, unknown-id -1 return

### Task 2: SupersetPair visual component

`src/components/SupersetPair/index.tsx`:
- Two ExerciseCards stacked vertically with a bracket divider between them
- Bracket: 2px accent (#F2CA50) vertical line + "SUPERSET" text (12px, uppercase, letterSpacing 1.5) per UI-SPEC.md
- `activeArm: 'A' | 'B' | null` drives `isActive` on the correct ExerciseCard
- Pure composition — no local state, no hooks; FlashList recycling safe
- All Text uses `allowFontScaling={false}` per Phase 2 policy

### Task 3: SessionScreen + sessionStore + SetRow wiring

**src/stores/sessionStore.ts:**
- Added `flashListRef: FlashListRef<FlashListItem> | null` (Plan 06 scroll target)
- Added `supersetCursor: { groupId, arm, setNumber } | null`
- Added actions: `setListRef(ref)`, `scrollToExerciseId(exerciseId)` (uses Pitfall 8 helper, guards -1), `advanceSupersetCursor(cursor)`

**app/(session)/index.tsx:**
- FlashList data changed from `exercises` (ExerciseState[]) to `buildFlashListData(exercises)` (FlashListItem[])
- `renderItem` branches on `item.type`: 'single' → ExerciseCard; 'superset-pair' → SupersetPair
- `keyExtractor`: `item.exerciseId` for single; `pair-${item.groupId}` for superset-pair
- `listRef` registered in store via `setListRef()` on mount; cleared on unmount
- `handleRestSkip`: after cancel(), checks `supersetCursor` → `scrollToExerciseId(firstArm)` to return to A for next set pair

**src/components/SetRow/index.tsx:**
- New props: `supersetGroup`, `partnerExerciseId`, `supersetFirstArmId`, `partnerDefaultRestSeconds`, `onRestStart`
- `handleGo`: if superset and `supersetRoundComplete === false` → `scrollToExerciseId(partner)`, skip rest timer
- `handleGo`: if superset and round complete → `startTimer(max(thisRest, partnerRest))`; sets supersetCursor for scroll-back
- `handleNoGo`: same superset scroll logic (No-Go is a valid round-completion result)

**src/components/ExerciseCard/index.tsx:**
- Resolves partner exercise via `useSessionStore.getState().exercises` at render
- Determines `supersetFirstArmId` by array position (lower index = A)
- Passes `supersetGroup`, `partnerExerciseId`, `supersetFirstArmId`, `partnerDefaultRestSeconds` to each SetRow

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 RED | 1637a05 | test(02-06): add failing supersetLogic tests |
| 1 GREEN | 7ef5eb5 | feat(02-06): implement supersetLogic library |
| 2 | c1d793e | feat(02-06): add SupersetPair visual component |
| 3 | 36b01eb | feat(02-06): wire SessionScreen + SetRow for superset |

## TDD Gate Compliance

- RED gate: `1637a05` — test commit exists (3 it.todo → 17 real assertions, all failing)
- GREEN gate: `7ef5eb5` — feat commit exists after RED (17/17 passing)
- REFACTOR gate: not needed — implementation matched spec cleanly

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] No-Go tap triggers superset scroll (not just Go)**
- **Found during:** Task 3 (SetRow Go handler implementation)
- **Issue:** Plan spec described the superset scroll logic only for Go tap. But No-Go is also a valid set result per supersetRoundComplete. If user taps No-Go on arm A, arm B still needs to be logged; if user taps No-Go on arm B when arm A already has a result, the round is complete.
- **Fix:** Added the same supersetRoundComplete gate + scrollToExerciseId logic to handleNoGo. Note: No-Go does NOT start the rest timer even when a superset round is complete — this matches existing behavior (rest timer only fires on Go).
- **Files modified:** `src/components/SetRow/index.tsx`
- **Commit:** 36b01eb

**2. [Rule 2 - Missing Critical] ExerciseCard passes superset props to SetRow**
- **Found during:** Task 3 (ExerciseCard was not in plan's modified files list, but is required for SetRow to receive partner info)
- **Issue:** Plan spec said to update SetRow to look up supersetGroup from the store, but ExerciseCard is the component that renders SetRow and needs to resolve the partner at render time.
- **Fix:** Updated ExerciseCard to resolve partner exercise and pass `supersetGroup`, `partnerExerciseId`, `supersetFirstArmId`, `partnerDefaultRestSeconds` as props to SetRow.
- **Files modified:** `src/components/ExerciseCard/index.tsx`
- **Commit:** 36b01eb

## Threat Model Coverage

| ID | Threat | Implementation |
|----|--------|---------------|
| T-02-08 | Tampering: supersetRoundComplete with mismatched setNumber | `find(s => s.setNumber === setNumber)` returns undefined; `Boolean(undefined?.result)` → false |
| T-02-09 | Spoofing: scrollToExerciseId with unknown exerciseId | `findFlashListIndexForExercise` returns -1; `scrollToExerciseId` guards `if (index < 0) return` |

## Known Stubs

- `onSwapA={() => {/* Plan 08 */}}` and `onSwapB={() => {/* Plan 08 */}}` in SupersetPair rendered from SessionScreen — Plan 08 wires exercise swap for both arms
- `handleComplete` stub persists from Plan 04 — Plan 07 wires Anubis flow

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced beyond what was in the plan's threat model.

## Self-Check: PASSED

**Files verified to exist:**
- FOUND: src/lib/supersetLogic.ts
- FOUND: src/components/SupersetPair/index.tsx
- FOUND: src/stores/sessionStore.ts (modified)
- FOUND: app/(session)/index.tsx (modified)
- FOUND: src/components/SetRow/index.tsx (modified)
- FOUND: src/components/ExerciseCard/index.tsx (modified)
- FOUND: tests/unit/supersetLogic.test.ts (17 assertions, 0 it.todo)

**Tests:** 17/17 passing for supersetLogic.test.ts — 0 it.todo remaining (WORKOUT-11 GREEN)
**Full test suite:** 217 passed, 4 skipped, 6 todo (0 failed)

**Commits verified:**
- 1637a05 — Task 1 RED: supersetLogic failing tests
- 7ef5eb5 — Task 1 GREEN: supersetLogic implementation
- c1d793e — Task 2: SupersetPair visual component
- 36b01eb — Task 3: SessionScreen + SetRow superset wiring
