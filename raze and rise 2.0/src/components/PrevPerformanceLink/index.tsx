import React from 'react';
import { Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { NumericText } from '@/components/NumericText';

/**
 * PrevPerformanceLink — tap-to-fill previous performance display.
 *
 * Renders a single line: "{weight} {unit} · {dots}" where:
 *   ● (U+25CF filled circle) = 'go' result
 *   ○ (U+25CB empty circle)  = 'no-go' result
 *
 * Up to 5 dots shown; longer histories are truncated at 5 with trailing ellipsis.
 * Dot colors are applied via inline style hex (hex required — set-go/set-nogo tokens
 * are NativeWind classNames, not directly addressable on Text style fragments).
 *
 * Disabled (no onPress) when weightKg is null — renders "—" placeholder.
 * On press: fires Haptics.impactAsync(Light) first, then calls onAutoFill().
 *
 * Accessibility:
 *   accessibilityRole="button"
 *   accessibilityLabel = structured description of weight, go count, no-go count
 *
 * hitSlop ensures 44pt vertical tap target without padding the visible text row.
 *
 * Per UI-SPEC.md D-09:
 *   PrevPerformanceLink is consumed by SetRow (Plan 04) to show previous session
 *   data and allow one-tap auto-fill of the weight field.
 */
interface PrevPerformanceLinkProps {
  weightKg: number | null;
  unit: 'lbs' | 'kg';
  /** Up to 5 previous set results in chronological order */
  results: ('go' | 'no-go' | null)[];
  onAutoFill: () => void;
}

const HIT_SLOP = { top: 12, bottom: 12, left: 0, right: 0 };
const MAX_DOTS = 5;

// Hex values required — NativeWind tokens are not addressable on inline Text style
const GO_COLOR = '#F2CA50';   // set-go alias
const NOGO_COLOR = '#EF4444'; // set-nogo alias

export function PrevPerformanceLink({
  weightKg,
  unit,
  results,
  onAutoFill,
}: PrevPerformanceLinkProps) {
  const isDisabled = weightKg === null;

  const handlePress = async () => {
    if (isDisabled) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAutoFill();
  };

  // Build the dots string (truncate at MAX_DOTS)
  const visibleResults = results.slice(0, MAX_DOTS);
  const isTruncated = results.length > MAX_DOTS;

  // Build accessibility label
  const goCount = results.filter((r) => r === 'go').length;
  const noGoCount = results.filter((r) => r === 'no-go').length;
  const weightDisplay = weightKg !== null ? `${weightKg} ${unit}` : '—';
  const accessibilityLabel = isDisabled
    ? 'No previous performance data'
    : `Previous: ${weightDisplay}, ${goCount} go, ${noGoCount} no-go. Tap to auto-fill.`;

  if (isDisabled) {
    return (
      <View>
        <Text className="text-caption text-fg-muted" allowFontScaling={false}>
          —
        </Text>
      </View>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={HIT_SLOP}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={isDisabled}
    >
      <View className="flex-row items-center flex-wrap">
        <NumericText className="text-caption text-fg-muted">
          {weightKg}
        </NumericText>
        <Text className="text-caption text-fg-muted" allowFontScaling={false}>
          {' '}{unit} ·{' '}
        </Text>
        {visibleResults.map((result, index) => (
          <Text
            key={index}
            allowFontScaling={false}
            style={{
              color: result === 'go' ? GO_COLOR : NOGO_COLOR,
              fontSize: 12,
            }}
          >
            {result === 'go' ? '●' : '○'}
          </Text>
        ))}
        {isTruncated && (
          <Text className="text-caption text-fg-muted" allowFontScaling={false}>
            …
          </Text>
        )}
      </View>
    </Pressable>
  );
}
