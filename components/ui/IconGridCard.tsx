import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { colors, fonts, radii, spacing } from '../../constants/theme';
import { haptic } from '../../lib/haptics';

interface IconGridCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
}

/** Content-selection grid item with icon, title, subtitle and gold highlight. */
export function IconGridCard({ icon, title, subtitle, selected, onPress }: IconGridCardProps) {
  const style = useAnimatedStyle(() => ({
    borderColor: withTiming(selected ? colors.gold.primary : colors.hairline),
    backgroundColor: withTiming(selected ? colors.bg.raised : colors.bg.card),
    transform: [{ scale: withSpring(selected ? 1.03 : 1, { damping: 15, stiffness: 200 }) }],
  }));

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={title}
      onPress={() => {
        haptic.select();
        onPress();
      }}
      style={styles.press}
    >
      <Animated.View style={[styles.card, style]}>
        <View style={[styles.iconWrap, selected && styles.iconWrapActive]}>
          <Ionicons name={icon} size={22} color={selected ? colors.text.onGold : colors.gold.bright} />
        </View>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  press: { flex: 1 },
  card: {
    borderRadius: radii.lg,
    borderWidth: 1.5,
    padding: spacing.md,
    minHeight: 116,
    justifyContent: 'center',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(212,175,55,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  iconWrapActive: { backgroundColor: colors.gold.primary },
  title: { fontFamily: fonts.sansSemibold, fontSize: 15, color: colors.text.heading },
  subtitle: { fontFamily: fonts.sans, fontSize: 12, color: colors.text.muted, marginTop: 2 },
});

export default IconGridCard;
