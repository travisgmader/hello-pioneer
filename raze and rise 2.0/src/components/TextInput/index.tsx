import React, { useState, forwardRef } from 'react';
import {
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  View,
  Pressable,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

export type TextInputVariant = 'text' | 'email' | 'password';

interface TextInputProps extends Omit<RNTextInputProps, 'style' | 'secureTextEntry'> {
  variant?: TextInputVariant;
  error?: boolean;
}

const EYE_HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

/**
 * TextInput — single source for all auth + onboarding text fields.
 *
 * Variants:
 *   text     — default single-line text field
 *   email    — keyboardType="email-address" + autoCapitalize="none"
 *   password — secureTextEntry with Eye/EyeOff 20px toggle (44x44pt hitSlop per UI-SPEC)
 *
 * States:
 *   default — bg-bg-elevated border border-border rounded-sm h-12 px-md
 *   focused — border-border-strong (via onFocus/onBlur state)
 *   error   — border-danger + bg-danger-dim
 *
 * No StyleSheet.create — all styling via NativeWind className.
 * allowFontScaling={false} is the Phase 1 default per UI-SPEC Accessibility section.
 *
 * Threat T-01c-I-01: password variant defaults secureTextEntry=true.
 * Eye toggle is user-initiated only.
 */
const TextInput = forwardRef<RNTextInput, TextInputProps>(
  ({ variant = 'text', error = false, onFocus, onBlur, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);

    const isPassword = variant === 'password';
    const isEmail = variant === 'email';

    const baseContainerClass = 'rounded-sm h-12 overflow-hidden';
    const baseInputClass = [
      'flex-1 px-md text-body text-fg h-12',
      error
        ? 'bg-danger-dim border border-danger'
        : focused
        ? 'bg-bg-elevated border border-border-strong'
        : 'bg-bg-elevated border border-border',
    ].join(' ');

    const handleFocus: RNTextInputProps['onFocus'] = (e) => {
      setFocused(true);
      onFocus?.(e);
    };

    const handleBlur: RNTextInputProps['onBlur'] = (e) => {
      setFocused(false);
      onBlur?.(e);
    };

    if (isPassword) {
      return (
        <View
          className={[
            baseContainerClass,
            'flex-row items-center',
            error
              ? 'bg-danger-dim border border-danger'
              : focused
              ? 'bg-bg-elevated border border-border-strong'
              : 'bg-bg-elevated border border-border',
          ].join(' ')}
        >
          <RNTextInput
            ref={ref}
            className="flex-1 px-md text-body text-fg h-12"
            allowFontScaling={false}
            secureTextEntry={!passwordVisible}
            autoCapitalize="none"
            autoCorrect={false}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholderTextColor="#99907C"
            {...props}
          />
          <Pressable
            className="px-sm items-center justify-center"
            onPress={() => setPasswordVisible((v) => !v)}
            hitSlop={EYE_HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
          >
            {passwordVisible ? (
              <EyeOff size={20} className="text-fg-muted" color="currentColor" />
            ) : (
              <Eye size={20} className="text-fg-muted" color="currentColor" />
            )}
          </Pressable>
        </View>
      );
    }

    return (
      <RNTextInput
        ref={ref}
        className={baseInputClass}
        allowFontScaling={false}
        keyboardType={isEmail ? 'email-address' : 'default'}
        autoCapitalize={isEmail ? 'none' : 'sentences'}
        autoCorrect={!isEmail}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholderTextColor="#99907C"
        {...props}
      />
    );
  }
);

TextInput.displayName = 'TextInput';

export { TextInput };
export default TextInput;
