import React, { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import { colors } from '../../constants/theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface GlowArchProps {
  size?: number;
}

/**
 * Gold-outlined Islamic arch with a crescent + stars inside.
 * The arch outline draws itself on mount; the glow gently pulses.
 */
export function GlowArch({ size = 220 }: GlowArchProps) {
  const draw = useSharedValue(0);
  const glow = useSharedValue(0.5);

  useEffect(() => {
    draw.value = withTiming(1, { duration: 1400, easing: Easing.out(Easing.cubic) });
    glow.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [draw, glow]);

  // Pointed Islamic arch path
  const archPath = 'M30 150 L30 80 Q30 30 60 18 Q75 12 90 18 Q120 30 120 80 L120 150';
  const archLen = 360;

  const archProps = useAnimatedProps(() => ({
    strokeDashoffset: archLen * (1 - draw.value),
  }));

  return (
    <Svg width={size} height={size} viewBox="0 0 150 175">
      <Defs>
        <RadialGradient id="archGlow" cx="50%" cy="45%" r="55%">
          <Stop offset="0%" stopColor={colors.gold.bright} stopOpacity="0.28" />
          <Stop offset="100%" stopColor={colors.gold.bright} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx="75" cy="80" r="70" fill="url(#archGlow)" />

      <AnimatedPath
        d={archPath}
        stroke={colors.gold.primary}
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={archLen}
        animatedProps={archProps}
      />
      {/* base line */}
      <AnimatedPath
        d="M22 150 L128 150"
        stroke={colors.gold.primary}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeDasharray={archLen}
        animatedProps={archProps}
      />

      {/* crescent inside */}
      <Path
        d="M88 70 A20 20 0 1 0 88 102 A15 15 0 1 1 88 70 Z"
        fill={colors.gold.bright}
        opacity={0.95}
      />
      {/* little stars */}
      <Path d="M62 60 l1.5 3 l3 1.5 l-3 1.5 l-1.5 3 l-1.5 -3 l-3 -1.5 l3 -1.5 Z" fill={colors.gold.bright} />
      <Path d="M58 95 l1 2 l2 1 l-2 1 l-1 2 l-1 -2 l-2 -1 l2 -1 Z" fill={colors.gold.bright} />
    </Svg>
  );
}

export default GlowArch;
