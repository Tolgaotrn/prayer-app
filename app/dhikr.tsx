/**
 * dhikr — Yenilenmiş Tasbih ekranı
 *
 * Büyük halkadan oluşan sayaç, altta zikir kartları (scroll yok),
 * her tıkta haptic + scale animasyonu, tur sayacı.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '../components/layout/ScreenContainer';
import { ArabicText } from '../components/arabic/ArabicText';
import { fonts, radii, spacing } from '../constants/theme';
import { useThemeColors } from '../lib/useThemeColors';
import { useT } from '../lib/i18n';
import { haptic } from '../lib/haptics';

const DHIKRS = [
  { key: 'subhan',     arabic: 'سُبْحَانَ اللهِ',           translit: 'SubhanAllah',       meaning: 'Glory be to God',        target: 33 },
  { key: 'alhamd',     arabic: 'الْحَمْدُ لِلَّهِ',          translit: 'Alhamdulillah',     meaning: 'All praise is to God',   target: 33 },
  { key: 'akbar',      arabic: 'اللهُ أَكْبَر',               translit: 'Allahu Akbar',      meaning: 'God is the Greatest',    target: 34 },
  { key: 'tahlil',     arabic: 'لَا إِلٰهَ إِلَّا اللّٰه',     translit: 'La ilaha illallah', meaning: 'There is no god but God',target: 100 },
  { key: 'istighfar',  arabic: 'أَسْتَغْفِرُ اللهَ',           translit: 'Astaghfirullah',    meaning: 'I seek God\'s forgiveness', target: 100 },
];

const RING_SIZE = 260;
const STROKE = 12;
const RADIUS = (RING_SIZE - STROKE) / 2;
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
  const glow = useSharedValue(0.6);

  const selectDhikr = (i: number) => {
    if (i === idx) return;
    haptic.select();
    setIdx(i);
    setCount(0);
    setRounds(0);
    progress.value = withTiming(0, { duration: 200 });
  };

  const onTap = () => {
    const next = count + 1;
    scale.value = withSequence(
      withSpring(0.91, { damping: 10, stiffness: 500 }),
      withSpring(1, { damping: 14, stiffness: 300 }),
    );
    glow.value = withSequence(
      withTiming(1, { duration: 80 }),
      withTiming(0.6, { duration: 300 }),
    );

    if (next >= dhikr.target) {
      haptic.success();
      setRounds((r) => r + 1);
      setCount(0);
      progress.value = withTiming(1, { duration: 150 }, () => {
        progress.value = withTiming(0, { duration: 300 });
      });
    } else {
      haptic.light();
      setCount(next);
      progress.value = withTiming(next / dhikr.target, { duration: 180 });
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
  const tapStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  const trackColor = tc.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(120,95,55,0.12)';

  return (
    <ScreenContainer padded={false}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.headerBtn, { backgroundColor: tc.cardBg }]}
          accessibilityRole="button" accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={20} color={tc.heading} />
        </Pressable>
        <Text style={[styles.title, { color: tc.heading }]}>{t('tasbih.title')}</Text>
        <Pressable
          onPress={onReset}
          style={[styles.headerBtn, { backgroundColor: tc.cardBg }]}
          accessibilityRole="button" accessibilityLabel="Reset"
        >
          <Ionicons name="refresh-outline" size={20} color={tc.muted} />
        </Pressable>
      </View>

      {/* Main area */}
      <View style={styles.main}>
        {/* Arabic + meaning */}
        <View style={styles.textBlock}>
          <ArabicText size={36} color={tc.heading} style={{ textAlign: 'center' }}>
            {dhikr.arabic}
          </ArabicText>
          <Text style={[styles.meaning, { color: tc.muted }]}>{dhikr.meaning}</Text>
        </View>

        {/* Ring tap area */}
        <Pressable
          onPress={onTap}
          style={styles.ringWrap}
          accessibilityRole="button"
          accessibilityLabel={`Count ${dhikr.translit}, ${count} of ${dhikr.target}`}
        >
          <Animated.View style={tapStyle}>
            {/* Glow halkası */}
            <Animated.View style={[styles.glowRing, { shadowColor: tc.gold }, glowStyle]} />

            <Svg width={RING_SIZE} height={RING_SIZE}>
              <Defs>
                <SvgGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0%" stopColor={tc.gold} stopOpacity="1" />
                  <Stop offset="100%" stopColor={tc.isDark ? '#E8C766' : '#C9963A'} stopOpacity="0.7" />
                </SvgGradient>
              </Defs>
              {/* Track */}
              <Circle
                cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS}
                stroke={trackColor} strokeWidth={STROKE} fill="none"
              />
              {/* Progress */}
              <AnimatedCircle
                cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS}
                stroke="url(#ringGrad)" strokeWidth={STROKE} fill="none"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                animatedProps={animatedCircleProps}
                transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
              />
            </Svg>

            {/* Center */}
            <View style={styles.ringCenter} pointerEvents="none">
              <Text style={[styles.countNum, { color: tc.heading }]}>{count}</Text>
              <Text style={[styles.countOf, { color: tc.muted }]}>/ {dhikr.target}</Text>
              <View style={[styles.tapPill, { backgroundColor: tc.gold + '18' }]}>
                <Text style={[styles.tapText, { color: tc.gold }]}>tap to count</Text>
              </View>
            </View>
          </Animated.View>
        </Pressable>

        {/* Rounds */}
        {(rounds > 0 || count > 0) && (
          <View style={[styles.roundsRow, { backgroundColor: tc.cardBg, borderColor: tc.border }]}>
            <View style={styles.roundsItem}>
              <Text style={[styles.roundsNum, { color: tc.gold }]}>{rounds}</Text>
              <Text style={[styles.roundsLabel, { color: tc.muted }]}>rounds</Text>
            </View>
            <View style={[styles.roundsDivider, { backgroundColor: tc.border }]} />
            <View style={styles.roundsItem}>
              <Text style={[styles.roundsNum, { color: tc.gold }]}>{rounds * dhikr.target + count}</Text>
              <Text style={[styles.roundsLabel, { color: tc.muted }]}>total</Text>
            </View>
          </View>
        )}
      </View>

      {/* Dhikr selector — bottom card grid */}
      <View style={[styles.selectorWrap, { backgroundColor: tc.cardBg, borderTopColor: tc.border }]}>
        <View style={styles.selectorGrid}>
          {DHIKRS.map((d, i) => {
            const active = i === idx;
            return (
              <Pressable
                key={d.key}
                onPress={() => selectDhikr(i)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[
                  styles.dhikrTile,
                  { backgroundColor: active ? tc.gold : tc.raisedBg, borderColor: active ? tc.gold : tc.border },
                ]}
              >
                <Text style={[styles.dhikrTranslit, { color: active ? '#fff' : tc.body }]} numberOfLines={1}>
                  {d.translit}
                </Text>
                <Text style={[styles.dhikrTarget, { color: active ? 'rgba(255,255,255,0.7)' : tc.muted }]}>
                  ×{d.target}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xs,
  },
  headerBtn: {
    width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
  },
  title: { fontFamily: fonts.serifBold, fontSize: 20 },

  main: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing.lg, gap: spacing.lg,
  },

  textBlock: { alignItems: 'center', gap: 6 },
  meaning: { fontFamily: fonts.sans, fontSize: 13 },

  ringWrap: { alignItems: 'center', justifyContent: 'center' },
  glowRing: {
    position: 'absolute',
    width: RING_SIZE - 20, height: RING_SIZE - 20,
    borderRadius: (RING_SIZE - 20) / 2,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 28,
    shadowOpacity: 0.45,
    elevation: 12,
  },
  ringCenter: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  countNum: { fontFamily: fonts.serifBold, fontSize: 72, lineHeight: 78 },
  countOf: { fontFamily: fonts.sansMedium, fontSize: 15 },
  tapPill: {
    borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 4, marginTop: 8,
  },
  tapText: { fontFamily: fonts.sansSemibold, fontSize: 11 },

  roundsRow: {
    flexDirection: 'row', borderRadius: radii.xl, borderWidth: 1,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.xl, gap: spacing.xl,
  },
  roundsItem: { alignItems: 'center', gap: 2 },
  roundsNum: { fontFamily: fonts.serifBold, fontSize: 22 },
  roundsLabel: { fontFamily: fonts.sans, fontSize: 11 },
  roundsDivider: { width: 1, height: 32, alignSelf: 'center' },

  selectorWrap: {
    borderTopWidth: 1, paddingTop: spacing.md, paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  selectorGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center',
  },
  dhikrTile: {
    borderRadius: radii.lg, borderWidth: 1.5,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    alignItems: 'center', minWidth: 100,
  },
  dhikrTranslit: { fontFamily: fonts.sansSemibold, fontSize: 13 },
  dhikrTarget: { fontFamily: fonts.sans, fontSize: 11, marginTop: 2 },
});
