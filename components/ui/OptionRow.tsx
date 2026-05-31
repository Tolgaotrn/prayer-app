import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { fonts, radii, spacing } from '../../constants/theme';
import { useThemeColors } from '../../lib/useThemeColors';
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
  const tc = useThemeColors();
  const animStyle = useAnimatedStyle(() => ({
    borderColor: withTiming(selected ? tc.gold : tc.border),
    backgroundColor: withTiming(selected ? tc.raisedBg : tc.cardBg),
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
          <Text style={[styles.label, { color: tc.heading }, variant === 'center' && { textAlign: 'center' }]}>
            {label}
          </Text>
          {sublabel ? <Text style={[styles.sublabel, { color: tc.muted }]}>{sublabel}</Text> : null}
        </View>

        {variant !== 'center' ? (
          <Indicator selected={selected} radio={variant === 'radio'} tc={tc} />
        ) : selected ? (
          <Ionicons
            name="checkmark"
            size={18}
            color={tc.gold}
            style={styles.centerCheck}
          />
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

function Indicator({ selected, radio, tc }: { selected: boolean; radio: boolean; tc: ReturnType<typeof useThemeColors> }) {
  const style = useAnimatedStyle(() => ({
    borderColor: withTiming(selected ? tc.gold : tc.muted),
    backgroundColor: withTiming(selected ? tc.gold : 'transparent'),
    transform: [{ scale: withSpring(selected ? 1 : 0.85) }],
  }));
  return (
    <Animated.View style={[styles.box, radio && styles.radio, style]}>
      {selected && (
        <Ionicons name="checkmark" size={15} color={tc.onGold} />
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
  },
  sublabel: {
    fontFamily: fonts.sans,
    fontSize: 13,
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
