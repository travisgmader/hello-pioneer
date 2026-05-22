import React from 'react';
import { Pressable, Text } from 'react-native';

/**
 * SetResultButton — presentational Go/No-Go button atom for set logging.
 *
 * Extracted from PracticeSetCard (lines 57–95) as a reusable atom.
 * The parent (SetRow) owns the useSetResult hook — this component is purely
 * presentational + tap handler. Intentionally does NOT call useSetResult
 * internally, because SetRow is a FlashList item and hook state must live in
 * the parent to survive FlashList recycling (RESEARCH.md Pitfall 1).
 *
 * Visual rules (match PracticeSetCard exactly — do NOT vary):
 *   Go selected:   bg-accent-dim border-border-strong + text-accent font-bold
 *   Go unselected: bg-bg border-border + text-fg-muted
 *   No-go selected:   bg-danger/20 border-danger + text-danger font-bold
 *   No-go unselected: bg-bg border-border + text-fg-muted
 *
 * Accessibility:
 *   accessibilityRole="button"
 *   accessibilityLabel — includes setNumber when provided
 *   accessibilityState={{ selected }}
 *
 * Tap target:
 *   height: 44pt via h-11 (Tailwind 11×4px = 44px ≈ 44pt on RN)
 *   min-width: 56pt via inline style (NativeWind cannot infer pt values)
 */
interface SetResultButtonProps {
  variant: 'go' | 'no-go';
  selected: boolean;
  onPress: () => void;
  /** Optional set number for accessibilityLabel "Mark set N as go" */
  setNumber?: number;
}

export function SetResultButton({
  variant,
  selected,
  onPress,
  setNumber,
}: SetResultButtonProps) {
  const isGo = variant === 'go';

  const containerClass = [
    'flex-1 h-11 rounded-md items-center justify-center border active:opacity-80',
    isGo
      ? selected
        ? 'bg-accent-dim border-border-strong'
        : 'bg-bg border-border'
      : selected
      ? 'bg-danger/20 border-danger'
      : 'bg-bg border-border',
  ].join(' ');

  const textClass = isGo
    ? selected
      ? 'text-accent font-bold'
      : 'text-fg-muted'
    : selected
    ? 'text-danger font-bold'
    : 'text-fg-muted';

  const label = isGo ? '✓ Go' : '✗ No-go';

  const accessibilityLabel = setNumber
    ? `Mark set ${setNumber} as ${variant}`
    : `Mark set as ${variant}`;

  return (
    <Pressable
      className={containerClass}
      style={{ minWidth: 56 }}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
    >
      <Text className={textClass} allowFontScaling={false}>
        {label}
      </Text>
    </Pressable>
  );
}
