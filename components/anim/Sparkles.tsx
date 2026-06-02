import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../constants/theme';

interface SparkleProps {
  size?: number;
  delay?: number;
  x: number;
  y: number;
  color?: string;
  duration?: number;
  drift?: number;
}

/** A four-point gold star (✦) that floats up and fades, looping. */
function Sparkle({
  size = 14,
  delay = 0,
  x,
  y,
  color = colors.gold.bright,
  duration = 3000,
  drift = 24,
}: SparkleProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }), -1, false),
    );
  }, [delay, duration, progress]);

  const style = useAnimatedStyle(() => {
    const p = progress.value;
    const opacity = p < 0.5 ? p * 2 : (1 - p) * 2;
    return {
      opacity,
      transform: [
        { translateY: -p * drift },
        { scale: 0.6 + 0.4 * (p < 0.5 ? p * 2 : (1 - p) * 2) },
        { rotate: `${p * 45}deg` },
      ],
    };
  });

  return (
    <Animated.View style={[{ position: 'absolute', left: x, top: y }, style]}>
      <Star size={size} color={color} />
    </Animated.View>
  );
}

/** Four-point sparkle (✦) with concave sides — reads as a star, not a plus. */
export function Star({ size = 14, color = colors.gold.bright }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 0 C12.8 7.6 16.4 11.2 24 12 C16.4 12.8 12.8 16.4 12 24 C11.2 16.4 7.6 12.8 0 12 C7.6 11.2 11.2 7.6 12 0 Z"
        fill={color}
      />
    </Svg>
  );
}

interface SparkleFieldProps {
  count?: number;
  style?: ViewStyle;
  /** width/height of the field used to randomly place sparkles */
  width: number;
  height: number;
}

/** A scattered field of floating sparkles. */
export function SparkleField({ count = 10, width, height, style }: SparkleFieldProps) {
  const items = React.useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        key: i,
        x: Math.random() * width,
        y: Math.random() * height,
        size: 8 + Math.random() * 14,
        delay: Math.random() * 2500,
        duration: 2600 + Math.random() * 2200,
        drift: 18 + Math.random() * 30,
      })),
    [count, width, height],
  );

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      {items.map((it) => (
        <Sparkle
          key={it.key}
          x={it.x}
          y={it.y}
          size={it.size}
          delay={it.delay}
          duration={it.duration}
          drift={it.drift}
        />
      ))}
    </View>
  );
}

export default Sparkle;
