/**
 * Tab navigator — 5 tabs: Dashboard / Workouts / Split / Progress / Settings.
 *
 * Design spec (01-UI-SPEC.md):
 *   tabBarStyle: bg #0A0A0B, 1px top border rgba(212,175,55,0.22), height 56pt
 *   tabBarActiveTintColor: #F2CA50 (accent)
 *   tabBarInactiveTintColor: #99907C (fg-muted)
 *   Icons: lucide-react-native, 24px
 *   Haptics.selectionAsync() on tab change (FOUND-08)
 *
 * Offline navigation: tabs do not fetch on mount — no loading state blocking tab render.
 * NAV-01 (5-tab nav), NAV-02 (Split dedicated tab), NAV-03 (accent active state).
 */

import { Tabs } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  LayoutDashboard,
  Dumbbell,
  CalendarDays,
  LineChart,
  Settings,
} from 'lucide-react-native';

const ICON_SIZE = 24;
const ACTIVE_TINT = '#F2CA50';
const INACTIVE_TINT = '#99907C';

function triggerHaptic() {
  Haptics.selectionAsync();
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE_TINT,
        tabBarInactiveTintColor: INACTIVE_TINT,
        tabBarStyle: {
          backgroundColor: '#0A0A0B',
          borderTopWidth: 1,
          borderTopColor: 'rgba(212,175,55,0.22)',
          height: 56,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <LayoutDashboard size={ICON_SIZE} color={color} />
          ),
        }}
        listeners={{
          tabPress: triggerHaptic,
        }}
      />

      <Tabs.Screen
        name="workouts"
        options={{
          title: 'Workouts',
          tabBarIcon: ({ color }) => (
            <Dumbbell size={ICON_SIZE} color={color} />
          ),
        }}
        listeners={{
          tabPress: triggerHaptic,
        }}
      />

      <Tabs.Screen
        name="split"
        options={{
          title: 'Split',
          tabBarIcon: ({ color }) => (
            <CalendarDays size={ICON_SIZE} color={color} />
          ),
        }}
        listeners={{
          tabPress: triggerHaptic,
        }}
      />

      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }) => (
            <LineChart size={ICON_SIZE} color={color} />
          ),
        }}
        listeners={{
          tabPress: triggerHaptic,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <Settings size={ICON_SIZE} color={color} />
          ),
        }}
        listeners={{
          tabPress: triggerHaptic,
        }}
      />
    </Tabs>
  );
}
