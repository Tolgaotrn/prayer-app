/**
 * Noor design system.
 * Dark-first Islamic companion app. Deep navy backgrounds, gold accents,
 * Playfair serif display, Amiri Arabic, Plus Jakarta Sans UI.
 */

export const colors = {
  // ── Dark palette (default) ──────────────────────────────────────────
  bg: {
    midnight: '#0A1230',
    deep: '#0D1635',
    card: '#161E3D',
    raised: '#1E2A52',
    premium: '#07101F',
  },
  gold: {
    primary: '#D4AF37',
    bright: '#E8C766',
    deep: '#B8902E',
  },
  text: {
    heading: '#F5F0E1',
    body: '#C3C9DE',
    muted: '#828BAD',
    onGold: '#1A1206',
  },
  green: {
    streak: '#2E7D32',
    accent: '#4CAF72',
  },
  white: '#FFFFFF',
  hairline: 'rgba(255,255,255,0.08)',
  overlay: 'rgba(5,9,22,0.7)',

  // ── Warm / Light palette ────────────────────────────────────────────
  // Sıcak bej-krem tonlar — "Deen Buddy" referansından ilham alındı.
  // Kullanım: <ScreenContainer warm> gibi bir prop ile veya
  // doğrudan warm.* renkleri ile uygulayabilirsin.
  warm: {
    bg:       '#F2EDE4',   // en açık arka plan (ana ekran)
    surface:  '#EDE7DC',   // kart arka planı
    raised:   '#E4DDD3',   // hover / selected
    border:   'rgba(180,155,120,0.25)',
    gold:     '#C9963A',   // koyu sarı/altın bu paletten
    goldSoft: '#D4A855',
    text:     '#2C2418',   // koyu kahve başlık
    body:     '#5C4F3D',   // orta bej body
    muted:    '#9C8E7D',   // soluk label
    streak:   '#C9963A',   // streak rengi (warm tonda)
  },
} as const;

export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 28,
  full: 999,
} as const;

/** Font family keys — must match the names registered in app/_layout.tsx via useFonts. */
export const fonts = {
  // Playfair Display — display / headlines
  serif: 'PlayfairDisplay_400Regular',
  serifMedium: 'PlayfairDisplay_500Medium',
  serifSemibold: 'PlayfairDisplay_600SemiBold',
  serifBold: 'PlayfairDisplay_700Bold',
  // Plus Jakarta Sans — UI / body
  sans: 'PlusJakartaSans_400Regular',
  sansMedium: 'PlusJakartaSans_500Medium',
  sansSemibold: 'PlusJakartaSans_600SemiBold',
  sansBold: 'PlusJakartaSans_700Bold',
  // Amiri — Arabic / Quran
  arabic: 'Amiri_400Regular',
  arabicBold: 'Amiri_700Bold',
} as const;

export const fontSize = {
  caption: 12,
  small: 13,
  body: 15,
  base: 16,
  lg: 18,
  xl: 22,
  title: 26,
  display: 34,
  hero: 44,
} as const;

/** Common drop-shadow / glow presets. */
export const shadow = {
  goldGlow: {
    shadowColor: colors.gold.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 12,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;

export type ThemeColors = typeof colors;
