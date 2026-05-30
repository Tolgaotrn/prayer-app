import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { colors, fonts, radii, spacing } from '../../constants/theme';
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
  const step = (delta: number) => {
    const next = Math.min(max, Math.max(min, value + delta));
    if (next !== value) {
      haptic.light();
      onChange(next);
    }
  };

  return (
    <View style={styles.row}>
      <Btn icon="remove" onPress={() => step(-1)} disabled={value <= min} />
      <View style={styles.valueWrap}>
        <Animated.Text key={value} entering={FadeIn} exiting={FadeOut} style={styles.value}>
          {value}
          {suffix}
        </Animated.Text>
      </View>
      <Btn icon="add" onPress={() => step(1)} disabled={value >= max} />
    </View>
  );
}

function Btn({
  icon,
  onPress,
  disabled,
}: {
  icon: 'add' | 'remove';
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={icon === 'add' ? 'Increase' : 'Decrease'}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.btn, pressed && { opacity: 0.6 }, disabled && { opacity: 0.3 }]}
    >
      <Ionicons name={icon} size={22} color={colors.gold.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg.card,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.xs,
  },
  btn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.bg.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueWrap: { flex: 1, alignItems: 'center' },
  value: { fontFamily: fonts.sansBold, fontSize: 18, color: colors.text.heading },
});

export default Stepper;
