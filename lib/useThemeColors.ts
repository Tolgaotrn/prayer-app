/**
 * useThemeColors — dark/light moda göre renk seti döndürür.
 * Tüm ekranlar hardcoded colors.* yerine bunu kullanmalı.
 */
import { useAppStore } from '../stores/useAppStore';
import { colors } from '../constants/theme';

export interface ThemeColors {
  // Arka planlar
  screenBg:   string;
  cardBg:     string;
  raisedBg:   string;
  // Yazılar
  heading:    string;
  body:       string;
  muted:      string;
  onGold:     string;
  // Altın
  gold:       string;
  goldBright: string;
  // Çizgiler
  border:     string;
  hairline:   string;
  // Tab bar / overlay
  tabBarBg:   string;
  tabBorder:  string;
  // Pill / chip
  pillBg:     string;
  pillText:   string;
  // Seksyon başlığı
  sectionTitle: string;
}

const dark: ThemeColors = {
  screenBg:   colors.bg.midnight,
  cardBg:     colors.bg.card,
  raisedBg:   colors.bg.raised,
  heading:    colors.text.heading,
  body:       colors.text.body,
  muted:      colors.text.muted,
  onGold:     colors.text.onGold,
  gold:       colors.gold.primary,
  goldBright: colors.gold.bright,
  border:     colors.hairline,
  hairline:   colors.hairline,
  tabBarBg:   'rgba(13,22,53,0.75)',
  tabBorder:  colors.hairline,
  pillBg:     colors.bg.raised,
  pillText:   colors.text.body,
  sectionTitle: colors.text.heading,
};

const light: ThemeColors = {
  screenBg:   colors.warm.bg,
  cardBg:     colors.warm.surface,
  raisedBg:   colors.warm.raised,
  heading:    colors.warm.text,
  body:       colors.warm.body,
  muted:      colors.warm.muted,
  onGold:     '#FFFFFF',
  gold:       colors.warm.gold,
  goldBright: colors.warm.goldSoft,
  border:     colors.warm.border,
  hairline:   colors.warm.border,
  tabBarBg:   'rgba(232,224,212,0.88)',
  tabBorder:  'rgba(180,155,120,0.3)',
  pillBg:     colors.warm.raised,
  pillText:   colors.warm.body,
  sectionTitle: colors.warm.text,
};

export function useThemeColors(): ThemeColors & { isDark: boolean } {
  const darkMode = useAppStore((s) => s.darkMode);
  return { ...(darkMode ? dark : light), isDark: darkMode };
}
