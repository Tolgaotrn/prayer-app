/**
 * Background themes — görseller Supabase Storage'dan gelir.
 * expo-image otomatik cache'ler, tekrar indirmez.
 */

const BASE = 'https://hvxrsscrsqdbfewpmfhl.supabase.co/storage/v1/object/public/themes';

export interface BackgroundTheme {
  id: number;
  name: string;
  image: { uri: string };
  gradient: readonly [string, string, ...string[]];
  badge?: 'New' | 'Live';
  isFree?: boolean;
  /** Optional looping video background (overrides image in feed) */
  video?: { uri: string };
}

export const backgroundThemes: BackgroundTheme[] = [
  {
    id: 1,
    name: 'Night Mosque',
    image: { uri: `${BASE}/night-mosque.png` },
    gradient: ['#0B1530', '#1A2A50', '#080E1F'],
  },
  {
    id: 2,
    name: 'Sunset Arch',
    image: { uri: `${BASE}/sunset-arch.png` },
    gradient: ['#3A2A18', '#B98A4E', '#2B1E12'],
    isFree: true,
  },
  {
    id: 3,
    name: 'Grand Interior',
    image: { uri: `${BASE}/interior.png` },
    gradient: ['#2B2418', '#6E5A3E', '#1A150E'],
    isFree: true,
  },
  {
    id: 4,
    name: 'Sunrise Court',
    image: { uri: `${BASE}/sunrise-court.jpg` },
    gradient: ['#4A3A22', '#C9A765', '#2A2014'],
  },
  {
    id: 5,
    name: 'Serene Gate',
    image: { uri: `${BASE}/serene-arch.jpg` },
    gradient: ['#2A2018', '#8A6A44', '#181208'],
  },
  {
    id: 6,
    name: 'Quran Light',
    image: { uri: `${BASE}/quran-light.jpg` },
    gradient: ['#2A1E0E', '#9A6A2E', '#160E04'],
  },
  {
    id: 7,
    name: "Bird's Eye Dusk",
    image: { uri: `${BASE}/bird-sunset.jpg` },
    gradient: ['#3A2410', '#7A4A1E', '#0E0804'],
    isFree: true,
  },
  {
    id: 8,
    name: 'Holy Kaaba',
    image: { uri: `${BASE}/kaaba.png` },
    gradient: ['#1A1A1A', '#4A4A4A', '#0A0A0A'],
  },
  {
    id: 9,
    name: 'Living Light I',
    image: { uri: `${BASE}/midnight.jpg` },
    gradient: ['transparent', 'transparent', 'transparent'],
    badge: 'Live',
    video: { uri: 'https://hvxrsscrsqdbfewpmfhl.supabase.co/storage/v1/object/public/media/0531.mp4' },
  },
  {
    id: 10,
    name: 'Living Light II',
    image: { uri: `${BASE}/midnight.jpg` },
    gradient: ['transparent', 'transparent', 'transparent'],
    badge: 'Live',
    video: { uri: 'https://hvxrsscrsqdbfewpmfhl.supabase.co/storage/v1/object/public/media/0532.mp4' },
  },
  {
    id: 11,
    name: 'Desert Prayer',
    image: { uri: `${BASE}/desert-prayer.jpg` },
    gradient: ['#1A1008', '#3A2010', '#0A0804'],
    badge: 'New',
  },
  {
    id: 12,
    name: 'Blue Night',
    image: { uri: `${BASE}/blue-night.jpg` },
    gradient: ['#0A1428', '#1A2A50', '#06080F'],
    badge: 'New',
  },
  {
    id: 13,
    name: 'Golden Arabesque',
    image: { uri: `${BASE}/golden-arabesque.jpg` },
    gradient: ['#3A2A08', '#8A6A1A', '#1A1204'],
    badge: 'New',
  },
  {
    id: 14,
    name: 'Iznik Birds',
    image: { uri: `${BASE}/iznik-birds.jpg` },
    gradient: ['#2A3A1A', '#4A6A3A', '#141E0C'],
    badge: 'New',
  },
  {
    id: 15,
    name: 'Forest Prayer',
    image: { uri: `${BASE}/forest-prayer.jpg` },
    gradient: ['#1A2A10', '#3A5A20', '#0C1408'],
    badge: 'New',
  },
  {
    id: 16,
    name: 'Golden Mosque',
    image: { uri: `${BASE}/golden-mosque.jpg` },
    gradient: ['#3A2A10', '#8A6A2A', '#1A1408'],
    badge: 'New',
  },
  {
    id: 17,
    name: 'Kaaba Aerial',
    image: { uri: `${BASE}/kaaba-aerial.jpg` },
    gradient: ['#2A2A2A', '#5A5A4A', '#101010'],
    badge: 'New',
  },
  {
    id: 18,
    name: 'Al-Madinah',
    image: { uri: `${BASE}/madinah.jpg` },
    gradient: ['#1A2A1A', '#2A4A3A', '#0A1410'],
    badge: 'New',
  },
  {
    id: 19,
    name: 'Ortaköy Sunset',
    image: { uri: `${BASE}/ortakoy.jpg` },
    gradient: ['#3A2008', '#8A4A18', '#1A0C04'],
    badge: 'New',
  },
  {
    id: 20,
    name: 'White Dome',
    image: { uri: `${BASE}/white-dome.jpg` },
    gradient: ['#2A2A1A', '#6A6A4A', '#14140A'],
    badge: 'New',
  },
  {
    id: 21,
    name: 'Iznik Tulips',
    image: { uri: `${BASE}/iznik-tulips.jpg` },
    gradient: ['#2A1A1A', '#6A3A3A', '#140A0A'],
    badge: 'New',
  },
  {
    id: 22,
    name: 'Sheikh Zayed Grand',
    image: { uri: `${BASE}/sheikh-zayed.jpg` },
    gradient: ['#1A1210', '#4A3A2A', '#0C0808'],
    badge: 'New',
  },
  {
    id: 23,
    name: 'Ottoman Courtyard',
    image: { uri: `${BASE}/ottoman-courtyard.jpg` },
    gradient: ['#2A1A0A', '#5A3A1A', '#0E0804'],
    badge: 'New',
  },
  {
    id: 24,
    name: 'Topkapi Corridor',
    image: { uri: `${BASE}/topkapi-corridor.jpg` },
    gradient: ['#3A2A18', '#7A5A32', '#1A140C'],
    badge: 'New',
  },
  {
    id: 25,
    name: 'Persian Dome',
    image: { uri: `${BASE}/persian-dome.jpg` },
    gradient: ['#1A0E08', '#3A1A10', '#080404'],
    badge: 'New',
  },
  {
    id: 26,
    name: 'Ottoman Sunrise',
    image: { uri: `${BASE}/ottoman-sunrise.jpg` },
    gradient: ['#2A1408', '#6A3A18', '#0E0604'],
    badge: 'New',
  },
  {
    id: 27,
    name: 'Cedar Forest Light',
    image: { uri: `${BASE}/cedar-forest.jpg` },
    gradient: ['#1A1408', '#3A2A1A', '#080604'],
    badge: 'New',
  },
  {
    id: 28,
    name: 'Wadi Rum Sunset',
    image: { uri: `${BASE}/new-theme-1.png` },
    gradient: ['#1A1A1A', '#2A2A2A', '#0A0A0A'],
    badge: 'New',
  },
  {
    id: 29,
    name: 'Cappadocia Quran',
    image: { uri: `${BASE}/new-theme-2.png` },
    gradient: ['#1A1A1A', '#2A2A2A', '#0A0A0A'],
    badge: 'New',
  },
  {
    id: 30,
    name: 'Samarkand Glow',
    image: { uri: `${BASE}/new-theme-3.png` },
    gradient: ['#1A1A1A', '#2A2A2A', '#0A0A0A'],
    badge: 'New',
  },
  {
    id: 31,
    name: 'Courtyard Spring',
    image: { uri: `${BASE}/new-theme-4.png` },
    gradient: ['#1A1A1A', '#2A2A2A', '#0A0A0A'],
    badge: 'New',
  },
  {
    id: 32,
    name: 'Crescent Dunes',
    image: { uri: `${BASE}/new-theme-5.png` },
    gradient: ['#1A1A1A', '#2A2A2A', '#0A0A0A'],
    badge: 'New',
  },
  {
    id: 33,
    name: 'Bosphorus Dawn',
    image: { uri: `${BASE}/new-theme-6.png` },
    gradient: ['#1A1A1A', '#2A2A2A', '#0A0A0A'],
    badge: 'New',
  },
  {
    id: 34,
    name: 'Riad Fountain',
    image: { uri: `${BASE}/new-theme-7.png` },
    gradient: ['#1A1A1A', '#2A2A2A', '#0A0A0A'],
    badge: 'New',
  },
  {
    id: 35,
    name: 'Misty Rose Garden',
    image: { uri: `${BASE}/new-theme-8.png` },
    gradient: ['#1A1A1A', '#2A2A2A', '#0A0A0A'],
    badge: 'New',
  },
  {
    id: 36,
    name: 'Iznik Panel',
    image: { uri: `${BASE}/new-theme-9.png` },
    gradient: ['#1A1A1A', '#2A2A2A', '#0A0A0A'],
    badge: 'New',
  },
  {
    id: 37,
    name: 'Fig Tree Shade',
    image: { uri: `${BASE}/new-theme-10.png` },
    gradient: ['#1A1A1A', '#2A2A2A', '#0A0A0A'],
    badge: 'New',
  },
  {
    id: 38,
    name: 'Moonlit Harbor',
    image: { uri: `${BASE}/new-theme-11.png` },
    gradient: ['#1A1A1A', '#2A2A2A', '#0A0A0A'],
    badge: 'New',
  },
];

/** Varsayılan tema — ücretsiz bir tema (Midnight Crescent kaldırıldı). */
export const DEFAULT_THEME_ID = 2; // Sunset Arch (free)

/**
 * Widget arka plan görseli URL'sini çözer.
 * widgetThemeId: null → app temasını izle, 0 → minimal (görsel yok), diğer → o tema.
 */
export function resolveWidgetBgURL(
  widgetThemeId: number | null | undefined,
  appThemeId: number,
): string | undefined {
  if (widgetThemeId === 0) return undefined; // minimal — düz gradient
  const id = widgetThemeId ?? appThemeId;
  return backgroundThemes.find((t) => t.id === id)?.image.uri;
}

export function getTheme(id: number): BackgroundTheme {
  return (
    backgroundThemes.find((t) => t.id === id) ??
    backgroundThemes.find((t) => t.id === DEFAULT_THEME_ID) ??
    backgroundThemes[0]
  );
}

/**
 * Galeri sıralaması: önce Free, sonra Live (gizlenmesin),
 * sonra New, en son düz temalar. Seçim id'ye göre olduğu için
 * sıralama sadece görsel düzeni etkiler.
 */
export function sortedThemes(list: BackgroundTheme[]): BackgroundTheme[] {
  const rank = (t: BackgroundTheme): number => {
    if (t.isFree) return 0;
    if (t.badge === 'Live') return 1;
    if (t.badge === 'New') return 2;
    return 3;
  };
  return [...list].sort((a, b) => rank(a) - rank(b));
}
