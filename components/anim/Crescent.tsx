import React, { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop, Path } from 'react-native-svg';
import { colors } from '../../constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CrescentProps {
  size?: number;
  color?: string;
  glow?: boolean;
}

/**
 * Gold crescent moon with an optional pulsing glow halo.
 * Built as two overlapping circles (outer fill + offset cutout).
 */
export function Crescent({ size = 96, color = colors.gold.primary, glow = true }: CrescentProps) {
  const pulse = useSharedValue(0.6);

  useEffect(() => {
    if (!glow) return;
    pulse.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [glow, pulse]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ scale: 0.9 + pulse.value * 0.15 }],
  }));

  return (
    <Animated.View style={glow ? haloStyle : undefined}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={colors.gold.bright} stopOpacity="0.35" />
            <Stop offset="100%" stopColor={colors.gold.bright} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        {glow && <Circle cx="50" cy="50" r="50" fill="url(#moonGlow)" />}
        {/* Crescent: full disc minus an offset disc */}
        <Path
          d="M62 18 A34 34 0 1 0 62 82 A27 27 0 1 1 62 18 Z"
          fill={color}
        />
      </Svg>
    </Animated.View>
  );
}

interface RadialRaysProps {
  size?: number;
  color?: string;
}

/** Slowly rotating radial light rays (used on notifications screen). */
export function RadialRays({ size = 280, color = colors.gold.primary }: RadialRaysProps) {
  const rot = useSharedValue(0);
  useEffect(() => {
    rot.value = withRepeat(withTiming(1, { duration: 8000, easing: Easing.linear }), -1, false);
  }, [rot]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value * 360}deg` }],
  }));

  const rays = Array.from({ length: 12 });
  return (
    <Animated.View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {rays.map((_, i) => {
          const angle = (i / rays.length) * Math.PI * 2;
          const x1 = 50 + Math.cos(angle) * 22;
          const y1 = 50 + Math.sin(angle) * 22;
          const x2 = 50 + Math.cos(angle) * 48;
          const y2 = 50 + Math.sin(angle) * 48;
          return (
            <Path
              key={i}
              d={`M${x1} ${y1} L${x2} ${y2}`}
              stroke={color}
              strokeWidth={2}
              strokeOpacity={0.35}
              strokeLinecap="round"
            />
          );
        })}
      </Svg>
    </Animated.View>
  );
}

/** Concentric slowly-rotating star-trail rings used on the Welcome screen. */
export function StarTrails({ size = 420 }: { size?: number }) {
  const rot = useSharedValue(0);
  useEffect(() => {
    rot.value = withRepeat(withTiming(1, { duration: 60000, easing: Easing.linear }), -1, false);
  }, [rot]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value * 360}deg` }],
  }));

  const rings = [
    { r: 30, op: 0.18 },
    { r: 40, op: 0.14 },
    { r: 48, op: 0.1 },
    { r: 36, op: 0.16 },
  ];

  return (
    <Animated.View style={[{ width: size, height: size }, style]} pointerEvents="none">
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {rings.map((ring, i) => (
          <Circle
            key={i}
            cx="50"
            cy="50"
            r={ring.r}
            stroke={colors.gold.primary}
            strokeOpacity={ring.op}
            strokeWidth={0.4}
            strokeDasharray={i % 2 === 0 ? '1 3' : '0.5 5'}
            fill="none"
          />
        ))}
      </Svg>
    </Animated.View>
  );
}

export default Crescent;
