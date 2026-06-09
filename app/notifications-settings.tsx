import React from 'react';
import {
  Platform, Pressable, ScrollView, StyleSheet, Text, View,

  I18nManager,} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usePostHog } from 'posthog-react-native';

import { ScreenContainer } from '../components/layout/ScreenContainer';
import { ToggleSwitch } from '../components/ui/ToggleSwitch';
import { fonts, radii, spacing } from '../constants/theme';
import { useThemeColors } from '../lib/useThemeColors';
import { useT } from '../lib/i18n';
import { usePrayerTimes } from '../lib/prayerTimes';
import { haptic } from '../lib/haptics';
import {
  loadNotifPrefs, saveNotifPrefs, applyAllNotifPrefs,
  requestPermission, NotifPrefs, InspirationFrequency,
} from '../lib/notifications';

const INSPIRATION_OPTIONS: { key: InspirationFrequency; labelKey: string; subKey: string }[] = [
  { key: 'off',     labelKey: 'rem.freqOff',     subKey: 'rem.freqOffSub' },
  { key: 'every3h', labelKey: 'rem.freqEvery3h', subKey: 'rem.freqEvery3hSub' },
  { key: 'hourly',  labelKey: 'rem.freqHourly',  subKey: 'rem.freqHourlySub' },
];


// ─── Main screen ─────────────────────────────────────────────────────────────

export default function NotificationsSettings() {
  const router   = useRouter();
  const posthog  = usePostHog();
  const tc       = useThemeColors();
  const t        = useT();
  const prayer   = usePrayerTimes();

  const [prefs, setPrefs] = React.useState<NotifPrefs | null>(null);
  const [permGranted, setPermGranted] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    posthog?.capture('notifications_settings_viewed');
    loadNotifPrefs().then(setPrefs);
    if (Platform.OS !== 'web') requestPermission().then(setPermGranted);
  }, [posthog]);

  const slotsUI = prayer.slots.filter((s) => s.key !== 'sunrise');

  const apply = React.useCallback(async (next: NotifPrefs) => {
    posthog?.capture('notification_preferences_updated', {
      dailyInspiration: next.inspirationFrequency,
      prayerNotifications: Object.values(next.prayerEnabled).filter(Boolean).length,
    });
    setPrefs(next);
    await saveNotifPrefs(next);
    if (Platform.OS !== 'web') {
      const granted = await requestPermission();
      setPermGranted(granted);
      if (granted) await applyAllNotifPrefs(slotsUI, next);
    }
  }, [slotsUI, posthog]);

  const togglePrayer = (key: string) => {
    if (!prefs) return;
    haptic.select();
    apply({ ...prefs, prayerEnabled: { ...prefs.prayerEnabled, [key]: !prefs.prayerEnabled[key] } });
  };

  const setInspiration = (freq: InspirationFrequency) => {
    if (!prefs || prefs.inspirationFrequency === freq) return;
    haptic.select();
    apply({ ...prefs, inspirationFrequency: freq });
  };

  const allOn = prefs ? slotsUI.every((s) => prefs.prayerEnabled[s.key]) : false;
  const toggleAll = () => {
    if (!prefs) return;
    haptic.medium();
    const v = !allOn;
    const pe: Record<string, boolean> = { ...prefs.prayerEnabled };
    slotsUI.forEach((s) => { pe[s.key] = v; });
    apply({ ...prefs, prayerEnabled: pe });
  };

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
        <Text style={[styles.title, { color: tc.heading }]}>{t('rem.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {permGranted === false && (
          <Pressable
            style={[styles.permBanner, { backgroundColor: tc.gold + '1E', borderColor: tc.gold }]}
            onPress={async () => setPermGranted(await requestPermission())}
            accessibilityRole="button"
          >
            <Ionicons name="notifications-off-outline" size={18} color={tc.gold} />
            <Text style={[styles.permText, { color: tc.gold }]}>{t('rem.off')}</Text>
          </Pressable>
        )}

        {/* ── Prayer times ─────────────────────────────── */}
        <View style={[styles.prayerBlock, { backgroundColor: tc.gold + '10', borderColor: tc.gold + '40' }]}>
          <View style={styles.sectionHead}>
            <View style={styles.prayerHeadLeft}>
              <Ionicons name="partly-sunny-outline" size={16} color={tc.gold} />
              <Text style={[styles.sectionTitle, { color: tc.heading }]}>{t('rem.prayerTimes')}</Text>
            </View>
            <Pressable onPress={toggleAll} hitSlop={8} accessibilityRole="button">
              <Text style={[styles.allToggle, { color: tc.gold }]}>
                {allOn ? t('rem.turnAllOff') : t('rem.turnAllOn')}
              </Text>
            </Pressable>
          </View>
          <View style={[styles.card, { backgroundColor: tc.cardBg, borderColor: tc.gold + '30' }]}>
            {slotsUI.map((p, i) => {
              const isNext  = p.key === prayer.nextKey;
              const enabled = prefs?.prayerEnabled[p.key] ?? false;
              return (
                <Animated.View key={p.key} entering={FadeInDown.delay(i * 40).duration(300)}>
                  {i > 0 && <View style={[styles.divider, { backgroundColor: tc.border }]} />}
                  <View style={styles.row}>
                    <View style={styles.rowLeft}>
                      <View style={[styles.iconCircle, { backgroundColor: tc.raisedBg }]}>
                        <Ionicons name={p.icon} size={17} color={isNext ? tc.gold : tc.muted} />
                      </View>
                      <View>
                        <Text style={[styles.rowTitle, { color: tc.heading }]}>{t(`prayer.${p.key}`)}</Text>
                        <Text style={[styles.rowSub, { color: tc.muted }]}>{p.time}</Text>
                      </View>
                      {isNext && (
                        <View style={[styles.nextPill, { backgroundColor: tc.gold + '22' }]}>
                          <Text style={[styles.nextPillText, { color: tc.gold }]}>{t('common.next')}</Text>
                        </View>
                      )}
                    </View>
                    <ToggleSwitch value={enabled} onChange={() => togglePrayer(p.key)} label={p.name} />
                  </View>
                </Animated.View>
              );
            })}
          </View>
        </View>

        {/* ── Daily inspiration ────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: tc.heading, marginTop: spacing.lg, marginBottom: 4 }]}>
          {t('rem.daily')}
        </Text>
        <Text style={[styles.sectionDesc, { color: tc.muted }]}>
          {t('rem.inspDesc')}
        </Text>

        <Animated.View
          entering={FadeInDown.delay(80).duration(300)}
          style={[styles.card, { backgroundColor: tc.cardBg, borderColor: tc.border, marginTop: spacing.sm, padding: spacing.md }]}
        >
          <View style={styles.inspHead}>
            <View style={[styles.iconCircle, { backgroundColor: tc.raisedBg }]}>
              <Ionicons name="sparkles-outline" size={17} color={tc.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: tc.heading }]}>{t('rem.inspTitle')}</Text>
              <Text style={[styles.rowSub, { color: tc.muted }]}>
                {prefs?.inspirationFrequency === 'hourly'
                  ? t('rem.inspStatusHourly')
                  : prefs?.inspirationFrequency === 'every3h'
                    ? t('rem.inspStatusEvery3h')
                    : t('rem.inspStatusOff')}
              </Text>
            </View>
          </View>

          <View style={styles.inspSegment}>
            {INSPIRATION_OPTIONS.map((opt) => {
              const active = (prefs?.inspirationFrequency ?? 'off') === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setInspiration(opt.key)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.inspSegBtn,
                    {
                      backgroundColor: active ? tc.gold : tc.raisedBg,
                      borderColor: active ? tc.gold : tc.border,
                    },
                  ]}
                >
                  <Text style={[styles.inspSegLabel, { color: active ? tc.onGold : tc.heading }]}>{t(opt.labelKey)}</Text>
                  <Text style={[styles.inspSegSub, { color: active ? tc.onGold : tc.muted }]}>{t(opt.subKey)}</Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {!prayer.resolved && Platform.OS !== 'web' && (
          <Pressable
            style={[styles.permBanner, { backgroundColor: tc.gold + '1E', borderColor: tc.gold, marginTop: spacing.lg }]}
            onPress={() => { haptic.select(); router.push('/location-setup'); }}
            accessibilityRole="button"
          >
            <Ionicons name="location-outline" size={18} color={tc.gold} />
            <Text style={[styles.permText, { color: tc.gold }]}>
              {t('rem.setLocation')}
            </Text>
            <Ionicons name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color={tc.gold} />
          </Pressable>
        )}
        <Text style={[styles.note, { color: tc.muted }]}>
          {t('rem.note', { c: prayer.resolved ? prayer.city : (prayer.loading ? '…' : 'your city') })}
          {Platform.OS === 'web' ? t('rem.webNote') : ''}
        </Text>
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
  title: { fontFamily: fonts.serifBold, fontSize: 22, lineHeight: 36 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 120 },

  permBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: radii.md, borderWidth: 1, padding: spacing.md, marginBottom: spacing.md,
  },
  permText: { fontFamily: fonts.sansMedium, fontSize: 13, flex: 1 },

  prayerBlock: {
    borderRadius: radii.xl, borderWidth: 1.5, padding: spacing.md, marginBottom: spacing.md,
  },
  prayerHeadLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: { fontFamily: fonts.sansBold, fontSize: 16 },
  sectionDesc: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, marginBottom: 2 },
  allToggle: { fontFamily: fonts.sansSemibold, fontSize: 13 },

  card: { borderRadius: radii.xl, borderWidth: 1, overflow: 'hidden' },
  divider: { height: 1, marginLeft: spacing.md + 36 + 10 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: fonts.sansMedium, fontSize: 15 },
  rowSub: { fontFamily: fonts.sans, fontSize: 12, marginTop: 1 },
  nextPill: { borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 4 },
  nextPillText: { fontFamily: fonts.sansSemibold, fontSize: 10 },

  note: {
    fontFamily: fonts.sans, fontSize: 12, lineHeight: 18,
    textAlign: 'center', marginTop: spacing.lg,
  },

  inspHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.md },
  inspSegment: { flexDirection: 'row', gap: 8 },
  inspSegBtn: {
    flex: 1, borderRadius: radii.md, borderWidth: 1.5,
    paddingVertical: 10, alignItems: 'center', gap: 1,
  },
  inspSegLabel: { fontFamily: fonts.sansBold, fontSize: 14 },
  inspSegSub: { fontFamily: fonts.sans, fontSize: 10.5 },
});
