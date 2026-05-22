/**
 * ExpandChevron — 44×44pt animated expand/collapse chevron button.
 *
 * Renders a Pressable wrapping a Reanimated.View that rotates the ChevronDown
 * icon 180° to ChevronUp visual when expanded === true. Animation: 150ms ease-out.
 *
 * UI-SPEC.md: Chevron expand button per row: 44×44pt hit area, visible icon 20px
 * Lucide ChevronDown color #99907C (fg-muted — passive interactive, not accent).
 *
 * Haptic: Haptics.selectionAsync() on press.
 * accessibilityRole="button", accessibilityLabel defaults to
 *   expanded ? "Hide set options" : "Show set options".
 *
 * allowFontScaling={false} not applicable (no Text). Pattern 1 Reanimated rotation.
 */

import React, { useEffect } from 'react';
import { Pressable } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  withTiming,
  Easing,
  useAnimatedStyle,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface ExpandChevronProps {
  expanded: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}

export function ExpandChevron({
  expanded,
  onPress,
  accessibilityLabel,
}: ExpandChevronProps) {
  const rotation = useSharedValue(expanded ? 180 : 0);

  useEffect(() => {
    rotation.value = withTiming(expanded ? 180 : 0, { duration: 150, easing: Easing.out(Easing.ease) });
  }, [expanded, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const handlePress = async () => {
    await Haptics.selectionAsync();
    onPress();
  };

  const defaultLabel = expanded ? 'Hide set options' : 'Show set options';

  return (
    <Pressable
      style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? defaultLabel}
      accessibilityState={{ expanded }}
    >
      <Animated.View style={animatedStyle}>
        <ChevronDown size={20} color="#99907C" />
      </Animated.View>
    </Pressable>
  );
}

export default ExpandChevron;
