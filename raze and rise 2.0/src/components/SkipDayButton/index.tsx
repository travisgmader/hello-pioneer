/**
 * SkipDayButton — CTA for the Workouts tab when no template exists for today.
 *
 * Implements WORKOUT-16: advances rotation_pointer without creating a session row.
 * Used in workouts.tsx when useTodaysTemplate returns template === null.
 *
 * Design (UI-SPEC.md Destructive Actions — Skip today):
 *   - Button label: "Skip today"
 *   - No confirmation dialog (UI-SPEC.md: single tap, no confirm)
 *   - Ghost button variant (not primary — this is a secondary/destructive action)
 *   - Haptics.selectionAsync() on press
 *
 * T-02-13 mitigation: button is disabled for 500ms after tap to prevent
 * double-tap advancing rotation_pointer twice. A useRef tracks the in-flight
 * debounce so the disabled state is local and does not cause re-renders.
 *
 * All Text uses allowFontScaling={false} per Phase 2 policy (via Button component).
 */

import React, { useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/Button';

// ── Props ─────────────────────────────────────────────────────────────────────

interface SkipDayButtonProps {
  /** Called when user taps "Skip today" — caller handles the skipDay service call */
  onSkip: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SkipDayButton({ onSkip }: SkipDayButtonProps) {
  // T-02-13 mitigation: disable for 500ms after tap to prevent double-tap
  const [disabled, setDisabled] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePress = async () => {
    if (disabled) return;

    // Disable immediately to prevent double-tap
    setDisabled(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDisabled(false);
    }, 500);

    await Haptics.selectionAsync();
    onSkip();
  };

  return (
    <Button
      label="Skip today"
      variant="ghost"
      disabled={disabled}
      onPress={handlePress}
    />
  );
}

export default SkipDayButton;
