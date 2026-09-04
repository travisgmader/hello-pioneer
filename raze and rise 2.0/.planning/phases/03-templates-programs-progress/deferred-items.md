# Phase 3 — Deferred Items

Out-of-scope discoveries logged during execution. These are NOT caused by Phase 3
changes and were deliberately not fixed (executor scope boundary).

## Pre-existing `npx tsc --noEmit` errors (24, discovered in plan 03-01)

`npx tsc --noEmit` was already failing on `main` before plan 03-01 touched
anything. Confirmed zero of these originate in the files this plan created or
modified (`src/lib/schema.ts`, `src/lib/tokens.ts`, `src/lib/chartStyles.ts`,
`tailwind.config.js`). Because `.github/workflows/test.yml` runs `npx tsc --noEmit`
as a required CI step, PR CI is already red independent of Phase 3.

| File | Error class | Notes |
|------|-------------|-------|
| `app/(tabs)/settings.tsx:29` | TS2693 `'MMKV' only refers to a type` | react-native-mmkv v4 API change |
| `src/hooks/useSessionData.ts` (×5) | TS2339 `Property 'data' does not exist on type 'X[]'` | `usePowerSyncQuery` return type changed — returns the array directly, not `{ data }`. Affects lines 90, 102, 117, 193, 229 (+ TS7006 at 139). |
| `src/components/ExerciseSwapModal/index.tsx` (×3) | TS2339 / TS7006 / TS2322 | same `usePowerSyncQuery` shape issue + `estimatedItemSize` removed in FlashList v2 |
| `src/components/{BodyweightOffsetInput,RestTimerPill,RunExerciseRow,SessionHeader}` (×7) | TS2322 `allowFontScaling` not on `NumericTextProps` | `NumericText` needs to forward `allowFontScaling` |
| `src/components/{SessionNoteSheet,SetRow}` (×2) | TS2322 `style` not on props | wrapper components need `style` passthrough |
| `src/components/ExerciseCard/index.tsx:212` | TS2322 `onExpand` not on `SetRowProps` | |
| `src/components/BodyMap/index.tsx:99` | TS2322 `hitSlop` not on react-native-svg `PathProps` | |
| `tests/unit/sessionPersistence.test.ts` (×2) | TS2739 missing `distanceMeters` / `durationSeconds` on `SetState` | test fixtures lag the Phase 2 run-exercise type |

**Recommended owner:** a dedicated type-hygiene plan, or fold the
`useSessionData` fixes into plan 03-03 (which already has to touch that file for
the `logged_at` → `measured_at` latent bug).

## Latent bugs confirmed but not fixed in 03-01

| Bug | Location | Owner plan |
|-----|----------|------------|
| Query orders `measurements` by `logged_at`; the column is `measured_at` | `src/hooks/useSessionData.ts:184` | 03-03 (`useMeasurements`) |
| Query selects `exercises.primary_muscle`; the column is `muscle_group` | `src/components/ExerciseSwapModal/index.tsx:98` | 03-02 (inline exercise search) |

Both names are recorded correctly in the 03-01 migration and PowerSync mirror,
so downstream plans have a correct schema to code against.
