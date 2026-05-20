/**
 * Auth group layout — full-screen Stack with no header.
 * gestureEnabled: false on the root auth screen — user cannot swipe back from auth.
 */

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Root auth screen: no back gesture (user has no prior screen to return to). */}
      <Stack.Screen name="index" options={{ gestureEnabled: false }} />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
