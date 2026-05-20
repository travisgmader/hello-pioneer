import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Raze and Rise',
  slug: 'raze-and-rise',
  version: '1.0.0',
  scheme: 'razeandrise',
  orientation: 'portrait',
  userInterfaceStyle: 'dark',
  ios: {
    bundleIdentifier: 'com.razeandrise.app',
    usesAppleSignIn: true,
    supportsTablet: false,
  },
  android: {
    package: 'com.razeandrise.app',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0A0A0B',
    },
  },
  plugins: [
    'expo-router',
    'expo-apple-authentication',
    '@powersync/react-native',
    ['react-native-mmkv', {}],
    'expo-secure-store',
    'expo-web-browser',
  ],
  runtimeVersion: {
    policy: 'fingerprint',
  },
  updates: {
    url: 'https://u.expo.dev/placeholder',
  },
  extra: {
    eas: {
      projectId: 'placeholder',
    },
    // SDK 55 mandates New Architecture; set via extra for compatibility with typed ExpoConfig
    newArchEnabled: true,
  },
  // @ts-expect-error newArchEnabled is a valid Expo config field added in SDK 55
  newArchEnabled: true,
});
