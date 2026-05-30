import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { StreakWidget } from '../../components/ui/StreakWidget';
import { ToggleSwitch } from '../../components/ui/ToggleSwitch';
import { BackButton } from '../../components/ui/BackButton';
import { colors, fonts, radii, spacing } from '../../constants/theme';
import { useOnboardingStore } from '../../stores/useOnboardingStore';
import { useAppStore } from '../../stores/useAppStore';
import { haptic } from '../../lib/haptics';

export default function Profile() {
  const router      = useRouter();
  const name        = useOnboardingStore((s) => s.name) || 'Friend';
  const language    = useOnboardingStore((s) => s.language) || 'Arabic + English';
  const reminderCount = useOnboardingStore((s) => s.reminderCount);
  const streakDays  = useAppStore((s) => s.streakDays);
  const isPremium   = useAppStore((s) => s.isPremium);
  const darkMode    = useAppStore((s) => s.darkMode);
  const setDarkMode = useAppStore((s) => s.setDarkMode);
  const savedCount  = useAppStore((s) => s.savedVerseIds.length);

  // dark mode geçişi için metin rengi
  const isLight = !darkMode;
  const textColor = isLight ? colors.warm.text : colors.text.heading;
  const mutedColor = isLight ? colors.warm.muted : colors.text.muted;
  const cardBg = isLight ? colors.warm.surface : colors.bg.card;
  const dividerColor = isLight ? colors.warm.border : colors.hairline;

  const ACTIONS: { icon: keyof typeof Ionicons.glyphMap; label: string; sub: string; onPress: () => void }[] = [
    {
      icon: 'heart-outline',
      label: 'Saved Verses',
      sub: `${savedCount} saved`,
      onPress: () => router.push('/saved-verses'),
    },
    {
      icon: 'notifications-outline',
      label: 'Reminders',
      sub: `${reminderCount}× daily`,
      onPress: () => router.push('/reminders-settings'),
    },
    {
      icon: 'color-palette-outline',
      label: 'Themes',
      sub: '9 themes',
      onPress: () => router.push('/(tabs)/themes'),
    },
    {
      icon: 'grid-outline',
      label: 'Widget',
      sub: 'Customize',
      onPress: () => router.push('/widget-studio'),
    },
  ];

  return (
    <ScreenContainer padded={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* HEADER */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <View style={styles.headerLeft}>
            <BackButton style={{ marginRight: spacing.sm }} />
            <View>
              <Text style={[styles.screenTitle, { color: textColor }]}>Profile</Text>
              <Text style={[styles.nameText, { color: mutedColor }]}>
                {name}
              </Text>
            </View>
          </View>
          <View style={[styles.avatarCircle, { backgroundColor: cardBg }]}>
            <Ionicons name="person" size={24} color={colors.gold.primary} />
          </View>
        </Animated.View>

        {/* PREMIUM BANNER */}
        {!isPremium && (
          <Animated.View entering={FadeInDown.delay(60).duration(400)}>
            <Pressable
              style={styles.premiumBanner}
              onPress={() => router.push('/(onboarding)/paywall')}
              accessibilityRole="button"
              accessibilityLabel="Unlock premium"
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.premiumTitle}>Unlock everything ✦</Text>
                <Text style={styles.premiumSub}>All quotes, themes, categories & no ads</Text>
              </View>
              <View style={styles.premiumIcon}>
                <Ionicons name="book-outline" size={28} color="rgba(255,255,255,0.9)" />
              </View>
            </Pressable>
          </Animated.View>
        )}

        {/* STREAK */}
        <Animated.View entering={FadeInDown.delay(120).duration(400)}>
          <StreakWidget streakDays={streakDays} />
        </Animated.View>

        {/* QUICK ACTIONS */}
        <Animated.View entering={FadeInDown.delay(180).duration(400)}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Quick actions</Text>
          <View style={styles.actionsGrid}>
            {ACTIONS.map((a) => (
              <ActionCard
                key={a.label}
                icon={a.icon}
                label={a.label}
                sub={a.sub}
                cardBg={cardBg}
                borderColor={dividerColor}
                textColor={textColor}
                mutedColor={mutedColor}
                gold={isLight ? colors.warm.gold : colors.gold.primary}
                onPress={() => { haptic.select(); a.onPress(); }}
              />
            ))}
          </View>
        </Animated.View>

        {/* SETTINGS */}
        <Animated.View entering={FadeInDown.delay(240).duration(400)}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Settings</Text>
          <View style={[styles.settingsCard, { backgroundColor: cardBg, borderColor: dividerColor }]}>

            <SettingsRow
              icon="person-outline"
              label="Name"
              value={name}
              textColor={textColor}
              mutedColor={mutedColor}
              isLight={isLight}
              onPress={() => router.push('/name-settings')}
            />
            <View style={[styles.divider, { backgroundColor: dividerColor }]} />

            <SettingsRow
              icon="language-outline"
              label="Language"
              value={language}
              textColor={textColor}
              mutedColor={mutedColor}
              isLight={isLight}
              onPress={() => router.push('/language-settings')}
            />
            <View style={[styles.divider, { backgroundColor: dividerColor }]} />

            <SettingsRow
              icon="notifications-outline"
              label="Notifications"
              value={`${reminderCount}× daily`}
              textColor={textColor}
              mutedColor={mutedColor}
              isLight={isLight}
              onPress={() => router.push('/reminders-settings')}
            />
            <View style={[styles.divider, { backgroundColor: dividerColor }]} />

            {/* Dark mode toggle — gerçekten çalışıyor */}
            <View style={styles.toggleRow}>
              <View style={styles.rowLeft}>
                <Ionicons
                  name="moon-outline"
                  size={18}
                  color={colors.gold.primary}
                  style={styles.rowIcon}
                />
                <Text style={[styles.rowLabel, { color: textColor }]}>Dark Mode</Text>
              </View>
              <ToggleSwitch
                value={darkMode}
                onChange={(v) => {
                  haptic.select();
                  setDarkMode(v);
                }}
                label="Dark Mode"
              />
            </View>
          </View>
        </Animated.View>

        {/* FOOTER */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.footer}>
          <Pressable hitSlop={8} onPress={() => {}}>
            <Text style={[styles.footerLink, { color: mutedColor }]}>Restore Purchase</Text>
          </Pressable>
          <Text style={[styles.footerDot, { color: mutedColor }]}>·</Text>
          <Pressable hitSlop={8} onPress={() => {}}>
            <Text style={[styles.footerLink, { color: mutedColor }]}>Privacy Policy</Text>
          </Pressable>
          <Text style={[styles.footerDot, { color: mutedColor }]}>·</Text>
          <Pressable hitSlop={8} onPress={() => {}}>
            <Text style={[styles.footerLink, { color: mutedColor }]}>Terms</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </ScreenContainer>
  );
}

/* ── Sub-components ── */

function ActionCard({ icon, label, sub, cardBg, borderColor, textColor, mutedColor, gold, onPress }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string; sub: string; cardBg: string; borderColor: string;
  textColor: string; mutedColor: string; gold: string; onPress: () => void;
}) {
  const pressStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(cardBg, { duration: 200 }),
  }));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{ width: '47.5%' }}
    >
      <Animated.View style={[styles.actionCard, pressStyle, { borderColor }]}>
        <Text style={[styles.actionLabel, { color: textColor }]}>{label}</Text>
        <Text style={[styles.actionSub, { color: mutedColor }]}>{sub}</Text>
        <Ionicons name={icon} size={24} color={gold} style={{ marginTop: 'auto' }} />
      </Animated.View>
    </Pressable>
  );
}

function SettingsRow({ icon, label, value, textColor, mutedColor, isLight, onPress }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string; value: string;
  textColor: string; mutedColor: string; isLight: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.settingsRow} onPress={onPress} accessibilityRole="button">
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={18} color={colors.gold.primary} style={styles.rowIcon} />
        <Text style={[styles.rowLabel, { color: textColor }]}>{label}</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={[styles.rowValue, { color: mutedColor }]} numberOfLines={1}>{value}</Text>
        <Ionicons name="chevron-forward" size={15} color={isLight ? colors.warm.muted : colors.text.muted} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 120, gap: spacing.lg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  screenTitle: { fontFamily: fonts.serifBold, fontSize: 28 },
  nameText: { fontFamily: fonts.sans, fontSize: 14, marginTop: 2 },
  avatarCircle: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
  },

  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gold.deep,
    borderRadius: radii.xl,
    padding: spacing.md,
    gap: spacing.md,
  },
  premiumTitle: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.white },
  premiumSub: { fontFamily: fonts.sans, fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 3 },
  premiumIcon: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },

  sectionTitle: { fontFamily: fonts.sansBold, fontSize: 17, marginBottom: spacing.sm },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  actionCard: {
    minHeight: 96,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  actionLabel: { fontFamily: fonts.sansSemibold, fontSize: 14 },
  actionSub: { fontFamily: fonts.sans, fontSize: 12, marginTop: 2 },

  settingsCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 15,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 15,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowIcon: {},
  rowLabel: { fontFamily: fonts.sansMedium, fontSize: 15 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '55%' },
  rowValue: { fontFamily: fonts.sans, fontSize: 14 },
  divider: { height: 1, marginHorizontal: spacing.md },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  footerLink: { fontFamily: fonts.sans, fontSize: 12 },
  footerDot: { fontSize: 12 },
});
