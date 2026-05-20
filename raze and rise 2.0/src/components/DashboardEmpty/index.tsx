/**
 * DashboardEmpty — Phase 1 stub empty state card shown on the Dashboard.
 *
 * Displays "No workout scheduled." and a Phase 2 stub caption.
 * No action button — non-functional buttons read as broken per UI-SPEC.
 */

import React from 'react';
import { View, Text } from 'react-native';

/**
 * DashboardEmpty renders the empty state card for the Dashboard stub.
 * Full workout scheduling ships in Phase 2.
 */
export function DashboardEmpty() {
  return (
    <View className="bg-bg-elevated rounded-lg p-lg">
      <Text
        className="text-body font-bold text-fg"
        allowFontScaling={false}
      >
        No workout scheduled.
      </Text>
      <View className="h-sm" />
      <Text
        className="text-caption text-fg-muted"
        allowFontScaling={false}
      >
        Real workout logging ships in Phase 2.
      </Text>
    </View>
  );
}

export default DashboardEmpty;
