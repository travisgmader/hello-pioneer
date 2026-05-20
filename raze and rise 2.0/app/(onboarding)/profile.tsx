/**
 * Onboarding step 1: Profile — display name, units, goal.
 * Implemented in 01-navigation-onboarding-PLAN.md.
 */

import { View, Text } from 'react-native';

export default function OnboardingProfileScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0B', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#E5E2E1', fontSize: 16 }}>Onboarding step 1</Text>
    </View>
  );
}
