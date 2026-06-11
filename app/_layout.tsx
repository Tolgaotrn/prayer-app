import React, { useCallback, useEffect } from 'react';
import { Platform, View } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import { useFonts } from 'expo-font';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_500Medium,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Amiri_400Regular, Amiri_700Bold } from '@expo-google-fonts/amiri';
import { PostHogProvider } from 'posthog-react-native';
import { colors } from '../constants/theme';
import { useConfigureRevenueCat } from '../lib/revenueCat';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { syncRTLOnStartup } from '../lib/rtl';
import { useOnboardingStore } from '../stores/useOnboardingStore';
import { Image as ExpoImage } from 'expo-image';
import { allThemeImageURLs } from '../data/themes';

const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useConfigureRevenueCat();

  // Açılışta RTL senkronizasyonu — Zustand getState() synchronous.
  // Kayıtlı dil Arapça ama I18nManager LTR ise (önceki restart eksikse) düzelt.
  useEffect(() => {
    const storedLang = useOnboardingStore.getState().language;
    const changed = syncRTLOnStartup(storedLang);
    if (changed) {
      // RTL durumu değişti → uygulamayı yeniden yükle (native layout düzelsin)
      Updates.reloadAsync().catch(() => {});
    }
  }, []);

  // TÜM tema görsellerini açılıştan kısa süre sonra arka planda (tam çözünürlük)
  // disk cache'e indir → galeri/temalar her zaman kaliteli ve anında açılır,
  // "tema inmiyor" sorunu biter. İlk içerik yüklemesiyle yarışmasın diye gecikmeli.
  useEffect(() => {
    const id = setTimeout(() => {
      ExpoImage.prefetch(allThemeImageURLs(), 'memory-disk').catch(() => {});
    }, 2500);
    return () => clearTimeout(id);
  }, []);

  const [loaded, error] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_500Medium,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    Amiri_400Regular,
    Amiri_700Bold,
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync().catch(() => {});
  }, [loaded, error]);

  const onLayout = useCallback(() => {}, []);

  if (!loaded && !error) return null;

  const tree = (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg.midnight }}>
      <SafeAreaProvider>
        <View style={{ flex: 1 }} onLayout={onLayout}>
          <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.bg.midnight },
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen name="(onboarding)" />
              <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
              <Stack.Screen name="verse/[id]" options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen
                name="categories"
                options={{
                  presentation: 'transparentModal',
                  animation: 'fade',
                  contentStyle: { backgroundColor: 'transparent' },
                }}
              />
              <Stack.Screen name="widget-studio" />
              <Stack.Screen name="saved-verses" />
              <Stack.Screen name="reminders-settings" />
              <Stack.Screen name="language-settings" />
              <Stack.Screen name="widget-settings" />
              <Stack.Screen name="promo-code" />
              <Stack.Screen name="qibla" />
              <Stack.Screen name="dhikr" />
              <Stack.Screen name="notifications-settings" />
              <Stack.Screen name="prayer-times" />
              <Stack.Screen name="location-setup" options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="explore-topics" options={{ animation: 'slide_from_bottom' }} />
            </Stack>
          </View>
        </SafeAreaProvider>
    </GestureHandlerRootView>
  );

  // PostHog anahtarı yoksa provider'ı hiç render etme — undefined anahtarla
  // init çökmesini önler. ErrorBoundary tüm ağacı sarar.
  return (
    <ErrorBoundary>
      {POSTHOG_KEY && Platform.OS !== 'web' ? (
        <PostHogProvider
          apiKey={POSTHOG_KEY}
          options={{
            host: process.env.EXPO_PUBLIC_POSTHOG_HOST,
            captureAppLifecycleEvents: true, // app açıldı/güncellendi (PII yok)
          }}
          // Privacy-temiz autocapture: sadece ekran ADI.
          // captureTouches=false → dokunulan metin/içerik yakalanmaz (PII yok),
          // event listesi de temiz kalır. Session replay yok, tracking yok.
          autocapture={{
            captureScreens: true,
            captureTouches: false,
          }}
        >
          {tree}
        </PostHogProvider>
      ) : (
        tree
      )}
    </ErrorBoundary>
  );
}
