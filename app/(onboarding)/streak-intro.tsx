import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { GoldButton } from '../../components/ui/GoldButton';
import { StreakWidget } from '../../components/ui/StreakWidget';
import { SparkleField } from '../../components/anim/Sparkles';
import { colors, fonts, spacing } from '../../constants/theme';
import { useThemeColors } from '../../lib/useThemeColors';

const { width } = Dimensions.get('window');

/** Animated tasbih (prayer beads) ring — 33 beads in a circle */
function TasbihRing({ size = 160 }: { size?: number }) {
  const BEAD_COUNT = 33;
  const cx = size / 2;
  const cy = size / 2;
  const ringR = size * 0.38;
  const beadR = size * 0.042;

  const pulse = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 900, easing: Easing.in(Easing.ease) }),
      ),
      -1,
      false,
    );
    rotate.value = withRepeat(
      withTiming(1, { duration: 40000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value * 360}deg` }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + pulse.value * 0.5,
    transform: [{ scale: 0.85 + pulse.value * 0.18 }],
  }));

  const beads = Array.from({ length: BEAD_COUNT }, (_, i) => {
    const angle = (i / BEAD_COUNT) * 2 * Math.PI - Math.PI / 2;
    return {
      x: cx + ringR * Math.cos(angle),
      y: cy + ringR * Math.sin(angle),
      highlighted: i === 0,
    };
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Central glow */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: size * 0.55,
            height: size * 0.55,
            borderRadius: size * 0.275,
            shadowColor: colors.gold.primary,
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: 30,
            shadowOpacity: 0.5,
            elevation: 16,
          },
          glowStyle,
        ]}
      />
      <Animated.View style={rotateStyle}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Defs>
            <RadialGradient id="beadGold" cx="40%" cy="35%" r="65%">
              <Stop offset="0%" stopColor={colors.gold.bright} stopOpacity="1" />
              <Stop offset="100%" stopColor={colors.gold.deep} stopOpacity="0.9" />
            </RadialGradient>
            <RadialGradient id="beadFaint" cx="40%" cy="35%" r="65%">
              <Stop offset="0%" stopColor={colors.gold.primary} stopOpacity="0.55" />
              <Stop offset="100%" stopColor={colors.gold.deep} stopOpacity="0.3" />
            </RadialGradient>
          </Defs>
          {/* Thin connector ring */}
          <Circle
            cx={cx} cy={cy} r={ringR}
            stroke={colors.gold.primary}
            strokeOpacity={0.2}
            strokeWidth={0.8}
            fill="none"
          />
          {beads.map((b, i) => (
            <Circle
              key={i}
              cx={b.x}
              cy={b.y}
              r={b.highlighted ? beadR * 1.7 : beadR}
              fill={b.highlighted ? 'url(#beadGold)' : 'url(#beadFaint)'}
            />
          ))}
        </Svg>
      </Animated.View>
      {/* Center count */}
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={{ fontFamily: fonts.serifBold, fontSize: 28, color: colors.gold.bright }}>١</Text>
        <Text style={{ fontFamily: fonts.sans, fontSize: 10, color: colors.gold.primary, opacity: 0.7, letterSpacing: 1 }}>DAY</Text>
      </View>
    </View>
  );
}

export default function StreakIntro() {
  const router = useRouter();
  const tc = useThemeColors();
  return (
    <ScreenContainer
      backgroundImage={require('../../assets/themes/midnight.jpg')}
      imageOpacity={0.45}
    >
      <SparkleField count={10} width={width} height={260} />
      <View style={styles.center}>
        <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.tasbihWrap}>
          <TasbihRing size={180} />
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(300)} style={[styles.title, { color: tc.heading }]}>
          Remain close to Allah with a consistent routine
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(420)} style={styles.streak}>
          <StreakWidget streakDays={1} title="Day 1 complete" />
        </Animated.View>

        <Animated.Text entering={FadeIn.delay(560)} style={[styles.caption, { color: tc.muted }]}>
          Every streak starts with Day 1
        </Animated.Text>
      </View>

      <View style={styles.footer}>
        <GoldButton label="Continue" onPress={() => router.push('/(onboarding)/reminders')} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tasbihWrap: { alignItems: 'center', justifyContent: 'center' },
  title: {
    fontFamily: fonts.serifBold,
    fontSize: 26,
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 34,
    paddingHorizontal: spacing.sm,
  },
  streak: { width: '100%', marginTop: spacing.xl },
  caption: {
    fontFamily: fonts.sans,
    fontSize: 14,
    marginTop: spacing.lg,
  },
  footer: { paddingBottom: spacing.sm },
});
