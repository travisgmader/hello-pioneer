/**
 * Session group layout — full-screen Stack, NO tab bar.
 *
 * gestureEnabled: false is MANDATORY per UI-SPEC.md Back/Cancel Navigation Rules:
 *   "iOS swipe-back gesture is DISABLED on the session screen."
 *   Android hardware back is Plan 07's concern.
 *
 * The (session) route group sits OUTSIDE the (tabs) group, so the tab bar
 * is automatically hidden when navigating here (D-01).
 *
 * animation: 'fade' — slides in from bottom would feel jarring for a full-screen
 * workout screen; fade is cleaner for the session entry point.
 */

import { Stack } from 'expo-router';

export default function SessionLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, gestureEnabled: false, animation: 'fade' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="body-map" options={{ animation: 'slide_from_bottom' }} />
    </Stack>
  );
}
