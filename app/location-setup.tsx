import React, { useEffect } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
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

import { ScreenContainer } from '../components/layout/ScreenContainer';
import { GoldButton } from '../components/ui/GoldButton';
import { fonts, radii, spacing, colors } from '../constants/theme';
import { useThemeColors } from '../lib/useThemeColors';
import { haptic } from '../lib/haptics';
import { CITIES, type City } from '../lib/cities';
import { enableDeviceLocation, setManualLocation } from '../lib/prayerTimes';

export const LOCATION_PROMPTED_KEY = 'huda_location_prompted';

/** Animated compass-like SVG with pulsing rings */
function LocationHero({ size = 180 }: { size?: number }) {
  const pulse1 = useSharedValue(0);
  const pulse2 = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    pulse1.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );
    pulse2.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );
    // slight offset start
    setTimeout(() => {
      pulse2.value = withRepeat(
        withTiming(1, { duration: 2200, easing: Easing.out(Easing.ease) }),
        -1,
        false,
      );
    }, 1100);
    rotate.value = withRepeat(
      withTiming(1, { duration: 18000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const ring1Style = useAnimatedStyle(() => ({
    opacity: (1 - pulse1.value) * 0.45,
    transform: [{ scale: 0.6 + pulse1.value * 0.6 }],
  }));
  const ring2Style = useAnimatedStyle(() => ({
    opacity: (1 - pulse2.value) * 0.3,
    transform: [{ scale: 0.55 + pulse2.value * 0.65 }],
  }));
  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value * 360}deg` }],
  }));

  const cx = size / 2;
  const cy = size / 2;
  const tickCount = 12;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Pulse rings */}
      <Animated.View
        style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: colors.gold.primary + '12' }, ring1Style]}
      />
      <Animated.View
        style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: colors.gold.primary + '0C' }, ring2Style]}
      />
      {/* Rotating tick marks */}
      <Animated.View style={[{ position: 'absolute' }, rotateStyle]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {Array.from({ length: tickCount }, (_, i) => {
            const angle = (i / tickCount) * 2 * Math.PI;
            const r1 = size * 0.4;
            const r2 = size * 0.45;
            return (
              <Line
                key={i}
                x1={cx + r1 * Math.cos(angle)}
                y1={cy + r1 * Math.sin(angle)}
                x2={cx + r2 * Math.cos(angle)}
                y2={cy + r2 * Math.sin(angle)}
                stroke={colors.gold.primary}
                strokeOpacity={i % 3 === 0 ? 0.7 : 0.3}
                strokeWidth={i % 3 === 0 ? 2 : 1}
                strokeLinecap="round"
              />
            );
          })}
        </Svg>
      </Animated.View>
      {/* Static outer ring */}
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
      {/* Center icon */}
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

export default function LocationSetup() {
  const router = useRouter();
  const tc = useThemeColors();
  const [mode, setMode] = React.useState<'intro' | 'denied' | 'cities'>('intro');
  const [query, setQuery] = React.useState('');
  const [busy, setBusy] = React.useState(false);

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
      haptic.success();
      close();
    } else {
      // Permission denied — show inline denied state
      haptic.light();
      setMode('denied');
    }
  };

  const pickCity = async (city: City) => {
    haptic.select();
    await setManualLocation({
      latitude: city.latitude,
      longitude: city.longitude,
      city: city.name,
    });
    haptic.success();
    close();
  };

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CITIES;
    return CITIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q),
    );
  }, [query]);

  // ── INTRO ──
  if (mode === 'intro' || mode === 'denied') {
    return (
      <ScreenContainer>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={12}
          style={styles.close}
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

          {/* Feature pills */}
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
            <Text style={[styles.privacyText, { color: tc.muted }]}>
              Never shared · stays on your device
            </Text>
          </Animated.View>

          {/* Denied state banner */}
          {mode === 'denied' && (
            <Animated.View
              entering={FadeInDown.duration(300)}
              style={[styles.deniedBanner, { backgroundColor: tc.raisedBg, borderColor: tc.border }]}
            >
              <Ionicons name="location-outline" size={16} color={tc.muted} />
              <Text style={[styles.deniedText, { color: tc.muted }]}>
                Location access is off. Enable it in Settings or choose your city below.
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
              label="Choose my city"
              onPress={() => { haptic.select(); setMode('cities'); }}
            />
          )}
          {mode === 'intro' && (
            <Pressable
              onPress={() => { haptic.select(); setMode('cities'); }}
              style={styles.manualBtn}
              accessibilityRole="button"
            >
              <Ionicons name="globe-outline" size={16} color={tc.gold} />
              <Text style={[styles.manualText, { color: tc.gold }]}>Choose my city manually</Text>
            </Pressable>
          )}
        </View>
      </ScreenContainer>
    );
  }

  // ── CITY PICKER ──
  return (
    <ScreenContainer padded={false}>
      <View style={styles.pickerHeader}>
        <Pressable
          onPress={() => { haptic.light(); setMode('intro'); }}
          style={[styles.backBtn, { backgroundColor: tc.cardBg }]}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="arrow-back" size={22} color={tc.heading} />
        </Pressable>
        <Text style={[styles.pickerTitle, { color: tc.heading }]}>Choose your city</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.searchBox, { backgroundColor: tc.cardBg, borderColor: tc.border }]}>
        <Ionicons name="search" size={18} color={tc.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search city or country"
          placeholderTextColor={tc.muted}
          style={[styles.searchInput, { color: tc.heading }]}
          autoCorrect={false}
          autoCapitalize="words"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear">
            <Ionicons name="close-circle" size={18} color={tc.muted} />
          </Pressable>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(c) => `${c.name}-${c.country}`}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => pickCity(item)}
            style={({ pressed }) => [
              styles.cityRow,
              { backgroundColor: tc.cardBg, borderColor: tc.border, opacity: pressed ? 0.85 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${item.name}, ${item.country}`}
          >
            <View style={[styles.cityIcon, { backgroundColor: tc.raisedBg }]}>
              <Ionicons name="location-outline" size={17} color={tc.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cityName, { color: tc.heading }]}>{item.name}</Text>
              <Text style={[styles.cityCountry, { color: tc.muted }]}>{item.country}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={tc.muted} />
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: tc.muted }]}>No cities found</Text>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  close: { position: 'absolute', top: 8, right: 4, zIndex: 10, padding: 6 },

  introBody: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing.sm, gap: spacing.lg,
  },
  title: {
    fontFamily: fonts.serifBold, fontSize: 28,
    textAlign: 'center', lineHeight: 38,
  },
  featureRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },
  featurePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: radii.pill, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  featureText: { fontFamily: fonts.sansMedium, fontSize: 12 },
  privacyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  privacyText: { fontFamily: fonts.sansMedium, fontSize: 12 },
  deniedBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    borderRadius: radii.lg, borderWidth: 1,
    paddingHorizontal: spacing.md, paddingVertical: 12,
    marginTop: spacing.sm,
  },
  deniedText: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, flex: 1 },

  introFooter: { paddingBottom: spacing.md, gap: spacing.md },
  manualBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6, paddingVertical: 4,
  },
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
    borderRadius: radii.lg, borderWidth: 1, paddingHorizontal: spacing.md, height: 48,
  },
  searchInput: { flex: 1, fontFamily: fonts.sans, fontSize: 15, height: '100%' },

  list: { paddingHorizontal: spacing.lg, paddingBottom: 120, gap: spacing.sm },
  cityRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderRadius: radii.lg, borderWidth: 1, padding: spacing.md,
  },
  cityIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  cityName: { fontFamily: fonts.sansBold, fontSize: 15 },
  cityCountry: { fontFamily: fonts.sans, fontSize: 12, marginTop: 1 },
  empty: { fontFamily: fonts.sans, fontSize: 14, textAlign: 'center', marginTop: spacing.xl },
});
