/**
 * dhikr — Premium Tasbih (digital prayer beads)
 *
 * Büyük dokunma alanı + SVG ilerleme halkası. Hedefe ulaşınca tur (round)
 * sayılır ve sayaç sıfırlanır. Farklı zikirler arasında geçiş.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '../components/layout/ScreenContainer';
import { ArabicText } from '../components/arabic/ArabicText';
import { fonts, radii, spacing } from '../constants/theme';
import { useThemeColors } from '../lib/useThemeColors';
import { useT } from '../lib/i18n';
import { haptic } from '../lib/haptics';

const DHIKRS = [
  { key: 'subhan', arabic: 'سُبْحَانَ اللهِ',         translit: 'SubhanAllah',       target: 33 },
  { key: 'alhamd', arabic: 'الْحَمْدُ لِلَّهِ',        translit: 'Alhamdulillah',     target: 33 },
  { key: 'akbar',  arabic: 'اللهُ أَكْبَر',             translit: 'Allahu Akbar',      target: 34 },
  { key: 'tahlil', arabic: 'لَا إِلٰهَ إِلَّا اللّٰه',   translit: 'La ilaha illallah', target: 100 },
  { key: 'istighfar', arabic: 'أَسْتَغْفِرُ اللهَ',     translit: 'Astaghfirullah',    target: 100 },
];

const RING = 240;
const STROKE = 14;
const RADIUS = (RING - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function DhikrScreen() {
  const router = useRouter();
  const tc = useThemeColors();
  const t = useT();

  const [idx, setIdx] = React.useState(0);
  const [count, setCount] = React.useState(0);
  const [rounds, setRounds] = React.useState(0);
  const dhikr = DHIKRS[idx];

  const progress = useSharedValue(0);
  const scale = useSharedValue(1);

  const setDhikr = (i: number) => {
    haptic.select();
    setIdx(i);
    setCount(0);
    setRounds(0);
    progress.value = withTiming(0, { duration: 200 });
  };

  const onTap = () => {
    const next = count + 1;
    scale.value = withSequence(
      withSpring(0.93, { damping: 12, stiffness: 400 }),
      withSpring(1, { damping: 12, stiffness: 300 }),
    );
    if (next >= dhikr.target) {
      haptic.success();
      setRounds((r) => r + 1);
      setCount(0);
      progress.value = withTiming(1, { duration: 150 }, () => {
        progress.value = withTiming(0, { duration: 250 });
      });
    } else {
      haptic.light();
      setCount(next);
      progress.value = withTiming(next / dhikr.target, { duration: 200 });
    }
  };

  const onReset = () => {
    haptic.medium();
    setCount(0);
    setRounds(0);
    progress.value = withTiming(0, { duration: 250 });
  };

  const animatedCircleProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRC * (1 - progress.value),
  }));
  const tapScale = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const trackColor = tc.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(120,95,55,0.15)';

  return (
    <ScreenContainer padded={false}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons
          name="arrow-back" size={24} color={tc.heading}
          onPress={() => router.back()}
          accessibilityRole="button" accessibilityLabel="Go back"
        />
        <Text style={[styles.title, { color: tc.heading }]}>{t('tasbih.title')}</Text>
        <Ionicons
          name="refresh-outline" size={22} color={tc.muted}
          onPress={onReset}
          accessibilityRole="button" accessibilityLabel="Reset counter"
        />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Dhikr seçici chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {DHIKRS.map((d, i) => {
            const active = i === idx;
            return (
              <Pressable
                key={d.key}
                onPress={() => setDhikr(i)}
                style={[
                  styles.chip,
                  { backgroundColor: active ? tc.gold : tc.cardBg, borderColor: active ? tc.gold : tc.border },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.chipText, { color: active ? '#FFFFFF' : tc.body }]}>
                  {d.translit}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Anlam */}
        <View style={styles.meaningBox}>
          <ArabicText size={32} color={tc.heading} style={{ textAlign: 'center' }}>
            {dhikr.arabic}
          </ArabicText>
          <Text style={[styles.meaning, { color: tc.muted }]}>{t(`dhikr.${dhikr.key}`)}</Text>
        </View>

        {/* Sayaç + halka */}
        <Pressable
          onPress={onTap}
          style={styles.ringWrap}
          accessibilityRole="button"
          accessibilityLabel={`Count ${dhikr.translit}, ${count} of ${dhikr.target}`}
        >
          <Animated.View style={tapScale}>
            <Svg width={RING} height={RING}>
              <Circle
                cx={RING / 2} cy={RING / 2} r={RADIUS}
                stroke={trackColor} strokeWidth={STROKE} fill="none"
              />
              <AnimatedCircle
                cx={RING / 2} cy={RING / 2} r={RADIUS}
                stroke={tc.gold} strokeWidth={STROKE} fill="none"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                animatedProps={animatedCircleProps}
                transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
              />
            </Svg>
            <View style={styles.ringCenter} pointerEvents="none">
              <Text style={[styles.countNum, { color: tc.heading }]}>{count}</Text>
              <Text style={[styles.countTarget, { color: tc.muted }]}>{t('tasbih.of', { n: dhikr.target })}</Text>
              <View style={[styles.tapHintPill, { backgroundColor: tc.raisedBg }]}>
                <Ionicons name="hand-left-outline" size={12} color={tc.gold} />
                <Text style={[styles.tapHintText, { color: tc.body }]}>{t('tasbih.tap')}</Text>
              </View>
            </View>
          </Animated.View>
        </Pressable>

        {/* Tur sayısı */}
        <View style={[styles.roundsCard, { backgroundColor: tc.cardBg, borderColor: tc.border }]}>
          <View style={styles.roundsItem}>
            <Text style={[styles.roundsNum, { color: tc.gold }]}>{rounds}</Text>
            <Text style={[styles.roundsLabel, { color: tc.muted }]}>{t('tasbih.completed')}</Text>
          </View>
          <View style={[styles.roundsDivider, { backgroundColor: tc.border }]} />
          <View style={styles.roundsItem}>
            <Text style={[styles.roundsNum, { color: tc.gold }]}>{rounds * dhikr.target + count}</Text>
            <Text style={[styles.roundsLabel, { color: tc.muted }]}>{t('tasbih.total')}</Text>
          </View>
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
  title: { fontFamily: fonts.serifBold, fontSize: 22 },
  scroll: { paddingBottom: 120, alignItems: 'center', gap: spacing.lg },

  chips: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingVertical: spacing.xs },
  chip: { borderRadius: radii.pill, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 9 },
  chipText: { fontFamily: fonts.sansSemibold, fontSize: 13 },

  meaningBox: { alignItems: 'center', gap: 6, paddingHorizontal: spacing.lg },
  meaning: { fontFamily: fonts.sans, fontSize: 13 },

  ringWrap: { alignItems: 'center', justifyContent: 'center', marginTop: spacing.xs },
  ringCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: 2 },
  countNum: { fontFamily: fonts.serifBold, fontSize: 64, lineHeight: 70 },
  countTarget: { fontFamily: fonts.sansMedium, fontSize: 14 },
  tapHintPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 4, marginTop: 8,
  },
  tapHintText: { fontFamily: fonts.sansSemibold, fontSize: 11 },

  roundsCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: radii.xl, borderWidth: 1,
    paddingVertical: spacing.md, marginHorizontal: spacing.lg,
    alignSelf: 'stretch',
  },
  roundsItem: { flex: 1, alignItems: 'center', gap: 2 },
  roundsNum: { fontFamily: fonts.serifBold, fontSize: 26 },
  roundsLabel: { fontFamily: fonts.sans, fontSize: 12 },
  roundsDivider: { width: 1, height: 36 },
});
