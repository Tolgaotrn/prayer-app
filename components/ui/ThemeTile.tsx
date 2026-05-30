import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { colors, fonts, radii } from '../../constants/theme';
import { haptic } from '../../lib/haptics';
import type { BackgroundTheme } from '../../data/themes';

interface ThemeTileProps {
  theme: BackgroundTheme;
  selected: boolean;
  onPress: () => void;
  style?: ViewStyle;
  showEdit?: boolean;
  aspectRatio?: number;
}

/** Photo tile (real mosque image) with badge + selection checkmark. */
export function ThemeTile({
  theme,
  selected,
  onPress,
  style,
  showEdit,
  aspectRatio = 0.62,
}: ThemeTileProps) {
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(selected ? 1.0 : 1, { damping: 16 }) }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${theme.name} theme`}
      accessibilityState={{ selected }}
      onPress={() => {
        haptic.select();
        onPress();
      }}
      style={[{ flex: 1 }, style]}
    >
      <Animated.View style={[styles.tile, { aspectRatio }, selected && styles.selected, anim]}>
        <Image
          source={theme.image}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={300}
          placeholder={{ blurhash: 'L37nIw00~q9F4n%MD%xu00~q-;%M' }}
        />
        <LinearGradient
          colors={['transparent', 'rgba(7,10,20,0.1)', 'rgba(7,10,20,0.85)']}
          style={StyleSheet.absoluteFill}
        />

        {theme.badge ? (
          <View style={[styles.badge, theme.badge === 'New' && styles.badgeNew]}>
            <Text style={styles.badgeText}>{theme.badge}</Text>
          </View>
        ) : null}

        {selected ? (
          <View style={styles.check}>
            <Ionicons name="checkmark" size={14} color={colors.white} />
          </View>
        ) : null}

        {selected && showEdit ? (
          <View style={styles.editOverlay}>
            <Ionicons name="brush" size={13} color={colors.white} />
            <Text style={styles.editText}>Edit</Text>
          </View>
        ) : null}

        <Text style={styles.name} numberOfLines={1}>
          {theme.name}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'flex-end',
    padding: 8,
    backgroundColor: colors.bg.card,
  },
  selected: { borderColor: colors.gold.primary },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  badgeNew: { backgroundColor: colors.gold.deep },
  badgeText: { fontFamily: fonts.sansSemibold, fontSize: 10, color: colors.white },
  check: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2F6BFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editText: { fontFamily: fonts.sansSemibold, fontSize: 11, color: colors.white },
  name: { fontFamily: fonts.sansSemibold, fontSize: 11, color: colors.white },
});

export default ThemeTile;
