import React from 'react';
import { Text, View } from 'react-native';
import { AlertCircle } from 'lucide-react-native';

export type HelperTextVariant = 'default' | 'error' | 'success';

interface HelperTextProps {
  children: React.ReactNode;
  variant?: HelperTextVariant;
}

/**
 * HelperText — renders below TextInput fields.
 * 12px Manrope 400 (text-caption role).
 *
 * Variants:
 *   default — text-fg-muted
 *   error   — text-danger + AlertCircle 14px icon prefix + bg-danger-dim background
 *   success — text-success
 *
 * accessibilityRole="alert" on error variant per UI-SPEC accessibility section.
 * allowFontScaling={false} is the Phase 1 default.
 */
export function HelperText({ children, variant = 'default' }: HelperTextProps) {
  if (variant === 'error') {
    return (
      <View
        className="flex-row items-center gap-xs px-sm py-xs rounded-sm bg-danger-dim"
        accessibilityRole="alert"
      >
        <AlertCircle size={14} className="text-danger" color="currentColor" />
        <Text className="text-caption text-danger flex-1" allowFontScaling={false}>
          {children}
        </Text>
      </View>
    );
  }

  if (variant === 'success') {
    return (
      <Text className="text-caption text-success" allowFontScaling={false}>
        {children}
      </Text>
    );
  }

  return (
    <Text className="text-caption text-fg-muted" allowFontScaling={false}>
      {children}
    </Text>
  );
}

export default HelperText;
