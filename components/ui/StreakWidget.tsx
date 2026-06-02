import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Defs, Mask, Rect, Path } from 'react-native-svg';
import Animated, {
  FadeIn, Easing, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence,
} from 'react-native-reanimated';
import { colors, fonts, radii, spacing } from '../../constants/theme';
import { useThemeColors } from '../../lib/useThemeColors';

const DAY_LETTERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface StreakWidgetProps {
  streakDays: number;
  banner?: boolean;
  title?: string;
  caption?: string;
  style?: ViewStyle;
}

/** Framed streak card — left: glowing animated crescent hero with the streak
 *  number, right: title + caption, below: 7-day dots. */
export function StreakWidget({ streakDays, title, caption, style }: StreakWidgetProps) {
  const tc = useThemeColors();
  const filled = Math.min(streakDays, 7);

  // Dolu altın günler için çok hafif "nefes alan" parıltı (sakin, senkron)
  const glow = useSharedValue(0);
  React.useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [glow]);
  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + glow.value * 0.06 }],
    shadowOpacity: 0.25 + glow.value * 0.45,
  }));

  // Bugünden geriye doğru günleri sırala (bugün en sonda görünür)
  const today = new Date().getDay();
  const days = Array.from({ length: 7 }, (_, i) => {
    const idx = (today - (6 - i) + 7) % 7;
    return DAY_LETTERS[idx];
  });

  const cardBg = tc.isDark ? tc.cardBg : '#FFFFFF';
  const cardBorder = tc.isDark ? 'rgba(212,175,55,0.3)' : 'rgba(120,100,70,0.22)';
  const emptyBg = tc.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(120,100,70,0.10)';

  return (
    <View style={[styles.wrap, { backgroundColor: cardBg, borderColor: cardBorder }, style]}>
      {/* ── Üst satır: animasyonlu hilal hero + başlık ── */}
      <View style={styles.topRow}>
        <CrescentHero streakDays={streakDays} tc={tc} />
        <View style={styles.headTextCol}>
          <Text style={[styles.titleText, { color: tc.heading }]}>
            {title ?? 'Your streak'}
          </Text>
          <Text style={[styles.caption, { color: tc.muted }]}>
            {caption ?? (streakDays > 0 ? 'Keep the light going' : 'Build a streak, one day at a time')}
          </Text>
        </View>
      </View>

      {/* ── Günler ── */}
      <View style={styles.days}>
        {days.map((d, i) => {
          const done = i >= 7 - filled; // son `filled` gün dolu
          return (
            <View key={i} style={styles.dayCol}>
              <Text style={[styles.dayLabel, { color: done ? tc.gold : tc.muted }]}>{d}</Text>
              <Animated.View
                entering={FadeIn.delay(i * 70)}
                style={[
                  styles.dot,
                  done
                    ? { backgroundColor: tc.gold, borderColor: tc.gold, shadowColor: tc.gold }
                    : { backgroundColor: emptyBg, borderColor: 'transparent' },
                  done && styles.dotGlow,
                  done && glowStyle,
                ]}
              >
                {done && <Ionicons name="checkmark" size={14} color={colors.white} />}
              </Animated.View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/* ── Sol hero: ışıması nefes alan hilal + parıldayan yıldız + sayı rozeti ── */
const HERO = 64;
const C = HERO / 2;

function CrescentHero({ streakDays, tc }: { streakDays: number; tc: ReturnType<typeof useThemeColors> }) {
  const maskId = `crescent-${React.useId()}`; // instance'a özel — id çakışmasını önler
  const flicker = useSharedValue(0);   // hilalin ışıması (ateş gibi canlı nefes)
  const float = useSharedValue(0);     // hafif yukarı-aşağı süzülme
  const twinkle = useSharedValue(0);   // yıldız parıltısı

  React.useEffect(() => {
    flicker.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.35, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.8, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    float.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1900, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1900, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    twinkle.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.2, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [flicker, float, twinkle]);

  // Hilalin arkasındaki yumuşak ışık halesi — flicker ile büyüyüp parlar
  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.18 + flicker.value * 0.42,
    transform: [{ scale: 0.85 + flicker.value * 0.25 }],
  }));
  const crescentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -float.value * 3 }],
  }));
  const twinkleStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + twinkle.value * 0.7,
    transform: [{ scale: 0.8 + twinkle.value * 0.4 }],
  }));

  const haloColor = tc.isDark ? 'rgba(232,199,102,0.9)' : 'rgba(201,150,58,0.8)';

  return (
    <View style={styles.heroWrap}>
      {/* Işık halesi */}
      <Animated.View
        style={[styles.halo, { backgroundColor: haloColor, shadowColor: tc.gold }, haloStyle]}
      />

      {/* Hilal + yıldız (süzülen) */}
      <Animated.View style={[StyleSheet.absoluteFill, crescentStyle]}>
        <Svg width={HERO} height={HERO}>
          <Defs>
            {/* Soldaki büyük daireden sağa kaydırılmış daireyi çıkararak hilal */}
            <Mask id={maskId}>
              <Rect x={0} y={0} width={HERO} height={HERO} fill="black" />
              <Circle cx={C - 2} cy={C} r={17} fill="white" />
              <Circle cx={C + 7} cy={C - 3} r={15} fill="black" />
            </Mask>
          </Defs>
          <Circle cx={C - 2} cy={C} r={17} fill={tc.gold} mask={`url(#${maskId})`} />
        </Svg>
      </Animated.View>

      {/* Parıldayan yıldız — hilalin açık tarafında */}
      <Animated.View style={[styles.star, twinkleStyle]}>
        <Svg width={14} height={14}>
          <Path
            d="M7 0 L8.6 4.9 L13.6 4.9 L9.5 8 L11.1 13 L7 9.9 L2.9 13 L4.5 8 L0.4 4.9 L5.4 4.9 Z"
            fill={tc.gold}
          />
        </Svg>
      </Animated.View>

      {/* Sayı rozeti — altta */}
      <View style={[styles.numBadge, { backgroundColor: tc.gold, borderColor: cardBorderForBadge(tc) }]}>
        <Text style={styles.numText}>{streakDays}</Text>
      </View>
    </View>
  );
}

function cardBorderForBadge(tc: ReturnType<typeof useThemeColors>) {
  return tc.isDark ? '#161E3D' : '#FFFFFF';
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 2,
    gap: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headTextCol: { flex: 1, gap: 2 },

  heroWrap: {
    width: HERO,
    height: HERO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderRadius: 21,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 14,
    elevation: 6,
  },
  star: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  numBadge: {
    position: 'absolute',
    bottom: -2,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    color: '#FFFFFF',
    includeFontPadding: false,
  },

  titleText: {
    fontFamily: fonts.sansBold,
    fontSize: 16,
  },
  days: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  dayCol: { alignItems: 'center', gap: 8, flex: 1 },
  dayLabel: { fontFamily: fonts.sansSemibold, fontSize: 12 },
  dot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotGlow: {
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 6,
    elevation: 4,
  },
  caption: {
    fontFamily: fonts.sans,
    fontSize: 13,
  },
});

export default StreakWidget;
