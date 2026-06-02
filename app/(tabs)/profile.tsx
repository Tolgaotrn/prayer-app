/**
 * profile — Professional settings hub
 *
 * Sections:
 *  • Identity card  (avatar + name + plan badge + streak)
 *  • Premium banner (free users only)
 *  • Quick actions  (Saved Verses, Reminders)
 *  • Appearance     (Font, Dark Mode)
 *  • Account        (Name, Language)
 *  • Support        (Rate App, Contact Us, About)
 *  • Legal          (Privacy Policy, Terms of Use, Restore Purchase)
 *  • Version footer
 */
import React from 'react';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';

import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { ToggleSwitch } from '../../components/ui/ToggleSwitch';
import { BackButton } from '../../components/ui/BackButton';
import { colors, fonts, radii, spacing } from '../../constants/theme';
import { getTheme } from '../../data/themes';
import { useThemeColors } from '../../lib/useThemeColors';
import { useT } from '../../lib/i18n';
import { useOnboardingStore } from '../../stores/useOnboardingStore';
import { useAppStore } from '../../stores/useAppStore';
import { haptic } from '../../lib/haptics';
import { restoreRevenueCatPurchases } from '../../lib/revenueCat';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

export default function Profile() {
  const router      = useRouter();
  const tc          = useThemeColors();
  const t           = useT();
  const name        = useOnboardingStore((s) => s.name) || 'Friend';
  const language    = useOnboardingStore((s) => s.language) || 'English';
  const reminderCount = useOnboardingStore((s) => s.reminderCount);
  const streakDays  = useAppStore((s) => s.streakDays);
  const isPremium   = useAppStore((s) => s.isPremium);
  const darkMode    = useAppStore((s) => s.darkMode);
  const setDarkMode = useAppStore((s) => s.setDarkMode);
  const setPremium  = useAppStore((s) => s.setPremium);
  const savedCount  = useAppStore((s) => s.savedVerseIds.length);
  const themeId     = useOnboardingStore((s) => s.selectedTheme);
  const currentThemeName = getTheme(themeId).name;

  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  const restorePurchase = async () => {
    haptic.select();
    try {
      const ok = await restoreRevenueCatPurchases();
      setPremium(ok);
      Alert.alert(ok ? 'Purchases restored' : 'No purchase found');
    } catch {
      Alert.alert('Restore failed', 'Please try again in a moment.');
    }
  };

  return (
    <ScreenContainer padded={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >

        {/* ── HEADER ── */}
        <Animated.View entering={FadeInDown.duration(350)} style={styles.header}>
          <BackButton />
          <Text style={[styles.pageTitle, { color: tc.heading }]}>{t('profile.title')}</Text>
          <View style={{ width: 40 }} />
        </Animated.View>

        {/* ── IDENTITY CARD ── */}
        <Animated.View
          entering={FadeInDown.delay(60).duration(400)}
          style={[styles.identityCard, { backgroundColor: tc.cardBg, borderColor: tc.border }]}
        >
          {/* Avatar */}
          <View style={[styles.avatarWrap, { backgroundColor: tc.gold + '22', borderColor: tc.gold + '55' }]}>
            <Text style={[styles.avatarInitials, { color: tc.gold }]}>{initials}</Text>
          </View>

          <View style={styles.identityMeta}>
            <Text style={[styles.identityName, { color: tc.heading }]} numberOfLines={1}>{name}</Text>
            <View style={styles.identityRow}>
              <View style={[
                styles.planBadge,
                { backgroundColor: isPremium ? tc.gold + '22' : tc.raisedBg },
              ]}>
                {isPremium && <Ionicons name="star" size={9} color={tc.gold} />}
                <Text style={[styles.planText, { color: isPremium ? tc.gold : tc.muted }]}>
                  {isPremium ? t('profile.premium') : t('profile.free')}
                </Text>
              </View>
              <Text style={[styles.identityDot, { color: tc.muted }]}>·</Text>
              <Text style={[styles.identityLang, { color: tc.muted }]}>{language}</Text>
            </View>
          </View>

          {/* Streak pill */}
          <View style={[styles.streakPill, { backgroundColor: tc.raisedBg }]}>
            <Text style={[styles.streakNum, { color: tc.gold }]}>{streakDays}</Text>
            <Text style={[styles.streakLabel, { color: tc.muted }]}>{t('profile.dayStreak')}</Text>
          </View>
        </Animated.View>

        {/* ── PREMIUM BANNER ── */}
        {!isPremium && (
          <Animated.View entering={FadeInDown.delay(110).duration(400)}>
            <Pressable
              style={styles.premiumBanner}
              onPress={() => { haptic.medium(); router.push('/(onboarding)/paywall'); }}
              accessibilityRole="button"
              accessibilityLabel={t('profile.unlockTitle')}
            >
              <View style={styles.premiumLeft}>
                <View style={styles.premiumIconWrap}>
                  <Ionicons name="star" size={18} color={colors.gold.primary} />
                </View>
                <View>
                  <Text style={styles.premiumTitle}>{t('profile.unlockTitle')}</Text>
                  <Text style={styles.premiumSub}>{t('profile.unlockSub')}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
            </Pressable>
          </Animated.View>
        )}

        {/* ── QUICK ACTIONS ── */}
        <Animated.View entering={FadeInDown.delay(160).duration(400)}>
          <SectionLabel label={t('profile.quickActions')} tc={tc} />
          <View style={styles.actionsRow}>
            <ActionCard
              icon="heart-outline"
              label={t('profile.savedVerses')}
              sub={t('profile.savedCount', { n: savedCount })}
              tc={tc}
              onPress={() => { haptic.select(); router.push('/saved-verses'); }}
            />
            <ActionCard
              icon="notifications-outline"
              label={t('profile.reminders')}
              sub={t('profile.dailyCount', { n: reminderCount })}
              tc={tc}
              onPress={() => { haptic.select(); router.push('/notifications-settings'); }}
            />
          </View>
        </Animated.View>

        {/* ── APPEARANCE ── */}
        <Animated.View entering={FadeInDown.delay(210).duration(400)}>
          <SectionLabel label={t('profile.appearance')} tc={tc} />
          <View style={[styles.settingsCard, { backgroundColor: tc.cardBg, borderColor: tc.border }]}>

            {/* Tema kısayolu */}
            <NavRow
              icon="color-palette-outline"
              label="Theme"
              value={currentThemeName}
              tc={tc}
              onPress={() => { haptic.select(); router.push('/(tabs)/themes'); }}
            />

            <Divider tc={tc} />

            {/* Dark mode */}
            <View style={styles.settingsRow}>
              <View style={styles.rowLeft}>
                <SettingsIcon icon="moon-outline" tc={tc} />
                <Text style={[styles.rowLabel, { color: tc.heading }]}>{t('profile.darkMode')}</Text>
              </View>
              <ToggleSwitch
                value={darkMode}
                onChange={(v) => { haptic.select(); setDarkMode(v); }}
                label={t('profile.darkMode')}
              />
            </View>
          </View>
        </Animated.View>

        {/* ── ACCOUNT ── */}
        <Animated.View entering={FadeInDown.delay(255).duration(400)}>
          <SectionLabel label={t('profile.account')} tc={tc} />
          <View style={[styles.settingsCard, { backgroundColor: tc.cardBg, borderColor: tc.border }]}>
            <NavRow
              icon="person-outline"
              label={t('profile.name')}
              value={name}
              tc={tc}
              onPress={() => router.push('/name-settings')}
            />
            <Divider tc={tc} />
            <NavRow
              icon="language-outline"
              label={t('profile.language')}
              value={language}
              tc={tc}
              onPress={() => router.push('/language-settings')}
            />
          </View>
        </Animated.View>

        {/* ── REDEEM CODE ── */}
        {!isPremium && (
          <Animated.View entering={FadeInDown.delay(275).duration(400)}>
            <Pressable
              onPress={() => { haptic.select(); router.push('/promo-code'); }}
              style={[styles.redeemRow, { backgroundColor: tc.cardBg, borderColor: tc.border }]}
              accessibilityRole="button"
              accessibilityLabel="Redeem promo code"
            >
              <View style={[styles.redeemIcon, { backgroundColor: tc.gold + '18' }]}>
                <Ionicons name="gift-outline" size={18} color={tc.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.redeemLabel, { color: tc.heading }]}>Redeem a Code</Text>
                <Text style={[styles.redeemSub, { color: tc.muted }]}>Have a promo code? Unlock premium free</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={tc.muted} />
            </Pressable>
          </Animated.View>
        )}

        {/* ── SUPPORT ── */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <SectionLabel label={t('profile.support')} tc={tc} />
          <View style={[styles.settingsCard, { backgroundColor: tc.cardBg, borderColor: tc.border }]}>
            <NavRow
              icon="star-outline"
              label={t('profile.rateApp')}
              tc={tc}
              onPress={() => {
                haptic.select();
                const url = Platform.OS === 'ios'
                  ? 'itms-apps://itunes.apple.com/app/id6746878697?action=write-review'
                  : 'market://details?id=com.tolgaoturan.huda';
                Linking.openURL(url).catch(() => {});
              }}
            />
            <Divider tc={tc} />
            <NavRow
              icon="mail-outline"
              label={t('profile.contactUs')}
              tc={tc}
              onPress={() => {
                haptic.select();
                Linking.openURL('mailto:support@hudaapp.co?subject=Huda App Feedback').catch(() => {});
              }}
            />
            <Divider tc={tc} />
            <NavRow
              icon="information-circle-outline"
              label={t('profile.about')}
              tc={tc}
              onPress={() => { haptic.select(); }}
            />
          </View>
        </Animated.View>

        {/* ── LEGAL ── */}
        <Animated.View entering={FadeInDown.delay(345).duration(400)}>
          <SectionLabel label={t('profile.legal')} tc={tc} />
          <View style={[styles.settingsCard, { backgroundColor: tc.cardBg, borderColor: tc.border }]}>
            <NavRow
              icon="shield-outline"
              label={t('profile.privacy')}
              tc={tc}
              onPress={() => {
                haptic.select();
                Linking.openURL('https://hudaapp.co/privacy').catch(() => {});
              }}
            />
            <Divider tc={tc} />
            <NavRow
              icon="document-text-outline"
              label={t('profile.terms')}
              tc={tc}
              onPress={() => {
                haptic.select();
                Linking.openURL('https://hudaapp.co/terms').catch(() => {});
              }}
            />
            <Divider tc={tc} />
            <NavRow
              icon="refresh-outline"
              label={t('profile.restore')}
              tc={tc}
              onPress={restorePurchase}
            />
          </View>
        </Animated.View>

        {/* ── VERSION FOOTER ── */}
        <Animated.View entering={FadeInDown.delay(390).duration(400)} style={styles.footer}>
          <View style={[styles.logoMark, { borderColor: tc.border }]}>
            <Text style={[styles.logoText, { color: tc.gold }]}>✦</Text>
          </View>
          <Text style={[styles.appName, { color: tc.heading }]}>Huda</Text>
          <Text style={[styles.version, { color: tc.muted }]}>
            {t('profile.version')} {APP_VERSION}
          </Text>
          <Text style={[styles.tagline, { color: tc.muted }]}>
            Daily Islamic reflection
          </Text>
        </Animated.View>

      </ScrollView>
    </ScreenContainer>
  );
}

/* ─────────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────────── */

function SectionLabel({ label, tc }: { label: string; tc: ReturnType<typeof useThemeColors> }) {
  return (
    <Text style={[styles.sectionLabel, { color: tc.muted }]}>{label.toUpperCase()}</Text>
  );
}

function Divider({ tc }: { tc: ReturnType<typeof useThemeColors> }) {
  return <View style={[styles.divider, { backgroundColor: tc.border }]} />;
}

function SettingsIcon({ icon, tc }: { icon: keyof typeof Ionicons.glyphMap; tc: ReturnType<typeof useThemeColors> }) {
  return (
    <View style={[styles.settingsIconWrap, { backgroundColor: tc.raisedBg }]}>
      <Ionicons name={icon} size={16} color={tc.gold} />
    </View>
  );
}

function NavRow({
  icon, label, value, tc, onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  tc: ReturnType<typeof useThemeColors>;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.settingsRow, pressed && { opacity: 0.7 }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.rowLeft}>
        <SettingsIcon icon={icon} tc={tc} />
        <Text style={[styles.rowLabel, { color: tc.heading }]}>{label}</Text>
      </View>
      <View style={styles.rowRight}>
        {value ? (
          <Text style={[styles.rowValue, { color: tc.muted }]} numberOfLines={1}>{value}</Text>
        ) : null}
        <Ionicons name="chevron-forward" size={16} color={tc.muted} />
      </View>
    </Pressable>
  );
}

function ActionCard({
  icon, label, sub, tc, onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub: string;
  tc: ReturnType<typeof useThemeColors>;
  onPress: () => void;
}) {
  const animStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(tc.cardBg, { duration: 200 }),
  }));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ flex: 1 }}
    >
      <Animated.View style={[styles.actionCard, animStyle, { borderColor: tc.border }]}>
        <View style={[styles.actionIconWrap, { backgroundColor: tc.gold + '18' }]}>
          <Ionicons name={icon} size={20} color={tc.gold} />
        </View>
        <Text style={[styles.actionLabel, { color: tc.heading }]}>{label}</Text>
        <Text style={[styles.actionSub, { color: tc.muted }]}>{sub}</Text>
      </Animated.View>
    </Pressable>
  );
}

/* ─────────────────────────────────────────────────────────────
   Styles
───────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 60, gap: spacing.md },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: spacing.sm, marginBottom: spacing.xs,
  },
  pageTitle: { fontFamily: fonts.serifBold, fontSize: 22, lineHeight: 36 },

  // Identity card
  identityCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    borderRadius: radii.xl, borderWidth: 1, padding: spacing.md,
  },
  avatarWrap: {
    width: 52, height: 52, borderRadius: 26, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  avatarInitials: { fontFamily: fonts.sansBold, fontSize: 18 },
  identityMeta: { flex: 1 },
  identityName: { fontFamily: fonts.sansBold, fontSize: 17 },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  planBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 3,
  },
  planText: { fontFamily: fonts.sansSemibold, fontSize: 11 },
  identityDot: { fontSize: 11 },
  identityLang: { fontFamily: fonts.sans, fontSize: 12 },
  streakPill: {
    alignItems: 'center', borderRadius: radii.md,
    paddingHorizontal: spacing.sm, paddingVertical: 8, minWidth: 56,
  },
  streakNum: { fontFamily: fonts.serifBold, fontSize: 22, lineHeight: 36 },
  streakLabel: { fontFamily: fonts.sans, fontSize: 10, marginTop: 1 },

  // Premium banner
  premiumBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: radii.xl, padding: spacing.md,
    backgroundColor: colors.gold.deep,
  },
  premiumLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  premiumIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  premiumTitle: { fontFamily: fonts.sansBold, fontSize: 15, color: '#FFFFFF' },
  premiumSub: { fontFamily: fonts.sans, fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  // Quick actions
  actionsRow: { flexDirection: 'row', gap: spacing.sm },
  actionCard: {
    borderRadius: radii.lg, borderWidth: 1, padding: spacing.md,
    minHeight: 100, justifyContent: 'flex-start', gap: 4,
  },
  actionIconWrap: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  actionLabel: { fontFamily: fonts.sansSemibold, fontSize: 14 },
  actionSub: { fontFamily: fonts.sans, fontSize: 12 },

  // Section label
  sectionLabel: {
    fontFamily: fonts.sansSemibold, fontSize: 11, letterSpacing: 0.8,
    marginBottom: 6, marginTop: spacing.xs, paddingLeft: 4,
  },

  // Settings card
  settingsCard: { borderRadius: radii.xl, borderWidth: 1, overflow: 'hidden' },
  settingsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: 13,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingsIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontFamily: fonts.sansMedium, fontSize: 15 },
  rowValue: { fontFamily: fonts.sans, fontSize: 14, maxWidth: 120 },
  divider: { height: 1, marginLeft: spacing.md + 32 + 12 },

  // Footer
  footer: { alignItems: 'center', paddingVertical: spacing.lg, gap: 6, marginTop: spacing.md },
  redeemRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    borderRadius: radii.lg, borderWidth: 1,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  redeemIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  redeemLabel: { fontFamily: fonts.sansSemibold, fontSize: 15 },
  redeemSub: { fontFamily: fonts.sans, fontSize: 12, marginTop: 1 },
  logoMark: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  logoText: { fontSize: 20 },
  appName: { fontFamily: fonts.serifBold, fontSize: 18, lineHeight: 30 },
  version: { fontFamily: fonts.sans, fontSize: 12 },
  tagline: { fontFamily: fonts.sans, fontSize: 12 },
});
