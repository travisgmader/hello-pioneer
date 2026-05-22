import React from 'react';
import { Text, TextProps, StyleProp, TextStyle } from 'react-native';

/**
 * NumericText — tabular-nums Text wrapper for Phase 2.
 *
 * MANDATORY for every numeric display in Phase 2: weight, RPE, time, set count.
 * Prevents digit-width jitter in stacked set rows (Whoop/Strong density aesthetic).
 *
 * Applies:
 *   - `fontVariant: ['tabular-nums']` via style prop (NativeWind has no fontVariant utility)
 *   - `allowFontScaling={false}` per Phase 1/Phase 2 policy
 *   - Accepts `className` for NativeWind utilities (text-numeric, text-fg, text-fg-muted, etc.)
 *   - Forwards all other Text props via {...rest}
 *
 * The fontVariant entry is placed FIRST in the style array so caller-provided styles
 * (fontWeight, color, fontSize) can override it without specificity issues.
 *
 * No default export — follows Phase 1 named-export convention from Button/index.tsx.
 */
interface NumericTextProps extends Omit<TextProps, 'allowFontScaling'> {
  className?: string;
  style?: StyleProp<TextStyle>;
}

export function NumericText({ style, ...rest }: NumericTextProps) {
  return (
    <Text
      allowFontScaling={false}
      style={[{ fontVariant: ['tabular-nums'] }, style]}
      {...rest}
    />
  );
}
