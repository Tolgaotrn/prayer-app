import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,

  I18nManager,} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, RadialGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePostHog } from 'posthog-react-native';

import { ScreenContainer } from '../components/layout/ScreenContainer';
import { GoldButton } from '../components/ui/GoldButton';
import { fonts, radii, spacing, colors } from '../constants/theme';
import { useThemeColors } from '../lib/useThemeColors';
import { haptic } from '../lib/haptics';
import { enableDeviceLocation, setManualLocation } from '../lib/prayerTimes';

export const LOCATION_PROMPTED_KEY = 'huda_location_prompted';

// ── Geocoding API (Open-Meteo — ücretsiz, API key yok) ──────────────────────

interface GeoResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  country_code: string;
  admin1?: string; // eyalet / bölge
}

async function searchCities(query: string): Promise<GeoResult[]> {
  if (!query.trim()) return [];
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=12&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = await res.json();
  return (json.results ?? []) as GeoResult[];
}

/** Debounced arama hook'u */
function useGeoSearch() {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<GeoResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const q = query.trim();
    if (!q) { setResults([]); setLoading(false); setError(false); return; }

    setLoading(true);
    setError(false);
    timer.current = setTimeout(async () => {
      try {
        const data = await searchCities(q);
        setResults(data);
      } catch {
        setError(true);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [query]);

  return { query, setQuery, results, loading, error };
}

// ── Animated compass hero ────────────────────────────────────────────────────

function LocationHero({ size = 180 }: { size?: number }) {
  const pulse1 = useSharedValue(0);
  const pulse2 = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    pulse1.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.out(Easing.ease) }), -1, false);
    setTimeout(() => {
      pulse2.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.out(Easing.ease) }), -1, false);
    }, 1100);
    rotate.value = withRepeat(withTiming(1, { duration: 18000, easing: Easing.linear }), -1, false);
  }, []);

  const ring1Style = useAnimatedStyle(() => ({ opacity: (1 - pulse1.value) * 0.45, transform: [{ scale: 0.6 + pulse1.value * 0.6 }] }));
  const ring2Style = useAnimatedStyle(() => ({ opacity: (1 - pulse2.value) * 0.3, transform: [{ scale: 0.55 + pulse2.value * 0.65 }] }));
  const rotateStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotate.value * 360}deg` }] }));

  const cx = size / 2;
  const cy = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: colors.gold.primary + '12' }, ring1Style]} />
      <Animated.View style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: colors.gold.primary + '0C' }, ring2Style]} />
      <Animated.View style={[{ position: 'absolute' }, rotateStyle]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {Array.from({ length: 12 }, (_, i) => {
            const angle = (i / 12) * 2 * Math.PI;
            const r1 = size * 0.4;
            const r2 = size * 0.45;
            return (
              <Line
                key={i}
                x1={cx + r1 * Math.cos(angle)} y1={cy + r1 * Math.sin(angle)}
                x2={cx + r2 * Math.cos(angle)} y2={cy + r2 * Math.sin(angle)}
                stroke={colors.gold.primary}
                strokeOpacity={i % 3 === 0 ? 0.7 : 0.3}
                strokeWidth={i % 3 === 0 ? 2 : 1}
                strokeLinecap="round"
              />
            );
          })}
        </Svg>
      </Animated.View>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute' }}>
        <Defs>
          <RadialGradient id="locGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={colors.gold.bright} stopOpacity="0.2" />
            <Stop offset="100%" stopColor={colors.gold.bright} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={cx} cy={cy} r={size * 0.44} stroke={colors.gold.primary} strokeOpacity={0.2} strokeWidth={1} fill="url(#locGlow)" />
        <Circle cx={cx} cy={cy} r={size * 0.32} stroke={colors.gold.primary} strokeOpacity={0.12} strokeWidth={0.8} fill="none" />
      </Svg>
      <View style={{
        width: size * 0.3, height: size * 0.3, borderRadius: size * 0.15,
        backgroundColor: colors.gold.primary + '22',
        borderWidth: 1.5, borderColor: colors.gold.primary + '55',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name="location" size={size * 0.13} color={colors.gold.primary} />
      </View>
    </View>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function LocationSetup() {
  const router = useRouter();
  const posthog = usePostHog();
  const tc = useThemeColors();
  const [mode, setMode] = React.useState<'intro' | 'denied' | 'search'>('intro');
  const [busy, setBusy] = React.useState(false);
  const geo = useGeoSearch();

  React.useEffect(() => { posthog?.capture('location_setup_viewed'); }, [posthog]);

  const markPrompted = React.useCallback(() => {
    AsyncStorage.setItem(LOCATION_PROMPTED_KEY, '1').catch(() => {});
  }, []);

  const close = React.useCallback(() => {
    markPrompted();
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/feed');
  }, [router, markPrompted]);

  const useDeviceLocation = async () => {
    haptic.medium();
    setBusy(true);
    const ok = await enableDeviceLocation();
    setBusy(false);
    if (ok) {
      posthog?.capture('location_permission_granted', { method: 'device' });
      haptic.success();
      close();
    } else {
      posthog?.capture('location_permission_denied');
      haptic.light();
      setMode('denied');
    }
  };

  const pickResult = async (item: GeoResult) => {
    haptic.select();
    posthog?.capture('location_set_manually', { city: item.name, country: item.country });
    await setManualLocation({
      latitude: item.latitude,
      longitude: item.longitude,
      city: item.name,
      countryCode: item.country_code,
    });
    haptic.success();
    close();
  };

  // ── INTRO / DENIED ──
  if (mode === 'intro' || mode === 'denied') {
    return (
      <ScreenContainer>
        <Pressable
          accessibilityRole="button" accessibilityLabel="Close"
          hitSlop={12} style={styles.close}
          onPress={() => { haptic.light(); close(); }}
        >
          <Ionicons name="close" size={24} color={tc.muted} />
        </Pressable>

        <View style={styles.introBody}>
          <Animated.View entering={FadeIn.duration(500)}>
            <LocationHero size={180} />
          </Animated.View>

          <Animated.Text entering={FadeInDown.delay(120)} style={[styles.title, { color: tc.heading }]}>
            Accurate prayer times{'\n'}for your location
          </Animated.Text>

          <Animated.View entering={FadeInDown.delay(200)} style={styles.featureRow}>
            {['Prayer times', 'Qibla direction', 'Local sunrise'].map((f) => (
              <View key={f} style={[styles.featurePill, { backgroundColor: tc.gold + '18', borderColor: tc.gold + '33' }]}>
                <Ionicons name="checkmark" size={12} color={tc.gold} />
                <Text style={[styles.featureText, { color: tc.gold }]}>{f}</Text>
              </View>
            ))}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(280)} style={styles.privacyRow}>
            <Ionicons name="lock-closed-outline" size={13} color={tc.muted} />
            <Text style={[styles.privacyText, { color: tc.muted }]}>Never shared · stays on your device</Text>
          </Animated.View>

          {mode === 'denied' && (
            <Animated.View
              entering={FadeInDown.duration(300)}
              style={[styles.deniedBanner, { backgroundColor: tc.raisedBg, borderColor: tc.border }]}
            >
              <Ionicons name="location-outline" size={16} color={tc.muted} />
              <Text style={[styles.deniedText, { color: tc.muted }]}>
                Location access is off. Enable it in Settings or search for your city below.
              </Text>
            </Animated.View>
          )}
        </View>

        <View style={styles.introFooter}>
          {mode === 'intro' ? (
            <GoldButton
              label={busy ? 'Please wait…' : 'Use my current location'}
              onPress={useDeviceLocation}
            />
          ) : (
            <GoldButton
              label="Search for my city"
              onPress={() => { haptic.select(); setMode('search'); }}
            />
          )}
          {mode === 'intro' && (
            <Pressable
              onPress={() => { haptic.select(); setMode('search'); }}
              style={styles.manualBtn}
              accessibilityRole="button"
            >
              <Ionicons name="globe-outline" size={16} color={tc.gold} />
              <Text style={[styles.manualText, { color: tc.gold }]}>Search for my city</Text>
            </Pressable>
          )}
        </View>
      </ScreenContainer>
    );
  }

  // ── SEARCH ──
  const showEmpty = !geo.loading && !geo.error && geo.query.trim().length > 0 && geo.results.length === 0;
  const showHint  = geo.query.trim().length === 0;

  return (
    <ScreenContainer padded={false}>
      <View style={styles.pickerHeader}>
        <Pressable
          onPress={() => { haptic.light(); setMode('intro'); geo.setQuery(''); }}
          style={[styles.backBtn, { backgroundColor: tc.cardBg }]}
          accessibilityRole="button" accessibilityLabel="Back"
        >
          <Ionicons name={I18nManager.isRTL ? 'arrow-forward' : 'arrow-back'} size={22} color={tc.heading} />
        </Pressable>
        <Text style={[styles.pickerTitle, { color: tc.heading }]}>Search city</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search input */}
      <View style={[styles.searchBox, { backgroundColor: tc.cardBg, borderColor: tc.border }]}>
        <Ionicons name="search" size={18} color={tc.muted} />
        <TextInput
          value={geo.query}
          onChangeText={geo.setQuery}
          placeholder="Search city or country…"
          placeholderTextColor={tc.muted}
          style={[styles.searchInput, { color: tc.heading }]}
          autoCorrect={false}
          autoCapitalize="words"
          autoFocus
          returnKeyType="search"
        />
        {geo.loading && <ActivityIndicator size="small" color={tc.gold} />}
        {!geo.loading && geo.query.length > 0 && (
          <Pressable onPress={() => geo.setQuery('')} hitSlop={8} accessibilityLabel="Clear">
            <Ionicons name="close-circle" size={18} color={tc.muted} />
          </Pressable>
        )}
      </View>

      {/* Hint / error / results */}
      {showHint && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.hintWrap}>
          <Ionicons name="earth-outline" size={44} color={tc.border} />
          <Text style={[styles.hintTitle, { color: tc.heading }]}>Find any city</Text>
          <Text style={[styles.hintSub, { color: tc.muted }]}>
            Type a city, region, or country name. Results cover the whole world.
          </Text>
        </Animated.View>
      )}

      {geo.error && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.hintWrap}>
          <Ionicons name="cloud-offline-outline" size={44} color={tc.border} />
          <Text style={[styles.hintTitle, { color: tc.heading }]}>No connection</Text>
          <Text style={[styles.hintSub, { color: tc.muted }]}>Check your internet and try again.</Text>
        </Animated.View>
      )}

      {!showHint && !geo.error && (
        <FlatList
          data={geo.results}
          keyExtractor={(item) => String(item.id)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 30).duration(220)}>
              <Pressable
                onPress={() => pickResult(item)}
                style={({ pressed }) => [
                  styles.cityRow,
                  { backgroundColor: tc.cardBg, borderColor: tc.border, opacity: pressed ? 0.85 : 1 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${item.name}, ${item.country}`}
              >
                <View style={[styles.cityIcon, { backgroundColor: tc.raisedBg }]}>
                  <Text style={styles.flag}>{countryFlag(item.country_code)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cityName, { color: tc.heading }]}>{item.name}</Text>
                  <Text style={[styles.cityCountry, { color: tc.muted }]}>
                    {[item.admin1, item.country].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <Ionicons name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color={tc.muted} />
              </Pressable>
            </Animated.View>
          )}
          ListEmptyComponent={
            showEmpty ? (
              <View style={styles.hintWrap}>
                <Ionicons name="search-outline" size={44} color={tc.border} />
                <Text style={[styles.hintTitle, { color: tc.heading }]}>No results</Text>
                <Text style={[styles.hintSub, { color: tc.muted }]}>Try a different spelling or nearby city.</Text>
              </View>
            ) : null
          }
        />
      )}
    </ScreenContainer>
  );
}

/** ISO 3166-1 alpha-2 → emoji bayrağı (Unicode regional indicators). */
function countryFlag(code?: string): string {
  if (!code || code.length !== 2) return '🌍';
  const offset = 0x1F1E6 - 65;
  const chars = code.toUpperCase().split('').map((c) => {
    const cp = c.codePointAt(0);
    return cp !== undefined ? String.fromCodePoint(cp + offset) : '';
  });
  return chars.join('');
}

const styles = StyleSheet.create({
  close: { position: 'absolute', top: 8, right: 4, zIndex: 10, padding: 6 },

  introBody: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing.sm, gap: spacing.lg,
  },
  title: { fontFamily: fonts.serifBold, fontSize: 28, textAlign: 'center', lineHeight: 38 },
  featureRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },
  featurePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: radii.pill, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5,
  },
  featureText: { fontFamily: fonts.sansMedium, fontSize: 12 },
  privacyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  privacyText: { fontFamily: fonts.sansMedium, fontSize: 12 },
  deniedBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    borderRadius: radii.lg, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: 12,
    marginTop: spacing.sm,
  },
  deniedText: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, flex: 1 },
  introFooter: { paddingBottom: spacing.md, gap: spacing.md },
  manualBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 4 },
  manualText: { fontFamily: fonts.sansSemibold, fontSize: 15 },

  pickerHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  pickerTitle: { fontFamily: fonts.serifBold, fontSize: 20 },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: spacing.lg, marginBottom: spacing.sm,
    borderRadius: radii.lg, borderWidth: 1, paddingHorizontal: spacing.md, height: 50,
  },
  searchInput: { flex: 1, fontFamily: fonts.sans, fontSize: 15, height: '100%' },

  hintWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, gap: spacing.sm },
  hintTitle: { fontFamily: fonts.sansBold, fontSize: 17, textAlign: 'center' },
  hintSub: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, textAlign: 'center' },

  list: { paddingHorizontal: spacing.lg, paddingBottom: 120, gap: spacing.xs },
  cityRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderRadius: radii.lg, borderWidth: 1, padding: spacing.md,
  },
  cityIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  flag: { fontSize: 22 },
  cityName: { fontFamily: fonts.sansBold, fontSize: 15 },
  cityCountry: { fontFamily: fonts.sans, fontSize: 12, marginTop: 1 },
});
