/**
 * Onboarding step 1: Profile screen.
 *
 * Collects display name, units, primary goal, age, sex, height, weight,
 * and body fat % (ONBOARD-02). Writes to:
 *   - supabase profiles (display_name, units, primary_goal, age, height_cm, sex)
 *   - supabase measurements (weight_kg, body_fat_pct) — if weight or body fat entered
 *
 * Back from step 1: calls signOut() then navigates to (auth).
 */

import { useState } from 'react';
import { router } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { supabase } from '@/lib/supabase';
import { updateOnboardingStep } from '@/hooks/useOnboardingState';
import { signOut } from '@/services/auth/signOut';
import { OnboardingStepLayout } from '@/components/OnboardingStepLayout';
import {
  ProfileStep,
  heightToCm,
  weightToKg,
  type ProfileStepValues,
} from '@/components/ProfileStep';

const DEFAULT_VALUES: ProfileStepValues = {
  displayName: '',
  units: 'lbs',
  goal: 'strength',
  age: '',
  sex: null,
  height: '',
  weight: '',
  bodyFat: '',
};

export default function OnboardingProfileScreen() {
  const [values, setValues] = useState<ProfileStepValues>(DEFAULT_VALUES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const continueEnabled = values.displayName.trim().length >= 1;

  const handleBack = async () => {
    await signOut();
    router.replace('/(auth)');
  };

  const handleContinue = async () => {
    if (!continueEnabled) return;
    setLoading(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError('Session expired. Please sign in again.');
        setLoading(false);
        return;
      }

      const userId = session.user.id;

      // Convert measurements
      const parsedAge = values.age ? parseInt(values.age, 10) : null;
      const height_cm = heightToCm(values.height, values.units);
      const weight_kg = weightToKg(values.weight, values.units);
      const body_fat_pct = values.bodyFat ? parseFloat(values.bodyFat) : null;

      // Step 1: Update profiles row (ONBOARD-02)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: values.displayName.trim(),
          units: values.units,
          primary_goal: values.goal,
          age: isNaN(parsedAge as number) ? null : parsedAge,
          height_cm,
          sex: values.sex,
        })
        .eq('user_id', userId);

      if (profileError) {
        setError(profileError.message || 'Failed to save profile. Please try again.');
        setLoading(false);
        return;
      }

      // Step 2: Insert initial measurements row if weight or body fat entered (ONBOARD-02)
      if (weight_kg !== null || body_fat_pct !== null) {
        const { error: measurementsError } = await supabase
          .from('measurements')
          .insert({
            id: Crypto.randomUUID(),
            user_id: userId,
            measured_at: new Date().toISOString(),
            weight_kg,
            body_fat_pct,
          });

        if (measurementsError) {
          // Non-blocking: measurements failure shouldn't halt onboarding
          console.warn('[OnboardingProfile] measurements insert failed:', measurementsError.message);
        }
      }

      // Persist step progress to MMKV for app-kill recovery
      updateOnboardingStep(1);

      router.push('/(onboarding)/split');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingStepLayout
      step={1}
      onBack={handleBack}
      onContinue={handleContinue}
      continueEnabled={continueEnabled}
      loading={loading}
    >
      <ProfileStep
        values={values}
        onChange={setValues}
        error={error}
      />
    </OnboardingStepLayout>
  );
}
