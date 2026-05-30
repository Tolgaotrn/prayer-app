import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { colors } from '../../constants/theme';

interface ProgressDotsProps {
  total: number;
  current: number; // 0-indexed
}

/** Onboarding progress indicator — active dots elongate into gold pills. */
export function ProgressDots({ total, current }: ProgressDotsProps) {
  return (
    <View style={styles.row} accessibilityLabel={`Step ${current + 1} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <Dot key={i} active={i <= current} isCurrent={i === current} />
      ))}
    </View>
  );
}

function Dot({ active, isCurrent }: { active: boolean; isCurrent: boolean }) {
  const style = useAnimatedStyle(() => ({
    width: withSpring(active ? 22 : 7, { damping: 14, stiffness: 160 }),
    backgroundColor: withTiming(active ? colors.gold.primary : 'rgba(255,255,255,0.18)'),
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
