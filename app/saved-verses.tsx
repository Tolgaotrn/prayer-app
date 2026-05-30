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
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { ArabicText } from '../components/arabic/ArabicText';
import { colors, fonts, radii, spacing } from '../constants/theme';
import { verses } from '../data/verses';
import { useAppStore } from '../stores/useAppStore';
import { haptic } from '../lib/haptics';

export default function SavedVerses() {
  const router = useRouter();
  const savedIds = useAppStore((s) => s.savedVerseIds);
  const toggleSave = useAppStore((s) => s.toggleSave);
  const saved = verses.filter((v) => savedIds.includes(v.id));

  return (
    <ScreenContainer padded={false}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={22} color={colors.text.heading} />
        </Pressable>
        <Text style={styles.title}>Saved Verses</Text>
        <View style={{ width: 40 }} />
      </View>

      {saved.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={48} color={colors.text.muted} />
          <Text style={styles.emptyTitle}>No saved verses yet</Text>
          <Text style={styles.emptySub}>Tap the heart icon on any verse to save it here.</Text>
          <Pressable style={styles.emptyBtn} onPress={() => router.push('/(tabs)/feed')}>
            <Text style={styles.emptyBtnText}>Browse Verses</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          <Text style={styles.count}>{saved.length} verse{saved.length !== 1 ? 's' : ''}</Text>
          {saved.map((v, i) => (
            <Animated.View key={v.id} entering={FadeInDown.delay(i * 60).duration(400)}>
              <Pressable
                style={styles.card}
                onPress={() => { haptic.light(); router.push(`/verse/${v.id}`); }}
                accessibilityRole="button"
                accessibilityLabel={`Open verse ${v.surah} ${v.ayah}`}
              >
                <ArabicText size={22} style={{ textAlign: 'center', marginBottom: spacing.sm }}>
                  {v.arabic}
                </ArabicText>
                <Text style={styles.translation} numberOfLines={3}>
                  "{v.translation}"
                </Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.ref}>{v.surah} · Ayah {v.ayah}</Text>
                  <Pressable
                    onPress={() => { haptic.medium(); toggleSave(v); }}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel="Remove from saved"
                  >
                    <Ionicons name="heart" size={20} color={colors.gold.primary} />
                  </Pressable>
                </View>
              </Pressable>
            </Animated.View>
          ))}
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.bg.card,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontFamily: fonts.serifBold, fontSize: 22, color: colors.text.heading },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 120, gap: spacing.md },
  count: { fontFamily: fonts.sans, fontSize: 13, color: colors.text.muted, marginBottom: spacing.xs },
  card: {
    backgroundColor: colors.bg.card,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.lg,
  },
  translation: { fontFamily: fonts.serif, fontSize: 15, color: colors.text.body, textAlign: 'center', lineHeight: 22 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  ref: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.gold.bright },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  emptyTitle: { fontFamily: fonts.serifBold, fontSize: 22, color: colors.text.heading },
  emptySub: { fontFamily: fonts.sans, fontSize: 15, color: colors.text.muted, textAlign: 'center', lineHeight: 22 },
  emptyBtn: {
    backgroundColor: colors.gold.primary, borderRadius: radii.pill,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, marginTop: spacing.sm,
  },
  emptyBtnText: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.text.onGold },
});
