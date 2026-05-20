import React from 'react';
import { Text, TextProps } from 'react-native';

interface LabelProps extends Omit<TextProps, 'style'> {
  children: React.ReactNode;
  /** Error state applies text-danger color */
  error?: boolean;
}

/**
 * Label — renders above TextInput fields.
 * 16px Manrope 400 (text-body role), text-fg color.
 * allowFontScaling={false} is the Phase 1 default (UI-SPEC Accessibility section).
 */
export function Label({ children, error = false, ...props }: LabelProps) {
  return (
    <Text
      className={`text-body ${error ? 'text-danger' : 'text-fg'}`}
      allowFontScaling={false}
      {...props}
    >
      {children}
    </Text>
  );
}

export default Label;
