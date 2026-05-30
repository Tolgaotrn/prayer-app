import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { GoldButton } from '../components/ui/GoldButton';
import { colors, fonts, radii, spacing } from '../constants/theme';
import { useOnboardingStore } from '../stores/useOnboardingStore';
import { haptic } from '../lib/haptics';
import { clearContentCache } from '../lib/contentDb';

const LANGS = [
  { flag: '🇬🇧', label: 'English',    recommended: true },
  { flag: '🇹🇷', label: 'Turkish' },
  { flag: '🇫🇷', label: 'French' },
  { flag: '🇮🇩', label: 'Indonesian' },
  { flag: '🇸🇦', label: 'Arabic' },
];

export default function LanguageSettings() {
  const router = useRouter();
  const current = useOnboardingStore((s) => s.language);
  const set = useOnboardingStore((s) => s.set);
  const [selected, setSelected] = React.useState(current || 'English');

  return (
    <ScreenContainer padded={false}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={22} color={colors.text.heading} />
        </Pressable>
        <Text style={styles.title}>Language</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.sub}>Choose the language for verses and content</Text>

        {LANGS.map((l, i) => (
          <Animated.View key={l.label} entering={FadeInDown.delay(i * 55).duration(350)}>
            <LangRow
              flag={l.flag}
              label={l.label}
              recommended={l.recommended}
              selected={selected === l.label}
              onPress={() => { haptic.select(); setSelected(l.label); }}
            />
          </Animated.View>
        ))}

        <View style={{ marginTop: spacing.md }}>
          <GoldButton
            label="Save Language"
            onPress={async () => {
              haptic.success();
              await clearContentCache();
              set('language', selected);
              router.back();
            }}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

function LangRow({ flag, label, recommended, selected, onPress }: {
  flag: string; label: string; recommended?: boolean; selected: boolean; onPress: () => void;
}) {
  const animStyle = useAnimatedStyle(() => ({
    borderColor: withTiming(selected ? colors.gold.primary : colors.hairline, { duration: 180 }),
    backgroundColor: withTiming(selected ? colors.bg.raised : colors.bg.card, { duration: 180 }),
  }));

  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected }}>
      <Animated.View style={[styles.langRow, animStyle]}>
        <Text style={styles.flag}>{flag}</Text>
        <Text style={styles.langLabel}>{label}</Text>
        {recommended && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Recommended</Text>
          </View>
        )}
        {selected && <Ionicons name="checkmark-circle" size={22} color={colors.gold.primary} />}
      </Animated.View>
    </Pressable>
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
  content: { paddingHorizontal: spacing.lg, gap: spacing.xs },
  sub: { fontFamily: fonts.sans, fontSize: 14, color: colors.text.muted, marginBottom: spacing.sm },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 58,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
    marginVertical: 4,
    gap: spacing.sm,
  },
  flag: { fontSize: 22 },
  langLabel: { fontFamily: fonts.sansMedium, fontSize: 16, color: colors.text.heading, flex: 1 },
  badge: {
    backgroundColor: 'rgba(212,175,55,0.16)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontFamily: fonts.sansSemibold, fontSize: 11, color: colors.gold.bright },
});
