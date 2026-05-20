import React from 'react';
import { Text, View } from 'react-native';

export type DividerVariant = 'horizontal' | 'with-label';

interface DividerProps {
  variant?: DividerVariant;
  label?: string;
}

/**
 * Divider — horizontal rule with optional centered label.
 *
 * Variants:
 *   horizontal  — plain 1px bg-border line
 *   with-label  — "or" text centered in bg-input capsule, flanked by 1px bg-border lines
 *
 * Used in auth screen below the primary CTA button.
 * No StyleSheet.create — all styling via NativeWind className.
 */
export function Divider({ variant = 'horizontal', label = 'or' }: DividerProps) {
  if (variant === 'with-label') {
    return (
      <View className="flex-row items-center gap-md">
        <View className="flex-1 h-px bg-border" />
        <View className="bg-bg-input px-sm py-xs rounded-full">
          <Text
            className="text-caption text-fg-muted"
            allowFontScaling={false}
          >
            {label}
          </Text>
        </View>
        <View className="flex-1 h-px bg-border" />
      </View>
    );
  }

  return <View className="h-px bg-border w-full" />;
}

export default Divider;
