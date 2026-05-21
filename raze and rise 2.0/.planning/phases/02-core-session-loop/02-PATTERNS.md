# Phase 2: Core Session Loop - Pattern Map

**Mapped:** 2026-05-20
**Files analyzed:** 14 new/modified files
**Analogs found:** 14 / 14

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `app/(session)/index.tsx` | route | request-response | `app/(onboarding)/practice-set.tsx` | exact |
| `src/hooks/useSetResult.ts` | hook | event-driven | `src/components/PracticeSetCard/index.tsx` (inline state) | exact — extract |
| `src/hooks/useRestTimer.ts` | hook | event-driven | `src/hooks/useSession.ts` (subscription + cleanup) | role-match |
| `src/hooks/useSessionPersistence.ts` | hook | CRUD | `src/hooks/useOnboardingState.ts` (MMKV read/write) | exact |
| `src/services/sessionService.ts` | service | CRUD | `src/lib/powersync.ts` + RESEARCH.md patterns | role-match |
| `src/components/SetRow/index.tsx` | component | event-driven | `src/components/PracticeSetCard/index.tsx` | exact |
| `src/components/ExerciseCard/index.tsx` | component | event-driven | `src/components/PracticeSetCard/index.tsx` | role-match |
| `src/components/RestTimerPill/index.tsx` | component | event-driven | `src/components/ProgressBar/index.tsx` (Reanimated withTiming) | role-match |
| `src/components/SessionHeader/index.tsx` | component | event-driven | `src/components/OnboardingStepLayout/index.tsx` (header region) | partial |
| `src/components/AnubisOverlay/index.tsx` | component | event-driven | `src/components/ProgressBar/index.tsx` (Reanimated fade) | partial |
| `src/components/BodyMap/index.tsx` | component | event-driven | `src/components/Chip/index.tsx` (Pressable tap + selection state) | partial |
| `src/components/NumericText/index.tsx` | component | transform | `src/components/PracticeSetCard/index.tsx` (Text + allowFontScaling) | role-match |
| `src/components/WeightInput/index.tsx` | component | event-driven | `src/components/TextInput/index.tsx` | exact |
| `src/components/SetResultButton/index.tsx` | component | event-driven | `src/components/PracticeSetCard/index.tsx` (Go/No-Go Pressable) | exact — extract |

---

## Pattern Assignments

### `app/(session)/index.tsx` (route, request-response)

**Analog:** `app/(onboarding)/practice-set.tsx`

**Imports pattern** (lines 14–23):
```typescript
import { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { setOnboardingComplete } from '@/hooks/useOnboardingState';
import { OnboardingStepLayout } from '@/components/OnboardingStepLayout';
import { PracticeSetCard } from '@/components/PracticeSetCard';
import { Button } from '@/components/Button';
```

For `session/index.tsx`, adapt imports to:
```typescript
import { useEffect, useRef } from 'react';
import { View, AppState } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { getPowerSync } from '@/lib/powersync';
import { useSessionPersistence } from '@/hooks/useSessionPersistence';
import { useRestTimer } from '@/hooks/useRestTimer';
import { SessionHeader } from '@/components/SessionHeader';
import { ExerciseCard } from '@/components/ExerciseCard';
import { RestTimerPill } from '@/components/RestTimerPill';
import { AnubisOverlay } from '@/components/AnubisOverlay';
```

**Full-screen route pattern** — no tab bar; uses Stack with `headerShown: false`. Analog is `app/(onboarding)/_layout.tsx` lines 9–27:
```typescript
// app/(session)/_layout.tsx — copy this pattern exactly
import { Stack } from 'expo-router';

export default function SessionLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
```

**keep-awake lifecycle pattern** — from RESEARCH.md Pattern 6; analogous to subscription cleanup in `useSession.ts` lines 32–54:
```typescript
useEffect(() => {
  activateKeepAwakeAsync('session-active');
  return () => {
    deactivateKeepAwake('session-active');
  };
}, []);
```

**Navigation on completion** (analog: `practice-set.tsx` line 65):
```typescript
router.replace('/(tabs)');
```

**SafeAreaView shell** (analog: `OnboardingStepLayout/index.tsx` line 70):
```typescript
<SafeAreaView className="flex-1 bg-bg">
```

---

### `src/hooks/useSetResult.ts` (hook, event-driven)

**Analog:** `src/components/PracticeSetCard/index.tsx` — extract the inline state machine directly.

**State type** (PracticeSetCard lines 16):
```typescript
type SetResult = null | 'go' | 'no-go';
```

**State machine handlers** (PracticeSetCard lines 25–33):
```typescript
const handleGo = async () => {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  setResult((prev) => (prev === 'go' ? null : 'go'));
};

const handleNoGo = async () => {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  setResult((prev) => (prev === 'no-go' ? null : 'no-go'));
};
```

**Extracted hook shape** (copy this pattern):
```typescript
import { useState, useCallback } from 'react';
import * as Haptics from 'expo-haptics';

export type SetResult = null | 'go' | 'no-go';

interface UseSetResultReturn {
  result: SetResult;
  handleGo: () => Promise<void>;
  handleNoGo: () => Promise<void>;
  reset: () => void;
}

export function useSetResult(initial: SetResult = null): UseSetResultReturn {
  const [result, setResult] = useState<SetResult>(initial);

  const handleGo = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setResult((prev) => (prev === 'go' ? null : 'go'));
  }, []);

  const handleNoGo = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setResult((prev) => (prev === 'no-go' ? null : 'no-go'));
  }, []);

  const reset = useCallback(() => setResult(null), []);

  return { result, handleGo, handleNoGo, reset };
}
```

**NOTE for FlashList recycling:** The `initial` param allows the Zustand store to provide the persisted result on recycle — do NOT rely on local `useState` default surviving a FlashList item recycle.

---

### `src/hooks/useRestTimer.ts` (hook, event-driven)

**Analog:** `src/hooks/useSession.ts` — subscription + cleanup pattern (lines 31–54).

**Subscription/cleanup structure** (useSession.ts lines 32–53):
```typescript
useEffect(() => {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, newSession) => {
    setSession(newSession);
    setLoading(false);
  });

  supabase.auth.getSession().catch((err: unknown) => {
    console.warn('[useSession] getSession() failed (offline?):', err);
    setLoading(false);
  });

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

Adapt this cleanup pattern for the timer — the `return () => { ... }` teardown is the key pattern. Also apply the MMKV pattern from `useOnboardingState.ts` (see below) for `timer_start_epoch`.

**Core timer hook shape** (from RESEARCH.md Pattern 2 + analog cleanup pattern):
```typescript
import { useState, useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { AppState } from 'react-native';
import { createMMKV } from 'react-native-mmkv';

const timerStorage = createMMKV({ id: 'rest-timer' });

export function useRestTimer() {
  const [remaining, setRemaining] = useState<number | null>(null);
  const notificationIdRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(async (durationSeconds: number) => {
    // Cancel any prior notification
    if (notificationIdRef.current) {
      await Notifications.cancelScheduledNotificationAsync(notificationIdRef.current);
    }
    // Persist start time for backgrounding accuracy (RESEARCH.md Pitfall 2)
    timerStorage.set('timer_start_epoch', Date.now().toString());
    timerStorage.set('timer_duration_seconds', durationSeconds.toString());
    // Schedule OS notification
    const id = await Notifications.scheduleNotificationAsync({
      content: { title: 'Rest complete', body: 'Back to it.', sound: false },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: durationSeconds,
      },
    });
    notificationIdRef.current = id;
    setRemaining(durationSeconds);
  }, []);

  const cancel = useCallback(async () => {
    if (notificationIdRef.current) {
      await Notifications.cancelScheduledNotificationAsync(notificationIdRef.current);
      notificationIdRef.current = null;
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRemaining(null);
  }, []);

  // Rehydrate on foreground return — RESEARCH.md Pitfall 2
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      const start = parseInt(timerStorage.getString('timer_start_epoch') ?? '0', 10);
      const duration = parseInt(timerStorage.getString('timer_duration_seconds') ?? '0', 10);
      if (!start || !duration) return;
      const elapsed = (Date.now() - start) / 1000;
      const rem = Math.max(0, duration - elapsed);
      setRemaining(rem > 0 ? rem : null);
    });
    return () => sub.remove();   // same cleanup pattern as useSession.ts line 52
  }, []);

  return { remaining, start, cancel };
}
```

---

### `src/hooks/useSessionPersistence.ts` (hook, CRUD)

**Analog:** `src/hooks/useOnboardingState.ts` + `src/lib/storage.ts` — MMKV read/write pattern.

**MMKV instance creation** (storage.ts line 44):
```typescript
storageInstance = createMMKV({ id: 'razeandrise.session', encryptionKey });
```
For session persistence, create a separate MMKV instance (not the encrypted session store):
```typescript
import { createMMKV } from 'react-native-mmkv';
const sessionStorage = createMMKV({ id: 'active-session' });
```

**MMKV key read/write pattern** (useOnboardingState.ts lines 25–26, 86–88):
```typescript
const ONBOARDING_COMPLETE_KEY = 'onboarding.complete';
// Write:
getStorage().set(ONBOARDING_COMPLETE_KEY, value ? 'true' : 'false');
// Read:
const [rawFlag] = useMMKVString(ONBOARDING_COMPLETE_KEY);
```

**MMKV delete method** — `storage.ts` line 69 uses `.remove(key)`, confirming the installed MMKV v4 API uses `.remove()` (not `.delete()`):
```typescript
removeItem: (key: string): void => { getStorage().remove(key); },
```
Use `.remove(key)` consistently in useSessionPersistence.

**Hook shape:**
```typescript
import { createMMKV } from 'react-native-mmkv';
import { useMMKVString } from 'react-native-mmkv';

const SESSION_MMKV = createMMKV({ id: 'active-session' });

export const SESSION_KEYS = {
  id: 'active_session_id',
  startedAt: 'active_session_started_at',
} as const;

export function useSessionPersistence() {
  const [sessionId] = useMMKVString(SESSION_KEYS.id);
  const [startedAt] = useMMKVString(SESSION_KEYS.startedAt);

  const saveSession = (id: string) => {
    SESSION_MMKV.set(SESSION_KEYS.id, id);
    SESSION_MMKV.set(SESSION_KEYS.startedAt, new Date().toISOString());
  };

  const clearSession = () => {
    SESSION_MMKV.remove(SESSION_KEYS.id);        // .remove() confirmed from storage.ts line 69
    SESSION_MMKV.remove(SESSION_KEYS.startedAt);
  };

  return { sessionId, startedAt, saveSession, clearSession };
}
```

---

### `src/services/sessionService.ts` (service, CRUD)

**Analog:** `src/lib/powersync.ts` — getPowerSync() singleton usage; RESEARCH.md Patterns 3 for SQL.

**PowerSync singleton import** (powersync.ts lines 30–32):
```typescript
export function getPowerSync() {
  return powersync;
}
```

**Single-set execute pattern** (RESEARCH.md Pattern 3):
```typescript
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

**Atomic completion writeTransaction pattern** (RESEARCH.md Pattern 3):
```typescript
await ps.writeTransaction(async (tx) => {
  await tx.execute(
    `INSERT OR REPLACE INTO sessions
     (id, user_id, template_id, day_label, started_at, completed_at, notes, is_deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    [sessionId, userId, templateId, dayLabel, startedAt, new Date().toISOString(), sessionNotes]
  );
  await tx.execute(
    `UPDATE split_settings SET rotation_pointer = rotation_pointer + 1 WHERE user_id = ?`,
    [userId]
  );
});
```

**Error handling** — follow `practice-set.tsx` lines 62–70: non-blocking try/catch, operation still completes on network error:
```typescript
try {
  await ps.writeTransaction(async (tx) => { /* ... */ });
} catch (_err) {
  // PowerSync writes are local SQLite — errors here are programming errors, not network
  console.warn('[sessionService] writeTransaction failed:', _err);
}
```

**IMPORTANT:** Do NOT check `rowsAffected` — PowerSync JSON view system returns 0 on success (RESEARCH.md Pitfall 4). Use `INSERT OR REPLACE` with idempotent session UUID.

---

### `src/components/SetRow/index.tsx` (component, event-driven)

**Analog:** `src/components/PracticeSetCard/index.tsx` — extend this exact visual structure.

**Container + info row pattern** (PracticeSetCard lines 35–53):
```typescript
<View className="bg-bg-elevated rounded-lg p-md border border-border gap-sm">
  <View className="flex-row items-center justify-between">
    <View>
      <Text className="text-body font-bold text-fg" allowFontScaling={false}>
        Bench Press
      </Text>
      <Text className="text-caption text-fg-muted mt-xs" allowFontScaling={false}>
        8–10 reps · 185 lbs
      </Text>
    </View>
  </View>
```

**Go/No-Go button pair pattern** (PracticeSetCard lines 56–96):
```typescript
<View className="flex-row gap-sm">
  <Pressable
    className={[
      'flex-1 h-11 rounded-md items-center justify-center border active:opacity-80',
      result === 'go' ? 'bg-accent-dim border-border-strong' : 'bg-bg border-border',
    ].join(' ')}
    onPress={handleGo}
    accessibilityRole="button"
    accessibilityLabel="Mark set as go"
    accessibilityState={{ selected: result === 'go' }}
  >
    <Text className={result === 'go' ? 'text-accent font-bold' : 'text-fg-muted'} allowFontScaling={false}>
      ✓ Go
    </Text>
  </Pressable>

  <Pressable
    className={[
      'flex-1 h-11 rounded-md items-center justify-center border active:opacity-80',
      result === 'no-go' ? 'bg-danger/20 border-danger' : 'bg-bg border-border',
    ].join(' ')}
    onPress={handleNoGo}
    accessibilityRole="button"
    accessibilityLabel="Mark set as no-go"
    accessibilityState={{ selected: result === 'no-go' }}
  >
    <Text className={result === 'no-go' ? 'text-danger font-bold' : 'text-fg-muted'} allowFontScaling={false}>
      ✗ No-go
    </Text>
  </Pressable>
</View>
```

**SetRow extends PracticeSetCard with:**
- `useSetResult` hook instead of inline state
- `WeightInput` replacing the static weight text
- Expand chevron Pressable with rotation animation
- Previous performance muted text (`NumericText` + tap-to-fill callback)
- Conditional expanded section (RPE stepper, warm-up toggle, note TextInput) below the button row

**Imports for SetRow:**
```typescript
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ChevronDown } from 'lucide-react-native';
import { useSetResult } from '@/hooks/useSetResult';
import { WeightInput } from '@/components/WeightInput';
import { SetResultButton } from '@/components/SetResultButton';
import { NumericText } from '@/components/NumericText';
```

---

### `src/components/ExerciseCard/index.tsx` (component, event-driven)

**Analog:** `src/components/PracticeSetCard/index.tsx` — card shell; `src/components/Chip/index.tsx` — selected state visual.

**Card shell** (PracticeSetCard lines 36):
```typescript
<View className="bg-bg-elevated rounded-lg p-md border border-border gap-sm">
```

**Exercise card renders:**
- Exercise name (`text-body font-bold text-fg`)
- Set count × rep range (`text-caption text-fg-muted`)
- An array of `<SetRow>` rendered as plain `View` children (NOT nested FlashList — RESEARCH.md Pitfall 6)
- Optional: swap exercise Pressable icon (Shuffle from lucide-react-native)

**NOTE:** ExerciseCard is a FlashList item. Do NOT use local `useState` for expanded row state — use Zustand store or `useRecyclingState` from FlashList v2 to prevent stale state on recycle (RESEARCH.md Pitfall 1).

---

### `src/components/RestTimerPill/index.tsx` (component, event-driven)

**Analog:** `src/components/ProgressBar/index.tsx` — `useSharedValue` + `withTiming` animated width pattern.

**Reanimated withTiming pattern** (ProgressBar lines 1–8, 43–58):
```typescript
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  useReducedMotion,
} from 'react-native-reanimated';

const widthPercent = useSharedValue(0);

useEffect(() => {
  const target = Math.min(Math.max(progress, 0), 1) * 100;
  if (reducedMotion) {
    widthPercent.value = target;
  } else {
    widthPercent.value = withTiming(target, { duration: 200 });
  }
}, [progress, reducedMotion]);

const animatedStyle = useAnimatedStyle(() => ({
  width: `${widthPercent.value}%`,
}));
```

For the countdown bar, adapt to linear 1s timing:
```typescript
widthPercent.value = withTiming(nextPercent, { duration: 1000, easing: Easing.linear });
```

**Pill overlay position** — absolutely positioned above bottom safe area. NOT inside FlashList. Use `position: absolute` via style prop (cannot animate position with NativeWind className):
```typescript
<View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
  {/* pill content */}
</View>
```

**Button variant within pill** — copy from `src/components/Button/index.tsx` `secondary` variant:
```typescript
// Skip button:
'bg-bg-elevated border border-border rounded-md h-12 w-full items-center justify-center'
// ±30s buttons: same variant, narrower width
```

**At-zero behavior** — pill turns accent color (`#F2CA50` — hex required per STATE.md rule; NativeWind cannot use dynamic colors):
```typescript
// Use style prop for dynamic accent background, not className:
<View style={{ backgroundColor: isComplete ? '#F2CA50' : undefined }} className="...base classes...">
```

---

### `src/components/SessionHeader/index.tsx` (component, event-driven)

**Analog:** `src/components/OnboardingStepLayout/index.tsx` header region (lines 72–79).

**Header row pattern** (OnboardingStepLayout lines 72–79):
```typescript
<View className="px-md pt-sm flex-row items-center">
  {step > 1 && onBack ? (
    <IconButton variant="back" onPress={onBack} accessibilityLabel="Back" />
  ) : (
    <View className="w-11 h-11" />
  )}
</View>
```

SessionHeader adapts to:
```typescript
<View className="px-md pt-sm flex-row items-center justify-between">
  {/* Day label — text-body font-bold text-fg */}
  <Text className="text-body font-bold text-fg" allowFontScaling={false}>{dayLabel}</Text>
  {/* Elapsed timer — NumericText, isolated component, safe to re-render independently */}
  <ElapsedTimer startedAt={startedAt} />
  {/* Complete button — Button variant="primary" or Pressable */}
  <Button label="Complete" variant="primary" onPress={onComplete} />
</View>
```

**Elapsed timer isolation pattern** — SessionHeader is NOT inside the FlashList, so a `useState` tick every second here is safe and will NOT cause FlashList re-renders (RESEARCH.md Code Examples, "Elapsed Timer Without State Re-renders" alternative).

**Complete button** — copy from `Button/index.tsx` primary variant:
```typescript
'bg-accent rounded-md h-12 w-full items-center justify-center'
```

---

### `src/components/AnubisOverlay/index.tsx` (component, event-driven)

**Analog:** `src/components/ProgressBar/index.tsx` — Reanimated `useSharedValue` + `withTiming` for fade-in overlay; RESEARCH.md Pattern 4 for LottieView.

**Reanimated fade-in** (adapt from ProgressBar animated style pattern, lines 56–58):
```typescript
const opacity = useSharedValue(0);

const animatedStyle = useAnimatedStyle(() => ({
  opacity: opacity.value,
}));

// Trigger on mount:
useEffect(() => {
  opacity.value = withTiming(1, { duration: 600 });
}, []);
```

**Full-screen absolute overlay** — style prop (not className) for position:
```typescript
<Animated.View
  style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0A0A0B' }, animatedStyle]}
>
```

**LottieView pattern** (RESEARCH.md Pattern 4):
```typescript
import LottieView from 'lottie-react-native';

<LottieView
  source={require('../../../assets/animations/anubis.json')}
  autoPlay
  loop={false}
  style={{ width: '60%', height: '60%' }}
  onAnimationFinish={() => {
    router.replace('/(tabs)/');
  }}
/>
```

**Navigation on finish** (same as practice-set.tsx line 65):
```typescript
router.replace('/(tabs)');
```

---

### `src/components/BodyMap/index.tsx` (component, event-driven)

**Analog:** `src/components/Chip/index.tsx` — Pressable with selection state toggle + haptics.

**Selection state pattern** (Chip lines 32–49):
```typescript
const handlePress = async () => {
  if (haptics) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
  onPress?.();
};
```

**Selected vs unselected visual** (Chip lines 48–54):
```typescript
<Pressable
  className={[
    'rounded-lg p-md border relative active:opacity-80',
    selected ? 'bg-accent-dim border-border-strong' : 'bg-bg-elevated border-border',
  ].join(' ')}
```

For BodyMap, each SVG `Path` muscle group wraps in `Pressable` with the same selection toggle pattern. Selected muscles use `fill="#F2CA50"` (accent hex — hex required for SVG fill, cannot use NativeWind className on SVG elements).

**SVG import** (react-native-svg already installed):
```typescript
import Svg, { Path, G } from 'react-native-svg';
```

---

### `src/components/NumericText/index.tsx` (component, transform)

**Analog:** `src/components/PracticeSetCard/index.tsx` — Text with `allowFontScaling={false}` pattern (lines 44–48, 49–52).

**Text atom pattern** (PracticeSetCard lines 44–48):
```typescript
<Text
  className="text-body font-bold text-fg"
  allowFontScaling={false}
>
  Bench Press
</Text>
```

NumericText wraps this with tabular-nums font variant (style prop required — NativeWind does not have fontVariant utility):
```typescript
import React from 'react';
import { Text, TextProps, StyleProp, TextStyle } from 'react-native';

interface NumericTextProps extends Omit<TextProps, 'style'> {
  className?: string;
  style?: StyleProp<TextStyle>;
}

export function NumericText({ style, ...props }: NumericTextProps) {
  return (
    <Text
      allowFontScaling={false}
      style={[{ fontVariant: ['tabular-nums'] }, style]}
      {...props}
    />
  );
}
```

---

### `src/components/WeightInput/index.tsx` (component, event-driven)

**Analog:** `src/components/TextInput/index.tsx` — TextInput with focus state, `allowFontScaling={false}`, `placeholderTextColor`.

**Focus state pattern** (TextInput lines 38–55):
```typescript
const [focused, setFocused] = useState(false);

const handleFocus: RNTextInputProps['onFocus'] = (e) => {
  setFocused(true);
  onFocus?.(e);
};

const handleBlur: RNTextInputProps['onBlur'] = (e) => {
  setFocused(false);
  onBlur?.(e);
};
```

**Input class with focus state** (TextInput lines 47–53):
```typescript
const baseInputClass = [
  'flex-1 px-md text-body text-fg h-12',
  error
    ? 'bg-danger-dim border border-danger'
    : focused
    ? 'bg-bg-elevated border border-border-strong'
    : 'bg-bg-elevated border border-border',
].join(' ');
```

**placeholderTextColor** (TextInput line 89):
```typescript
placeholderTextColor="#99907C"
```

**WeightInput specialization** (adapt TextInput):
```typescript
import React, { useState, forwardRef } from 'react';
import { TextInput as RNTextInput, TextInputProps as RNTextInputProps } from 'react-native';

interface WeightInputProps extends Omit<RNTextInputProps, 'style' | 'keyboardType'> {
  error?: boolean;
}

// forwardRef pattern copied from TextInput/index.tsx line 38:
const WeightInput = forwardRef<RNTextInput, WeightInputProps>(({ error = false, onFocus, onBlur, ...props }, ref) => {
  const [focused, setFocused] = useState(false);
  // ... same focus handlers as TextInput ...
  return (
    <RNTextInput
      ref={ref}
      keyboardType="decimal-pad"     // D-07: decimal-pad for weight entry
      allowFontScaling={false}
      placeholderTextColor="#99907C"
      style={{ fontVariant: ['tabular-nums'] }}  // NumericText convention
      // ... class + focus state ...
      {...props}
    />
  );
});
```

---

### `src/components/SetResultButton/index.tsx` (component, event-driven)

**Analog:** `src/components/PracticeSetCard/index.tsx` — individual Go or No-Go Pressable extracted as standalone atom.

**Go button pattern** (PracticeSetCard lines 57–75):
```typescript
<Pressable
  className={[
    'flex-1 h-11 rounded-md items-center justify-center border active:opacity-80',
    result === 'go' ? 'bg-accent-dim border-border-strong' : 'bg-bg border-border',
  ].join(' ')}
  onPress={handleGo}
  accessibilityRole="button"
  accessibilityLabel="Mark set as go"
  accessibilityState={{ selected: result === 'go' }}
>
  <Text
    className={result === 'go' ? 'text-accent font-bold' : 'text-fg-muted'}
    allowFontScaling={false}
  >
    ✓ Go
  </Text>
</Pressable>
```

**No-Go button pattern** (PracticeSetCard lines 77–95):
```typescript
<Pressable
  className={[
    'flex-1 h-11 rounded-md items-center justify-center border active:opacity-80',
    result === 'no-go' ? 'bg-danger/20 border-danger' : 'bg-bg border-border',
  ].join(' ')}
  onPress={handleNoGo}
  accessibilityRole="button"
  accessibilityLabel="Mark set as no-go"
  accessibilityState={{ selected: result === 'no-go' }}
>
  <Text
    className={result === 'no-go' ? 'text-danger font-bold' : 'text-fg-muted'}
    allowFontScaling={false}
  >
    ✗ No-go
  </Text>
</Pressable>
```

**SetResultButton component shape:**
```typescript
type SetResultVariant = 'go' | 'no-go';

interface SetResultButtonProps {
  variant: SetResultVariant;
  selected: boolean;
  onPress: () => void;
}
```

---

## Shared Patterns

### NativeWind className Convention
**Source:** Every existing component — `src/components/PracticeSetCard/index.tsx`, `Button/index.tsx`, etc.
**Apply to:** All Phase 2 components

Rule: NativeWind `className` for all styling **except**:
- `placeholderTextColor` — hex string prop (e.g. `"#99907C"`)
- `ActivityIndicator color` — hex string prop
- Dynamic colors (accent at timer zero `#F2CA50`, SVG fill) — `style` prop with hex
- `fontVariant: ['tabular-nums']` — `style` prop (no NativeWind utility exists)
- `position: 'absolute'` on animated overlays — `style` prop (NativeWind absolute works but Animated.View style merging requires style prop)

### allowFontScaling={false}
**Source:** `src/components/PracticeSetCard/index.tsx` lines 43, 49; `src/components/Button/index.tsx` line 88
**Apply to:** Every `<Text>` element in every Phase 2 component, without exception.

### Haptics Pattern
**Source:** `src/components/PracticeSetCard/index.tsx` lines 26, 31
```typescript
import * as Haptics from 'expo-haptics';
// Tap feedback:
await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
// Completion feedback:
await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
```
**Apply to:** SetResultButton (each tap), RestTimerPill (at zero), Complete Workout button.

### Error Handling (non-blocking)
**Source:** `app/(onboarding)/practice-set.tsx` lines 62–70
```typescript
try {
  // primary operation
} catch (_err) {
  // Non-blocking: operation still completes even if network fails
  // fallback behavior
} finally {
  setLoading(false);
}
```
**Apply to:** `sessionService.ts` write operations; rest timer notification scheduling (permission denial is a silent fallback per RESEARCH.md Pitfall 3).

### router.replace Navigation
**Source:** `app/(onboarding)/practice-set.tsx` line 65
```typescript
router.replace('/(tabs)');
```
**Apply to:** `AnubisOverlay` `onAnimationFinish` callback; session route exit on complete.

### PowerSync Singleton Import
**Source:** `src/lib/powersync.ts` lines 30–32
```typescript
import { getPowerSync } from '@/lib/powersync';
const ps = getPowerSync();
```
**Apply to:** `sessionService.ts` for all execute() and writeTransaction() calls.

### Lucide Icon Import
**Source:** `src/components/Chip/index.tsx` line 3; `src/components/TextInput/index.tsx` line 8
```typescript
import { Check } from 'lucide-react-native';
import { Eye, EyeOff } from 'lucide-react-native';
```
**Apply to:** All Phase 2 components using icons (ChevronDown/Up, Shuffle, MinusCircle, PlusCircle, etc.)

### MMKV Delete Key
**Source:** `src/lib/storage.ts` line 69
```typescript
getStorage().remove(key);   // confirmed: installed react-native-mmkv v4 uses .remove()
```
**Apply to:** `useSessionPersistence.ts`, `useRestTimer.ts` — use `.remove()` not `.delete()`.

---

## No Analog Found

All 14 files have analogs. The following files have only partial analogs (planner should also use RESEARCH.md code examples as supplementary reference):

| File | Reason for Partial Analog |
|------|--------------------------|
| `src/hooks/useRestTimer.ts` | No existing timer hook; structure follows `useSession.ts` cleanup pattern but timer logic comes from RESEARCH.md Pattern 2 |
| `src/services/sessionService.ts` | No existing service layer; SQL comes from RESEARCH.md Pattern 3; error handling from `practice-set.tsx` |
| `src/components/BodyMap/index.tsx` | No existing SVG component; selection pattern from `Chip`; SVG rendering is new to the codebase |
| `src/components/AnubisOverlay/index.tsx` | Lottie is new; fade pattern from ProgressBar; LottieView API from RESEARCH.md Pattern 4 |

---

## Metadata

**Analog search scope:** `src/components/`, `src/hooks/`, `src/lib/`, `app/(onboarding)/`, `app/(tabs)/`, `app/_layout.tsx`
**Files scanned:** 14 existing source files read in full
**Pattern extraction date:** 2026-05-20
