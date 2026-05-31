/**
 * prayer-times — Full daily prayer schedule
 *
 * Sıradaki vakit hero (büyük geri sayım) + tüm günün listesi (sunrise dahil).
 * usePrayerTimes hook'undan beslenir (konum + adhan).
 */
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '../components/layout/ScreenContainer';
import { fonts, radii, spacing } from '../constants/theme';
import { useThemeColors } from '../lib/useThemeColors';
import { useT, useLocaleTag } from '../lib/i18n';
import { usePrayerTimes } from '../lib/prayerTimes';
import { haptic } from '../lib/haptics';

export default function PrayerTimesScreen() {
  const router = useRouter();
  const tc = useThemeColors();
  const t = useT();
  const locale = useLocaleTag();
  const prayer = usePrayerTimes();
  const nextSlot = prayer.slots.find((p) => p.key === prayer.nextKey);

  const dateStr = new Date().toLocaleDateString(locale, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <ScreenContainer padded={false}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: tc.cardBg }]}
          accessibilityRole="button" accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={tc.heading} />
        </Pressable>
        <Text style={[styles.title, { color: tc.heading }]}>{t('pt.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* HERO — sıradaki vakit */}
        <Animated.View entering={FadeInDown.duration(420)}>
          <LinearGradient
            colors={tc.isDark ? ['#1E2A52', '#161E3D'] : ['#D9A84E', '#B07D2A']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroTopRow}>
              <View style={styles.heroLoc}>
                <Ionicons name="location" size={13} color="#FFFFFF" />
                <Text style={styles.heroCity}>{prayer.loading ? '…' : prayer.city}</Text>
              </View>
              <Text style={styles.heroDate}>{dateStr}</Text>
            </View>
            <Text style={styles.heroLabel}>{t('home.nextPrayer')}</Text>
            <Text style={styles.heroName}>{nextSlot ? t(`prayer.${nextSlot.key}`) : '—'}</Text>
            <View style={styles.heroCountRow}>
              <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.85)" />
              <Text style={styles.heroCount}>
                {prayer.countdown ? t('pt.in', { c: prayer.countdown }) : t('pt.calculating')}
                {nextSlot ? `  ·  ${nextSlot.time}` : ''}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* LİSTE */}
        <View style={[styles.listCard, { backgroundColor: tc.cardBg, borderColor: tc.border }]}>
          {prayer.slots.map((p, i) => {
            const isNext = p.key === prayer.nextKey;
            return (
              <Animated.View key={p.key} entering={FadeInDown.delay(100 + i * 50).duration(320)}>
                {i > 0 && <View style={[styles.divider, { backgroundColor: tc.border }]} />}
                <View style={[styles.row, isNext && { backgroundColor: tc.isDark ? 'rgba(212,175,55,0.08)' : 'rgba(201,150,58,0.08)' }]}>
                  <View style={styles.rowLeft}>
                    <View style={[
                      styles.iconCircle,
                      { backgroundColor: tc.raisedBg, borderColor: isNext ? tc.gold : 'transparent', borderWidth: isNext ? 1.5 : 0 },
                    ]}>
                      <Ionicons name={p.icon} size={18} color={isNext ? tc.gold : tc.muted} />
                    </View>
                    <Text style={[styles.rowName, { color: isNext ? tc.gold : tc.heading }]}>{t(`prayer.${p.key}`)}</Text>
                    {isNext && (
                      <View style={[styles.nextPill, { backgroundColor: tc.gold + '22' }]}>
                        <Text style={[styles.nextPillText, { color: tc.gold }]}>{t('common.next')}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.rowTime, { color: isNext ? tc.heading : tc.body }]}>{p.time}</Text>
                </View>
              </Animated.View>
            );
          })}
        </View>

        {/* Bildirim kısayolu */}
        <Pressable
          style={[styles.notifBtn, { backgroundColor: tc.cardBg, borderColor: tc.border }]}
          onPress={() => { haptic.select(); router.push('/notifications-settings'); }}
          accessibilityRole="button" accessibilityLabel="Prayer notifications"
        >
          <Ionicons name="notifications-outline" size={18} color={tc.gold} />
          <Text style={[styles.notifText, { color: tc.heading }]}>{t('pt.setReminders')}</Text>
          <Ionicons name="chevron-forward" size={16} color={tc.muted} style={{ marginLeft: 'auto' }} />
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.serifBold, fontSize: 22 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 120, gap: spacing.lg },

  hero: { borderRadius: radii.xl, padding: spacing.lg, gap: 4 },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  heroLoc: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroCity: { fontFamily: fonts.sansSemibold, fontSize: 13, color: '#FFFFFF' },
  heroDate: { fontFamily: fonts.sans, fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  heroLabel: { fontFamily: fonts.sansSemibold, fontSize: 11, letterSpacing: 1.4, color: 'rgba(255,255,255,0.8)' },
  heroName: { fontFamily: fonts.serifBold, fontSize: 38, color: '#FFFFFF' },
  heroCountRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  heroCount: { fontFamily: fonts.sansMedium, fontSize: 15, color: 'rgba(255,255,255,0.95)' },

  listCard: { borderRadius: radii.xl, borderWidth: 1, overflow: 'hidden' },
  divider: { height: 1, marginLeft: spacing.md + 44 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: 14 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  rowName: { fontFamily: fonts.sansSemibold, fontSize: 16 },
  nextPill: { borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 2 },
  nextPillText: { fontFamily: fonts.sansSemibold, fontSize: 10 },
  rowTime: { fontFamily: fonts.sansBold, fontSize: 16 },

  notifBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: radii.xl, borderWidth: 1, padding: spacing.md,
  },
  notifText: { fontFamily: fonts.sansSemibold, fontSize: 14 },
});
