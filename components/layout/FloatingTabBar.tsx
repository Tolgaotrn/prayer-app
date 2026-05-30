import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, fonts, radii } from '../../constants/theme';
import { useThemeColors } from '../../lib/useThemeColors';
import { haptic } from '../../lib/haptics';

const ICONS: Record<string, { icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  feed: { icon: 'sparkles', label: 'Feed' },
  'home-card': { icon: 'grid', label: 'Home' },
  themes: { icon: 'color-palette', label: 'Themes' },
  profile: { icon: 'person', label: 'Profile' },
  settings: { icon: 'settings-sharp', label: 'Settings' },
};

/** Frosted floating pill tab bar shared across the main app tabs. */
export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: insets.bottom + 10 }]}>
      <BlurView intensity={40} tint={tc.isDark ? 'dark' : 'light'} style={[styles.bar, { backgroundColor: tc.tabBarBg, borderColor: tc.tabBorder }]}>
        {state.routes.map((route, index) => {
          const meta = ICONS[route.name];
          if (!meta) return null;
          const focused = state.index === index;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={meta.label}
              onPress={() => {
                haptic.light();
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              style={[styles.tab, focused && styles.tabActive]}
            >
              <Ionicons
                name={meta.icon}
                size={20}
                color={focused ? colors.text.onGold : tc.muted}
              />
              {focused ? <Text style={styles.label}>{meta.label}</Text> : null}
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: radii.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: 'rgba(13,22,53,0.6)',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: radii.full,
  },
  tabActive: { backgroundColor: colors.gold.primary },
  label: { fontFamily: fonts.sansSemibold, fontSize: 13, color: colors.text.onGold },
});

export default FloatingTabBar;
