import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Optional Lucide icon component (e.g. Dumbbell, Flame) */
  icon?: React.ReactNode;
  /** Enable haptic feedback on press — default true (UI-SPEC haptics section) */
  haptics?: boolean;
}

/**
 * Chip — selectable card with label + optional icon.
 * Used for: primary goal choices (Strength, Hypertrophy, Fat Loss, General Fitness).
 *
 * Selected: border-border-strong + bg-accent-dim + Lucide Check 16px absolute top-right
 *   Text: text-body-emphasis (bold)
 * Unselected: border-border + bg-bg-elevated
 *   Text: text-fg
 *
 * accessibilityRole="radio" per UI-SPEC accessibility section.
 * accessibilityState.selected = selected.
 *
 * On press: Haptics.impactAsync(Light) when haptics=true (default).
 * No StyleSheet.create — all styling via NativeWind className.
 * allowFontScaling={false} on all Text per UI-SPEC Accessibility section.
 */
export function Chip({
  label,
  selected = false,
  onPress,
  icon,
  haptics = true,
}: ChipProps) {
  const handlePress = async () => {
    if (haptics) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  return (
    <Pressable
      className={[
        'rounded-lg p-md border relative active:opacity-80',
        selected
          ? 'bg-accent-dim border-border-strong'
          : 'bg-bg-elevated border-border',
      ].join(' ')}
      onPress={handlePress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      {selected && (
        <View className="absolute top-sm right-sm">
          <Check size={16} className="text-accent" color="currentColor" />
        </View>
      )}
      {icon && (
        <View className="mb-xs">
          {icon}
        </View>
      )}
      <Text
        className={selected ? 'text-body font-bold text-fg' : 'text-body text-fg'}
        allowFontScaling={false}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default Chip;
