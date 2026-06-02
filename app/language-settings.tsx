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
import { fonts, radii, spacing } from '../constants/theme';
import { useThemeColors } from '../lib/useThemeColors';
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
  const tc = useThemeColors();
  const current = useOnboardingStore((s) => s.language);
  const set = useOnboardingStore((s) => s.set);
  const [selected, setSelected] = React.useState(current || 'English');

  return (
    <ScreenContainer padded={false}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: tc.cardBg }]} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={22} color={tc.heading} />
        </Pressable>
        <Text style={[styles.title, { color: tc.heading }]}>Language</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.sub, { color: tc.muted }]}>Choose the language for verses and content</Text>

        {LANGS.map((l, i) => (
          <Animated.View key={l.label} entering={FadeInDown.delay(i * 55).duration(350)}>
            <LangRow
              flag={l.flag}
              label={l.label}
              recommended={l.recommended}
              selected={selected === l.label}
              tc={tc}
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

function LangRow({ flag, label, recommended, selected, tc, onPress }: {
  flag: string; label: string; recommended?: boolean; selected: boolean;
  tc: ReturnType<typeof useThemeColors>; onPress: () => void;
}) {
  const animStyle = useAnimatedStyle(() => ({
    borderColor: withTiming(selected ? tc.gold : tc.border, { duration: 180 }),
    backgroundColor: withTiming(selected ? tc.raisedBg : tc.cardBg, { duration: 180 }),
  }));

  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected }}>
      <Animated.View style={[styles.langRow, animStyle]}>
        <Text style={styles.flag}>{flag}</Text>
        <Text style={[styles.langLabel, { color: tc.heading }]}>{label}</Text>
        {recommended && (
          <View style={[styles.badge, { backgroundColor: tc.gold + '22' }]}>
            <Text style={[styles.badgeText, { color: tc.gold }]}>Recommended</Text>
          </View>
        )}
        {selected && <Ionicons name="checkmark-circle" size={22} color={tc.gold} />}
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
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontFamily: fonts.serifBold, fontSize: 22, lineHeight: 36 },
  content: { paddingHorizontal: spacing.lg, gap: spacing.xs },
  sub: { fontFamily: fonts.sans, fontSize: 14, marginBottom: spacing.sm },
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
  langLabel: { fontFamily: fonts.sansMedium, fontSize: 16, flex: 1 },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontFamily: fonts.sansSemibold, fontSize: 11 },
});
