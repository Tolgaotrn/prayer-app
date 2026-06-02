import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Huda',
  slug: 'noor',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'noor',
  icon: './assets/icons/icon.png',
  userInterfaceStyle: 'light',
  backgroundColor: '#F2EDE4',
  splash: {
    image: './assets/icons/icon.png',
    resizeMode: 'contain',
    backgroundColor: '#F2EDE4',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.tolgaoturan.huda',
    buildNumber: '1',
    entitlements: {
      'com.apple.security.application-groups': ['group.com.tolgaoturan.huda'],
    },
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSLocationWhenInUseUsageDescription:
        'Huda uses your location to show accurate daily prayer times for your city.',
    },
  },
  android: {
    package: 'com.tolgaoturan.huda',
    adaptiveIcon: {
      foregroundImage: './assets/icons/icon.png',
      backgroundColor: '#F2EDE4',
    },
  },
  web: {
    bundler: 'metro',
    output: 'single',
  },
  plugins: [
    'expo-router',
    'expo-font',
    ['expo-notifications', { color: '#D4AF37' }],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Huda uses your location to show accurate daily prayer times for your city.',
      },
    ],
    [
      '@bacons/apple-targets',
      {
        // Override via EAS Secret if needed: eas secret:create --name APPLE_TEAM_ID
        appleTeamId: process.env.APPLE_TEAM_ID ?? 'M72UZZY834',
      },
    ],
    'expo-video',
    './plugins/withPrivacyManifest',
    'expo-localization',
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    // Keys exposed to the app bundle (public keys only — never secret keys here)
    revenueCatApiKey: process.env.REVENUECAT_API_KEY ?? '',
    router: {},
    eas: {
      projectId: '5fa3ab12-3a40-4fe4-a5a1-808d1ba3d1ec',
    },
  },
});
