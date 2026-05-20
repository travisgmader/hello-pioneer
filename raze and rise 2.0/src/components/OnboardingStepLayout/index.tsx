/**
 * OnboardingStepLayout — reusable shell for onboarding screens.
 *
 * Layout (top to bottom):
 *   SafeAreaView (bg-bg, flex-1)
 *   px-md padding row: invisible placeholder (step 1) OR ChevronLeft back button (steps 2-4)
 *   gap-sm. ProgressBar animates from (step-1)/4 to step/4 on mount (200ms ease-out).
 *   useReducedMotion() guard: snaps to final value with no animation.
 *   gap-sm. "Step {N} of {totalSteps}" caption (12px Manrope 400, fg-muted, text-right).
 *   gap-2xl.
 *   ScrollView (flex-1) containing {children}.
 *   Bottom KeyboardAvoidingView:
 *     - If secondaryCTA: flex-row (ghost 1/3 + primary 2/3)
 *     - Otherwise: full-width primary Button
 *   Safe area bottom padding.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReducedMotion } from 'react-native-reanimated';
import { ProgressBar } from '@/components/ProgressBar';
import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';

interface OnboardingStepLayoutProps {
  step: 1 | 2 | 3 | 4;
  totalSteps?: 4;
  /** step 1: signs out + navigate; steps 2-4: navigate back */
  onBack?: () => void;
  onContinue: () => void;
  continueEnabled: boolean;
  continueLabel?: string;
  /** practice-set step: ghost "Skip for now" button */
  secondaryCTA?: React.ReactNode;
  loading?: boolean;
  children: React.ReactNode;
}

/**
 * OnboardingStepLayout wraps each onboarding step with:
 * - SafeAreaView bg-bg
 * - Back button (hidden on step 1 via invisible placeholder)
 * - Animated ProgressBar (step/4), respects useReducedMotion()
 * - "Step N of 4" caption
 * - ScrollView for content
 * - Sticky bottom CTA (primary Button, or ghost+primary row when secondaryCTA provided)
 */
export function OnboardingStepLayout({
  step,
  totalSteps = 4,
  onBack,
  onContinue,
  continueEnabled,
  continueLabel = 'Continue',
  secondaryCTA,
  loading = false,
  children,
}: OnboardingStepLayoutProps) {
  const reducedMotion = useReducedMotion();
  const progress = step / totalSteps;

  return (
    <SafeAreaView className="flex-1 bg-bg">
      {/* Header row: back button or invisible placeholder */}
      <View className="px-md pt-sm flex-row items-center">
        {step > 1 && onBack ? (
          <IconButton variant="back" onPress={onBack} accessibilityLabel="Back" />
        ) : (
          // Invisible placeholder preserves layout height for step 1
          <View className="w-11 h-11" />
        )}
      </View>

      {/* Progress bar */}
      <View className="px-md gap-sm mt-sm">
        <ProgressBar
          progress={progress}
          accessibilityLabel="Onboarding progress"
          currentStep={step}
          totalSteps={totalSteps}
        />

        {/* Step caption */}
        <Text
          className="text-caption text-fg-muted text-right"
          allowFontScaling={false}
        >
          {`Step ${step} of ${totalSteps}`}
        </Text>
      </View>

      {/* Content area */}
      <ScrollView
        className="flex-1 px-md mt-2xl"
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>

      {/* Sticky bottom CTA */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View className="px-md pb-lg pt-sm">
          {secondaryCTA ? (
            <View className="flex-row gap-sm">
              <View className="flex-1">{secondaryCTA}</View>
              <View className="flex-[2]">
                <Button
                  label={continueLabel}
                  variant="primary"
                  disabled={!continueEnabled}
                  loading={loading}
                  onPress={onContinue}
                />
              </View>
            </View>
          ) : (
            <Button
              label={continueLabel}
              variant="primary"
              disabled={!continueEnabled}
              loading={loading}
              onPress={onContinue}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default OnboardingStepLayout;
