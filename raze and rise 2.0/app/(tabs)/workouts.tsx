/**
 * Workouts tab — entry point for starting a session.
 *
 * Tapping "Start workout" navigates to the full-screen session route
 * via router.push('/(session)/').
 *
 * For Plan 04 we assume a template exists for today.
 * Plan 08 wires the skip/no-template UX (WORKOUT-16).
 */

import React from 'react';
import { SafeAreaView, View, Text } from 'react-native';
import { router } from 'expo-router';

import { Button } from '@/components/Button';

export default function WorkoutsScreen() {
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
      </View>
    </SafeAreaView>
  );
}
