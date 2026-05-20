import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Spinner } from '@/components/Spinner';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'social-google'
  | 'social-apple';

interface ButtonProps {
  label?: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
  children?: React.ReactNode;
  /** Full width override — defaults true for primary/secondary */
  fullWidth?: boolean;
}

const variantContainerClass: Record<ButtonVariant, string> = {
  primary: 'bg-accent rounded-md h-12 w-full items-center justify-center',
  secondary:
    'bg-bg-elevated border border-border rounded-md h-12 w-full items-center justify-center',
  ghost: 'h-12 items-center justify-center',
  'social-google':
    'bg-bg-elevated border border-border rounded-md h-12 w-full flex-row items-center justify-center gap-sm',
  'social-apple':
    'bg-bg-elevated border border-border rounded-md h-12 w-full flex-row items-center justify-center gap-sm',
};

const variantTextClass: Record<ButtonVariant, string> = {
  primary: 'text-bg text-body font-bold',
  secondary: 'text-fg text-body',
  ghost: 'text-fg-muted text-body',
  'social-google': 'text-fg text-body',
  'social-apple': 'text-fg text-body',
};

/**
 * Button — primary CTA and supporting variants.
 *
 * Variants:
 *   primary      — bg-accent + text-bg (gold background, dark text)
 *   secondary    — bg-elevated + border + text-fg
 *   ghost        — transparent + text-fg-muted (used ONLY for "Skip for now")
 *   social-google — branded Google row
 *   social-apple  — branded Apple row
 *
 * Loading state: replaces label with Spinner. Button stays same width.
 * Disabled state: opacity-60.
 * Press feedback: active:opacity-80 (NativeWind utility).
 */
export function Button({
  label,
  variant = 'primary',
  disabled = false,
  loading = false,
  onPress,
  children,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const containerClass = [
    variantContainerClass[variant],
    isDisabled && !loading ? 'opacity-60' : '',
    'active:opacity-80',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Pressable
      className={containerClass}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <Spinner variant={variant === 'primary' ? 'bg' : 'default'} />
      ) : children ? (
        children
      ) : (
        <Text
          className={variantTextClass[variant]}
          allowFontScaling={false}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export default Button;
