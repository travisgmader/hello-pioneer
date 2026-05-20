/**
 * PracticeSetCard — onboarding step 4 demo set row.
 *
 * Visual-only demo: exercise name "Bench Press", reps "8–10", weight "185 lbs".
 * Two buttons: "✓ Go" (primary) and "✗ No-go" (ghost).
 * Pressing toggles state: null → "go" → "no-go" → null.
 * Haptics.impactAsync(Light) on each tap.
 *
 * No real data written — this is purely visual to demonstrate the set logging UX.
 */

import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';

type SetResult = null | 'go' | 'no-go';

/**
 * PracticeSetCard renders the demo set row for the practice-set onboarding step.
 * State cycles: null → "go" → "no-go" → null on button taps.
 */
export function PracticeSetCard() {
  const [result, setResult] = useState<SetResult>(null);

  const handleGo = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setResult((prev) => (prev === 'go' ? null : 'go'));
  };

  const handleNoGo = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setResult((prev) => (prev === 'no-go' ? null : 'no-go'));
  };

  return (
    <View className="bg-bg-elevated rounded-lg p-md border border-border gap-sm">
      {/* Exercise info row */}
      <View className="flex-row items-center justify-between">
        <View>
          <Text
            className="text-body font-bold text-fg"
            allowFontScaling={false}
          >
            Bench Press
          </Text>
          <Text
            className="text-caption text-fg-muted mt-xs"
            allowFontScaling={false}
          >
            8–10 reps · 185 lbs
          </Text>
        </View>
      </View>

      {/* Go / No-go buttons */}
      <View className="flex-row gap-sm">
        <Pressable
          className={[
            'flex-1 h-11 rounded-md items-center justify-center border active:opacity-80',
            result === 'go'
              ? 'bg-accent-dim border-border-strong'
              : 'bg-bg border-border',
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

        <Pressable
          className={[
            'flex-1 h-11 rounded-md items-center justify-center border active:opacity-80',
            result === 'no-go'
              ? 'bg-danger/20 border-danger'
              : 'bg-bg border-border',
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
      </View>
    </View>
  );
}

export default PracticeSetCard;
