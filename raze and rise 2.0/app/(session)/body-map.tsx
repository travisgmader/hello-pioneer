/**
 * Body Map screen — pre-session injury flagging (WORKOUT-10).
 *
 * Two modes:
 *   mode='pre'  (default) — "Flag sore muscles" before workout starts.
 *                           CTA: "Start workout" → navigates to /(session)/
 *   mode='mid'            — accessed mid-session via Activity icon in SessionHeader.
 *                           CTA: "Save and resume" → router.back()
 *
 * Sore muscles are stored in sessionStore.soreMuscles.
 * At session completion (completeSession), soreMuscles are serialized into the
 * sessions.notes JSON shape: { text: sessionNotes, soreMuscles: string[] }.
 *
 * Copy (from UI-SPEC.md):
 *   Heading: "Flag sore muscles"
 *   Body:    "Optional — helps you train smart today."
 *   CTA:     "Start workout" (pre) / "Save and resume" (mid)
 *
 * All Text uses allowFontScaling={false} per Phase 2 policy.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { useSessionStore } from '@/stores/sessionStore';
import { BodyMap } from '@/components/BodyMap';
import { Button } from '@/components/Button';

// ── Component ─────────────────────────────────────────────────────────────────

export default function BodyMapScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode = params.mode === 'mid' ? 'mid' : 'pre';

  const soreMuscles = useSessionStore((s) => s.soreMuscles);
  const toggleMuscle = useSessionStore((s) => s.toggleMuscle);

  const handleCTA = () => {
    if (mode === 'mid') {
      // Mid-session: save selection and return to active session
      router.back();
    } else {
      // Pre-session: proceed to the session screen
      router.push('/(session)/' as never);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 px-md pt-lg pb-md gap-md">
        {/* Heading */}
        <Text
          className="text-heading text-fg font-bold"
          allowFontScaling={false}
          style={{ fontFamily: 'NotoSerif_700Bold', fontSize: 24, lineHeight: 30 }}
        >
          Flag sore muscles
        </Text>

        {/* Body copy */}
        <Text
          className="text-body text-fg-muted"
          allowFontScaling={false}
        >
          Optional — helps you train smart today.
        </Text>

        {/* Body map selector */}
        <View className="flex-1">
          <BodyMap selected={soreMuscles} onToggle={toggleMuscle} />
        </View>

        {/* CTA */}
        <Button
          label={mode === 'mid' ? 'Save and resume' : 'Start workout'}
          variant="primary"
          onPress={handleCTA}
        />
      </View>
    </SafeAreaView>
  );
}
