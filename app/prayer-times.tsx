/**
 * prayer-times — Tam günlük namaz takvimi (zengin, dinamik)
 *
 * • Canlı saat (saniye), Gregoryen + Hicrî tarih
 * • Konum + anlık hava durumu (Open-Meteo)
 * • Sıradaki vakit için dairesel ilerleme halkası + geri sayım
 * • Tüm günün vakitleri (sunrise dahil), aktif vakit vurgulu
 * • Hesaplama yöntemi seçici (ülkeye göre OTOMATİK + manuel override)
 *
 * Doğruluk: vakitler `adhan` ile yerelde hesaplanır; bölgenin resmî
 * twilight açıları (Diyanet/ISNA/Umm al-Qura …) ülke kodundan otomatik seçilir.
 */
import React from 'react';
import { I18nManager, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '../components/layout/ScreenContainer';
import { fonts, radii, spacing } from '../constants/theme';
import { useThemeColors } from '../lib/useThemeColors';
import { useT, useLocaleTag } from '../lib/i18n';
import { usePrayerTimes } from '../lib/prayerTimes';
import { useWeather } from '../lib/weather';
import { gregorianToHijri, formatHijri } from '../lib/hijri';
import {
  getSettingsSnapshot, savePrayerSettings, subscribePrayerSettings,
  effectiveMethod, METHOD_LABELS, METHOD_ORDER,
  PrayerSettings, MethodKey, MadhabKey,
} from '../lib/prayerSettings';
import { haptic } from '../lib/haptics';

// ─── Dairesel ilerleme halkası ──────────────────────────────────────────────

function ProgressRing({
  progress, size, stroke, color, track, children,
}: {
  progress: number; size: number; stroke: number;
  color: string; track: string; children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * Math.min(1, Math.max(0, progress));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth={stroke} fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
      </Svg>
      {children}
    </View>
  );
}

// ─── Saat / tarih başlığı ────────────────────────────────────────────────────

function useClock() {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function PrayerTimesScreen() {
  const router = useRouter();
  const tc = useThemeColors();
  const t = useT();
  const locale = useLocaleTag();
  const prayer = usePrayerTimes();
  const weather = useWeather(prayer.coords.latitude, prayer.coords.longitude);
  const now = useClock();

  const [settings, setSettings] = React.useState<PrayerSettings>(getSettingsSnapshot());
  const [methodOpen, setMethodOpen] = React.useState(false);

  React.useEffect(() => subscribePrayerSettings(() => setSettings(getSettingsSnapshot())), []);

  const nextSlot = prayer.slots.find((p) => p.key === prayer.nextKey);
  const effMethod = effectiveMethod(settings, prayer.countryCode);

  const clock = now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false });
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const dateStr = now.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
  const hijriStr = formatHijri(gregorianToHijri(now), locale.startsWith('ar') ? 'ar' : 'en');

  const update = (patch: Partial<PrayerSettings>) => {
    haptic.select();
    savePrayerSettings({ ...settings, ...patch });
  };

  const heroColors: [string, string, string] = tc.isDark
    ? ['#243056', '#18203F', '#0E1430']
    : ['#E0B25C', '#CF9A3F', '#B07D2A'];

  return (
    <ScreenContainer padded={false}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: tc.cardBg }]}
          accessibilityRole="button" accessibilityLabel="Go back"
        >
          <Ionicons name={I18nManager.isRTL ? 'arrow-forward' : 'arrow-back'} size={22} color={tc.heading} />
        </Pressable>
        <Text style={[styles.title, { color: tc.heading }]}>{t('pt.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── HERO: saat + tarih + konum + hava ── */}
        <Animated.View entering={FadeInDown.duration(440)}>
          <LinearGradient
            colors={heroColors}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroTopRow}>
              <Pressable
                onPress={() => { if (!prayer.resolved) { haptic.select(); router.push('/location-setup'); } }}
                disabled={prayer.resolved}
                style={styles.heroChip}
                accessibilityRole="button"
                accessibilityLabel={prayer.resolved ? prayer.city : 'Set location'}
              >
                <Ionicons name={prayer.resolved ? 'location' : 'location-outline'} size={13} color="#FFFFFF" />
                <Text style={styles.heroChipText} numberOfLines={1}>
                  {prayer.loading && !prayer.resolved ? '…' : prayer.resolved ? prayer.city : 'Set location'}
                </Text>
                {!prayer.resolved && <Ionicons name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={12} color="rgba(255,255,255,0.8)" />}
              </Pressable>
              {weather && (
                <Animated.View entering={FadeIn.duration(400)} style={styles.heroChip}>
                  <Ionicons name={weather.icon} size={14} color="#FFFFFF" />
                  <Text style={styles.heroChipText}>{weather.tempC}°  ·  {weather.label}</Text>
                </Animated.View>
              )}
            </View>

            <View style={styles.clockRow}>
              <Text style={styles.clock}>{clock}</Text>
              <Text style={styles.clockSec}>{seconds}</Text>
            </View>

            <Text style={styles.heroDate}>{dateStr}</Text>
            <View style={styles.hijriRow}>
              <Ionicons name="moon" size={11} color="rgba(255,255,255,0.7)" />
              <Text style={styles.heroHijri}>{hijriStr}</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── SIRADAKİ VAKİT: ilerleme halkası + geri sayım ── */}
        <Animated.View entering={FadeInDown.delay(80).duration(420)}>
          <View style={[styles.nextCard, { backgroundColor: tc.cardBg, borderColor: tc.gold + '33' }]}>
            <ProgressRing
              progress={prayer.progress}
              size={74} stroke={6}
              color={tc.gold} track={tc.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(176,125,42,0.14)'}
            >
              <Ionicons name={nextSlot?.icon ?? 'time-outline'} size={22} color={tc.gold} />
            </ProgressRing>

            <View style={styles.nextInfo}>
              <Text style={[styles.nextLabel, { color: tc.muted }]}>{t('pt.nextIn')}</Text>
              <Text style={[styles.nextName, { color: tc.heading }]}>
                {nextSlot ? t(`prayer.${nextSlot.key}`) : '—'}
              </Text>
              <View style={styles.nextMetaRow}>
                <View style={[styles.timePill, { backgroundColor: tc.gold + '1A' }]}>
                  <Text style={[styles.timePillText, { color: tc.gold }]}>{nextSlot?.time ?? '—'}</Text>
                </View>
                <Text style={[styles.nextCountdown, { color: tc.body }]}>
                  {prayer.countdown ? t('pt.remaining', { c: prayer.countdown }) : t('pt.calculating')}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── TÜM VAKİTLER ── */}
        <View style={[styles.listCard, { backgroundColor: tc.cardBg, borderColor: tc.border }]}>
          {prayer.slots.map((p, i) => {
            const isNext = p.key === prayer.nextKey;
            return (
              <Animated.View key={p.key} entering={FadeInDown.delay(140 + i * 45).duration(320)}>
                {i > 0 && <View style={[styles.divider, { backgroundColor: tc.border }]} />}
                <View style={[styles.row, isNext && { backgroundColor: tc.isDark ? 'rgba(212,175,55,0.08)' : 'rgba(201,150,58,0.09)' }]}>
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

        {/* ── HESAPLAMA YÖNTEMİ ── */}
        <Animated.View entering={FadeInDown.delay(220).duration(360)}>
          <View style={[styles.methodCard, { backgroundColor: tc.cardBg, borderColor: tc.border }]}>
            <Pressable
              style={styles.methodHead}
              onPress={() => { haptic.select(); setMethodOpen((o) => !o); }}
              accessibilityRole="button" accessibilityLabel="Calculation method"
            >
              <View style={[styles.iconCircle, { backgroundColor: tc.gold + '1A' }]}>
                <Ionicons name="calculator-outline" size={18} color={tc.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.methodTitle, { color: tc.heading }]}>{t('pt.calcMethod')}</Text>
                <Text style={[styles.methodSub, { color: tc.muted }]} numberOfLines={1}>
                  {settings.method === 'auto'
                    ? t('pt.autoFor', { m: METHOD_LABELS[effMethod] })
                    : METHOD_LABELS[effMethod]}
                </Text>
              </View>
              <Ionicons name={methodOpen ? 'chevron-up' : 'chevron-down'} size={18} color={tc.muted} />
            </Pressable>

            {methodOpen && (
              <Animated.View entering={FadeIn.duration(220)} style={{ overflow: 'hidden' }}>
                <View style={[styles.divider, { backgroundColor: tc.border, marginLeft: spacing.md }]} />

                {/* Madhab (Asr) seçimi */}
                <Text style={[styles.groupLabel, { color: tc.muted }]}>{t('pt.madhab')}</Text>
                <View style={styles.segment}>
                  {(['shafi', 'hanafi'] as MadhabKey[]).map((m) => {
                    const active = settings.madhab === m;
                    return (
                      <Pressable
                        key={m}
                        onPress={() => update({ madhab: m })}
                        style={[
                          styles.segmentBtn,
                          { borderColor: active ? tc.gold : tc.border, backgroundColor: active ? tc.gold + '1A' : 'transparent' },
                        ]}
                        accessibilityRole="button"
                      >
                        <Text style={[styles.segmentText, { color: active ? tc.gold : tc.body }]}>
                          {m === 'shafi' ? t('pt.standard') : t('pt.hanafi')}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Yöntem listesi */}
                <Text style={[styles.groupLabel, { color: tc.muted }]}>{t('pt.method')}</Text>
                <MethodOption
                  label={t('pt.auto')}
                  sub={t('pt.autoHint')}
                  active={settings.method === 'auto'}
                  onPress={() => update({ method: 'auto' })}
                  tc={tc}
                />
                {METHOD_ORDER.map((m: MethodKey) => (
                  <MethodOption
                    key={m}
                    label={METHOD_LABELS[m]}
                    active={settings.method === m}
                    onPress={() => update({ method: m })}
                    tc={tc}
                  />
                ))}
              </Animated.View>
            )}
          </View>
        </Animated.View>

        {/* ── Bildirim kısayolu ── */}
        <Pressable
          style={[styles.notifBtn, { backgroundColor: tc.cardBg, borderColor: tc.border }]}
          onPress={() => { haptic.select(); router.push('/notifications-settings'); }}
          accessibilityRole="button" accessibilityLabel="Prayer notifications"
        >
          <Ionicons name="notifications-outline" size={18} color={tc.gold} />
          <Text style={[styles.notifText, { color: tc.heading }]}>{t('pt.setReminders')}</Text>
          <Ionicons name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color={tc.muted} style={{ marginLeft: 'auto' }} />
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

// ── Yöntem seçeneği satırı ──────────────────────────────────────────────────

function MethodOption({
  label, sub, active, onPress, tc,
}: {
  label: string; sub?: string; active: boolean;
  onPress: () => void; tc: ReturnType<typeof useThemeColors>;
}) {
  return (
    <Pressable style={styles.optRow} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.optLabel, { color: active ? tc.gold : tc.heading }]}>{label}</Text>
        {sub && <Text style={[styles.optSub, { color: tc.muted }]}>{sub}</Text>}
      </View>
      <View style={[styles.radio, { borderColor: active ? tc.gold : tc.border }]}>
        {active && <View style={[styles.radioDot, { backgroundColor: tc.gold }]} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.serifBold, fontSize: 22, lineHeight: 36 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 120, gap: spacing.sm },

  // Hero
  hero: { borderRadius: radii.xl, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  heroChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: radii.pill,
    paddingHorizontal: 10, paddingVertical: 5, maxWidth: '60%',
  },
  heroChipText: { fontFamily: fonts.sansSemibold, fontSize: 12, color: '#FFFFFF' },
  clockRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: spacing.sm },
  clock: { fontFamily: fonts.serifBold, fontSize: 44, lineHeight: 50, color: '#FFFFFF', letterSpacing: 1 },
  clockSec: { fontFamily: fonts.sansSemibold, fontSize: 16, color: 'rgba(255,255,255,0.7)', marginBottom: 8, marginLeft: 4 },
  heroDate: { fontFamily: fonts.sansMedium, fontSize: 14, color: 'rgba(255,255,255,0.95)', marginTop: 2 },
  hijriRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  heroHijri: { fontFamily: fonts.sans, fontSize: 12, color: 'rgba(255,255,255,0.78)' },

  // Next prayer card
  nextCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    borderRadius: radii.xl, borderWidth: 1.5, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  nextInfo: { flex: 1 },
  nextLabel: { fontFamily: fonts.sansSemibold, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  nextName: { fontFamily: fonts.serifBold, fontSize: 24, lineHeight: 32, marginTop: 1 },
  nextMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  timePill: { borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 3 },
  timePillText: { fontFamily: fonts.sansBold, fontSize: 13 },
  nextCountdown: { fontFamily: fonts.sansMedium, fontSize: 13 },

  // List
  listCard: { borderRadius: radii.xl, borderWidth: 1, overflow: 'hidden' },
  divider: { height: 1, marginLeft: spacing.md + 40 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: 9 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  rowName: { fontFamily: fonts.sansSemibold, fontSize: 16 },
  nextPill: { borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 2 },
  nextPillText: { fontFamily: fonts.sansSemibold, fontSize: 10 },
  rowTime: { fontFamily: fonts.sansBold, fontSize: 16 },

  // Method
  methodCard: { borderRadius: radii.xl, borderWidth: 1, overflow: 'hidden' },
  methodHead: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.md },
  methodTitle: { fontFamily: fonts.sansSemibold, fontSize: 15 },
  methodSub: { fontFamily: fonts.sans, fontSize: 12, marginTop: 1 },
  groupLabel: {
    fontFamily: fonts.sansSemibold, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase',
    paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: 6,
  },
  segment: { flexDirection: 'row', gap: 8, paddingHorizontal: spacing.md },
  segmentBtn: { flex: 1, borderWidth: 1.5, borderRadius: radii.md, paddingVertical: 10, alignItems: 'center' },
  segmentText: { fontFamily: fonts.sansSemibold, fontSize: 12, textAlign: 'center' },
  optRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing.md, paddingVertical: 12 },
  optLabel: { fontFamily: fonts.sansMedium, fontSize: 14 },
  optSub: { fontFamily: fonts.sans, fontSize: 11, marginTop: 2, lineHeight: 15 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 11, height: 11, borderRadius: 6 },

  // Reminders
  notifBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: radii.xl, borderWidth: 1, padding: spacing.md,
  },
  notifText: { fontFamily: fonts.sansSemibold, fontSize: 14 },
});
