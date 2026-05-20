import React from 'react';
import { ActivityIndicator, View } from 'react-native';

// ActivityIndicator color must be hex string — NativeWind className not supported on this prop
const ACCENT_HEX = '#F2CA50';

export type SpinnerSize = 'small' | 'large';
export type SpinnerVariant = 'default' | 'inline' | 'bg';

interface SpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
}

/**
 * Spinner — ActivityIndicator with accent color.
 * Used inside loading Buttons (variant="bg" for bg-color on accent background)
 * and on the migration screen.
 *
 * NOTE: ActivityIndicator.color must be a hex string.
 * NativeWind className is not supported on the `color` prop.
 * This is the documented exception for raw hex usage in this codebase.
 */
export function Spinner({ size = 'small', variant = 'default' }: SpinnerProps) {
  const color = variant === 'bg' ? '#0A0A0B' : ACCENT_HEX;
  return (
    <View className="items-center justify-center">
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}

export default Spinner;
