import React from 'react';
import { I18nManager, Pressable, StyleSheet, Text, View } from 'react-native';
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
import { useT } from '../lib/i18n';
import { haptic } from '../lib/haptics';
import { clearContentCache } from '../lib/contentDb';
import { rescheduleForLanguageChange } from '../lib/notifications';
import { applyRTL, isRTLLanguage } from '../lib/rtl';
import * as Updates from 'expo-updates';

const LANGS = [
  { flag: '🇬🇧', label: 'English' },
  { flag: '🇹🇷', label: 'Turkish' },
  { flag: '🇩🇪', label: 'German' },
  { flag: '🇵🇰', label: 'Urdu' },
  { flag: '🇫🇷', label: 'French' },
  { flag: '🇮🇩', label: 'Indonesian' },
  { flag: '🇸🇦', label: 'Arabic' },
];

export default function LanguageSettings() {
  const router = useRouter();
  const tc = useThemeColors();
  const t = useT();
  const current = useOnboardingStore((s) => s.language);
  const set = useOnboardingStore((s) => s.set);
  const [selected, setSelected] = React.useState(current || 'English');

  return (
    <ScreenContainer padded={false}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: tc.cardBg }]} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name={I18nManager.isRTL ? 'arrow-forward' : 'arrow-back'} size={22} color={tc.heading} />
        </Pressable>
        <Text style={[styles.title, { color: tc.heading }]}>{t('lang.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.sub, { color: tc.muted }]}>{t('lang.sub')}</Text>

        {LANGS.map((l, i) => (
          <Animated.View key={l.label} entering={FadeInDown.delay(i * 55).duration(350)}>
            <LangRow
              flag={l.flag}
              label={l.label}
              selected={selected === l.label}
              tc={tc}
              onPress={() => { haptic.select(); setSelected(l.label); }}
            />
          </Animated.View>
        ))}

        <View style={{ marginTop: spacing.md }}>
          <GoldButton
            label={t('lang.save')}
            onPress={async () => {
              haptic.success();
              await clearContentCache();
              set('language', selected);
              rescheduleForLanguageChange();

              // RTL değişimi: RTL diller (Arapça/Urduca) ↔ diğer diller arasında
              // geçişte I18nManager'ı güncelle ve uygulamayı yeniden yükle.
              const rtlChanged = applyRTL(isRTLLanguage(selected));
              if (rtlChanged) {
                // Kısa gecikme: store'a yazılma fırsatı tanı
                await new Promise((r) => setTimeout(r, 80));
                await Updates.reloadAsync();
                return; // reload sonrası burası çalışmaz
              }

              router.back();
            }}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

function LangRow({ flag, label, selected, tc, onPress }: {
  flag: string; label: string; selected: boolean;
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
