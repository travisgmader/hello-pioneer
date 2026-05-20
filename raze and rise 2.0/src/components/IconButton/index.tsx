import React from 'react';
import { Pressable } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';

export type IconButtonVariant = 'default' | 'back';

interface IconButtonProps {
  variant?: IconButtonVariant;
  onPress?: () => void;
  accessibilityLabel?: string;
  /** Icon to render for 'default' variant */
  icon?: React.ReactNode;
}

const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };

/**
 * IconButton — 44x44pt touch target Pressable.
 *
 * Variants:
 *   back    — ChevronLeft 24px in text-fg color (UI-SPEC onboarding back chevron)
 *   default — renders the `icon` prop
 *
 * hitSlop expands touch target to 44pt minimum on all sides per UI-SPEC accessibility section.
 * accessibilityRole="button" is always set.
 * accessibilityLabel defaults to "Back" for back variant.
 *
 * Press feedback: active:opacity-80 (NativeWind utility).
 */
export function IconButton({
  variant = 'default',
  onPress,
  accessibilityLabel,
  icon,
}: IconButtonProps) {
  const label =
    accessibilityLabel ?? (variant === 'back' ? 'Back' : undefined);

  return (
    <Pressable
      className="w-11 h-11 items-center justify-center active:opacity-80"
      onPress={onPress}
      hitSlop={HIT_SLOP}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {variant === 'back' ? (
        <ChevronLeft size={24} className="text-fg" color="currentColor" />
      ) : (
        icon
      )}
    </Pressable>
  );
}

export default IconButton;
