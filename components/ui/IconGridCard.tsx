import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { fonts, radii, spacing } from '../../constants/theme';
import { useThemeColors } from '../../lib/useThemeColors';
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
  const tc = useThemeColors();
  const style = useAnimatedStyle(() => ({
    borderColor: withTiming(selected ? tc.gold : tc.border),
    backgroundColor: withTiming(selected ? tc.raisedBg : tc.cardBg),
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
        <View style={[styles.iconWrap, { backgroundColor: selected ? tc.gold : tc.gold + '22' }]}>
          <Ionicons name={icon} size={22} color={selected ? tc.onGold : tc.gold} />
        </View>
        <Text style={[styles.title, { color: tc.heading }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: tc.muted }]}>{subtitle}</Text> : null}
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: { fontFamily: fonts.sansSemibold, fontSize: 15 },
  subtitle: { fontFamily: fonts.sans, fontSize: 12, marginTop: 2 },
});

export default IconGridCard;
