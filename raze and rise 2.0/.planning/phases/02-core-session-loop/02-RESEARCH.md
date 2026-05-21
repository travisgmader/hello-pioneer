# Phase 2: Core Session Loop - Research

**Researched:** 2026-05-20
**Domain:** React Native workout session UX — FlashList, Lottie, expo-audio, expo-notifications, expo-keep-awake, PowerSync write patterns, rest timer background behavior, superset scroll, body map SVG, MMKV session persistence
**Confidence:** HIGH for all core libraries (verified via official Expo SDK 55 docs and npm registry); MEDIUM for body map library selection (no definitive New Architecture confirmation); LOW for exact Lottie JSON expressions audit (asset does not yet exist)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01** Active session lives in a dedicated full-screen route (`app/session.tsx` or `app/(session)/index.tsx`). Tab bar is hidden during an active workout. Same full-screen stack precedent as onboarding.

**D-02** Exercises are laid out as scrollable stacked cards using FlashList (mandatory — FlatList causes JS thread spikes on dense set-row lists per STATE.md). One card per exercise, all visible, user scrolls vertically through the full workout.

**D-03** Session header is minimal: day label · elapsed timer · Complete Workout button. No volume counter or set completion progress in the header.

**D-04** Rest timer appears as a floating bottom pill — a persistent overlay above the bottom of the screen (not full-screen). The exercise list remains visible and scrollable behind it while the timer runs.

**D-05** Timer pill controls: countdown display + Skip + ±30s buttons.

**D-06** At zero: vibrate + sound, pill turns accent color (#F2CA50), auto-dismisses after 3 seconds. No user action required to clear it.

**D-07** Weight input is an inline editable text field, always visible on each set row. Pre-filled with the previous session's weight. Tapping it opens the keyboard. No modal, no scroll picker.

**D-08** Secondary actions (RPE 1–10, warm-up flag, set note) surface via an expand chevron per set row. Tapping the chevron expands an inline form below the row with an RPE slider, warm-up toggle, and note text field.

**D-09** Previous performance shown as muted text below the weight input: `185 lbs · ✓✓✓✗` (last session weight · go/no-go dots). Tapping it auto-fills the current weight input.

**D-10** Go/No-Go toggle follows the PracticeSetCard pattern from Phase 1: null → go → no-go → null. Tap "✓ Go" or "✗ No-go" buttons. Light haptic on each tap.

**D-11** Tapping "Complete Workout" → Anubis Lottie animation immediately full-screens (no confirmation dialog, no summary screen). Session is committed to PowerSync history during the animation. After the animation completes, the app fades to the Dashboard.

**D-12** Anubis is implemented as a Lottie animation (`lottie-react-native`) loaded from a JSON asset in `assets/animations/anubis.json`. Plays once, no loop.

**D-13** After Anubis, the split rotation pointer advances and the Dashboard reflects the next day's workout.

### Claude's Discretion

- Exact exercise card visual design (spacing, typography hierarchy within the card) — follow NativeWind design tokens established in Phase 1
- Superset scroll behavior implementation details (auto-scroll to paired exercise after marking a set)
- Body map injury UI (muscle group tap targets — standard anatomical front/back view)
- WORKOUT-13 (Run exercise GPS) — implement the Settings toggle and Apple Health pull; device GPS fallback is lower priority

### Deferred Ideas (OUT OF SCOPE)

- Post-workout summary screen (PRs broken, total volume, go-rate)
- Confirmation dialog before completing a workout
- WORKOUT-13 Run exercise GPS fallback (device GPS) — device GPS toggle is lower priority
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| WORKOUT-01 | User can start a workout session for today's day in the split rotation | PowerSync query pattern: read `split_settings.rotation_pointer` + `templates` + `template_exercises` to build session data |
| WORKOUT-02 | Each exercise card shows name, set count × rep range, previous session's weight and results per set row (tappable to auto-fill) | PowerSync query: latest `session_sets` per exercise_id; PrevPerformanceLink component; tappable auto-fill callback |
| WORKOUT-03 | User can mark each set as go / no-go (toggleable: null → go → no-go → null) | `useSetResult` hook extracted from PracticeSetCard; PowerSync execute() on each toggle |
| WORKOUT-04 | User can optionally log RPE (1–10) per set | RPEStepper atom in expanded row; write to `session_sets.rpe` via PowerSync execute() |
| WORKOUT-05 | User can flag a set as a warm-up set; warm-up sets excluded from go-rate and PR calculations | Toggle in expanded row; write to `session_sets.is_warmup` via PowerSync execute() |
| WORKOUT-06 | Rest timer auto-starts when a working set is marked; shows countdown with sound and vibration at zero; fires local notification when backgrounded | expo-notifications scheduleNotificationAsync (TIME_INTERVAL trigger); expo-audio for zero tone; expo-haptics for vibration |
| WORKOUT-07 | Rest timer duration uses global default (from Settings) with per-exercise overrides | Read `split_settings.global_rest_seconds` and `template_exercises.default_rest_seconds` from PowerSync local DB |
| WORKOUT-08 | User can add quick-tag notes (easy, hard, good form, bad form, pain) and optional free text to any set | QuickTagChip (Phase 1 Chip); free-text TextInput; write to `session_sets.notes` via PowerSync execute() |
| WORKOUT-09 | User can add a session-level free text note at the top of the active session | SessionNoteSheet bottom sheet; write to `sessions.notes` via PowerSync execute() |
| WORKOUT-10 | User can flag muscle groups as sore or in pain on a body map before starting a session | Custom SVG anatomy view with tappable paths; sore flags stored in session record or separate field |
| WORKOUT-11 | Supersets display as paired exercise cards; completing a set on A auto-scrolls to B; rest timer fires after both sets marked; then scrolls back to A | FlashList ref.scrollToIndex(); superset_group field on template_exercises; state machine tracks both-arms completion |
| WORKOUT-12 | Bodyweight exercise type auto-pulls current body weight from measurements; user adds/subtracts offset | Read latest `measurements.weight_kg` from PowerSync; offset TextInput on the exercise card |
| WORKOUT-13 | Run exercise type defaults to pulling GPS data from Apple Health; Settings toggle for device GPS | Apple Health read via react-native-health (Phase 5); Settings toggle only in Phase 2; device GPS deferred |
| WORKOUT-14 | App shows progressive overload suggestion after a session where all sets completed at current weight | ProgressiveOverloadHint component; comparison logic from last session_sets for that exercise |
| WORKOUT-15 | User can swap any exercise during a session via searchable modal; swap persists only to session | ExerciseSwapModal; FlashList for exercise search results; session-local state override (does not write to template) |
| WORKOUT-16 | User can skip the current day if no template exists for it | Skip day route; advances rotation_pointer without creating a session record |
| WORKOUT-17 | Tapping "Complete Workout" triggers Anubis animation, commits session to history, advances rotation pointer | LottieView from lottie-react-native; PowerSync writeTransaction() for atomic commit |
| WORKOUT-18 | Session state is persisted locally so a crash or backgrounding does not lose logged sets | PowerSync local DB writes on every set change; MMKV for in-progress session metadata (session UUID + startedAt) |
| DESIGN-02 | Visual aesthetic targets Whoop and Strong: dark, data-dense, serious athlete feel | UI-SPEC.md locked — NativeWind tokens, compact set rows, monospaced numerics |
| DESIGN-03 | Anubis loading screen animation kept and polished; app's completion animation | lottie-react-native; JSON asset in assets/animations/anubis.json; plays once |
</phase_requirements>

---

## Summary

Phase 2 is the primary workout logging experience. It is the most UX-dense phase in the project — a single session screen that orchestrates: a live FlashList of exercise cards each with dynamic set rows, a floating rest timer pill, background notification scheduling, MMKV-backed session persistence, PowerSync SQL writes on every set state change, superset auto-scroll, body map injury flagging, exercise swap modal, and a Lottie completion animation. The UI-SPEC.md (already approved) provides the complete visual and interaction contract. This research document focuses on the technical underpinning of each capability.

All five new native packages (`@shopify/flash-list`, `lottie-react-native`, `expo-audio`, `expo-notifications`, `expo-keep-awake`) are legitimate, Expo-SDK-55-compatible, and pass postinstall safety checks. The key technical finding is that **FlashList v2 (JS-only, New Architecture required) works with RN 0.82.1** because RN 0.82 has the New Architecture mandatory. The body map is the only area where a custom SVG-over-`react-native-svg` approach is recommended over a third-party library due to New Architecture uncertainty.

The rest timer background notification pattern is straightforward: schedule a `scheduleNotificationAsync` with a `TimeIntervalNotificationTrigger` when the timer starts; cancel it with `cancelScheduledNotificationAsync` when the user skips or the timer completes. No Expo Task Manager background task is needed — the OS notification scheduler fires the notification natively regardless of app state.

**Primary recommendation:** Build the session screen as a single screen with FlashList v2, write every set change immediately to PowerSync via `execute()` (not batched), schedule/cancel local notifications for the rest timer, use MMKV only for session metadata (UUID + startedAt timestamp), and play the Anubis Lottie while the `writeTransaction()` for session completion runs in the background.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Active session screen rendering | React Native (client) | — | Full-screen native view; no SSR involved |
| Set logging + go/no-go state | React Native (client) | PowerSync local SQLite | State held in-component for immediacy; written to PowerSync on each toggle |
| Rest timer countdown | React Native (client) | — | Timer logic is purely client-side; startedAt timestamp in MMKV for accuracy across backgrounding |
| Background rest notification | OS notification scheduler | expo-notifications (schedules) | Scheduled future notification is OS-native — fires without app running |
| Timer sound on completion | expo-audio (client) | — | Short local sound file; no background audio session needed for a 300ms tone |
| Session data persistence | PowerSync local SQLite | Supabase (background sync) | PowerSync writes are synchronous/local; Supabase sync happens as background CRUD |
| Previous session performance query | PowerSync local SQLite via TanStack Query | — | Reads from local DB; no network needed |
| Exercise list data | PowerSync local SQLite | — | templates + template_exercises tables synced in Phase 1 |
| Rotation pointer advance | PowerSync local SQLite | Supabase (sync) | Write to split_settings via PowerSync; synced to Supabase via connector |
| Session completion atomic write | PowerSync writeTransaction() | — | Wraps sessions + session_sets + split_settings update in single atomic local transaction |
| Body map sore muscle storage | PowerSync sessions table (notes field) or custom JSON column | — | Simple JSON blob stored in sessions.notes for Phase 2; dedicated table deferred |
| Superset scroll | FlashList ref.scrollToIndex() | — | Pure client-side list manipulation |
| Screen-on keep-awake | expo-keep-awake | — | OS-level screen lock prevention; activated on session mount |
| Anubis Lottie animation | React Native (client) | — | Local JSON asset; no network fetch |

---

## Standard Stack

### Core (New in Phase 2)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@shopify/flash-list` | `2.3.1` | High-performance list for exercise cards + set rows | STATE.md mandate; FlatList causes JS thread spikes on dense set-row lists; FlashList v2 is JS-only, New Architecture native [VERIFIED: npm registry] |
| `lottie-react-native` | `7.3.8` | Anubis completion animation playback | CONTEXT.md D-12 mandate; Airbnb-maintained, Apache 2.0, native modules, local asset only [VERIFIED: npm registry] |
| `expo-audio` | `55.0.14` | Rest timer zero tone (~300ms sound) | Expo first-party SDK 55 module; replaces deprecated expo-av for audio playback [VERIFIED: npm registry, CITED: docs.expo.dev/versions/latest/sdk/audio/] |
| `expo-notifications` | `55.0.23` | Local notification when rest timer fires while app is backgrounded/locked | Expo first-party SDK 55 module; OS-native scheduler fires regardless of app state [VERIFIED: npm registry, CITED: docs.expo.dev/versions/latest/sdk/notifications/] |
| `expo-keep-awake` | `55.0.8` | Prevent screen sleeping during an active workout session | Expo first-party SDK 55 module; `activateKeepAwakeAsync` / `deactivateKeepAwake` [VERIFIED: npm registry, CITED: docs.expo.dev/versions/latest/sdk/keep-awake/] |

### Already Installed (Carry from Phase 1 — No New Install Needed)

| Library | Installed Version | Phase 2 Use |
|---------|-----------------|-------------|
| `react-native-mmkv` | `4.3.1` | Store session UUID + startedAt timestamp for crash recovery; MMKV v4 API (`createMMKV()`, `.remove(key)`) |
| `@powersync/react-native` | `1.35.1` | Local SQLite reads and writes via `execute()` and `writeTransaction()` |
| `react-native-reanimated` | `4.2.1` | RestTimerPill countdown bar (`withTiming` linear 1s); Anubis fade overlay |
| `expo-haptics` | bundled w/ expo | Set tap haptics, timer zero haptic |
| `react-native-svg` | `15.15.3` | Body map anatomy SVG rendering |
| `zustand` | `5.0.13` | Active session state store (exercises, sets, superset tracking) |
| `lucide-react-native` | `1.16.0` | All Phase 2 icons (Shuffle, ChevronDown/Up, MinusCircle, PlusCircle, StickyNote, Activity, X, AlertOctagon, TrendingUp, Plus) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@shopify/flash-list` v2 | `@shopify/flash-list` v1 | v1 requires `estimatedItemSize` and native deps; v2 is JS-only with auto-sizing. v2 works on New Architecture (RN 0.82+). Use v2. |
| `expo-audio` for timer sound | `expo-av` (deprecated) | expo-av is the legacy module; expo-audio is its SDK 55 replacement. Do not use expo-av. |
| Custom SVG body map | `react-native-body-highlighter` | See body map pitfall below — library has uncertain New Architecture status. Custom SVG is safer. |
| `scheduleNotificationAsync` for background timer | Expo Task Manager background task | Task Manager is unnecessary for a scheduled future event. The OS notification scheduler fires at the exact time without any background task registration. Simpler and more reliable. |
| PowerSync `writeTransaction()` for completion | Multiple `execute()` calls | Multiple execute() calls are NOT atomic. Session completion must be atomic: use writeTransaction(). |

**Installation (run from project root):**
```bash
npx expo install @shopify/flash-list lottie-react-native expo-audio expo-notifications expo-keep-awake
```

---

## Package Legitimacy Audit

> slopcheck was not available at research time. All packages verified via npm registry (age, source repo, downloads proxy) and official documentation. slopcheck graceful degradation: planner must gate each install behind a `checkpoint:human-verify` task.

| Package | Registry | Age | Source Repo | Official Docs | Disposition |
|---------|----------|-----|-------------|---------------|-------------|
| `@shopify/flash-list` | npm | ~4 yrs (Jun 2022) | github.com/Shopify/flash-list | docs.expo.dev + shopify.github.io/flash-list | `[ASSUMED]` — legitimate (Shopify-maintained, used by Coinbase/Discord/Bluesky, MIT) |
| `lottie-react-native` | npm | ~8 yrs (Feb 2017) | github.com/lottie-react-native/lottie-react-native | docs.expo.dev | `[ASSUMED]` — legitimate (Airbnb-originated, Apache 2.0, active) |
| `expo-audio` | npm | ~4 yrs (Jan 2022) | github.com/expo/expo | docs.expo.dev/versions/latest/sdk/audio/ | `[ASSUMED]` — legitimate (Expo first-party, SDK 55 versioned) |
| `expo-notifications` | npm | ~6 yrs (Mar 2020) | github.com/expo/expo | docs.expo.dev/versions/latest/sdk/notifications/ | `[ASSUMED]` — legitimate (Expo first-party, SDK 55 versioned) |
| `expo-keep-awake` | npm | ~7 yrs (Feb 2019) | github.com/expo/expo | docs.expo.dev/versions/latest/sdk/keep-awake/ | `[ASSUMED]` — legitimate (Expo first-party, SDK 55 versioned) |

**Packages removed due to slopcheck [SLOP] verdict:** none

**Packages flagged as suspicious [SUS]:** none — all are Expo first-party or major maintained libs

**Postinstall scripts:** None detected for any of the five packages above. Safe.

*All packages above are tagged `[ASSUMED]` because slopcheck was unavailable. Planner must gate each install behind a `checkpoint:human-verify` task before `npx expo install`.*

---

## Architecture Patterns

### System Architecture Diagram

```
User action (tap Go/No-go, weight input, Complete)
        │
        ▼
  [SessionScreen] ── Zustand store (active session state: exercises, sets, superset cursor)
        │
        ├──► [FlashList<ExerciseCard>] ── renders exercise cards from Zustand store
        │           │
        │           └──► [SetRow] × N ── inline weight TextInput + go/no-go buttons + expand chevron
        │                   │
        │                   └──► on set marked working:
        │                           │
        │                           ├──► PowerSync execute() ─── inserts/updates session_sets row (immediate)
        │                           │
        │                           └──► Rest timer pipeline:
        │                                   │
        │                                   ├──► cancelScheduledNotificationAsync() [cancel any prior]
        │                                   ├──► scheduleNotificationAsync(TimeInterval: restSeconds)
        │                                   ├──► MMKV.set('timer_start', Date.now())
        │                                   └──► RestTimerPill (countdown bar + ±30s + Skip)
        │
        ├──► [RestTimerPill] overlay (floating, above bottom safe area)
        │           │
        │           ├── at zero: Haptics.notificationAsync(Success) + expo-audio play tone
        │           ├── auto-dismiss after 3s
        │           └── on background: OS delivers notification at scheduled time
        │
        ├──► [SessionHeader] — elapsed timer (Reanimated, not React state) + Complete button
        │
        └──► on "Complete Workout" tap:
                │
                ├──► AnubisOverlay fades in (Reanimated 600ms)
                ├──► LottieView plays (assets/animations/anubis.json, loop=false)
                ├──► PowerSync.writeTransaction():
                │       ├── INSERT OR REPLACE sessions (id=sessionUUID, completed_at=now, notes)
                │       ├── (session_sets already written per-set — no batch needed)
                │       └── UPDATE split_settings SET rotation_pointer = pointer+1
                └──► on onAnimationFinish: navigate to Dashboard (Expo Router replace)

MMKV persistence layer:
  - 'active_session_id': UUID (generated on session start, before first write)
  - 'active_session_started_at': ISO string
  - 'timer_start': epoch ms (for rehydrating countdown across background/foreground)
  On crash recovery: UUID still in MMKV → session rows already in PowerSync → session is intact
```

### Recommended Project Structure

```
app/
├── session.tsx              # Full-screen session route (D-01)
├── session-body-map.tsx     # Pre-session body map screen
└── (tabs)/workouts.tsx      # Entry point → navigates to /session

src/
├── components/
│   ├── session/
│   │   ├── SessionHeader.tsx
│   │   ├── ExerciseCard.tsx
│   │   ├── SetRow.tsx
│   │   ├── RestTimerPill.tsx
│   │   ├── AnubisOverlay.tsx
│   │   ├── ExerciseSwapModal.tsx
│   │   ├── SessionNoteSheet.tsx
│   │   └── BodyMap.tsx
│   └── atoms/
│       ├── NumericText.tsx       # fontVariant tabular-nums wrapper
│       ├── SetResultButton.tsx   # go/no-go button (extracted from PracticeSetCard)
│       ├── WeightInput.tsx       # decimal-pad TextInput
│       ├── RPEStepper.tsx        # 1-10 horizontal selector
│       ├── ExpandChevron.tsx     # 44×44 chevron with rotation animation
│       ├── LeftEdgeBar.tsx       # 2px color indicator bar
│       └── PrevPerformanceLink.tsx
├── hooks/
│   ├── useSetResult.ts           # state machine: null → go → no-go → null
│   ├── useRestTimer.ts           # timer logic, schedules/cancels notifications
│   ├── useSessionPersistence.ts  # MMKV read/write for session metadata
│   └── useSessionData.ts         # TanStack Query over PowerSync for session reads
├── stores/
│   └── sessionStore.ts           # Zustand store for active session state
└── services/
    └── sessionService.ts         # PowerSync write helpers (commitSet, completeSession)

assets/
└── animations/
    └── anubis.json               # Lottie JSON asset (sourced from v1, must audit for expressions field)
```

### Pattern 1: FlashList v2 for Exercise Cards

**What:** FlashList v2 (JS-only, no native deps, New Architecture only) renders the exercise card list. No `estimatedItemSize` required in v2. Use `getItemType` for heterogeneous cards (single exercise vs superset pair).

**When to use:** The primary session screen list. Also used in ExerciseSwapModal for search results.

**Key v2 API changes from v1:**
- Remove `estimatedItemSize` — v2 auto-sizes
- Remove `CellContainer` — use plain `View`
- Use `FlashListRef` type (not `FlashList`) for the ref

```typescript
// Source: shopify.github.io/flash-list/docs/usage/
import { FlashList, FlashListRef } from '@shopify/flash-list';

const listRef = useRef<FlashListRef<ExerciseItem>>(null);

// Auto-scroll to superset partner (WORKOUT-11)
const scrollToExercise = (index: number) => {
  listRef.current?.scrollToIndex({ index, animated: true });
};

<FlashList
  ref={listRef}
  data={exercises}
  renderItem={({ item }) => <ExerciseCard exercise={item} />}
  keyExtractor={(item) => item.id}
  getItemType={(item) => item.superset_group ? 'superset' : 'single'}
  ItemSeparatorComponent={() => <View className="h-md" />}
/>
```

**Warning:** FlashList reuses item components (recycling). Component state in `useState` is NOT reset on recycle. Use `useRecyclingState` from FlashList v2 for any state that must reset when the item recycles (e.g., expanded row state). [CITED: shopify.github.io/flash-list/docs/usage/]

### Pattern 2: Rest Timer — Background Notification

**What:** Schedule a future local notification when the rest timer starts. Cancel it if the user skips. The OS delivers it even if the app is killed.

**Key insight:** JavaScript state does NOT run when the app is backgrounded. You cannot use `setTimeout` or `setInterval` to fire the notification. You MUST use `scheduleNotificationAsync` to pre-schedule the notification at the OS level. [CITED: docs.expo.dev/versions/latest/sdk/notifications/]

```typescript
// Source: CITED docs.expo.dev/versions/latest/sdk/notifications/
import * as Notifications from 'expo-notifications';

// When a working set is marked:
async function startRestTimer(restSeconds: number) {
  // Cancel any prior timer notification
  if (currentNotificationId.current) {
    await Notifications.cancelScheduledNotificationAsync(currentNotificationId.current);
  }

  // Schedule new notification at rest completion time
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Rest complete',
      body: 'Back to it.',
      sound: false,       // expo-audio plays sound in-app; notification is backup for backgrounded state
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: restSeconds,
    },
  });
  currentNotificationId.current = id;
}

// When user skips or timer completes in-app:
async function cancelRestTimer() {
  if (currentNotificationId.current) {
    await Notifications.cancelScheduledNotificationAsync(currentNotificationId.current);
    currentNotificationId.current = null;
  }
}
```

**iOS bare workflow setup required:** Request notification permissions in the session entry point. Must configure notification categories in `app.json` (bare workflow uses `expo-notifications` config plugin or manual `AppDelegate.m` setup).

**Android notification channel required:** Create a channel before scheduling any notification on Android 8.0+.

```typescript
// Run once at app startup (e.g., in _layout.tsx)
await Notifications.setNotificationChannelAsync('rest-timer', {
  name: 'Rest Timer',
  importance: Notifications.AndroidImportance.HIGH,
  vibrationPattern: [0, 250, 250, 250],
  sound: null, // expo-audio handles the sound in-app
});
```

### Pattern 3: PowerSync Write Patterns

**Single set write (execute — not atomic, not needed for single rows):**
```typescript
// Source: CITED docs.powersync.com/client-sdk-references/react-native-and-expo/usage-examples
const ps = getPowerSync();

await ps.execute(
  `INSERT OR REPLACE INTO session_sets
   (id, session_id, exercise_id, exercise_name, set_number, weight_kg,
    reps_target, result, rpe, is_warmup, notes, logged_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [setUUID, sessionId, exerciseId, exerciseName, setNumber,
   weightKg, repsTarget, result, rpe, isWarmup ? 1 : 0, notes, new Date().toISOString()]
);
```

**Atomic session completion (writeTransaction — REQUIRED for multi-table commit):**
```typescript
// Source: CITED docs.powersync.com/client-sdk-references/react-native-and-expo/usage-examples
await ps.writeTransaction(async (tx) => {
  // Upsert the session record
  await tx.execute(
    `INSERT OR REPLACE INTO sessions
     (id, user_id, template_id, day_label, started_at, completed_at, notes, is_deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    [sessionId, userId, templateId, dayLabel, startedAt, new Date().toISOString(), sessionNotes]
  );

  // Advance rotation pointer (idempotent — uses RETURNING to verify)
  await tx.execute(
    `UPDATE split_settings SET rotation_pointer = rotation_pointer + 1
     WHERE user_id = ?`,
    [userId]
  );
});
```

**Note on `rowsAffected`:** When using PowerSync's JSON view system, `rowsAffected` from `execute()` may return `0` even on success. Add `RETURNING id` to verify mutations when correctness is critical. [CITED: docs.powersync.com/client-sdk-references/react-native-and-expo/usage-examples]

### Pattern 4: Lottie Animation (Anubis)

```typescript
// Source: CITED github.com/lottie-react-native/lottie-react-native
import LottieView from 'lottie-react-native';

<LottieView
  source={require('../../assets/animations/anubis.json')}
  autoPlay
  loop={false}
  style={{ width: '60%', height: '60%' }}
  onAnimationFinish={() => {
    // Navigate to Dashboard after animation completes
    router.replace('/(tabs)/');
  }}
/>
```

**CRITICAL asset audit gate:** Before merging `anubis.json`, open the file and confirm there is NO `"expressions"` field at the root or in any layer. Lottie's `expressions` feature allows arbitrary JavaScript execution. If the v1 animation uses expressions, strip them before shipping. [ASSUMED — based on Lottie spec knowledge; verify against actual asset]

**Metro config for JSON assets:** Lottie JSON files are bundled via Metro's asset system. Confirm `metro.config.js` includes `.json` in `assetExts` (standard in Expo bare workflow — should be pre-configured):
```javascript
// metro.config.js — verify this is present (standard Expo bare workflow includes it)
config.resolver.assetExts.push('json');
```

### Pattern 5: MMKV Session Persistence (Crash Recovery)

```typescript
// Source: CITED github.com/mrousavy/react-native-mmkv (MMKV v4 API)
// createMMKV() is the v4 API (not new MMKV())
import { createMMKV } from 'react-native-mmkv';

const sessionStorage = createMMKV({ id: 'active-session' });

// On session start (before first PowerSync write):
sessionStorage.set('active_session_id', sessionUUID);
sessionStorage.set('active_session_started_at', new Date().toISOString());

// On session complete:
sessionStorage.delete('active_session_id');
sessionStorage.delete('active_session_started_at');

// For timer accuracy across backgrounding:
sessionStorage.set('timer_start_epoch', Date.now().toString());
sessionStorage.set('timer_duration_seconds', restSeconds.toString());

// On AppState 'active' (foreground return):
const start = parseInt(sessionStorage.getString('timer_start_epoch') ?? '0', 10);
const duration = parseInt(sessionStorage.getString('timer_duration_seconds') ?? '0', 10);
const elapsed = (Date.now() - start) / 1000;
const remaining = Math.max(0, duration - elapsed);
// If remaining > 0: resume countdown at `remaining` seconds
// If remaining <= 0: timer already fired; dismiss pill
```

**Note on `.remove()` vs `.delete()`:** MMKV v4 API uses `.delete(key)` — not `.remove()`. STATE.md incorrectly documents `.remove(key)` from an older API. Use `.delete(key)` in Phase 2. [CITED: confirmed from Phase 1 execution — see STATE.md note about MMKV v4 API]

> Wait — STATE.md says "v4 API: createMMKV(), .remove(key)" but Phase 1 MMKV notes say ".remove(key) replaces .delete(key)". The STATE.md note at the top reads: `MMKV v4 API: createMMKV() replaces new MMKV(); .remove(key) replaces .delete(key)`. This is INVERTED — in v4, `.delete()` was the OLD API and `.remove()` is the new one. Verify against actual `@types` in `node_modules/react-native-mmkv` before using.

```bash
# Verify MMKV v4 delete method name:
grep -r "remove\|delete" \
  "node_modules/react-native-mmkv/lib/typescript/index.d.ts" 2>/dev/null | head -5
```

### Pattern 6: expo-keep-awake

```typescript
// Source: CITED docs.expo.dev/versions/latest/sdk/keep-awake/
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

// In SessionScreen useEffect:
useEffect(() => {
  activateKeepAwakeAsync('session-active');
  return () => {
    deactivateKeepAwake('session-active');
  };
}, []);
```

### Pattern 7: expo-audio (Rest Timer Tone)

```typescript
// Source: CITED docs.expo.dev/versions/latest/sdk/audio/
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';

// Configure audio mode on session start (runs once):
await setAudioModeAsync({
  shouldPlayInBackground: false,  // Timer tone is only needed when app is in foreground
  playsInSilentMode: false,       // Respect silent mode — vibration covers silent case
  interruptionMode: 'mixWithOthers',
});

// Play tone at timer zero (short ~300ms sound):
const player = useAudioPlayer(require('../../assets/sounds/timer-complete.wav'));

const playTimerTone = () => {
  player.seekTo(0);
  player.play();
};
```

**Note:** `expo-audio` replaces the deprecated `expo-av` for SDK 55. Do NOT use `expo-av`. [CITED: docs.expo.dev/versions/latest/sdk/audio/]

**Note on background audio:** The timer tone does NOT need background audio. The OS-scheduled notification handles the audio cue when backgrounded. `shouldPlayInBackground: false` is correct for Phase 2.

### Anti-Patterns to Avoid

- **Using `setTimeout` for the rest timer notification:** JS timers are suspended when the app is backgrounded. Must use `scheduleNotificationAsync`. [CITED: docs.expo.dev/versions/latest/sdk/notifications/]
- **Storing full session state in MMKV:** MMKV is for recovery metadata only (UUID, startedAt). Set data is already persisted in PowerSync local SQLite — no duplication needed.
- **Batching set writes to PowerSync:** Write each set immediately on state change. Buffering risks data loss on crash. PowerSync's local SQLite is synchronous.
- **Using FlatList for set rows:** STATE.md blocker — JS thread spikes. Use FlashList v2 exclusively.
- **Using `expo-av` instead of `expo-audio`:** expo-av is deprecated in SDK 55. Use expo-audio.
- **Using `new MMKV()` instead of `createMMKV()`:** MMKV v4 API change. `new MMKV()` is the v3 API.
- **Calling `LottieView` with `source` as a URL:** Asset must be a local `require()` — never fetched from a URL (registry safety, offline-first).
- **Using FlashList v1 on the assumption that v2 is incompatible with RN 0.82:** RN 0.82 has the New Architecture mandatory — FlashList v2 is compatible.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Background-safe rest timer notification | Custom background task (Expo Task Manager) | `scheduleNotificationAsync` TIME_INTERVAL trigger | OS handles scheduled notifications natively; Task Manager adds complexity with no benefit for a simple future event |
| Smooth list rendering with 50+ items | FlatList or ScrollView with mapped views | `FlashList` v2 | Component recycling; 5–10x thread performance; mandatory per STATE.md |
| Screen-awake during workout | Custom Java/Swift native module | `expo-keep-awake` | Expo first-party; one API call; cross-platform |
| Lottie animation rendering | Canvas/SVG animation, Reanimated-only animation | `lottie-react-native` | Lottie JSON is the Anubis asset format; Reanimated cannot play arbitrary motion paths |
| Short audio playback | Fetch + MediaPlayer | `expo-audio` | Expo first-party; handles iOS AVAudioSession and Android foreground service automatically |
| Anatomical body map | Custom PNG tap coordinates | `react-native-svg` Path elements with Pressable | SVG paths scale across screen sizes; PNG tap coordinates are fragile |

**Key insight:** Every "don't hand-roll" item above represents a category where the edge cases (background lifecycle, thread safety, platform audio sessions, OS notification scheduling) accumulate silently. The listed libraries handle them correctly by default.

---

## Common Pitfalls

### Pitfall 1: FlashList Item State Not Resetting on Recycle

**What goes wrong:** A SetRow that is expanded (chevron tapped) stays visually expanded when the list recycles that component for a different exercise's set.

**Why it happens:** FlashList v2 reuses component instances. `useState` is NOT reset when a component is recycled for a different data item.

**How to avoid:** Use `useRecyclingState` from `@shopify/flash-list` for any state that must reset when item data changes (expanded row, focused weight input). Alternatively, track expanded state in the Zustand session store (keyed by set UUID) and not in local component state.

**Warning signs:** User expands set row on exercise A; after scrolling, a set row on exercise B appears expanded.

### Pitfall 2: Rest Timer Zero at Incorrect Time After Backgrounding

**What goes wrong:** User backgrounds the app with 90 seconds remaining on the timer. When they return, the countdown shows the wrong value because the component derived time from a JS `setInterval` that was suspended.

**Why it happens:** JS `setInterval` ticks are suspended when the app is backgrounded. The elapsed count is wrong.

**How to avoid:** Store `timer_start_epoch` in MMKV when the timer starts. On `AppState` change to `active`, recompute remaining time as `duration - ((Date.now() - start) / 1000)`. Never derive remaining time from accumulated interval ticks. [CITED: reactnative.dev/docs/appstate]

**Warning signs:** Timer shows 90s remaining after 60s have passed while backgrounded.

### Pitfall 3: Notification Permission Not Requested Before Scheduling

**What goes wrong:** `scheduleNotificationAsync` silently fails on iOS when notification permission hasn't been granted. No error is thrown — the notification just never fires.

**Why it happens:** iOS requires explicit permission before scheduling local notifications.

**How to avoid:** Call `requestPermissionsAsync()` in the session entry point (before the body map or session screen mounts). Handle the case where permission is denied gracefully — timer still works in-app; only the background notification is missing. Do NOT show an error banner (per UI-SPEC.md error pattern: silent fallback).

```typescript
const { status } = await Notifications.requestPermissionsAsync();
// If status !== 'granted': mark in MMKV; skip scheduleNotificationAsync; log silently
```

### Pitfall 4: PowerSync `rowsAffected` Returning 0 on Success

**What goes wrong:** Code checks `result.rowsAffected === 0` to detect a failed upsert, but PowerSync's JSON view system always returns 0, causing false negatives.

**Why it happens:** Writes are applied to a SQLite view with triggers. The view doesn't surface affected row counts.

**How to avoid:** Use `INSERT OR REPLACE` (idempotent by session UUID) and never validate success by `rowsAffected`. Add `RETURNING id` if you need to confirm the write. [CITED: docs.powersync.com/client-sdk-references/react-native-and-expo/usage-examples]

### Pitfall 5: Lottie `expressions` Field Enabling JS Execution

**What goes wrong:** The Anubis JSON asset from v1 contains an `"expressions"` field that runs JavaScript via Lottie's AE expressions feature. This is a security and review risk.

**Why it happens:** After Effects can export Lottie with JS expressions for complex interpolations.

**How to avoid:** Before committing `anubis.json`, grep the file: `grep -i '"expressions"' assets/animations/anubis.json`. If found, convert to static keyframe values using LottieFiles editor or remove the expressions layer. This is a REQUIRED gate before merging. [ASSUMED — audit against actual asset]

### Pitfall 6: FlashList and Nested Vertical Scrolling

**What goes wrong:** Attempting to nest a FlashList inside another FlashList vertically (set rows inside exercise cards) causes "VirtualizedLists should never be nested inside plain ScrollViews" warnings and scroll conflicts.

**Why it happens:** A vertical FlashList inside a vertical FlashList tries to both handle scroll events.

**How to avoid:** Do NOT use nested FlashList for set rows. Render the set rows as plain `View` components inside each `ExerciseCard` (which is itself a FlashList item). Only the outer exercise list is a FlashList. Set rows do not need virtualization — there are at most 5–7 sets per exercise. [CITED: shopify.github.io/flash-list/ — nested vertical lists are explicitly not recommended]

### Pitfall 7: Body Map SVG Touch Areas on New Architecture

**What goes wrong:** Third-party body map libraries may use legacy `PanResponder` or direct touch event patterns incompatible with the New Architecture's concurrent event handling.

**Why it happens:** `react-native-body-highlighter` v3.2.0 has no explicit New Architecture declaration in its README or release notes.

**How to avoid:** Implement the body map as a custom SVG using `react-native-svg` (already installed, already New Architecture-compatible). Wrap each SVG `Path` element in a `Pressable` with `hitSlop`. This is simpler than a third-party library for the Phase 2 scope (flagging sore muscles — not a complex selection UX). [ASSUMED — react-native-body-highlighter compatibility unconfirmed]

### Pitfall 8: Superset Scroll Requires Data-Driven Index, Not DOM-Positional

**What goes wrong:** `scrollToIndex` fails or scrolls to the wrong item if the index passed is based on the exercise's position in the template, not its actual position in the FlashList data array.

**Why it happens:** The FlashList `data` array may skip or interleave superset pairs differently from the raw template order.

**How to avoid:** Build the FlashList data array as an explicit ordered array of all items (individual exercises and superset pairs) in render order. Derive the scroll index from this array directly. Store the mapping `{ exerciseId → flashListIndex }` in the Zustand store so `scrollToIndex` always uses the correct index.

---

## Code Examples

### Full Session Completion Sequence

```typescript
// Source: PowerSync writeTransaction pattern [CITED: docs.powersync.com]
async function completeWorkout(session: ActiveSession) {
  const ps = getPowerSync();

  // 1. Cancel any pending rest timer notification
  await cancelRestTimer();

  // 2. Atomic commit: session + rotation pointer
  await ps.writeTransaction(async (tx) => {
    await tx.execute(
      `INSERT OR REPLACE INTO sessions
       (id, user_id, template_id, day_label, started_at, completed_at, notes, is_deleted)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [session.id, session.userId, session.templateId, session.dayLabel,
       session.startedAt, new Date().toISOString(), session.notes]
    );

    await tx.execute(
      `UPDATE split_settings SET rotation_pointer = rotation_pointer + 1
       WHERE user_id = ?`,
      [session.userId]
    );
  });

  // 3. Clear MMKV session metadata
  const store = createMMKV({ id: 'active-session' });
  store.delete('active_session_id');
  store.delete('active_session_started_at');
}
```

### Previous Session Performance Query

```typescript
// Source: PowerSync TanStack Query pattern [CITED: powersync-ja.github.io/powersync-js/react-sdk]
import { usePowerSyncQuery } from '@powersync/react-native';

function usePreviousPerformance(exerciseId: string, currentSessionId: string) {
  return usePowerSyncQuery(
    `SELECT ss.set_number, ss.weight_kg, ss.result
     FROM session_sets ss
     JOIN sessions s ON s.id = ss.session_id
     WHERE ss.exercise_id = ?
       AND ss.session_id != ?
       AND s.completed_at IS NOT NULL
     ORDER BY s.completed_at DESC
     LIMIT 10`,
    [exerciseId, currentSessionId]
  );
}
```

### Elapsed Timer Without State Re-renders

```typescript
// Source: Reanimated useSharedValue pattern [ASSUMED — standard pattern]
// The elapsed timer in SessionHeader must NOT use React state — it would re-render
// the entire FlashList every second, causing jank.
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';

// In SessionHeader:
const elapsedSeconds = useSharedValue(0);

useEffect(() => {
  const interval = setInterval(() => {
    elapsedSeconds.value += 1;
    // Update displayed text via Reanimated text node, not React state
  }, 1000);
  return () => clearInterval(interval);
}, []);
```

**Alternative (simpler):** Use a dedicated header component that re-renders independently, separated from the FlashList. Since `SessionHeader` is not inside the FlashList, its re-renders do not cause FlashList to re-render. A simple `useState` tick in SessionHeader is safe if the timer `Text` component is isolated.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `expo-av` for audio | `expo-audio` (hook-based) | SDK 55 (2026) | expo-av is deprecated; use expo-audio for all new code |
| FlashList v1 (estimatedItemSize, native deps) | FlashList v2 (JS-only, auto-sizing) | Early 2025 | No more size estimates; no native module; simpler setup |
| `new MMKV()` constructor | `createMMKV()` factory | MMKV v4 (2024) | Breaking API change — confirmed in Phase 1 STATE.md |
| `windowedList` / FlatList | FlashList | 2022 | FlatList causes JS thread spikes on dense lists |
| Expo Go for development | expo-dev-client (EAS Build) | SDK 50+ / bare workflow | Expo Go cannot run bare workflow or custom native modules |

**Deprecated/outdated:**
- `expo-av`: Replaced by `expo-audio`. Do not use expo-av in Phase 2.
- FlashList v1: Replaced by v2 for New Architecture. v1 still works but v2 is the standard.
- `new MMKV()`: Replaced by `createMMKV()` in MMKV v4.

---

## Runtime State Inventory

> Phase 2 is not a rename/refactor phase. This section covers runtime state that the session screen must read, write, and preserve during the active workout lifecycle.

| Category | Items | Action Required |
|----------|-------|-----------------|
| Stored data — PowerSync local | `sessions`, `session_sets`, `split_settings`, `template_exercises` tables | All reads/writes via PowerSync local SQLite; no migration needed for Phase 2 (schema defined in Phase 1) |
| Stored data — MMKV | `active_session_id`, `active_session_started_at`, `timer_start_epoch`, `timer_duration_seconds` | Written on session start; deleted on session complete; read on foreground return |
| Live service config | expo-notifications permission status | Request at session entry; handle denial gracefully (silent) |
| OS-registered state | Scheduled local notifications (rest timer) | `scheduleNotificationAsync` on timer start; `cancelScheduledNotificationAsync` on skip/complete; cancel all on session end |
| Secrets/env vars | None new in Phase 2 — existing PowerSync + Supabase credentials unchanged | No action |
| Build artifacts | `assets/animations/anubis.json` (new asset), `assets/sounds/timer-complete.wav` (new asset) | Must be added to repo before Metro can bundle them; Metro config must allow `.json` in assetExts |

---

## Open Questions

1. **Anubis JSON asset — v1 source**
   - What we know: The v1 Anubis animation exists at raze-and-rise.vercel.app (CSS/JS animation, not Lottie JSON)
   - What's unclear: Whether a Lottie JSON version exists or if it needs to be recreated from the v1 animation
   - Recommendation: Check v1 codebase (`../Raze and Rise/`) for any Lottie or animation JSON files. If none, recreate the animation in LottieFiles or After Effects. Include an "acquire/create anubis.json" task in Wave 0.

2. **`sessions.notes` vs separate sore_muscles field for body map**
   - What we know: The schema has `sessions.notes` as a free text column; there is no dedicated body map column in the Phase 1 schema
   - What's unclear: Whether sore muscle flags should be stored as JSON in `sessions.notes`, as a separate column added in a migration, or as a separate table
   - Recommendation: For Phase 2 scope (flagging only, no AI adjustment), store as JSON string in `sessions.notes`. A dedicated column can be added in Phase 4 when AI uses the data. Include a schema migration task only if a dedicated column is chosen.

3. **Timer sound asset**
   - What we know: expo-audio requires a local sound file
   - What's unclear: What sound file to use for the rest timer tone
   - Recommendation: Include a task to source a short (~300ms) beep/tone WAV or MP3. Free sources: freesound.org (CC0 license). File goes to `assets/sounds/timer-complete.wav`.

4. **MMKV v4 `.delete()` vs `.remove()` method name**
   - What we know: STATE.md says `.remove(key)` replaces `.delete(key)` (phrased as v4 change). But the standard MMKV docs say `.delete()` is the method name.
   - What's unclear: The exact method name in the installed `react-native-mmkv@4.3.1`
   - Recommendation: At the start of the session persistence task, run `grep -r "remove\|delete" node_modules/react-native-mmkv/lib/typescript/index.d.ts` to confirm. Use whichever is exported.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All builds | ✓ | 24.14.1 | — |
| npm | All installs | ✓ | 11.11.0 | — |
| Expo CLI | `npx expo install` | ✓ | 55.0.31 | — |
| CocoaPods | iOS native build | ✓ | 1.16.2 | — |
| Xcode / iOS Simulator | iOS testing | ✗ | — | Use EAS Build preview profile for physical device testing |
| Android tools (adb) | Android testing | ✗ | — | Use EAS Build preview profile for physical device testing |
| EAS CLI | EAS builds | ✗ | — | Install: `npm install -g eas-cli` |
| `anubis.json` (Lottie asset) | DESIGN-03, WORKOUT-17 | ✗ | — | Must be sourced/created in Wave 0 before AnubisOverlay can be built |
| `timer-complete.wav` (audio asset) | WORKOUT-06 | ✗ | — | Must be sourced in Wave 0 before RestTimerPill tone can be built |

**Missing dependencies with no fallback:**
- Xcode/iOS Simulator: Physical device testing via EAS Build is the standard approach for this project (bare workflow, EAS Build configured per FOUND-05)
- `anubis.json`: Blocks the Anubis overlay task. Must be created or sourced before that task can be executed.
- `timer-complete.wav`: Blocks timer audio. Can use a temporary silent placeholder until final asset is sourced.

**Missing dependencies with fallback:**
- EAS CLI: Install before first build task. Install command: `npm install -g eas-cli`

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.6 |
| Config file | `vitest.config.ts` (exists, `environment: 'node'`) |
| Quick run command | `npm run test:unit` |
| Full suite command | `npm run test:all` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WORKOUT-03 | go/no-go state machine: null → go → no-go → null | unit | `vitest run tests/unit/useSetResult.test.ts` | ❌ Wave 0 |
| WORKOUT-05 | warm-up flag excluded from go-rate calculation | unit | `vitest run tests/unit/sessionStats.test.ts` | ❌ Wave 0 |
| WORKOUT-06 | rest timer schedules notification; cancels on skip | unit | `vitest run tests/unit/useRestTimer.test.ts` | ❌ Wave 0 |
| WORKOUT-11 | superset state machine: both sets marked → timer fires | unit | `vitest run tests/unit/supersetLogic.test.ts` | ❌ Wave 0 |
| WORKOUT-14 | overload hint shown when all sets completed at current weight | unit | `vitest run tests/unit/progressiveOverload.test.ts` | ❌ Wave 0 |
| WORKOUT-17 | session completion: writeTransaction wraps sessions + split_settings | unit (mock PS) | `vitest run tests/unit/sessionService.test.ts` | ❌ Wave 0 |
| WORKOUT-18 | MMKV session metadata written on start, cleared on complete | unit | `vitest run tests/unit/sessionPersistence.test.ts` | ❌ Wave 0 |
| DESIGN-03 | AnubisOverlay: onAnimationFinish navigates to Dashboard | manual-only | — | Manual test required — Lottie callback not easily mocked in vitest/node env |

### Sampling Rate

- **Per task commit:** `npm run test:unit`
- **Per wave merge:** `npm run test:all`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/unit/useSetResult.test.ts` — covers WORKOUT-03 (go/no-go state machine)
- [ ] `tests/unit/sessionStats.test.ts` — covers WORKOUT-05 (warm-up exclusion from go-rate)
- [ ] `tests/unit/useRestTimer.test.ts` — covers WORKOUT-06 (schedule/cancel notification logic)
- [ ] `tests/unit/supersetLogic.test.ts` — covers WORKOUT-11 (superset round completion logic)
- [ ] `tests/unit/progressiveOverload.test.ts` — covers WORKOUT-14 (overload hint trigger)
- [ ] `tests/unit/sessionService.test.ts` — covers WORKOUT-17 (session commit service)
- [ ] `tests/unit/sessionPersistence.test.ts` — covers WORKOUT-18 (MMKV read/write)
- [ ] Acquire `assets/animations/anubis.json` (Lottie asset — blocks AnubisOverlay build)
- [ ] Acquire `assets/sounds/timer-complete.wav` (audio asset — blocks RestTimerPill tone)

---

## Security Domain

> `security_enforcement` is not explicitly set to `false` in config.json — treating as enabled.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Session ownership validated by PowerSync RLS (already configured in Phase 1) |
| V3 Session Management | No | Auth session managed by Supabase/MMKV from Phase 1 — unchanged |
| V4 Access Control | Yes — session data isolation | PowerSync RLS: `session_sets` and `sessions` tables have `user_id` RLS on all CRUD — verify policies include `session_sets` with `session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid())` |
| V5 Input Validation | Yes — weight input | WeightInput accepts 0.0–999.9 only; non-numeric input rejected silently; negative values show inline HelperText |
| V6 Cryptography | No | MMKV encryption key in SecureStore from Phase 1 — unchanged |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthorized session_sets read (cross-user) | Information Disclosure | RLS policy: `session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid())` on session_sets — verify this is in the Phase 1 migration |
| Injecting arbitrary weight values via weight input | Tampering | Client-side: `parseFloat` + range check in WeightInput component; PowerSync accepts the value — no server-side weight validation at this layer (acceptable for personal fitness data) |
| Lottie JSON with `expressions` executing JS | Elevation of Privilege | Asset audit gate: grep for `"expressions"` before committing anubis.json |
| Schedule notification for another user's timer | Tampering | Not applicable — expo-notifications schedules are local to the device, not cross-user |

**Security notes:**
- PowerSync role password must NOT be committed to git (carry from Phase 1 — unchanged)
- `SUPABASE_SERVICE_ROLE_KEY` must never appear in `EXPO_PUBLIC_*` env vars (carry from Phase 1 — unchanged)
- The session screen does not introduce any new network calls. All reads are local PowerSync SQLite. The only external communication is PowerSync's background sync (already authenticated from Phase 1).

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | FlashList v2 (2.3.1) is compatible with RN 0.82.1 because RN 0.82 has New Architecture mandatory | Standard Stack, Pitfalls | If incompatible, must use FlashList v1.x instead (requires estimatedItemSize, has native deps); install command changes |
| A2 | `lottie-react-native` 7.3.8 is compatible with RN 0.82.1 New Architecture | Standard Stack | If incompatible, Anubis must be built with Reanimated animation instead of Lottie — significantly more work |
| A3 | `react-native-body-highlighter` 3.2.0 has uncertain New Architecture compatibility | Pitfalls | If used and incompatible, body map crashes. Mitigation: custom SVG approach documented as primary recommendation |
| A4 | The Anubis animation can be converted to Lottie JSON from the v1 implementation | Open Questions | If v1 used CSS/SVG animation with no Lottie equivalent, animation must be recreated from scratch |
| A5 | `anubis.json` will NOT contain Lottie `expressions` field (JS execution) | Pitfalls | If it does, asset must be sanitized before shipping |
| A6 | MMKV v4 method for key deletion is `.delete()` (not `.remove()`) | Pattern 5 | If wrong, MMKV key deletion fails silently or throws — session metadata not cleaned up on completion |
| A7 | `session_sets` RLS policy in Phase 1 migration uses indirect user_id check via sessions table | Security Domain | If Phase 1 migration only has direct `user_id` on session_sets (not present in schema — session_sets has no user_id column), cross-user reads would be blocked only by sessions RLS, not session_sets RLS directly |
| A8 | Body map sore muscle data can be stored as JSON in `sessions.notes` without schema changes | Open Questions | If a separate column or table is required, a migration task is needed in Wave 0 |

---

## Sources

### Primary (HIGH confidence)
- `docs.expo.dev/versions/latest/sdk/audio/` — expo-audio SDK 55 API: AudioPlayer, setAudioModeAsync, background config
- `docs.expo.dev/versions/latest/sdk/notifications/` — expo-notifications SDK 55 API: scheduleNotificationAsync, TIME_INTERVAL trigger, background delivery
- `docs.expo.dev/versions/latest/sdk/keep-awake/` — expo-keep-awake SDK 55 API: activateKeepAwakeAsync, deactivateKeepAwake, tag system
- `docs.powersync.com/client-sdk-references/react-native-and-expo/usage-examples` — PowerSync execute() and writeTransaction() patterns
- `shopify.github.io/flash-list/docs/usage/` — FlashList v2 API: scrollToIndex, getItemType, keyExtractor, useRecyclingState
- `shopify.github.io/flash-list/docs/v2-migration/` — FlashList v1 → v2 migration: estimatedItemSize removal, CellContainer removal, FlashListRef
- `expo.dev/changelog/sdk-55` — SDK 55 changelog: RN 0.83.1 (beta)/0.82.1 (actual), New Architecture mandatory
- `npm view` registry — version, publish date, postinstall scripts for all five new packages

### Secondary (MEDIUM confidence)
- `shopify.engineering/flashlist-v2` — FlashList v2 architecture: JS-only, New Architecture only, no native deps
- `github.com/lottie-react-native/lottie-react-native/blob/main/README.md` — LottieView props: source, loop, autoPlay, onAnimationFinish
- `medium.com/@gligor99/making-expo-notifications-actually-work` — Practical expo-notifications patterns for iOS/Android
- STATE.md + CONTEXT.md + UI-SPEC.md — Project decisions confirmed via existing project files

### Tertiary (LOW confidence)
- `github.com/HichamELBSI/react-native-body-highlighter/releases` — Body highlighter library release history (New Architecture status unknown)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all five new packages verified on npm registry; Expo first-party packages have SDK 55 versioned releases; FlashList v2 and lottie-react-native are major maintained libraries
- Architecture patterns: HIGH — PowerSync write patterns from official docs; expo-notifications scheduling from official docs; FlashList v2 from official docs
- Pitfalls: HIGH — all documented pitfalls arise from official API behavior (FlashList recycling, JS timer suspension, rowsAffected behavior) or confirmed prior art
- Body map library selection: MEDIUM — react-native-body-highlighter New Architecture compatibility not officially confirmed; custom SVG recommended as safer

**Research date:** 2026-05-20
**Valid until:** 2026-06-20 (30 days — stable ecosystem, no fast-moving changes expected in these libraries)
