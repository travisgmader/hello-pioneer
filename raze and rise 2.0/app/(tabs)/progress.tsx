/**
 * Progress tab — placeholder screen.
 * Progress charts and analytics implemented in Phase 3.
 */

import { SafeAreaView, View, Text } from 'react-native';

export default function ProgressScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0B', alignItems: 'center', justifyContent: 'center' }}>
      <View>
        <Text style={{ fontFamily: 'Manrope', fontSize: 24, fontWeight: '700', color: '#E5E2E1' }}>
          Progress
        </Text>
      </View>
    </SafeAreaView>
  );
}
