import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { ArabicText } from '../../components/arabic/ArabicText';
import { StreakWidget } from '../../components/ui/StreakWidget';
import { BackButton } from '../../components/ui/BackButton';
import { colors, fonts, radii, spacing } from '../../constants/theme';
import { useThemeColors } from '../../lib/useThemeColors';
import { getTheme } from '../../data/themes';
import { useOnboardingStore } from '../../stores/useOnboardingStore';
import { useAppStore } from '../../stores/useAppStore';
import { haptic } from '../../lib/haptics';
import { fetchDailyVerse, FeedItem, resolveLang } from '../../lib/contentDb';

const PRAYER_TIMES = [
  { key: 'fajr',    name: 'Fajr',    icon: 'partly-sunny-outline' as const, time: '05:37' },
  { key: 'dhuhr',   name: 'Dhuhr',   icon: 'sunny-outline'        as const, time: '13:02' },
  { key: 'asr',     name: 'Asr',     icon: 'sunny-outline'        as const, time: '16:24' },
  { key: 'maghrib', name: 'Maghrib', icon: 'partly-sunny-outline' as const, time: '19:41' },
  { key: 'isha',    name: 'Isha',    icon: 'moon-outline'         as const, time: '21:08' },
];
const NEXT_PRAYER = 'maghrib';
const NEXT_COUNTDOWN = '2h 14m';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5)  return 'Good Night';
  if (h < 12) return 'Good Morning';
  if (h < 18) return 'Good Afternoon';
  return 'Good Evening';
}

export default function HomeCard() {
  const router      = useRouter();
  const tc          = useThemeColors();
  const name        = useOnboardingStore((s) => s.name) || 'Friend';
  const lang        = resolveLang(useOnboardingStore((s) => s.language));
  const theme       = getTheme(useOnboardingStore((s) => s.selectedTheme));
  const streakDays  = useAppStore((s) => s.streakDays);
  const [daily, setDaily] = React.useState<FeedItem | null>(null);

  React.useEffect(() => {
    fetchDailyVerse(lang).then(v => { if (v) setDaily(v); });
  }, [lang]);

  const dateStr = new Date().toLocaleDateString(undefined, {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <ScreenContainer padded={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >

        {/* ── HEADER ── */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.headerRow}>
          <BackButton style={{ marginRight: spacing.sm }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.greeting, { color: tc.heading }]} numberOfLines={1}>
              {greeting()}, {name} 🌙
            </Text>
            <Text style={[styles.date, { color: tc.muted }]}>{dateStr}</Text>
          </View>
          <Pressable
            style={[styles.profileBtn, { backgroundColor: tc.cardBg, borderColor: tc.border }]}
            onPress={() => router.push('/(tabs)/profile')}
            accessibilityRole="button"
            accessibilityLabel="Open profile"
          >
            <Ionicons name="person-outline" size={20} color={tc.heading} />
          </Pressable>
        </Animated.View>

        {/* ── NAMAZ VAKİTLERİ ── */}
        <Animated.View
          entering={FadeInDown.delay(80).duration(450)}
          style={[styles.prayerCard, { backgroundColor: tc.cardBg, borderColor: tc.border }]}
        >
          <View style={styles.prayerHead}>
            <View>
              <Text style={[styles.prayerLabel, { color: tc.muted }]}>NEXT PRAYER</Text>
              <View style={styles.nextRow}>
                <Text style={[styles.nextName, { color: tc.heading }]}>
                  {PRAYER_TIMES.find(p => p.key === NEXT_PRAYER)?.name}
                </Text>
                <Text style={[styles.nextCountdown, { color: tc.gold }]}>
                  · {NEXT_COUNTDOWN} away
                </Text>
              </View>
            </View>
            <View style={[styles.cityChip, { backgroundColor: tc.raisedBg }]}>
              <Ionicons name="location-outline" size={12} color={tc.gold} />
              <Text style={[styles.cityText, { color: tc.body }]}>Istanbul</Text>
            </View>
          </View>

          <View style={styles.timesRow}>
            {PRAYER_TIMES.map((p, i) => {
              const isNext = p.key === NEXT_PRAYER;
              return (
                <Animated.View
                  key={p.key}
                  entering={FadeInDown.delay(100 + i * 55).duration(350)}
                  style={styles.prayerCol}
                >
                  <View style={[
                    styles.prayerCircle,
                    { backgroundColor: tc.raisedBg, borderColor: tc.border },
                    isNext && { borderColor: tc.gold, borderWidth: 2, backgroundColor: tc.isDark ? 'rgba(212,175,55,0.12)' : 'rgba(201,150,58,0.12)' },
                  ]}>
                    <Ionicons
                      name={p.icon}
                      size={18}
                      color={isNext ? tc.gold : tc.muted}
                    />
                  </View>
                  <Text style={[styles.prayerName, { color: isNext ? tc.gold : tc.body }]}>
                    {p.name}
                  </Text>
                  <Text style={[styles.prayerTime, { color: isNext ? tc.heading : tc.muted }]}>
                    {p.time}
                  </Text>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        {/* ── DAILY REFLECTION ── */}
        <Animated.View entering={FadeInDown.delay(160).duration(450)}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: tc.heading }]}>Daily Reflection</Text>
            <Pressable onPress={() => router.push('/(tabs)/feed')} hitSlop={8}>
              <Text style={[styles.seeAll, { color: tc.gold }]}>Open Feed →</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => { haptic.medium(); router.push('/(tabs)/feed'); }}
            style={styles.heroCard}
            accessibilityRole="button"
            accessibilityLabel="Open verse detail"
          >
            <Image
              source={theme.image}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={300}
            />
            <LinearGradient
              colors={['rgba(7,10,20,0.3)', 'rgba(7,10,20,0.5)', 'rgba(7,10,20,0.92)']}
              locations={[0, 0.45, 1]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroBadge}>
              <Ionicons name="sparkles" size={11} color={colors.gold.bright} />
              <Text style={styles.heroBadgeText}>Verse of the day</Text>
            </View>
            {daily ? (
              <>
                <ArabicText size={28} color={colors.text.heading} style={{ textAlign: 'center', marginTop: 8 }}>
                  {daily.arabic}
                </ArabicText>
                <Text style={styles.heroTrans} numberOfLines={3}>
                  "{daily.translation}"
                </Text>
                <View style={styles.heroRefRow}>
                  <View style={styles.heroRefLine} />
                  <Text style={styles.heroRef}>{daily.reference}</Text>
                  <View style={styles.heroRefLine} />
                </View>
              </>
            ) : (
              <Text style={[styles.heroTrans, { opacity: 0.5 }]}>Loading verse...</Text>
            )}
          </Pressable>
        </Animated.View>

        {/* ── STREAK ── */}
        <Animated.View entering={FadeInDown.delay(240).duration(450)}>
          <Text style={[styles.sectionTitle, { color: tc.heading, marginBottom: spacing.md }]}>
            Your Streak
          </Text>
          <StreakWidget streakDays={streakDays} />
        </Animated.View>

      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 120, gap: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  greeting: { fontFamily: fonts.serifBold, fontSize: 24 },
  date: { fontFamily: fonts.sans, fontSize: 13, marginTop: 3 },
  profileBtn: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  prayerCard: {
    borderRadius: radii.xl, padding: spacing.md,
    borderWidth: 1, gap: spacing.md,
  },
  prayerHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  prayerLabel: { fontFamily: fonts.sansSemibold, fontSize: 10, letterSpacing: 1.2, marginBottom: 4 },
  nextRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  nextName: { fontFamily: fonts.sansBold, fontSize: 17 },
  nextCountdown: { fontFamily: fonts.sansMedium, fontSize: 13 },
  cityChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 5,
  },
  cityText: { fontFamily: fonts.sansMedium, fontSize: 11 },
  timesRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  prayerCol: { alignItems: 'center', gap: 5 },
  prayerCircle: {
    width: 46, height: 46, borderRadius: 23,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  prayerName: { fontFamily: fonts.sansMedium, fontSize: 11 },
  prayerTime: { fontFamily: fonts.sansSemibold, fontSize: 12 },
  sectionRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: spacing.md,
  },
  sectionTitle: { fontFamily: fonts.sansBold, fontSize: 18 },
  seeAll: { fontFamily: fonts.sansMedium, fontSize: 13 },
  // hero — her zaman koyu (fotoğraf üzerinde)
  heroCard: {
    borderRadius: radii.xl, overflow: 'hidden', minHeight: 210,
    padding: spacing.lg, justifyContent: 'center', alignItems: 'center',
  },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(7,10,20,0.55)',
    borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 5,
  },
  heroBadgeText: { fontFamily: fonts.sansSemibold, fontSize: 11, color: colors.gold.bright },
  heroTrans: {
    fontFamily: fonts.serif, fontSize: 15, color: colors.text.body,
    textAlign: 'center', marginTop: spacing.sm, lineHeight: 22,
  },
  heroRefRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  heroRefLine: { width: 24, height: 1, backgroundColor: 'rgba(212,175,55,0.45)' },
  heroRef: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.gold.bright, letterSpacing: 0.3 },
});
