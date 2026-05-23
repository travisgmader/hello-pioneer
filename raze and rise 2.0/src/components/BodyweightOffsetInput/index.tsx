/**
 * BodyweightOffsetInput — weight input for bodyweight exercises (WORKOUT-12).
 *
 * Displays: bodyweight + offset stepper + total
 *
 * Layout (horizontal row):
 *   [bodyweightKg kg] ± [MinusCircle] [offsetKg kg] [PlusCircle] = [total kg]
 *
 * Props:
 *   bodyweightKg   — user's latest body weight from PowerSync measurements table (or null if unknown)
 *   offsetKg       — current additional load offset (e.g. vest, band) — can be negative
 *   onOffsetChange — called with the new offset value (not delta) when ± is tapped
 *
 * Clamping (T-02-16 mitigation):
 *   offset min: -(bodyweightKg ?? 0) — total weight cannot go below 0
 *   offset max: +999 — matches WeightInput upper bound
 *
 * Haptics: Haptics.selectionAsync() on each ± tap (Plan 09 spec).
 * All Text uses allowFontScaling={false} per Phase 2 policy.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { MinusCircle, PlusCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { NumericText } from '@/components/NumericText';
import { IconButton } from '@/components/IconButton';

// ── Constants ─────────────────────────────────────────────────────────────────

const STEP = 2.5; // kg increment per tap
const OFFSET_MAX = 999;

// ── Props ─────────────────────────────────────────────────────────────────────

export interface BodyweightOffsetInputProps {
  /** User's latest body weight from PowerSync measurements table. Null if not yet recorded. */
  bodyweightKg: number | null;
  /** Current load offset (additional weight, e.g. vest or band). May be negative (band-assisted). */
  offsetKg: number;
  /** Called with the NEW offset value after clamping. */
  onOffsetChange: (newOffset: number) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatOffset(offset: number): string {
  if (offset === 0) return '0 kg';
  return `${offset > 0 ? '+' : ''}${offset} kg`;
}

function formatBodyweight(bw: number | null): string {
  if (bw === null) return '— kg';
  return `${bw} kg`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BodyweightOffsetInput({
  bodyweightKg,
  offsetKg,
  onOffsetChange,
}: BodyweightOffsetInputProps) {
  // Clamp bounds (T-02-16): total >= 0, offset <= 999
  const offsetMin = bodyweightKg !== null ? -bodyweightKg : 0;
  const total = (bodyweightKg ?? 0) + offsetKg;

  const handleMinus = async () => {
    await Haptics.selectionAsync();
    const newOffset = Math.max(offsetMin, offsetKg - STEP);
    onOffsetChange(newOffset);
  };

  const handlePlus = async () => {
    await Haptics.selectionAsync();
    const newOffset = Math.min(OFFSET_MAX, offsetKg + STEP);
    onOffsetChange(newOffset);
  };

  return (
    <View
      className="flex-row items-center gap-xs"
      accessibilityLabel={`Bodyweight exercise: ${formatBodyweight(bodyweightKg)} plus ${formatOffset(offsetKg)} equals ${total} kg`}
    >
      {/* Bodyweight label */}
      <NumericText
        className="text-caption text-fg-muted"
        allowFontScaling={false}
      >
        {formatBodyweight(bodyweightKg)}
      </NumericText>

      {/* Separator */}
      <Text className="text-caption text-fg-muted" allowFontScaling={false}>
        ±
      </Text>

      {/* Minus stepper */}
      <IconButton
        icon={<MinusCircle size={20} color="#99907C" />}
        onPress={handleMinus}
        accessibilityLabel="Decrease offset"
      />

      {/* Offset value */}
      <NumericText
        className="text-caption text-fg"
        style={{ minWidth: 48, textAlign: 'center' }}
        allowFontScaling={false}
      >
        {formatOffset(offsetKg)}
      </NumericText>

      {/* Plus stepper */}
      <IconButton
        icon={<PlusCircle size={20} color="#99907C" />}
        onPress={handlePlus}
        accessibilityLabel="Increase offset"
      />

      {/* Equals separator */}
      <Text className="text-caption text-fg-muted" allowFontScaling={false}>
        =
      </Text>

      {/* Total weight */}
      <NumericText
        className="text-caption text-fg font-bold"
        allowFontScaling={false}
      >
        {total} kg
      </NumericText>
    </View>
  );
}

export default BodyweightOffsetInput;
