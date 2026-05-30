import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, fonts, radii } from '../../constants/theme';
import { haptic } from '../../lib/haptics';

interface GhostButtonProps {
  label: string;
  onPress?: () => void;
  style?: ViewStyle;
  subtle?: boolean;
}

/** Secondary outlined / text button. */
export function GhostButton({ label, onPress, style, subtle }: GhostButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        haptic.light();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.btn,
        subtle ? styles.subtle : styles.outlined,
        pressed && { opacity: 0.7 },
        style,
      ]}
    >
      <Text style={[styles.label, subtle && { color: colors.text.muted }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 54,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  subtle: {
    backgroundColor: 'transparent',
  },
  label: {
    fontFamily: fonts.sansSemibold,
    fontSize: 15,
    color: colors.text.body,
  },
});

export default GhostButton;
