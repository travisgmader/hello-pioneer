/**
 * 404 Not Found screen — rendered by Expo Router when no route matches.
 */

import { SafeAreaView, View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0B', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ alignItems: 'center', gap: 16 }}>
        <Text
          style={{
            fontFamily: 'Noto Serif',
            fontSize: 24,
            fontWeight: '700',
            color: '#E5E2E1',
          }}
        >
          Not found
        </Text>
        <Pressable onPress={() => router.back()}>
          <Text
            style={{
              fontFamily: 'Manrope',
              fontSize: 16,
              fontWeight: '400',
              color: '#F2CA50',
            }}
          >
            Go back
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
