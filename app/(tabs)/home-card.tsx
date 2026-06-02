/**
 * home-card — Functional hub
 *
 *  1. Header (location + date, no greeting) — i18n
 *  2. Prayer times card (next prayer + countdown + day schedule)
 *  3. "Apps" grid — premium tappable feature tiles with bespoke glyphs
 */
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter, type Href } from 'expo-router';

import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { BackButton } from '../../components/ui/BackButton';
import { AppGlyph, type GlyphName } from '../../components/icons/AppGlyphs';
import { fonts, radii, spacing } from '../../constants/theme';
import { useThemeColors } from '../../lib/useThemeColors';
import { useT, useLocaleTag } from '../../lib/i18n';
import { haptic } from '../../lib/haptics';
import { usePrayerTimes } from '../../lib/prayerTimes';
import { syncWidget } from '../../lib/widgetSync';
import { useOnboardingStore } from '../../stores/useOnboardingStore';
import { useAppStore } from '../../stores/useAppStore';
import { resolveWidgetBgURL } from '../../data/themes';

type Tile = { glyph: GlyphName; key: string; href: Href };

const TILES: Tile[] = [
  { glyph: 'mosque',     key: 'prayerTimes', href: '/prayer-times' },
  { glyph: 'compass',    key: 'qibla',       href: '/qibla' },
  { glyph: 'beads',      key: 'tasbih',      href: '/dhikr' },
  { glyph: 'bell',       key: 'reminders',   href: '/notifications-settings' },
  { glyph: 'widget',     key: 'homeWidgets', href: '/widget-settings' },
  { glyph: 'lockscreen', key: 'lockScreen',  href: '/widget-settings' },
];

export default function HomeHub() {
  const router = useRouter();
  const tc = useThemeColors();
  const t = useT();
  const locale = useLocaleTag();
  const prayer = usePrayerTimes();
  const rawLang       = useOnboardingStore((s) => s.language);
  const selectedTheme = useOnboardingStore((s) => s.selectedTheme);
  const streakDays    = useAppStore((s) => s.streakDays);
  const isPremium     = useAppStore((s) => s.isPremium);
  const followedTopics = useAppStore((s) => s.followedTopics);
  const savedVerseIds = useAppStore((s) => s.savedVerseIds);
  const widgetThemeId = useAppStore((s) => s.widgetThemeId);
  const themeImageURL = resolveWidgetBgURL(widgetThemeId, selectedTheme);

  const nextSlot = prayer.slots.find((p) => p.key === prayer.nextKey);

  React.useEffect(() => {
    syncWidget({ language: rawLang, streakDays, isPremium, followedTopics, savedVerseIds, themeImageURL });
  }, [rawLang, streakDays, prayer.city, isPremium, widgetThemeId]);

  const dateStr = new Date().toLocaleDateString(locale, {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <ScreenContainer padded={false}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* ── HEADER ── */}
        <Animated.View entering={FadeInDown.duration(360)} style={styles.headerRow}>
          <BackButton style={{ marginRight: spacing.sm }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: tc.heading }]}>{t('home.today')}</Text>
            <Text style={[styles.headerDate, { color: tc.muted }]}>{dateStr}</Text>
          </View>
          <View style={[styles.cityChip, { backgroundColor: tc.raisedBg }]}>
            <Ionicons name="location-outline" size={12} color={tc.gold} />
            <Text style={[styles.cityText, { color: tc.body }]}>
              {prayer.loading ? '…' : prayer.city}
            </Text>
          </View>
        </Animated.View>

        {/* ── PRAYER CARD ── */}
        <Animated.View
          entering={FadeInDown.delay(70).duration(420)}
          style={[styles.prayerCard, { backgroundColor: tc.cardBg, borderColor: tc.border }]}
        >
          <View style={styles.prayerHead}>
            <View>
              <Text style={[styles.prayerLabel, { color: tc.muted }]}>{t('home.nextPrayer')}</Text>
              <View style={styles.nextRow}>
                <Text style={[styles.nextName, { color: tc.heading }]}>
                  {nextSlot ? t(`prayer.${nextSlot.key}`) : '—'}
                </Text>
                {prayer.countdown ? (
                  <Text style={[styles.nextCountdown, { color: tc.gold }]}>
                    · {t('home.away', { c: prayer.countdown })}
                  </Text>
                ) : null}
              </View>
            </View>
            <Pressable
              onPress={() => { haptic.select(); router.push('/prayer-times'); }}
              style={[styles.allTimesBtn, { borderColor: tc.border }]}
              accessibilityRole="button"
              accessibilityLabel={t('common.all')}
            >
              <Text style={[styles.allTimesText, { color: tc.gold }]}>{t('common.all')}</Text>
              <Ionicons name="chevron-forward" size={12} color={tc.gold} />
            </Pressable>
          </View>

          <View style={styles.timesRow}>
            {prayer.slots.map((p, i) => {
              const isNext = p.key === prayer.nextKey;
              return (
                <Animated.View
                  key={p.key}
                  entering={FadeInDown.delay(110 + i * 45).duration(320)}
                  style={styles.prayerCol}
                >
                  <View style={[
                    styles.prayerCircle,
                    { backgroundColor: tc.raisedBg, borderColor: tc.border },
                    isNext && {
                      borderColor: tc.gold, borderWidth: 2,
                      backgroundColor: tc.isDark ? 'rgba(212,175,55,0.12)' : 'rgba(201,150,58,0.12)',
                    },
                  ]}>
                    <Ionicons name={p.icon} size={16} color={isNext ? tc.gold : tc.muted} />
                  </View>
                  <Text style={[styles.prayerName, { color: isNext ? tc.gold : tc.body }]}>
                    {t(`prayer.${p.key}`)}
                  </Text>
                  <Text style={[styles.prayerTime, { color: isNext ? tc.heading : tc.muted }]}>
                    {p.time}
                  </Text>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        {/* ── APP GRID ── */}
        <Animated.View entering={FadeInDown.delay(150).duration(420)}>
          <Text style={[styles.sectionTitle, { color: tc.heading }]}>{t('home.apps')}</Text>
          <View style={styles.grid}>
            {TILES.map((tile, i) => (
              <AppTile
                key={tile.key + i}
                tile={tile}
                index={i}
                tc={tc}
                title={t(`tile.${tile.key}`)}
                subtitle={t(`sub.${tile.key}`)}
                onPress={() => { haptic.select(); router.push(tile.href); }}
              />
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </ScreenContainer>
  );
}

function AppTile({
  tile, index, tc, title, subtitle, onPress,
}: {
  tile: Tile;
  index: number;
  tc: ReturnType<typeof useThemeColors>;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const badgeBg = tc.isDark ? 'rgba(212,175,55,0.13)' : 'rgba(201,150,58,0.11)';
  return (
    <Animated.View entering={FadeInDown.delay(180 + index * 45).duration(360)} style={styles.tileWrap}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={title}
        style={({ pressed }) => [
          styles.tile,
          {
            backgroundColor: tc.cardBg,
            borderColor: tc.border,
            opacity: pressed ? 0.9 : 1,
            transform: [{ scale: pressed ? 0.975 : 1 }],
          },
        ]}
      >
        <View style={[styles.tileBadge, { backgroundColor: badgeBg }]}>
          <AppGlyph name={tile.glyph} size={28} color={tc.gold} tint={tc.gold + '2E'} />
        </View>
        <Text style={[styles.tileTitle, { color: tc.heading }]} numberOfLines={1}>{title}</Text>
        <Text style={[styles.tileSub, { color: tc.muted }]} numberOfLines={1}>{subtitle}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 120, gap: spacing.lg },

  headerRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  headerTitle: { fontFamily: fonts.serifBold, fontSize: 24, lineHeight: 40 },
  headerDate: { fontFamily: fonts.sans, fontSize: 13, marginTop: 2 },
  cityChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 6,
  },
  cityText: { fontFamily: fonts.sansMedium, fontSize: 11 },

  prayerCard: { borderRadius: radii.xl, padding: spacing.md, borderWidth: 1, gap: spacing.md },
  prayerHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  prayerLabel: { fontFamily: fonts.sansSemibold, fontSize: 10, letterSpacing: 1.2, marginBottom: 4 },
  nextRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  nextName: { fontFamily: fonts.sansBold, fontSize: 18 },
  nextCountdown: { fontFamily: fonts.sansMedium, fontSize: 13 },
  allTimesBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 5,
  },
  allTimesText: { fontFamily: fonts.sansSemibold, fontSize: 11 },
  timesRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  prayerCol: { alignItems: 'center', gap: 5, flex: 1 },
  prayerCircle: {
    width: 42, height: 42, borderRadius: 21,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  prayerName: { fontFamily: fonts.sansMedium, fontSize: 10 },
  prayerTime: { fontFamily: fonts.sansSemibold, fontSize: 11 },

  sectionTitle: { fontFamily: fonts.sansBold, fontSize: 18, marginBottom: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tileWrap: { width: '47.8%' },
  tile: {
    borderRadius: radii.lg, borderWidth: 1, padding: spacing.md,
    minHeight: 122, justifyContent: 'flex-start',
  },
  tileBadge: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
  },
  tileTitle: { fontFamily: fonts.sansBold, fontSize: 15 },
  tileSub: { fontFamily: fonts.sans, fontSize: 12, marginTop: 2 },
});
