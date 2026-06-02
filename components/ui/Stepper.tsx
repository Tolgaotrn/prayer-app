import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { fonts, radii, spacing } from '../../constants/theme';
import { useThemeColors } from '../../lib/useThemeColors';
import { haptic } from '../../lib/haptics';

interface StepperProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
}

/** − / N× / + counter with an animated value flip. */
export function Stepper({ value, onChange, min = 1, max = 9, suffix = '× Daily' }: StepperProps) {
  const tc = useThemeColors();
  const step = (delta: number) => {
    const next = Math.min(max, Math.max(min, value + delta));
    if (next !== value) {
      haptic.light();
      onChange(next);
    }
  };

  return (
    <View style={[styles.row, { backgroundColor: tc.raisedBg, borderColor: tc.border }]}>
      <Btn icon="chevron-down" onPress={() => step(-1)} disabled={value <= min} tc={tc} />
      <View style={styles.valueWrap}>
        <Animated.Text key={value} entering={FadeIn} exiting={FadeOut} style={[styles.value, { color: tc.heading }]}>
          {value}
          {suffix}
        </Animated.Text>
      </View>
      <Btn icon="chevron-up" onPress={() => step(1)} disabled={value >= max} tc={tc} />
    </View>
  );
}

function Btn({
  icon,
  onPress,
  disabled,
  tc,
}: {
  icon: 'chevron-up' | 'chevron-down';
  onPress: () => void;
  disabled?: boolean;
  tc: ReturnType<typeof useThemeColors>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={icon === 'chevron-up' ? 'Increase' : 'Decrease'}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.btn, { backgroundColor: tc.cardBg }, pressed && { opacity: 0.6 }, disabled && { opacity: 0.3 }]}
    >
      <Ionicons name={icon} size={22} color={tc.gold} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.pill,
    borderWidth: 1,
    padding: spacing.xs,
  },
  btn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueWrap: { flex: 1, alignItems: 'center' },
  value: { fontFamily: fonts.sansBold, fontSize: 18 },
});

export default Stepper;
