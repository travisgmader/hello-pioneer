---
phase: 02-core-session-loop
plan: "04"
subsystem: session-screen
tags:
  - zustand
  - mmkv
  - powersync
  - flash-list
  - workout-01
  - workout-02
  - workout-18
  - tdd
dependency_graph:
  requires:
    - 02-01 (expo-keep-awake, @shopify/flash-list installed; test stubs created)
    - 02-02 (useSetResult, SetResultButton, WeightInput, NumericText, LeftEdgeBar, PrevPerformanceLink atoms)
    - 02-03 (useRestTimer, resolveRestSeconds, RestTimerPill, initAudioMode)
  provides:
    - src/hooks/useSessionPersistence.ts (useSessionPersistence, SESSION_KEYS, saveSession, clearSession)
    - src/stores/sessionStore.ts (useSessionStore, ExerciseState, SetState)
    - src/hooks/useSessionData.ts (useTodaysTemplate, usePreviousPerformance)
    - src/services/sessionService.ts (startSession, commitSet)
    - src/components/SessionHeader/index.tsx
    - src/components/AddSetButton/index.tsx
    - src/components/SetRow/index.tsx
    - src/components/ExerciseCard/index.tsx
    - app/(session)/_layout.tsx
    - app/(session)/index.tsx
    - app/(tabs)/workouts.tsx (updated)
  affects:
    - 02-05 (SetRow expanded section — RPE/warmup/notes form wires onto this scaffold)
    - 02-06 (body map screen routes from session screen)
    - 02-07 (completeSession + Anubis overlay replaces handleComplete stub)
    - 02-08 (exercise swap modal + progressive overload hint stubs wired here)
tech_stack:
  added: []
  patterns:
    - Zustand store with spread-based immutable set mutations (no immer dependency)
    - MMKV module-scope singleton (createMMKV) + reactive useMMKVString
    - PowerSync usePowerSyncQuery for local SQLite reads (useTodaysTemplate, usePreviousPerformance)
    - PowerSync execute() for immediate set writes (commitSet, INSERT OR REPLACE)
    - FlashList v2 (no estimatedItemSize, no CellContainer) for exercise card list
    - expo-keep-awake lifecycle: activateKeepAwakeAsync on mount, deactivateKeepAwake on unmount
    - Zustand-keyed row state to survive FlashList recycling (RESEARCH.md Pitfall 1)
key_files:
  created:
    - src/hooks/useSessionPersistence.ts
    - src/stores/sessionStore.ts
    - src/hooks/useSessionData.ts
    - src/services/sessionService.ts
    - src/components/SessionHeader/index.tsx
    - src/components/AddSetButton/index.tsx
    - src/components/SetRow/index.tsx
    - src/components/ExerciseCard/index.tsx
    - app/(session)/_layout.tsx
    - app/(session)/index.tsx
  modified:
    - app/(tabs)/workouts.tsx (replaced placeholder with Start workout button)
    - tests/unit/sessionPersistence.test.ts (3 it.todo → 14 passing tests)
decisions:
  - "useMMKVString(key, instance) API: second arg is the MMKV instance object (not id string) — confirmed from node_modules type definition"
  - "saveSession/clearSession exported as module-level functions (not only hook returns) so sessionService.ts can call them without violating hook rules"
  - "sessions table row NOT written at session start — only session_sets rows written incrementally; sessions row committed atomically at completion (Plan 07)"
  - "ExerciseCard usePreviousPerformance per exercise — PowerSync query in the card; data grouped by set_number for PrevPerformanceLink props"
  - "lastRestSeconds tracked in SessionScreen state for RestTimerPill drain bar — SetRow calls start() but SessionScreen needs the duration for the pill"
  - "handleComplete is a stub (router.replace tabs) — Plan 07 replaces with writeTransaction + Anubis flow"
  - "rotationPointer % allTemplates.length used to select today's template — simple modular rotation matching split semantics"
metrics:
  duration: "15 min"
  completed: "2026-05-22"
  tasks_completed: 4
  files_changed: 12
---

# Phase 2 Plan 04: Active Session Screen Scaffold Summary

**One-liner:** Full-screen session route with FlashList<ExerciseCard>, Zustand-keyed set state, MMKV session persistence, PowerSync read/write service, and rest timer integration — WORKOUT-18 test GREEN with 14 passing assertions.

## What Was Built

### Task 1: Zustand session store + MMKV persistence hook (WORKOUT-18)

`src/hooks/useSessionPersistence.ts`:
- Module-scope `SESSION_MMKV = createMMKV({ id: 'active-session' })` (unencrypted, separate from auth store)
- `SESSION_KEYS = { id: 'active_session_id', startedAt: 'active_session_started_at' }` as const
- `saveSession(id)` — module-level function (callable from service layer): sets both MMKV keys
- `clearSession()` — uses `.remove()` (confirmed from storage.ts line 69 that v4 MMKV API uses `.remove()`)
- `useSessionPersistence()` hook — returns sessionId/startedAt via `useMMKVString(key, SESSION_MMKV)` (reactive)

`src/stores/sessionStore.ts`:
- Zustand 5.x store with ExerciseState + SetState types
- Root state: `exercises[]`, `expandedSetId: string | null`, `focusedSetId: string | null`
- Actions: `loadExercises`, `setSetResult`, `setSetWeight`, `setSetRpe`, `setSetWarmup`, `setSetNotes`, `setExpanded` (collapses any prior expanded set), `setFocused`, `addSet`, `swapExercise` (stub)
- `mutateSets()` helper: scans exercises array to find a set by id and applies the mutator
- `generateUUID()`: uses `crypto.randomUUID()` with Math.random fallback for test environments

`tests/unit/sessionPersistence.test.ts`:
- Converted 3 `it.todo` stubs to 14 real assertions (WORKOUT-18 GREEN)
- MMKV mock: inline Map-based factory with `useMMKVString(key, instance)` that reads from the instance object (matching real API signature)
- Tests cover: saveSession key writes, clearSession via .remove(), sessionId reflection in hook, SESSION_KEYS contract, store actions (loadExercises, setSetResult, setSetWeight, setExpanded collapse behavior)

### Task 2: PowerSync read hooks + write service

`src/hooks/useSessionData.ts`:
- `useTodaysTemplate(userId)`: `split_settings` → `rotation_pointer % templates.length` → `template_exercises LEFT JOIN exercises` ordered by `position`; returns ExerciseState[] with sets initialized (weightKg=null, result=null)
- `usePreviousPerformance(exerciseId, currentSessionId)`: exact query from RESEARCH.md — `session_sets JOIN sessions WHERE completed_at IS NOT NULL ORDER BY completed_at DESC LIMIT 10`

`src/services/sessionService.ts`:
- `startSession(opts)`: `Crypto.randomUUID()` → `saveSession()` (MMKV write) → returns `{ sessionId, startedAt }`. Does NOT write sessions table row (committed atomically at completion in Plan 07).
- `commitSet(opts)`: `INSERT OR REPLACE INTO session_sets` with all 12 columns; no `rowsAffected` check (Pitfall 4); non-blocking try/catch; repsTarget parsed to low end integer

### Task 3: SessionHeader, AddSetButton, SetRow, ExerciseCard organisms

**SessionHeader**: elapsed timer via local useState (safe — outside FlashList); Noto Serif 24/700 day label; NumericText M:SS / H:MM:SS format; 36pt × 88pt Complete button (UI-SPEC.md exception)

**AddSetButton**: ghost Pressable + `Plus` 16px (lucide) + "Add set" label; `Haptics.selectionAsync()` on press; 44pt height

**SetRow**: Zustand-keyed state (result, weightKg, isWarmup, expandedSetId); Go/No-Go handlers with Haptics → setSetResult → commitSet → rest timer start (Go + !isWarmup only); weight validation [0, 999.9] before commitSet (T-02-03); PrevPerformanceLink with handleAutoFill → setSetWeight; ChevronDown/Up expand stub; no local useState for cross-render data

**ExerciseCard**: `bg-bg-elevated rounded-lg p-md border border-border gap-sm` + active variant `bg-accent-dim border-border-strong`; Shuffle IconButton; SetRows as plain View children (no nested FlashList, Pitfall 6); `usePreviousPerformance` per exercise; AddSetButton footer; progressive overload hint placeholder View

### Task 4: Session route + workouts tab entry point

`app/(session)/_layout.tsx`: `Stack screenOptions={{ headerShown: false, gestureEnabled: false, animation: 'fade' }}` — iOS swipe-back disabled per UI-SPEC.md

`app/(session)/index.tsx`:
- Keep-awake + initAudioMode on mount; deactivateKeepAwake on unmount
- MMKV rehydration: if sessionId exists → loadExercises; else startSession() → loadExercises
- No template → router.replace('/(tabs)/workouts') (Plan 08 handles skip-day flow)
- FlashList v2: no estimatedItemSize, FlashListRef<ExerciseState> type
- currentExerciseIndex: first exercise with any set.result === null
- handleComplete stub: router.replace('/(tabs)') — Plan 07 wires Anubis

`app/(tabs)/workouts.tsx`: replaced placeholder with primary Button "Start workout" → `router.push('/(session)/')`

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | a86dfae | feat(02-04): Zustand session store + MMKV persistence hook (WORKOUT-18) |
| 2 | 6a59881 | feat(02-04): PowerSync read hooks + write service for session data |
| 3 | d65f8c4 | feat(02-04): build SessionHeader, AddSetButton, SetRow, ExerciseCard organisms |
| 4 | a313e4b | feat(02-04): build session route + workouts tab entry point |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Deviation] useMMKVString second arg is MMKV instance, not id string**
- **Found during:** Task 1 test writing
- **Issue:** Plan spec said `useMMKVString(SESSION_KEYS.id)` with no second arg. The real API signature is `useMMKVString(key: string, instance?: MMKV)`. The test mock's `useMMKVString` was looking up instances by string id but received the MMKV instance object.
- **Fix:** Updated hook to pass `SESSION_MMKV` instance as second arg to `useMMKVString`; updated test mock to accept MMKV instance object as second arg (reading directly from it)
- **Files modified:** `src/hooks/useSessionPersistence.ts`, `tests/unit/sessionPersistence.test.ts`
- **Commit:** a86dfae

**2. [Rule 2 - Missing Critical] saveSession/clearSession exported as module-level functions**
- **Found during:** Task 2 (`sessionService.ts` cannot call hooks)
- **Issue:** Plan spec only showed `saveSession`/`clearSession` on the hook return. `sessionService.startSession()` is not a hook and cannot call `useSessionPersistence()` to get them.
- **Fix:** Exported `saveSession` and `clearSession` as module-level functions alongside the hook. The hook re-exposes them for component convenience. This is the established pattern (no new behavior — same MMKV writes, just callable outside hooks).
- **Files modified:** `src/hooks/useSessionPersistence.ts`, `src/services/sessionService.ts`
- **Commit:** a86dfae, 6a59881

**3. [Rule 1 - Schema adjustment] template_exercises schema uses 'sets'/'position' not 'set_count'/'display_order'**
- **Found during:** Task 2 (read schema.ts)
- **Issue:** Plan spec and RESEARCH.md referenced `set_count` and `display_order` columns but the actual schema (schema.ts) has `sets` and `position`
- **Fix:** Used the correct column names from schema.ts in `useTodaysTemplate` query
- **Files modified:** `src/hooks/useSessionData.ts`
- **Commit:** 6a59881

**4. [Rule 2 - Missing] lastRestSeconds state in SessionScreen for RestTimerPill drain bar**
- **Found during:** Task 4 (RestTimerPill requires totalSeconds for drain bar calculation)
- **Issue:** Plan spec showed `<RestTimerPill remaining={remaining} totalSeconds={lastStartedRestSeconds} ...>` but didn't show how `lastStartedRestSeconds` is tracked in SessionScreen. SetRow calls `useRestTimer().start()` but SessionScreen needs the duration.
- **Fix:** Added `const [lastRestSeconds, setLastRestSeconds] = useState<number>(90)` to SessionScreen for RestTimerPill's `totalSeconds` prop. SetRow independently calls start() which updates remaining. The `lastRestSeconds` defaults to 90 (the fallback rest duration).
- **Files modified:** `app/(session)/index.tsx`
- **Commit:** a313e4b

## Threat Model Coverage

| ID | Threat | Implementation |
|----|--------|---------------|
| T-02-01 | session_sets cross-user read | commitSet uses sessionId from MMKV (derived from auth session startup); PowerSync RLS chain enforces user_id scope |
| T-02-03 | WeightInput value tampering | SetRow parseFloat + range check [0, 999.9] BEFORE commitSet; invalid values set error=true + blocked from write; reverts on blur |
| T-02-04 | Session UUID generation | Crypto.randomUUID() (expo-crypto) — cryptographically secure; INSERT OR REPLACE means duplicate writes are no-ops |

## Known Stubs

The following are intentional stubs documented for downstream plans:
- `handleComplete` in `app/(session)/index.tsx` — `router.replace('/(tabs)')` stub; Plan 07 replaces with writeTransaction + Anubis overlay
- `onSwap={() => {/* Plan 08 */}}` in ExerciseCard — exercise swap modal wired in Plan 08
- `swapExercise` action in sessionStore — exported but no UI; Plan 08 connects it
- Expanded section `{isExpanded && <View />}` in SetRow — Plan 05 fills with RPE/warmup/notes form
- Progressive overload hint `<View />` in ExerciseCard — Plan 08 fills with ProgressiveOverloadHint

These stubs do NOT prevent the plan's goal from being achieved — the core session logging flow is fully functional.

## Self-Check: PASSED

**Files verified to exist:**
- FOUND: src/hooks/useSessionPersistence.ts
- FOUND: src/stores/sessionStore.ts
- FOUND: src/hooks/useSessionData.ts
- FOUND: src/services/sessionService.ts
- FOUND: src/components/SessionHeader/index.tsx
- FOUND: src/components/AddSetButton/index.tsx
- FOUND: src/components/SetRow/index.tsx
- FOUND: src/components/ExerciseCard/index.tsx
- FOUND: app/(session)/_layout.tsx
- FOUND: app/(session)/index.tsx

**Tests:** 14/14 passing for sessionPersistence.test.ts — 0 it.todo remaining (WORKOUT-18 GREEN)
**Overall test suite:** 189 passed, 4 skipped, 12 todo (0 failed)

**Commits verified in git log:**
- a86dfae — Task 1: Zustand store + MMKV persistence
- 6a59881 — Task 2: PowerSync read hooks + write service
- d65f8c4 — Task 3: SessionHeader, AddSetButton, SetRow, ExerciseCard
- a313e4b — Task 4: Session route + workouts tab entry point
