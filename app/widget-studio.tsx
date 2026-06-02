import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { GoldButton } from '../components/ui/GoldButton';
import { ArabicText } from '../components/arabic/ArabicText';
import { colors, fonts, radii, spacing } from '../constants/theme';
import { verses } from '../data/verses';
import { duas } from '../data/duas';
import { quotes } from '../data/quotes';
import { hadiths } from '../data/hadiths';
import { haptic } from '../lib/haptics';

const SIZES = ['Small', 'Medium', 'Large', 'Lock'] as const;
const CONTENT = ['Verse', 'Dua', 'Quote', 'Hadith'] as const;
const SWATCHES: { id: number; gradient: readonly [string, string] }[] = [
  { id: 0, gradient: ['#162A52', '#0A1230'] },
  { id: 1, gradient: ['#7A4A1E', '#241A06'] },
  { id: 2, gradient: ['#0E5C3F', '#06241B'] },
  { id: 3, gradient: ['#2A2A6E', '#0B0B2B'] },
];

export default function WidgetStudio() {
  const router = useRouter();
  const [size, setSize] = React.useState<(typeof SIZES)[number]>('Medium');
  const [content, setContent] = React.useState<(typeof CONTENT)[number]>('Verse');
  const [swatch, setSwatch] = React.useState(0);

  const float = useSharedValue(0);
  useEffect(() => {
    float.value = withRepeat(withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [float]);
  const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -float.value * 8 }] }));

  const dims =
    size === 'Small'
      ? { w: 150, h: 150 }
      : size === 'Large'
        ? { w: 250, h: 260 }
        : size === 'Lock'
          ? { w: 250, h: 90 }
          : { w: 250, h: 130 };

  const body =
    content === 'Verse'
      ? { arabic: verses[0].arabic, text: verses[0].translation, ref: `${verses[0].surah} ${verses[0].ayah}` }
      : content === 'Dua'
        ? { arabic: duas[0].arabic, text: duas[0].translation, ref: duas[0].occasion }
        : content === 'Hadith'
          ? { arabic: hadiths[0].arabic, text: hadiths[0].translation, ref: hadiths[0].source }
          : { arabic: '', text: quotes[0].text, ref: quotes[0].author };

  return (
    <ScreenContainer>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back" accessibilityRole="button">
          <Ionicons name="chevron-back" size={26} color={colors.text.heading} />
        </Pressable>
        <Text style={styles.title}>Widget Studio</Text>
        <Pressable hitSlop={10} accessibilityLabel="Add widget" accessibilityRole="button" onPress={() => haptic.medium()}>
          <Text style={styles.add}>+ Add</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <View style={styles.stage}>
          <Animated.View style={[styles.widget, { width: dims.w, height: dims.h }, floatStyle]} entering={FadeIn}>
            <LinearGradient colors={SWATCHES[swatch].gradient} style={StyleSheet.absoluteFill} />
            <View style={styles.widgetInner}>
              {body.arabic && size !== 'Lock' ? <ArabicText size={size === 'Large' ? 24 : 18}>{body.arabic}</ArabicText> : null}
              <Text style={[styles.widgetText, size === 'Lock' && { fontSize: 13 }]} numberOfLines={size === 'Lock' ? 2 : 4}>
                {body.text}
              </Text>
              <Text style={styles.widgetRef}>{body.ref}</Text>
            </View>
          </Animated.View>
        </View>

        <Text style={styles.label}>Size</Text>
        <View style={styles.pillRow}>
          {SIZES.map((s) => (
            <Pill key={s} label={s} active={size === s} onPress={() => { haptic.select(); setSize(s); }} />
          ))}
        </View>

        <Text style={styles.label}>Theme Color</Text>
        <View style={styles.swatchRow}>
          {SWATCHES.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => { haptic.select(); setSwatch(s.id); }}
              accessibilityLabel={`Color ${s.id + 1}`}
              accessibilityRole="button"
              style={[styles.swatch, swatch === s.id && styles.swatchActive]}
            >
              <LinearGradient colors={s.gradient} style={StyleSheet.absoluteFill} />
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Content Type</Text>
        <View style={styles.pillRow}>
          {CONTENT.map((c) => (
            <Pill key={c} label={c} active={content === c} onPress={() => { haptic.select(); setContent(c); }} />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <GoldButton label="Add to Home Screen" onPress={() => haptic.success()} />
      </View>
    </ScreenContainer>
  );
}

function Pill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.pill, active && styles.pillActive]} accessibilityRole="button" accessibilityState={{ selected: active }}>
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm },
  title: { fontFamily: fonts.serifSemibold, fontSize: 20, lineHeight: 33, color: colors.text.heading },
  add: { fontFamily: fonts.sansSemibold, fontSize: 15, color: colors.gold.bright },
  stage: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl, minHeight: 300 },
  widget: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  widgetInner: { flex: 1, padding: spacing.md, justifyContent: 'center', alignItems: 'center' },
  widgetText: { fontFamily: fonts.serif, fontSize: 14, color: colors.white, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  widgetRef: { fontFamily: fonts.sans, fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 8 },
  label: { fontFamily: fonts.sansSemibold, fontSize: 14, color: colors.text.heading, marginTop: spacing.lg, marginBottom: spacing.sm },
  pillRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  pillActive: { backgroundColor: colors.gold.primary, borderColor: colors.gold.primary },
  pillText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.text.muted },
  pillTextActive: { color: colors.text.onGold },
  swatchRow: { flexDirection: 'row', gap: spacing.md },
  swatch: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  swatchActive: { borderColor: colors.gold.primary },
  footer: { paddingBottom: spacing.sm },
});
