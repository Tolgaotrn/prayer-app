import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { ScreenContainer } from './ScreenContainer';
import { ProgressDots } from '../ui/ProgressDots';
import { GoldButton } from '../ui/GoldButton';
import { colors, fonts, spacing } from '../../constants/theme';
import { haptic } from '../../lib/haptics';

interface OnboardingShellProps {
  step?: number; // 0-indexed, omit to hide dots
  totalSteps?: number;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  ctaLabel?: string;
  onContinue?: () => void;
  ctaDisabled?: boolean;
  onSkip?: () => void;
  /** Icon node rendered above the title (sparkle, diamond, etc.) */
  icon?: React.ReactNode;
  scroll?: boolean;
}

/**
 * Shared onboarding scaffold: progress dots + optional skip, centered icon/title,
 * content, and a pinned bottom CTA.
 */
export function OnboardingShell({
  step,
  totalSteps = 6,
  title,
  subtitle,
  children,
  ctaLabel = 'Continue',
  onContinue,
  ctaDisabled,
  onSkip,
  icon,
}: OnboardingShellProps) {
  const router = useRouter();

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View style={styles.headerSide}>
          {step !== undefined ? <ProgressDots total={totalSteps} current={step} /> : null}
        </View>
        {onSkip ? (
          <Pressable
            onPress={() => {
              haptic.light();
              onSkip();
            }}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Skip"
            style={styles.skip}
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.body}>
        {icon ? (
          <Animated.View entering={FadeInDown.duration(500)} style={styles.icon}>
            {icon}
          </Animated.View>
        ) : null}
        {title ? (
          <Animated.Text entering={FadeInDown.delay(80).duration(500)} style={styles.title}>
            {title}
          </Animated.Text>
        ) : null}
        {subtitle ? (
          <Animated.Text entering={FadeInDown.delay(160).duration(500)} style={styles.subtitle}>
            {subtitle}
          </Animated.Text>
        ) : null}

        <Animated.View entering={FadeIn.delay(220).duration(500)} style={styles.content}>
          {children}
        </Animated.View>
      </View>

      {onContinue ? (
        <Animated.View entering={FadeInDown.delay(260).duration(500)} style={styles.footer}>
          <GoldButton
            label={ctaLabel}
            onPress={onContinue ?? (() => router.back())}
            disabled={ctaDisabled}
            shimmer={!ctaDisabled}
          />
        </Animated.View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
    marginTop: spacing.xs,
  },
  headerSide: { flex: 1, alignItems: 'center' },
  skip: { position: 'absolute', right: 0, padding: 8 },
  skipText: { color: colors.text.muted, fontFamily: fonts.sansMedium, fontSize: 15 },
  body: { flex: 1, marginTop: spacing.xl },
  icon: { alignItems: 'center', marginBottom: spacing.lg },
  title: {
    fontFamily: fonts.serifBold,
    fontSize: 30,
    color: colors.text.heading,
    textAlign: 'center',
    lineHeight: 38,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  content: { flex: 1, marginTop: spacing.xl },
  footer: { paddingTop: spacing.sm, paddingBottom: spacing.sm },
});

export default OnboardingShell;
