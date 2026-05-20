/**
 * Migration screen — full-screen progress indicator for v1 → v2 data migration.
 * Implemented in 01-migration-PLAN.md.
 *
 * Shown when migration_status is 'pending' | 'in_progress' | 'failed'.
 * User cannot navigate away until migration succeeds (or they retry/contact support).
 */

import { SafeAreaView, View, Text } from 'react-native';

export default function MigrationScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0B', alignItems: 'center', justifyContent: 'center' }}>
      <View>
        <Text style={{ fontFamily: 'Manrope', fontSize: 16, fontWeight: '400', color: '#E5E2E1' }}>
          Migration in progress
        </Text>
      </View>
    </SafeAreaView>
  );
}
