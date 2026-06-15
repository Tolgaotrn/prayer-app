import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Huda',
  slug: 'noor',
  version: '1.0.4',
  orientation: 'portrait',
  scheme: 'huda',
  icon: './assets/icons/icon.png',
  userInterfaceStyle: 'light',
  backgroundColor: '#F2EDE4',
  splash: {
    // Logo düz krem (#F2EDE4) zemine gömülü → contain bandı görünmez,
    // splash arka planı uygulama yüzeyiyle birebir aynı (beyaz bant yok).
    image: './assets/icons/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#F2EDE4',
  },
  assetBundlePatterns: ['**/*'],
  locales: {
    en: './locales/en.json',
    tr: './locales/tr.json',
    fr: './locales/fr.json',
    id: './locales/id.json',
    ar: './locales/ar.json',
    de: './locales/de.json',
    ur: './locales/ur.json',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.tolgaoturan.huda',
    buildNumber: '1',
    entitlements: {
      'com.apple.security.application-groups': ['group.com.tolgaoturan.huda'],
    },
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSLocationWhenInUseUsageDescription:
        'Huda uses your location to show accurate daily prayer times for your city.',
      NSPrivacyPolicyURL:
        'https://aware-bone-2fc.notion.site/Huda-App-Privacy-Policy-3764d64566b6818899ead7c74e226341',
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
    // Public RevenueCat iOS key — safe to embed in the bundle. Env var overrides
    // it if set (e.g. for a separate sandbox project), but never falls back to ''.
    revenueCatApiKey:
      process.env.REVENUECAT_API_KEY ?? 'appl_XJJfseLiJHJYJnSwKHYlDrFvcGb',
    router: {},
    eas: {
      projectId: '5fa3ab12-3a40-4fe4-a5a1-808d1ba3d1ec',
    },
  },
});
