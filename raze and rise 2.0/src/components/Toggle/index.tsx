import React from 'react';
import { Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

interface ToggleOption<T extends string> {
  label: string;
  value: T;
}

interface ToggleProps<T extends string> {
  options: [ToggleOption<T>, ToggleOption<T>];
  value: T;
  onChange: (value: T) => void;
  /** Enable haptic feedback on change — default true (UI-SPEC haptics section) */
  haptics?: boolean;
}

/**
 * Toggle — binary two-pill toggle.
 * Used for: Sign In / Sign Up toggle, lbs / kg toggle.
 *
 * Selected pill: bg-accent-dim + border-border-strong + text-accent + font-bold + accessibilityState.selected=true
 * Unselected pill: text-fg-muted (no accent)
 *
 * Full-width by default; each pill takes 50% width.
 * On change: fires Haptics.selectionAsync() when haptics=true (default).
 *
 * No StyleSheet.create — all styling via NativeWind className.
 * allowFontScaling={false} on all Text per UI-SPEC Accessibility section.
 */
export function Toggle<T extends string>({
  options,
  value,
  onChange,
  haptics = true,
}: ToggleProps<T>) {
  const handlePress = async (optionValue: T) => {
    if (optionValue === value) return;
    if (haptics) {
      await Haptics.selectionAsync();
    }
    onChange(optionValue);
  };

  return (
    <View className="flex-row rounded-md border border-border overflow-hidden">
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <Pressable
            key={option.value}
            className={[
              'flex-1 h-11 items-center justify-center',
              isSelected
                ? 'bg-accent-dim border border-border-strong'
                : 'bg-bg-elevated',
              'active:opacity-80',
            ].join(' ')}
            onPress={() => handlePress(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={option.label}
          >
            <Text
              className={[
                'text-body',
                isSelected ? 'text-accent font-bold' : 'text-fg-muted',
              ].join(' ')}
              allowFontScaling={false}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default Toggle;
