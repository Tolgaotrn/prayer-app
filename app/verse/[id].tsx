import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { ArabicText } from '../../components/arabic/ArabicText';
import { colors, fonts, radii, spacing } from '../../constants/theme';
import { verses } from '../../data/verses';
import { useAppStore } from '../../stores/useAppStore';
import { haptic } from '../../lib/haptics';
import { Share } from 'react-native';

export default function VerseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const verse = verses.find((v) => v.id === id) ?? verses[0];
  const saved = useAppStore((s) => s.savedVerseIds.includes(verse.id));
  const toggleSave = useAppStore((s) => s.toggleSave);
  const [playing, setPlaying] = React.useState(false);

  const similar = verses
    .filter((v) => v.category === verse.category && v.id !== verse.id)
    .slice(0, 6);

  const meta = [
    { label: 'Surah', value: verse.surah },
    { label: 'Ayah', value: String(verse.ayah) },
    { label: 'Juz', value: String(verse.juz) },
    { label: 'Origin', value: verse.origin },
  ];

  const actions: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; active?: boolean }[] = [
    {
      icon: 'arrow-redo-outline',
      label: 'Share',
      onPress: () => {
        haptic.medium();
        Share.share({ message: `"${verse.translation}" — ${verse.surah} ${verse.ayah}` }).catch(() => {});
      },
    },
    {
      icon: saved ? 'heart' : 'heart-outline',
      label: 'Save',
      active: saved,
      onPress: () => {
        haptic.medium();
        toggleSave(verse);
      },
    },
    {
      icon: playing ? 'pause-circle' : 'play-circle',
      label: 'Audio',
      active: playing,
      onPress: () => {
        haptic.light();
        setPlaying((p) => !p);
      },
    },
    { icon: 'book-outline', label: 'Open Surah', onPress: () => haptic.light() },
  ];

  return (
    <ScreenContainer>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back" accessibilityRole="button">
          <Ionicons name="chevron-back" size={26} color={colors.text.heading} />
        </Pressable>
        <Text style={styles.surahName}>{verse.surah}</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <Animated.View entering={FadeIn.duration(700)} style={styles.arabicWrap}>
          <ArabicText size={38}>{verse.arabic}</ArabicText>
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(250)} style={styles.translation}>
          "{verse.translation}"
        </Animated.Text>

        <View style={styles.metaRow}>
          {meta.map((m, i) => (
            <Animated.View key={m.label} entering={FadeInDown.delay(350 + i * 80)} style={styles.metaChip}>
              <Text style={styles.metaLabel}>{m.label}</Text>
              <Text style={styles.metaValue}>{m.value}</Text>
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeInDown.delay(620)} style={styles.actions}>
          {actions.map((a) => (
            <Pressable key={a.label} style={styles.action} onPress={a.onPress} accessibilityLabel={a.label} accessibilityRole="button">
              <View style={[styles.actionIcon, a.active && styles.actionActive]}>
                <Ionicons name={a.icon} size={22} color={a.active ? colors.text.onGold : colors.gold.bright} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </Pressable>
          ))}
        </Animated.View>

        {similar.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Similar Verses</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              {similar.map((v, i) => (
                <Animated.View key={v.id} entering={FadeInRight.delay(i * 80)}>
                  <Pressable style={styles.similarCard} onPress={() => router.push(`/verse/${v.id}`)}>
                    <ArabicText size={20}>{v.arabic}</ArabicText>
                    <Text style={styles.similarText} numberOfLines={2}>
                      {v.translation}
                    </Text>
                    <Text style={styles.similarRef}>
                      {v.surah} {v.ayah}
                    </Text>
                  </Pressable>
                </Animated.View>
              ))}
            </ScrollView>
          </>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm },
  surahName: { fontFamily: fonts.serifSemibold, fontSize: 18, color: colors.text.heading },
  arabicWrap: { marginTop: spacing.xl, paddingHorizontal: spacing.xs },
  translation: {
    fontFamily: fonts.serif,
    fontSize: 18,
    color: colors.text.body,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 27,
  },
  metaRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xl },
  metaChip: {
    backgroundColor: colors.bg.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 72,
    alignItems: 'center',
  },
  metaLabel: { fontFamily: fonts.sans, fontSize: 11, color: colors.text.muted },
  metaValue: { fontFamily: fonts.sansSemibold, fontSize: 14, color: colors.text.heading, marginTop: 2 },
  actions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.xl },
  action: { alignItems: 'center', gap: 6 },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionActive: { backgroundColor: colors.gold.primary, borderColor: colors.gold.primary },
  actionLabel: { fontFamily: fonts.sans, fontSize: 12, color: colors.text.muted },
  sectionTitle: { fontFamily: fonts.sansBold, fontSize: 18, color: colors.text.heading, marginTop: spacing.xl, marginBottom: spacing.md },
  similarCard: {
    width: 220,
    borderRadius: radii.md,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.md,
  },
  similarText: { fontFamily: fonts.serif, fontSize: 13, color: colors.text.body, marginTop: spacing.sm, lineHeight: 19 },
  similarRef: { fontFamily: fonts.sans, fontSize: 11, color: colors.text.muted, marginTop: spacing.sm },
});
