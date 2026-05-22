import React, { useState, forwardRef } from 'react';
import {
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  View,
} from 'react-native';

/**
 * WeightInput — decimal weight entry field for set rows.
 *
 * Follows the forwardRef pattern from TextInput/index.tsx for consistency.
 * Uses decimal-pad keyboard (D-07) and tabular-nums font variant for column
 * alignment in stacked set rows.
 *
 * Validation contract:
 *   This component does NOT internally reject input — it accepts any string via
 *   onChangeText and the parent decides validity. The parent (SetRow, Plan 04)
 *   is responsible for parseFloat + range check 0.0–999.9 and setting the `error`
 *   prop to trigger the error visual state. This separation matches the TextInput
 *   precedent and keeps this atom purely presentational.
 *
 * Threat T-02-03 (client-side input validation):
 *   keyboardType="decimal-pad" constrains the on-screen keyboard to digits +
 *   decimal only. Full range validation (0 <= w <= 999.9) lives in the parent.
 *
 * States (container className):
 *   error:   bg-danger-dim border border-danger
 *   focused: bg-bg-input border border-border-strong
 *   default: bg-bg-input border border-border
 *   All:     px-md h-12 rounded-sm
 *
 * Min-width 88pt via inline style prevents layout shift when value changes
 * from a short (e.g. 95) to a long (e.g. 225.5) value.
 */
interface WeightInputProps extends Omit<RNTextInputProps, 'keyboardType' | 'allowFontScaling' | 'style'> {
  value: string;
  onChangeText: (v: string) => void;
  error?: boolean;
  disabled?: boolean;
}

const WeightInput = forwardRef<RNTextInput, WeightInputProps>(
  ({ error = false, disabled = false, onFocus, onBlur, ...props }, ref) => {
    const [focused, setFocused] = useState(false);

    const handleFocus: RNTextInputProps['onFocus'] = (e) => {
      setFocused(true);
      onFocus?.(e);
    };

    const handleBlur: RNTextInputProps['onBlur'] = (e) => {
      setFocused(false);
      onBlur?.(e);
    };

    const containerClass = [
      'px-md h-12 rounded-sm',
      error
        ? 'bg-danger-dim border border-danger'
        : focused
        ? 'bg-bg-input border border-border-strong'
        : 'bg-bg-input border border-border',
      disabled ? 'opacity-60' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <View className={containerClass} style={{ minWidth: 88 }}>
        <RNTextInput
          ref={ref}
          keyboardType="decimal-pad"
          allowFontScaling={false}
          placeholderTextColor="#99907C"
          style={{ fontVariant: ['tabular-nums'], flex: 1, height: '100%' }}
          editable={!disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
      </View>
    );
  }
);

WeightInput.displayName = 'WeightInput';

export { WeightInput };
