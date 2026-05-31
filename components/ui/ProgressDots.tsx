import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useThemeColors } from '../../lib/useThemeColors';

interface ProgressDotsProps {
  total: number;
  current: number; // 0-indexed
}

/** Onboarding progress indicator — active dots elongate into gold pills. */
export function ProgressDots({ total, current }: ProgressDotsProps) {
  const tc = useThemeColors();
  const inactive = tc.isDark ? 'rgba(255,255,255,0.18)' : 'rgba(120,100,70,0.22)';
  return (
    <View style={styles.row} accessibilityLabel={`Step ${current + 1} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <Dot key={i} active={i <= current} isCurrent={i === current} gold={tc.gold} inactive={inactive} />
      ))}
    </View>
  );
}

function Dot({ active, isCurrent, gold, inactive }: { active: boolean; isCurrent: boolean; gold: string; inactive: string }) {
  const style = useAnimatedStyle(() => ({
    width: withSpring(active ? 22 : 7, { damping: 14, stiffness: 160 }),
    backgroundColor: withTiming(active ? gold : inactive),
    opacity: withTiming(active || isCurrent ? 1 : 0.6),
  }));
  return <Animated.View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    height: 7,
    borderRadius: 4,
  },
});

export default ProgressDots;
