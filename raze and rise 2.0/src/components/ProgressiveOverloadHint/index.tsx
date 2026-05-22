/**
 * ProgressiveOverloadHint — inline banner at the bottom of an ExerciseCard.
 *
 * Renders when shouldShowOverloadHint() returns true AND the user hasn't
 * dismissed the hint for this exercise in the current session.
 *
 * Design (UI-SPEC.md Component Inventory — ProgressiveOverloadHint):
 *   - TrendingUp 14px icon (accent color #F2CA50)
 *   - Caption text: "Try " + "+2.5–5 lbs" (accent, bold) + " next time."
 *   - Tapping anywhere on the hint dismisses it (per-session via sessionStore)
 *   - accessibilityRole="button"
 *   - Haptics.selectionAsync() on dismiss
 *
 * All Text uses allowFontScaling={false} per Phase 2 policy.
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { TrendingUp } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

// ── Props ─────────────────────────────────────────────────────────────────────

interface ProgressiveOverloadHintProps {
  /** Called when user taps the hint to dismiss it for this session */
  onDismiss: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProgressiveOverloadHint({ onDismiss }: ProgressiveOverloadHintProps) {
  const handlePress = async () => {
    await Haptics.selectionAsync();
    onDismiss();
  };

  return (
    <Pressable
      className="flex-row items-center gap-xs"
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="Progressive overload suggestion. Tap to dismiss."
    >
      <TrendingUp size={14} color="#F2CA50" />
      <View className="flex-row flex-wrap">
        <Text className="text-caption text-fg-muted" allowFontScaling={false}>
          Try{' '}
        </Text>
        <Text className="text-caption text-accent font-bold" allowFontScaling={false}>
          +2.5–5 lbs
        </Text>
        <Text className="text-caption text-fg-muted" allowFontScaling={false}>
          {' '}next time.
        </Text>
      </View>
    </Pressable>
  );
}

export default ProgressiveOverloadHint;
