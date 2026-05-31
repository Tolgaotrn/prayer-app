/**
 * notifications-settings — Prayer + content notification toggles
 *
 * Her namaz vakti için ayrı bildirim toggle'ı + günlük ayet/hadis bildirimleri.
 * Tercihler AsyncStorage'da (lib/notifications). expo-notifications ile planlanır.
 */
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '../components/layout/ScreenContainer';
import { ToggleSwitch } from '../components/ui/ToggleSwitch';
import { fonts, radii, spacing } from '../constants/theme';
import { useThemeColors } from '../lib/useThemeColors';
import { useT } from '../lib/i18n';
import { usePrayerTimes } from '../lib/prayerTimes';
import { haptic } from '../lib/haptics';
import {
  loadNotifPrefs,
  saveNotifPrefs,
  applyAllNotifPrefs,
  requestPermission,
  NotifPrefs,
} from '../lib/notifications';

export default function NotificationsSettings() {
  const router = useRouter();
  const tc = useThemeColors();
  const t = useT();
  const prayer = usePrayerTimes();

  const [prefs, setPrefs] = React.useState<NotifPrefs | null>(null);
  const [permGranted, setPermGranted] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    loadNotifPrefs().then(setPrefs);
    if (Platform.OS !== 'web') {
      requestPermission().then(setPermGranted);
    }
  }, []);

  const slotsUI = prayer.slots.filter((s) => s.key !== 'sunrise');

  const apply = React.useCallback(async (next: NotifPrefs) => {
    setPrefs(next);
    await saveNotifPrefs(next);
    if (Platform.OS !== 'web') {
      const granted = await requestPermission();
      setPermGranted(granted);
      if (granted) await applyAllNotifPrefs(slotsUI, next);
    }
  }, [slotsUI]);

  const togglePrayer = (key: string) => {
    if (!prefs) return;
    haptic.select();
    apply({ ...prefs, prayerEnabled: { ...prefs.prayerEnabled, [key]: !prefs.prayerEnabled[key] } });
  };
  const toggleVerse = () => { if (prefs) { haptic.select(); apply({ ...prefs, dailyVerseEnabled: !prefs.dailyVerseEnabled }); } };
  const toggleHadith = () => { if (prefs) { haptic.select(); apply({ ...prefs, dailyHadithEnabled: !prefs.dailyHadithEnabled }); } };

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
          <Ionicons name="arrow-back" size={22} color={tc.heading} />
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
            <Text style={[styles.permText, { color: tc.gold }]}>
              {t('rem.off')}
            </Text>
          </Pressable>
        )}

        {/* PRAYER */}
        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { color: tc.heading }]}>{t('rem.prayerTimes')}</Text>
          <Pressable onPress={toggleAll} hitSlop={8} accessibilityRole="button">
            <Text style={[styles.allToggle, { color: tc.gold }]}>{allOn ? t('rem.turnAllOff') : t('rem.turnAllOn')}</Text>
          </Pressable>
        </View>
        <View style={[styles.card, { backgroundColor: tc.cardBg, borderColor: tc.border }]}>
          {slotsUI.map((p, i) => {
            const isNext = p.key === prayer.nextKey;
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

        {/* CONTENT */}
        <Text style={[styles.sectionTitle, { color: tc.heading, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
          {t('rem.daily')}
        </Text>
        <View style={[styles.card, { backgroundColor: tc.cardBg, borderColor: tc.border }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: tc.raisedBg }]}>
                <Ionicons name="book-outline" size={17} color={tc.gold} />
              </View>
              <View>
                <Text style={[styles.rowTitle, { color: tc.heading }]}>{t('rem.dailyVerse')}</Text>
                <Text style={[styles.rowSub, { color: tc.muted }]}>{t('rem.everyMorning')}</Text>
              </View>
            </View>
            <ToggleSwitch value={prefs?.dailyVerseEnabled ?? false} onChange={toggleVerse} label="Daily Verse" />
          </View>
          <View style={[styles.divider, { backgroundColor: tc.border }]} />
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: tc.raisedBg }]}>
                <Ionicons name="chatbubble-outline" size={17} color={tc.gold} />
              </View>
              <View>
                <Text style={[styles.rowTitle, { color: tc.heading }]}>{t('rem.dailyHadith')}</Text>
                <Text style={[styles.rowSub, { color: tc.muted }]}>{t('rem.everyEvening')}</Text>
              </View>
            </View>
            <ToggleSwitch value={prefs?.dailyHadithEnabled ?? false} onChange={toggleHadith} label="Daily Hadith" />
          </View>
        </View>

        <Text style={[styles.note, { color: tc.muted }]}>
          {t('rem.note', { c: prayer.loading ? '…' : prayer.city })}
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
  title: { fontFamily: fonts.serifBold, fontSize: 22 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 120 },

  permBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: radii.md, borderWidth: 1, padding: spacing.md, marginBottom: spacing.md,
  },
  permText: { fontFamily: fonts.sansMedium, fontSize: 13, flex: 1 },

  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  sectionTitle: { fontFamily: fonts.sansBold, fontSize: 16 },
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

  note: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: spacing.lg },
});
