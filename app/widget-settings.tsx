import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { GoldButton } from '../components/ui/GoldButton';
import { fonts, radii, spacing } from '../constants/theme';
import { useThemeColors } from '../lib/useThemeColors';
import { useOnboardingStore } from '../stores/useOnboardingStore';
import { useAppStore } from '../stores/useAppStore';
import { haptic } from '../lib/haptics';
import { syncWidget } from '../lib/widgetSync';

const CONTENT_TYPES: { icon: keyof typeof Ionicons.glyphMap; title: string; desc: string }[] = [
  { icon: 'moon-outline',     title: 'Prayer Times',     desc: 'Next prayer, countdown and the full daily schedule for your city.' },
  { icon: 'book-outline',     title: 'Verse of the Day', desc: 'A fresh verse with its translation, refreshed every day.' },
  { icon: 'flame-outline',    title: 'Streak',           desc: 'Your current day streak to keep your habit going.' },
  { icon: 'sparkles-outline', title: 'Smart',            desc: 'Automatically shows the most relevant content for the widget size.' },
];

const STEPS = [
  'Long-press an empty spot on your Home Screen or Lock Screen.',
  'Tap the + (Add Widget) button, then search for “Noor”.',
  'Pick a size and add it.',
  'Long-press the widget → “Edit Widget” to choose what it shows.',
];

export default function WidgetSettings() {
  const router = useRouter();
  const tc = useThemeColors();
  const language = useOnboardingStore((s) => s.language);
  const streakDays = useAppStore((s) => s.streakDays);
  const [syncing, setSyncing] = React.useState(false);
  const [synced, setSynced] = React.useState(false);

  const onRefresh = async () => {
    haptic.medium();
    setSyncing(true);
    setSynced(false);
    await syncWidget({ language, streakDays, force: true });
    setSyncing(false);
    setSynced(true);
    haptic.success();
    setTimeout(() => setSynced(false), 2500);
  };

  return (
    <ScreenContainer padded={false}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: tc.cardBg }]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={tc.heading} />
        </Pressable>
        <Text style={[styles.title, { color: tc.heading }]}>Widgets</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sub, { color: tc.muted }]}>
          Add Noor to your Home Screen and Lock Screen. Each widget can show a
          different kind of content — pick it from “Edit Widget”.
        </Text>

        {Platform.OS !== 'ios' && (
          <View style={[styles.notice, { backgroundColor: tc.cardBg, borderColor: tc.border }]}>
            <Ionicons name="information-circle-outline" size={18} color={tc.gold} />
            <Text style={[styles.noticeText, { color: tc.body }]}>
              Widgets are available on iOS only.
            </Text>
          </View>
        )}

        {/* Content types */}
        <Text style={[styles.sectionTitle, { color: tc.heading }]}>What it can show</Text>
        {CONTENT_TYPES.map((c, i) => (
          <Animated.View
            key={c.title}
            entering={FadeInDown.delay(i * 50).duration(350)}
            style={[styles.row, { backgroundColor: tc.cardBg, borderColor: tc.border }]}
          >
            <View style={[styles.iconCircle, { backgroundColor: tc.raisedBg }]}>
              <Ionicons name={c.icon} size={20} color={tc.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: tc.heading }]}>{c.title}</Text>
              <Text style={[styles.rowDesc, { color: tc.muted }]}>{c.desc}</Text>
            </View>
          </Animated.View>
        ))}

        {/* How to add */}
        <Text style={[styles.sectionTitle, { color: tc.heading, marginTop: spacing.lg }]}>
          How to add a widget
        </Text>
        <View style={[styles.stepsCard, { backgroundColor: tc.cardBg, borderColor: tc.border }]}>
          {STEPS.map((s, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={[styles.stepNum, { backgroundColor: tc.gold }]}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={[styles.stepText, { color: tc.body }]}>{s}</Text>
            </View>
          ))}
        </View>

        <View style={{ marginTop: spacing.lg }}>
          <GoldButton
            label={synced ? 'Widgets refreshed ✓' : syncing ? 'Refreshing…' : 'Refresh widgets now'}
            onPress={onRefresh}
            disabled={syncing || Platform.OS !== 'ios'}
          />
          <Text style={[styles.hint, { color: tc.muted }]}>
            Widgets update automatically. Tap above to push the latest prayer
            times, verse and streak right away.
          </Text>
        </View>
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
  sub: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, marginBottom: spacing.md },
  notice: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderRadius: radii.md, borderWidth: 1, padding: spacing.md, marginBottom: spacing.md,
  },
  noticeText: { fontFamily: fonts.sansMedium, fontSize: 13, flex: 1 },
  sectionTitle: { fontFamily: fonts.sansBold, fontSize: 16, marginBottom: spacing.sm },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    borderRadius: radii.md, borderWidth: 1, padding: spacing.md, marginBottom: spacing.sm,
  },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: fonts.sansSemibold, fontSize: 15 },
  rowDesc: { fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 17, marginTop: 2 },
  stepsCard: { borderRadius: radii.md, borderWidth: 1, padding: spacing.md, gap: spacing.md },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  stepNum: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  stepNumText: { fontFamily: fonts.sansBold, fontSize: 12, color: '#FFFFFF' },
  stepText: { fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 19, flex: 1 },
  hint: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: spacing.sm },
});
