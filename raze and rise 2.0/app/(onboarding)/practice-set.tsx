/**
 * Onboarding step 4: Practice set screen (optional / skippable).
 *
 * Shows a demo set row (Bench Press, 8–10, 185 lbs) for the user to try
 * the go/no-go interaction. Both "Skip for now" and "Try it" complete onboarding.
 *
 * On completion:
 *   - Upserts notification_preferences (workout_reminder_time) if time set (ONBOARD-06)
 *   - Updates profiles.onboarded = true
 *   - Sets MMKV "onboarding.complete" = "true"
 *   - Navigates to (tabs)
 */

import { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { setOnboardingComplete } from '@/hooks/useOnboardingState';
import { OnboardingStepLayout } from '@/components/OnboardingStepLayout';
import { PracticeSetCard } from '@/components/PracticeSetCard';
import { Button } from '@/components/Button';
import { Label } from '@/components/Label';

export default function OnboardingPracticeSetScreen() {
  const [workoutTime, setWorkoutTime] = useState('07:00');
  const [loading, setLoading] = useState(false);

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const userId = user?.id;

      // Upsert notification preferences if workout time set (ONBOARD-06)
      if (userId && workoutTime) {
        await supabase
          .from('notification_preferences')
          .upsert(
            {
              user_id: userId,
              workout_reminder_time: workoutTime,
              workout_reminder_enabled: true,
            },
            { onConflict: 'user_id' }
          );
      }

      // Update profiles.onboarded = true
      if (userId) {
        await supabase
          .from('profiles')
          .update({ onboarded: true })
          .eq('user_id', userId);
      }

      // Set MMKV + Supabase mirror via setOnboardingComplete
      await setOnboardingComplete(true);

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      router.replace('/(tabs)');
    } catch (_err) {
      // Non-blocking: complete onboarding even if network fails
      await setOnboardingComplete(true);
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  const skipButton = (
    <Button
      label="Skip for now"
      variant="ghost"
      onPress={completeOnboarding}
      disabled={loading}
    />
  );

  return (
    <OnboardingStepLayout
      step={4}
      onBack={() => router.back()}
      onContinue={completeOnboarding}
      continueEnabled={true}
      continueLabel="Try it"
      secondaryCTA={skipButton}
      loading={loading}
    >
      <View className="gap-md">
        {/* Heading */}
        <Text
          className="text-fg"
          style={{ fontFamily: 'Noto Serif', fontSize: 24, fontWeight: '700' }}
          allowFontScaling={false}
        >
          Try logging a set
        </Text>

        {/* Body */}
        <Text
          className="text-body text-fg-muted"
          allowFontScaling={false}
        >
          This is what every set looks like during a real workout. Tap go or
          no-go to mark it.
        </Text>

        {/* Demo set card */}
        <PracticeSetCard />

        {/* Preferred workout time (ONBOARD-06) */}
        <View className="gap-xs">
          <Label>Preferred workout time</Label>
          <TextInput
            className="bg-bg-elevated border border-border rounded-sm h-12 px-md text-body text-fg"
            keyboardType="numbers-and-punctuation"
            placeholder="07:00"
            value={workoutTime}
            onChangeText={(t) => setWorkoutTime(t)}
            placeholderTextColor="#99907C"
            allowFontScaling={false}
            maxLength={5}
          />
          <Text className="text-caption text-fg-muted" allowFontScaling={false}>
            Format: HH:MM (e.g. 06:30)
          </Text>
        </View>
      </View>
    </OnboardingStepLayout>
  );
}
