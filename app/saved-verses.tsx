import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { ArabicText } from '../components/arabic/ArabicText';
import { fonts, radii, spacing } from '../constants/theme';
import { useThemeColors } from '../lib/useThemeColors';
import { useAppStore } from '../stores/useAppStore';
import { useOnboardingStore } from '../stores/useOnboardingStore';
import { fetchFeedItems, FeedItem, resolveLang } from '../lib/contentDb';
import { haptic } from '../lib/haptics';

export default function SavedVerses() {
  const router = useRouter();
  const tc = useThemeColors();
  const savedIds = useAppStore((s) => s.savedVerseIds);
  const isPremium = useAppStore((s) => s.isPremium);
  const toggleSave = useAppStore((s) => s.toggleSave);
  const rawLang = useOnboardingStore((s) => s.language);
  const lang = resolveLang(rawLang);
  const showArabic = rawLang === 'Arabic';

  const [items, setItems] = React.useState<FeedItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    if (savedIds.length === 0) { setItems([]); setLoading(false); return; }
    setLoading(true);
    // Favorites → tüm türlerden kaydedilenleri çek (forceFresh: her zaman taze)
    fetchFeedItems(lang, 200, ['Favorites'], isPremium, savedIds, true)
      .then((data) => {
        if (!cancelled) { setItems(data); setLoading(false); }
      })
      .catch(() => {
        if (!cancelled) { setItems([]); setLoading(false); }
      });
    return () => { cancelled = true; };
  }, [lang, isPremium, savedIds.join(',')]);

  const removeItem = (it: FeedItem) => {
    haptic.medium();
    toggleSave({
      id: it.id, arabic: it.arabic, translation: it.translation,
      surah: it.reference.split(' · ')[0], ayah: 0, juz: 0,
      origin: 'Makkah', category: 'peace', tags: it.topics,
    });
    setItems((prev) => prev.filter((x) => x.id !== it.id));
  };

  return (
    <ScreenContainer padded={false}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: tc.cardBg }]} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={22} color={tc.heading} />
        </Pressable>
        <Text style={[styles.title, { color: tc.heading }]}>Saved Verses</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.empty}>
          <ActivityIndicator color={tc.gold} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={48} color={tc.muted} />
          <Text style={[styles.emptyTitle, { color: tc.heading }]}>No saved verses yet</Text>
          <Text style={[styles.emptySub, { color: tc.muted }]}>Double-tap or tap the heart on any verse to save it here.</Text>
          <Pressable style={[styles.emptyBtn, { backgroundColor: tc.gold }]} onPress={() => router.push('/(tabs)/feed')}>
            <Text style={[styles.emptyBtnText, { color: tc.onGold }]}>Browse Verses</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <Text style={[styles.count, { color: tc.muted }]}>{items.length} saved</Text>
          {items.map((v, i) => {
            const renderArabic = showArabic && v.arabic.trim().length > 0;
            return (
              <Animated.View key={v.id} entering={FadeInDown.delay(i * 50).duration(380)}>
                <Pressable
                  style={[styles.card, { backgroundColor: tc.cardBg, borderColor: tc.border }]}
                  onPress={() => { haptic.light(); router.push(`/verse/${v.id}`); }}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${v.reference}`}
                >
                  {renderArabic ? (
                    <ArabicText size={22} style={{ textAlign: 'center', marginBottom: spacing.sm }}>
                      {v.arabic}
                    </ArabicText>
                  ) : null}
                  <Text style={[styles.translation, { color: tc.body }]} numberOfLines={4}>
                    "{v.translation}"
                  </Text>
                  <View style={styles.cardFooter}>
                    <Text style={[styles.ref, { color: tc.gold }]}>{v.reference}</Text>
                    <Pressable
                      onPress={() => removeItem(v)}
                      hitSlop={10}
                      accessibilityRole="button"
                      accessibilityLabel="Remove from saved"
                    >
                      <Ionicons name="heart" size={20} color={tc.gold} />
                    </Pressable>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </ScrollView>
      )}
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
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 120, gap: spacing.md },
  count: { fontFamily: fonts.sans, fontSize: 13, marginBottom: spacing.xs },
  card: { borderRadius: radii.xl, borderWidth: 1, padding: spacing.lg },
  translation: { fontFamily: fonts.serif, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  ref: { fontFamily: fonts.sansMedium, fontSize: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  emptyTitle: { fontFamily: fonts.serifBold, fontSize: 22, lineHeight: 36 },
  emptySub: { fontFamily: fonts.sans, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  emptyBtn: { borderRadius: radii.pill, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, marginTop: spacing.sm },
  emptyBtnText: { fontFamily: fonts.sansBold, fontSize: 15 },
});
