import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../constants/theme';
import { haptic } from '../../lib/haptics';

interface ToggleSwitchProps {
  value: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}

/** Animated gold toggle — knob springs across, track fades to gold when on. */
export function ToggleSwitch({ value, onChange, label }: ToggleSwitchProps) {
  const progress = useDerivedValue(() => withTiming(value ? 1 : 0, { duration: 220 }));

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(255,255,255,0.14)', colors.gold.primary],
    ),
  }));

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(value ? 24 : 2, { damping: 15, stiffness: 220 }) }],
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      onPress={() => {
        haptic.light();
        onChange(!value);
      }}
    >
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.knob, knobStyle]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 52,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
  },
  knob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.white,
  },
});

export default ToggleSwitch;
