import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { colors, fonts, radii, shadow, spacing } from '../../constants/theme';
import { haptic } from '../../lib/haptics';

interface GoldButtonProps {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  shimmer?: boolean;
}

const AnimatedLG = Animated.createAnimatedComponent(LinearGradient);

/** Primary CTA: gold gradient pill with an animated shimmer sweep. */
export function GoldButton({ label, onPress, disabled, style, shimmer = true }: GoldButtonProps) {
  const sweep = useSharedValue(-1);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (shimmer && !disabled) {
      sweep.value = withRepeat(
        withSequence(
          withTiming(1.5, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
          withTiming(-1, { duration: 0 }),
        ),
        -1,
        false,
      );
    }
  }, [shimmer, disabled, sweep]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sweep.value * 220 }, { rotate: '20deg' }],
  }));
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[pressStyle, !disabled && shadow.goldGlow, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: !!disabled }}
        disabled={disabled}
        onPressIn={() => {
          scale.value = withTiming(0.97, { duration: 90 });
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: 120 });
        }}
        onPress={() => {
          if (disabled) return;
          haptic.medium();
          onPress?.();
        }}
      >
        <LinearGradient
          colors={
            disabled
              ? ['#3A3A48', '#33333F']
              : [colors.gold.bright, colors.gold.primary, colors.gold.deep]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.btn}
        >
          {shimmer && !disabled && (
            <View style={styles.shimmerClip} pointerEvents="none">
              <AnimatedLG
                colors={['transparent', 'rgba(255,255,255,0.55)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.shimmer, shimmerStyle]}
              />
            </View>
          )}
          <Text style={[styles.label, disabled && { color: colors.text.muted }]}>{label}</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 60,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    overflow: 'hidden',
  },
  label: {
    fontFamily: fonts.sansBold,
    fontSize: 17,
    color: colors.text.onGold,
    letterSpacing: 0.2,
  },
  shimmerClip: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: -20,
    bottom: -20,
    width: 60,
  },
});

export default GoldButton;
