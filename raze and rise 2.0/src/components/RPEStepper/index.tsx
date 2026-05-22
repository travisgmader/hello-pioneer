/**
 * RPEStepper — horizontal 1–10 RPE selector atom.
 *
 * Renders a flex-row gap-xs of 10 small Pressables (1–10), each 28×32pt.
 *
 * Selected cell: bg-accent-dim border border-border-strong rounded-sm
 *   Text: text-accent font-bold (NumericText)
 * Unselected cell: bg-bg-input border border-border rounded-sm
 *   Text: text-fg-muted (NumericText)
 *
 * Haptic: Haptics.selectionAsync() on each tap.
 *
 * accessibilityRole="button" per cell, accessibilityLabel "RPE N",
 * accessibilityState { selected: value === N }.
 *
 * All Text uses allowFontScaling={false} via NumericText component.
 * No StyleSheet.create — NativeWind className where possible; style prop for
 * fixed dimensions (28×32pt cell size, gap).
 *
 * UI-SPEC.md: RPE label uses text-caption, RPE values use NumericText Body emphasis.
 */

import React from 'react';
import { View, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { NumericText } from '@/components/NumericText';

interface RPEStepperProps {
  value: number | null;
  onChange: (rpe: number) => void;
}

const RPE_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function RPEStepper({ value, onChange }: RPEStepperProps) {
  const handlePress = async (rpe: number) => {
    await Haptics.selectionAsync();
    onChange(rpe);
  };

  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {RPE_VALUES.map((rpe) => {
        const isSelected = value === rpe;
        return (
          <Pressable
            key={rpe}
            style={{ width: 28, height: 32, alignItems: 'center', justifyContent: 'center' }}
            className={[
              'rounded-sm border',
              isSelected
                ? 'bg-accent-dim border-border-strong'
                : 'bg-bg-input border-border',
            ].join(' ')}
            onPress={() => handlePress(rpe)}
            accessibilityRole="button"
            accessibilityLabel={`RPE ${rpe}`}
            accessibilityState={{ selected: isSelected }}
          >
            <NumericText
              className={[
                'text-caption',
                isSelected ? 'text-accent font-bold' : 'text-fg-muted',
              ].join(' ')}
            >
              {rpe}
            </NumericText>
          </Pressable>
        );
      })}
    </View>
  );
}

export default RPEStepper;
