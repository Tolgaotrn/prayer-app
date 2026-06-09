import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeColors } from '../../lib/useThemeColors';
import { I18nManager } from 'react-native';
import { haptic } from '../../lib/haptics';

/**
 * Geri / feed'e dönüş butonu. Stack'te geri gidebiliyorsa back(),
 * yoksa feed'e gider. Tüm ana ekranların sol üstünde kullanılır.
 */
export function BackButton({ style, icon }: { style?: ViewStyle; icon?: keyof typeof Ionicons.glyphMap }) {
  const router = useRouter();
  const tc = useThemeColors();
  // RTL'de geri oku sağa dönük olmalı
  const backIcon = icon ?? (I18nManager.isRTL ? 'arrow-forward' : 'arrow-back');
  return (
    <Pressable
      onPress={() => {
        haptic.light();
        router.navigate('/(tabs)/feed');
      }}
      style={[styles.btn, { backgroundColor: tc.cardBg, borderColor: tc.border }, style]}
      accessibilityRole="button"
      accessibilityLabel="Back to feed"
      hitSlop={8}
    >
      <Ionicons name={backIcon} size={22} color={tc.heading} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
});

export default BackButton;
