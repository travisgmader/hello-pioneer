import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  useReducedMotion,
} from 'react-native-reanimated';

interface ProgressBarProps {
  /** Progress value from 0.0 to 1.0 */
  progress: number;
  /** Optional label for accessibility (e.g. "Onboarding progress") */
  accessibilityLabel?: string;
  /** Current step for accessibilityValue.now (e.g. 2 for "Step 2 of 4") */
  currentStep?: number;
  /** Total steps for accessibilityValue.max (e.g. 4) */
  totalSteps?: number;
}

/**
 * ProgressBar — animated horizontal fill bar.
 * Used for onboarding step progress indicator.
 *
 * Track: bg-border, height 4px, full-width, rounded-full
 * Fill: bg-accent, animated width from 0 to progress*100%
 *
 * Animation: useSharedValue + withTiming(200ms ease-out) per UI-SPEC DESIGN-04
 * useReducedMotion() guard: when OS reduce-motion setting is ON, width snaps
 * to final value with no animation (required for App Store a11y compliance).
 *
 * accessibilityRole="progressbar" with accessibilityValue per UI-SPEC accessibility section.
 *
 * No StyleSheet.create — dimensions set via Animated.View style prop (required for
 * percentage-based animated width — NativeWind cannot animate dynamic percentages).
 */
export function ProgressBar({
  progress,
  accessibilityLabel = 'Progress',
  currentStep,
  totalSteps,
}: ProgressBarProps) {
  const reducedMotion = useReducedMotion();
  const widthPercent = useSharedValue(0);

  useEffect(() => {
    const target = Math.min(Math.max(progress, 0), 1) * 100;
    if (reducedMotion) {
      // Snap to final value without animation per useReducedMotion guard
      widthPercent.value = target;
    } else {
      widthPercent.value = withTiming(target, { duration: 200 });
    }
  }, [progress, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${widthPercent.value}%`,
  }));

  const accessibilityValue = {
    min: 0,
    max: totalSteps ?? 100,
    now: currentStep ?? Math.round(progress * 100),
  };

  return (
    <View
      className="h-1 w-full bg-border rounded-full overflow-hidden"
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={accessibilityValue}
    >
      <Animated.View
        className="h-full bg-accent rounded-full"
        style={animatedStyle}
      />
    </View>
  );
}

export default ProgressBar;
