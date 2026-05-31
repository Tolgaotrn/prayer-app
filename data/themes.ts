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
  badge?: 'Free' | 'New' | 'Live';
  /** Optional looping video background (overrides image in feed) */
  video?: { uri: string };
}

export const backgroundThemes: BackgroundTheme[] = [
  {
    id: 0,
    name: 'Midnight Crescent',
    image: { uri: `${BASE}/midnight.jpg` },
    gradient: ['#0A1230', '#0D1A3A', '#070C18'],
    badge: 'Free',
  },
  {
    id: 1,
    name: 'Night Mosque',
    image: { uri: `${BASE}/night-mosque.png` },
    gradient: ['#0B1530', '#1A2A50', '#080E1F'],
    badge: 'Free',
  },
  {
    id: 2,
    name: 'Sunset Arch',
    image: { uri: `${BASE}/sunset-arch.png` },
    gradient: ['#3A2A18', '#B98A4E', '#2B1E12'],
    badge: 'New',
  },
  {
    id: 3,
    name: 'Grand Interior',
    image: { uri: `${BASE}/interior.png` },
    gradient: ['#2B2418', '#6E5A3E', '#1A150E'],
  },
  {
    id: 4,
    name: 'Sunrise Court',
    image: { uri: `${BASE}/sunrise-court.jpg` },
    gradient: ['#4A3A22', '#C9A765', '#2A2014'],
    badge: 'New',
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
    gradient: ['#0A1230', '#0D1A3A', '#070C18'],
    badge: 'Live',
    video: { uri: 'https://hvxrsscrsqdbfewpmfhl.supabase.co/storage/v1/object/public/media/0531.mp4' },
  },
  {
    id: 10,
    name: 'Living Light II',
    image: { uri: `${BASE}/midnight.jpg` },
    gradient: ['#1A0A08', '#3A1A12', '#0A0404'],
    badge: 'Live',
    video: { uri: 'https://hvxrsscrsqdbfewpmfhl.supabase.co/storage/v1/object/public/media/0532.mp4' },
  },
];

export function getTheme(id: number): BackgroundTheme {
  return backgroundThemes.find((t) => t.id === id) ?? backgroundThemes[0];
}
