/**
 * AddSetButton — ghost Pressable to insert a new set into an exercise.
 *
 * Full-width within card padding, 44pt height.
 * Renders Plus 16px icon + "Add set" label.
 * Fires Haptics.selectionAsync() on press per UI-SPEC.md Haptic Feedback table.
 *
 * All Text uses allowFontScaling={false} per Phase 2 policy.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Plus } from 'lucide-react-native';

// ── Props ─────────────────────────────────────────────────────────────────────

interface AddSetButtonProps {
  onPress: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AddSetButton({ onPress }: AddSetButtonProps) {
  const handlePress = async () => {
    await Haptics.selectionAsync();
    onPress();
  };

  return (
    <Pressable
      className="flex-row items-center justify-center h-11 rounded-md active:opacity-80"
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="Add set"
    >
      <View className="flex-row items-center gap-sm">
        <Plus size={16} color="#99907C" />
        <Text className="text-body text-fg-muted" allowFontScaling={false}>
          Add set
        </Text>
      </View>
    </Pressable>
  );
}

export default AddSetButton;
