/**
 * Split tab — placeholder screen.
 * Split management (NAV-02: Split gets its own dedicated tab) implemented in Phase 2.
 */

import { SafeAreaView, View, Text } from 'react-native';

export default function SplitScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0B', alignItems: 'center', justifyContent: 'center' }}>
      <View>
        <Text style={{ fontFamily: 'Manrope', fontSize: 24, fontWeight: '700', color: '#E5E2E1' }}>
          Split
        </Text>
      </View>
    </SafeAreaView>
  );
}
