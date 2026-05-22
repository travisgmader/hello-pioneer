import React from 'react';
import { View } from 'react-native';

/**
 * LeftEdgeBar — 2px vertical state-color bar for set rows and exercise cards.
 *
 * Decorative atom only — no interactivity, no accessibility role.
 * Communicates set state (go/no-go/warm-up/none) via color per UI-SPEC.md:
 *
 *   accent  → bg-set-go    (#F2CA50) — Go result
 *   danger  → bg-set-nogo  (#EF4444) — No-Go result
 *   subtle  → bg-set-warmup (#5C564B) — Warm-up set
 *   none    → transparent  — unlogged / neutral state
 *
 * Dimensions: 2px wide, stretches full height of parent via self-stretch.
 * Parent must have a defined height (flex container) for self-stretch to work.
 */
interface LeftEdgeBarProps {
  variant: 'accent' | 'danger' | 'subtle' | 'none';
}

const VARIANT_CLASS: Record<LeftEdgeBarProps['variant'], string> = {
  accent: 'bg-set-go',
  danger: 'bg-set-nogo',
  subtle: 'bg-set-warmup',
  none: 'bg-transparent',
};

export function LeftEdgeBar({ variant }: LeftEdgeBarProps) {
  return <View className={`w-[2px] self-stretch ${VARIANT_CLASS[variant]}`} />;
}
