import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { ToggleSwitch } from '../../components/ui/ToggleSwitch';
import { BackButton } from '../../components/ui/BackButton';
import { colors, fonts, radii, shadow, spacing } from '../../constants/theme';
import { useOnboardingStore } from '../../stores/useOnboardingStore';
import { useAppStore } from '../../stores/useAppStore';
import { haptic } from '../../lib/haptics';

export default function Settings() {
  const router = useRouter();
  const name     = useOnboardingStore((s) => s.name) || '—';
  const age      = useOnboardingStore((s) => s.age) || '—';
  const language = useOnboardingStore((s) => s.language) || '—';
  const reminderStart  = useOnboardingStore((s) => s.reminderStart);
  const reminderEnd    = useOnboardingStore((s) => s.reminderEnd);
  const reminderCount  = useOnboardingStore((s) => s.reminderCount);
  const contentTypes   = useOnboardingStore((s) => s.contentTypes);
  const isPremium   = useAppStore((s) => s.isPremium);
  const darkMode    = useAppStore((s) => s.darkMode);
  const setDarkMode = useAppStore((s) => s.setDarkMode);

  const isLight = !darkMode;
  const textColor = isLight ? colors.warm.text : colors.text.heading;
  const mutedColor = isLight ? colors.warm.muted : colors.text.muted;
  const cardBg = isLight ? colors.warm.surface : colors.bg.card;
  const dividerColor = isLight ? colors.warm.border : colors.hairline;

  const sections: {
    title: string;
    rows: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }[];
  }[] = [
    {
      title: 'PERSONALIZATION',
      rows: [
        {
          label: 'Your Name',
          value: name,
          icon: 'person-outline',
          onPress: () => router.push('/reminders-settings'),
        },
        {
          label: 'Age Group',
          value: age,
          icon: 'calendar-outline',
          onPress: () => {},
        },
        {
          label: 'Preferred Language',
          value: language,
          icon: 'language-outline',
          onPress: () => router.push('/language-settings'),
        },
      ],
    },
    {
      title: 'NOTIFICATIONS',
      rows: [
        {
          label: 'Reminder Hours',
          value: `${reminderStart} – ${reminderEnd}`,
          icon: 'time-outline',
          onPress: () => router.push('/reminders-settings'),
        },
        {
          label: 'Content Type',
          value: contentTypes[0] ?? 'Verse + Dua',
          icon: 'book-outline',
          onPress: () => {},
        },
        {
          label: 'Frequency',
          value: `${reminderCount}× daily`,
          icon: 'notifications-outline',
          onPress: () => router.push('/reminders-settings'),
        },
      ],
    },
    {
      title: 'APPEARANCE',
      rows: [
        {
          label: 'App Theme',
          value: 'Dark Night',
          icon: 'color-palette-outline',
          onPress: () => router.push('/(tabs)/themes'),
        },
        {
          label: 'Widget Studio',
          value: 'Customize →',
          icon: 'grid-outline',
          onPress: () => router.push('/widget-studio'),
        },
      ],
    },
  ];

  return (
    <ScreenContainer padded={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 120, paddingTop: spacing.sm }}
      >
        <View style={styles.headingRow}>
          <BackButton style={{ marginRight: spacing.sm }} />
          <Text style={[styles.heading, { color: textColor }]}>Settings</Text>
        </View>

        {/* Premium card */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={[styles.premium, isPremium && shadow.goldGlow]}
        >
          <Pressable
            style={styles.premiumInner}
            onPress={() => router.push('/(onboarding)/paywall')}
            accessibilityRole="button"
          >
            <Ionicons name="sparkles" size={18} color={colors.gold.bright} />
            <Text style={styles.premiumText}>
              Noor Premium — {isPremium ? '✓ Active' : 'Unlock'}
            </Text>
            <Text style={styles.manage}>Manage ›</Text>
          </Pressable>
        </Animated.View>

        {sections.map((section, si) => (
          <Animated.View key={section.title} entering={FadeInDown.delay(100 + si * 80)}>
            <Text style={[styles.sectionTitle, { color: mutedColor }]}>{section.title}</Text>
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: dividerColor }]}>
              {section.rows.map((row, ri) => (
                <React.Fragment key={row.label}>
                  <Pressable
                    style={styles.row}
                    onPress={() => { haptic.select(); row.onPress(); }}
                    accessibilityRole="button"
                    accessibilityLabel={`${row.label}: ${row.value}`}
                  >
                    <View style={styles.rowLeft}>
                      <Ionicons name={row.icon} size={16} color={colors.gold.primary} />
                      <Text style={[styles.rowLabel, { color: textColor }]}>{row.label}</Text>
                    </View>
                    <View style={styles.rowRight}>
                      <Text style={[styles.rowValue, { color: mutedColor }]} numberOfLines={1}>
                        {row.value}
                      </Text>
                      <Ionicons name="chevron-forward" size={14} color={mutedColor} />
                    </View>
                  </Pressable>
                  {ri < section.rows.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: dividerColor }]} />
                  )}
                </React.Fragment>
              ))}
            </View>
          </Animated.View>
        ))}

        {/* Dark mode toggle */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <Text style={[styles.sectionTitle, { color: mutedColor }]}>THEME</Text>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: dividerColor }]}>
            <View style={styles.toggleRow}>
              <View style={styles.rowLeft}>
                <Ionicons name="moon-outline" size={16} color={colors.gold.primary} />
                <Text style={[styles.rowLabel, { color: textColor }]}>Dark Mode</Text>
              </View>
              <ToggleSwitch
                value={darkMode}
                onChange={(v) => { haptic.select(); setDarkMode(v); }}
                label="Dark Mode"
              />
            </View>
          </View>
        </Animated.View>

        {/* Saved Verses quick link */}
        <Animated.View entering={FadeInDown.delay(460)}>
          <Pressable
            style={[styles.card, { backgroundColor: cardBg, borderColor: dividerColor, marginTop: spacing.xs }]}
            onPress={() => { haptic.select(); router.push('/saved-verses'); }}
            accessibilityRole="button"
          >
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons name="heart-outline" size={16} color={colors.gold.primary} />
                <Text style={[styles.rowLabel, { color: textColor }]}>Saved Verses</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={mutedColor} />
            </View>
          </Pressable>
        </Animated.View>

      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  heading: { fontFamily: fonts.serifBold, fontSize: 28 },
  premium: {
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.gold.primary,
    marginBottom: spacing.xs,
    overflow: 'hidden',
  },
  premiumInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.bg.raised,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  premiumText: { flex: 1, fontFamily: fonts.sansSemibold, fontSize: 15, color: colors.gold.bright },
  manage: { fontFamily: fonts.sans, fontSize: 13, color: colors.text.muted },
  sectionTitle: {
    fontFamily: fonts.sansSemibold,
    fontSize: 11,
    letterSpacing: 1,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowLabel: { fontFamily: fonts.sansMedium, fontSize: 15 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '50%' },
  rowValue: { fontFamily: fonts.sans, fontSize: 13 },
  divider: { height: 1 },
});
