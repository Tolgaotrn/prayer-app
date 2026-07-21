import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '../../components/layout/OnboardingShell';
import { fonts, radii, spacing } from '../../constants/theme';
import { useThemeColors } from '../../lib/useThemeColors';
import { useOnboardingStore } from '../../stores/useOnboardingStore';
import { haptic } from '../../lib/haptics';
import { clearContentCache } from '../../lib/contentDb';

const LANGS = [
  { flag: '🇬🇧', label: 'English', recommended: true },
  { flag: '🇹🇷', label: 'Turkish' },
  { flag: '🇩🇪', label: 'German' },
  { flag: '🇵🇰', label: 'Urdu' },
  { flag: '🇫🇷', label: 'French' },
  { flag: '🇮🇩', label: 'Indonesian' },
  { flag: '🇸🇦', label: 'Arabic' },
];

export default function Language() {
  const router = useRouter();
  const language = useOnboardingStore((s) => s.language);
  const set = useOnboardingStore((s) => s.set);

  return (
    <OnboardingShell
      step={6}
      title="Which language do you prefer?"
      ctaDisabled={!language}
      onContinue={async () => { await clearContentCache(); router.push('/(onboarding)/preparing'); }}
    >
      <View>
        {LANGS.map((l, i) => (
          <Animated.View key={l.label} entering={FadeInDown.delay(i * 60).duration(400)}>
            <Row
              flag={l.flag}
              label={l.label}
              recommended={l.recommended}
              selected={language === l.label}
              onPress={() => {
                haptic.select();
                set('language', l.label);
              }}
            />
          </Animated.View>
        ))}
      </View>
    </OnboardingShell>
  );
}

function Row({
  flag,
  label,
  recommended,
  selected,
  onPress,
}: {
  flag: string;
  label: string;
  recommended?: boolean;
  selected: boolean;
  onPress: () => void;
}) {
  const tc = useThemeColors();
  const style = useAnimatedStyle(() => ({
    borderColor: withTiming(selected ? tc.gold : tc.border),
    backgroundColor: withTiming(selected ? tc.raisedBg : tc.cardBg),
  }));
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress}>
      <Animated.View style={[styles.row, style]}>
        <Text style={styles.flag}>{flag}</Text>
        <Text style={[styles.label, { color: tc.heading }]}>{label}</Text>
        {recommended ? (
          <View style={[styles.badge, { backgroundColor: tc.gold + '22' }]}>
            <Text style={[styles.badgeText, { color: tc.gold }]}>Recommended</Text>
          </View>
        ) : null}
        {selected ? (
          <Ionicons name="checkmark-circle" size={22} color={tc.gold} style={styles.check} />
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
    marginVertical: 5,
    gap: spacing.sm,
  },
  flag: { fontSize: 22 },
  label: { fontFamily: fonts.sansMedium, fontSize: 16, flex: 1 },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontFamily: fonts.sansSemibold, fontSize: 11 },
  check: { marginLeft: 4 },
});
