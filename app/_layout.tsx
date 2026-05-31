import React, { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
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
import { AppState } from 'react-native';
import { colors } from '../constants/theme';
import { useConfigureRevenueCat } from '../lib/revenueCat';
import { analytics } from '../lib/analytics';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useConfigureRevenueCat();
  // Flush PostHog events when app goes to background
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') analytics.flush();
    });
    return () => sub.remove();
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

  return (
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
              <Stack.Screen name="qibla" />
              <Stack.Screen name="dhikr" />
              <Stack.Screen name="notifications-settings" />
              <Stack.Screen name="prayer-times" />
              <Stack.Screen name="explore-topics" options={{ animation: 'slide_from_bottom' }} />
            </Stack>
          </View>
        </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
