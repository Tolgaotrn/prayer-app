import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, fonts, radii, spacing } from '../../constants/theme';
import { haptic } from '../../lib/haptics';

interface OptionRowProps {
  label: string;
  sublabel?: string;
  selected: boolean;
  onPress: () => void;
  /** 'check' for multi-select, 'radio' for single-select, 'center' for pill style */
  variant?: 'check' | 'radio' | 'center';
}

/** Multi/single-select option row with gold border + spring on selection. */
export function OptionRow({ label, sublabel, selected, onPress, variant = 'check' }: OptionRowProps) {
  const animStyle = useAnimatedStyle(() => ({
    borderColor: withTiming(selected ? colors.gold.primary : colors.hairline),
    backgroundColor: withTiming(selected ? colors.bg.raised : colors.bg.card),
    transform: [{ scale: withSpring(selected ? 1.015 : 1, { damping: 16, stiffness: 200 }) }],
  }));

  return (
    <Pressable
      accessibilityRole={variant === 'radio' ? 'radio' : 'checkbox'}
      accessibilityState={{ checked: selected, selected }}
      accessibilityLabel={label}
      onPress={() => {
        haptic.select();
        onPress();
      }}
    >
      <Animated.View
        style={[styles.row, variant === 'center' && styles.center, animStyle]}
      >
        <View style={variant === 'center' ? styles.centerText : styles.textWrap}>
          <Text style={[styles.label, variant === 'center' && { textAlign: 'center' }]}>
            {label}
          </Text>
          {sublabel ? <Text style={styles.sublabel}>{sublabel}</Text> : null}
        </View>

        {variant !== 'center' ? (
          <Indicator selected={selected} radio={variant === 'radio'} />
        ) : selected ? (
          <Ionicons
            name="checkmark"
            size={18}
            color={colors.gold.primary}
            style={styles.centerCheck}
          />
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

function Indicator({ selected, radio }: { selected: boolean; radio: boolean }) {
  const style = useAnimatedStyle(() => ({
    borderColor: withTiming(selected ? colors.gold.primary : colors.text.muted),
    backgroundColor: withTiming(selected ? colors.gold.primary : 'transparent'),
    transform: [{ scale: withSpring(selected ? 1 : 0.85) }],
  }));
  return (
    <Animated.View style={[styles.box, radio && styles.radio, style]}>
      {selected && (
        <Ionicons name="checkmark" size={15} color={colors.text.onGold} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1.5,
    marginVertical: 5,
  },
  center: {
    justifyContent: 'center',
  },
  textWrap: { flex: 1, paddingRight: spacing.sm },
  centerText: { flexShrink: 1 },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    color: colors.text.heading,
  },
  sublabel: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.text.muted,
    marginTop: 3,
  },
  box: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radio: {
    borderRadius: 12,
  },
  centerCheck: {
    position: 'absolute',
    right: spacing.md,
  },
});

export default OptionRow;
