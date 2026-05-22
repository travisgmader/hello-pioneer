/**
 * Workouts tab — entry point for starting a session (WORKOUT-16).
 *
 * Branching logic:
 *   - loading: show Spinner
 *   - template exists: show "Start workout" primary Button → router.push('/(session)/')
 *   - template === null (no template for today): show SkipDayButton
 *     → calls skipDay(userId) which advances rotation_pointer (no session row created)
 *
 * Implements WORKOUT-16: skip day flow when no template exists.
 */

import React from 'react';
import { SafeAreaView, View, Text } from 'react-native';
import { router } from 'expo-router';

import { useSession } from '@/hooks/useSession';
import { useTodaysTemplate } from '@/hooks/useSessionData';
import { skipDay } from '@/services/sessionService';
import { Button } from '@/components/Button';
import { Spinner } from '@/components/Spinner';
import { SkipDayButton } from '@/components/SkipDayButton';

export default function WorkoutsScreen() {
  const { session } = useSession();
  const userId = session?.user?.id ?? '';

  const { template, loading } = useTodaysTemplate(userId);

  const handleSkipDay = async () => {
    if (!userId) return;
    await skipDay(userId);
    // PowerSync will reactively update useTodaysTemplate when rotation_pointer changes
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <View className="px-md w-full gap-md">
        <Text
          className="text-heading text-fg font-bold text-center"
          allowFontScaling={false}
          style={{ fontFamily: 'NotoSerif_700Bold' }}
        >
          Workouts
        </Text>

        {loading ? (
          /* Loading: show spinner while PowerSync reads split_settings + templates */
          <View className="items-center">
            <Spinner />
          </View>
        ) : template !== null ? (
          /* Template exists for today — show Start workout button */
          <>
            <Text
              className="text-body text-fg-muted text-center"
              allowFontScaling={false}
            >
              Today's workout is ready. Tap to start.
            </Text>
            <Button
              label="Start workout"
              variant="primary"
              onPress={() => router.push('/(session)/' as never)}
            />
          </>
        ) : (
          /* No template for today — show Skip day button (WORKOUT-16) */
          <>
            <Text
              className="text-body text-fg-muted text-center"
              allowFontScaling={false}
            >
              No workout scheduled for today.
            </Text>
            <SkipDayButton onSkip={handleSkipDay} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
