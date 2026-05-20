/**
 * Workouts tab — placeholder screen.
 * Full workout logging implemented in Phase 2 (Core Session Loop).
 */

import { SafeAreaView, View, Text } from 'react-native';

export default function WorkoutsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0B', alignItems: 'center', justifyContent: 'center' }}>
      <View>
        <Text style={{ fontFamily: 'Manrope', fontSize: 24, fontWeight: '700', color: '#E5E2E1' }}>
          Workouts
        </Text>
      </View>
    </SafeAreaView>
  );
}
