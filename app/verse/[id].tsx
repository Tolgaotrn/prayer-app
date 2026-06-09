import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { ArabicText } from '../../components/arabic/ArabicText';
import { fonts, radii, spacing } from '../../constants/theme';
import { useThemeColors } from '../../lib/useThemeColors';
import { fetchItemById, resolveLang, type FeedItem } from '../../lib/contentDb';
import { useT } from '../../lib/i18n';
import { useOnboardingStore } from '../../stores/useOnboardingStore';
import { useAppStore } from '../../stores/useAppStore';
import type { Verse } from '../../data/types';
import { haptic } from '../../lib/haptics';

const KIND_LABEL: Record<FeedItem['kind'], string> = {
  verse: 'Quran', hadith: 'Hadith', dua: 'Dua', quote: 'Quote',
};

export default function VerseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const tc = useThemeColors();
  const t = useT();
  const language = useOnboardingStore((s) => s.language);
  const lang = resolveLang(language);
  const showArabic = language === 'Arabic';

  const savedVerseIds = useAppStore((s) => s.savedVerseIds);
  const toggleSave = useAppStore((s) => s.toggleSave);
  const saved = id ? savedVerseIds.includes(id) : false;

  const [item, setItem] = React.useState<FeedItem | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    if (!id) { setLoading(false); return; }
    setLoading(true);
    fetchItemById(id, lang)
      .then((data) => { if (!cancelled) { setItem(data); setLoading(false); } })
      .catch(() => { if (!cancelled) { setItem(null); setLoading(false); } });
    return () => { cancelled = true; };
  }, [id, lang]);

  const body = showArabic ? (item?.arabic ?? '') : (item?.translation || item?.arabic || '');
  const hasArabic = !!item?.arabic?.trim();

  const onShare = () => {
    if (!item) return;
    haptic.medium();
    const text = showArabic ? item.arabic : (item.translation || item.arabic);
    if (!text?.trim()) return;
    Share.share({ message: `"${text}"\n\n— ${item.reference}` }).catch(() => {});
  };

  const onSave = () => {
    if (!item) return;
    haptic.medium();
    toggleSave({ id: item.id } as Verse);
  };

  return (
    <ScreenContainer>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel={t('common.back')} accessibilityRole="button">
          <Ionicons name="chevron-back" size={26} color={tc.heading} />
        </Pressable>
        <Text style={[styles.surahName, { color: tc.heading }]} numberOfLines={1}>
          {item?.reference ?? ''}
        </Text>
        <View style={{ width: 26 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={tc.gold} />
        </View>
      ) : !item ? (
        <View style={styles.center}>
          <Text style={[styles.translation, { color: tc.muted }]}>{t('feed.noContentTitle')}</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
          {hasArabic ? (
            <Animated.View entering={FadeIn.duration(700)} style={styles.arabicWrap}>
              <ArabicText size={36} color={tc.heading}>{item.arabic}</ArabicText>
            </Animated.View>
          ) : null}

          {!showArabic && item.translation ? (
            <Animated.Text entering={FadeInDown.delay(200)} style={[styles.translation, { color: tc.body }]}>
              "{item.translation}"
            </Animated.Text>
          ) : null}

          <View style={styles.metaRow}>
            <Animated.View entering={FadeInDown.delay(320)} style={[styles.metaChip, { backgroundColor: tc.cardBg, borderColor: tc.border }]}>
              <Text style={[styles.metaValue, { color: tc.gold }]}>{KIND_LABEL[item.kind]}</Text>
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(380)} style={[styles.metaChip, { backgroundColor: tc.cardBg, borderColor: tc.border }]}>
              <Text style={[styles.metaValue, { color: tc.heading }]} numberOfLines={1}>{item.reference}</Text>
            </Animated.View>
          </View>

          <Animated.View entering={FadeInDown.delay(480)} style={styles.actions}>
            {[
              { icon: 'arrow-redo-outline' as const, label: t('feed.share'), onPress: onShare, active: false },
              { icon: (saved ? 'heart' : 'heart-outline') as keyof typeof Ionicons.glyphMap, label: t('feed.like'), onPress: onSave, active: saved },
            ].map((a) => (
              <Pressable key={a.label} style={styles.action} onPress={a.onPress} accessibilityLabel={a.label} accessibilityRole="button">
                <View style={[styles.actionIcon, { backgroundColor: tc.cardBg, borderColor: tc.border }, a.active && { backgroundColor: tc.gold, borderColor: tc.gold }]}>
                  <Ionicons name={a.icon} size={22} color={a.active ? tc.onGold : tc.gold} />
                </View>
                <Text style={[styles.actionLabel, { color: tc.muted }]}>{a.label}</Text>
              </Pressable>
            ))}
          </Animated.View>
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm },
  surahName: { fontFamily: fonts.serifSemibold, fontSize: 18, lineHeight: 30, flex: 1, textAlign: 'center', marginHorizontal: spacing.sm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  arabicWrap: { marginTop: spacing.xl, paddingHorizontal: spacing.xs },
  translation: {
    fontFamily: fonts.serif,
    fontSize: 18,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 27,
  },
  metaRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xl },
  metaChip: {
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    maxWidth: 220,
  },
  metaValue: { fontFamily: fonts.sansSemibold, fontSize: 14 },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xl, marginTop: spacing.xl },
  action: { alignItems: 'center', gap: 6 },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontFamily: fonts.sans, fontSize: 12 },
});
