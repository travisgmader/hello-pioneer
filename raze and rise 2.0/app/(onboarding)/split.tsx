/**
 * Onboarding step 2: Split selection screen.
 *
 * Shows 5 split options with weekly schedule previews.
 * On Continue: writes MMKV onboarding.splitType + upserts split_settings in Supabase.
 */

import { useState } from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { getStorage } from '@/lib/storage';
import { OnboardingStepLayout } from '@/components/OnboardingStepLayout';
import { SplitSelector, type SplitId } from '@/components/SplitSelector';

export default function OnboardingSplitScreen() {
  const [selected, setSelected] = useState<SplitId | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const continueEnabled = selected !== null;

  const handleBack = () => {
    router.back();
  };

  const handleContinue = async () => {
    if (!selected) return;
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

      // Persist split type to MMKV for template step
      getStorage().set('onboarding.splitType', selected);

      // Upsert split_settings row
      const { error: splitError } = await supabase
        .from('split_settings')
        .upsert(
          {
            user_id: userId,
            split_type: selected,
            rotation_pointer: 0,
            phase: 0,
            global_rest_seconds: 90,
          },
          { onConflict: 'user_id' }
        );

      if (splitError) {
        setError(splitError.message || 'Failed to save split. Please try again.');
        setLoading(false);
        return;
      }

      router.push('/(onboarding)/template');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingStepLayout
      step={2}
      onBack={handleBack}
      onContinue={handleContinue}
      continueEnabled={continueEnabled}
      loading={loading}
    >
      <View className="gap-sm">
        <Text
          className="text-fg"
          style={{ fontFamily: 'Noto Serif', fontSize: 24, fontWeight: '700' }}
          allowFontScaling={false}
        >
          Choose your split
        </Text>
        <Text
          className="text-body text-fg-muted"
          allowFontScaling={false}
        >
          Your split determines how you structure your training week.
        </Text>

        {error ? (
          <Text className="text-caption text-danger" allowFontScaling={false}>
            {error}
          </Text>
        ) : null}
      </View>

      <View className="mt-lg">
        <SplitSelector selected={selected} onSelect={setSelected} />
      </View>
    </OnboardingStepLayout>
  );
}
