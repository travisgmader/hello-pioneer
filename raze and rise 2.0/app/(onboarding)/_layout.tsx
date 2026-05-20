/**
 * Onboarding group layout — full-screen Stack, slide_from_right animation.
 * gestureEnabled: true for most steps (swipe-back between steps).
 * practice-set screen: gestureEnabled: false (no accidental skip via swipe).
 *
 * Tab nav is NOT visible during onboarding (CONTEXT.md Decision 4b).
 */

import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="profile" />
      <Stack.Screen name="split" />
      <Stack.Screen name="template" />
      {/* Practice set: disable swipe-back (user must tap Skip or Complete). */}
      <Stack.Screen name="practice-set" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
