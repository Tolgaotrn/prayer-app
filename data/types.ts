export type VerseCategory =
  | 'peace'
  | 'patience'
  | 'hope'
  | 'tawakkul'
  | 'gratitude'
  | 'prayer';

export type Origin = 'Makkah' | 'Madinah';

export interface Verse {
  id: string;
  arabic: string;
  translation: string;
  surah: string;
  ayah: number;
  juz: number;
  origin: Origin;
  category: VerseCategory;
  tags: string[];
}

export interface Dua {
  id: string;
  arabic: string;
  translation: string;
  transliteration: string;
  occasion: string;
}

export interface Hadith {
  id: string;
  arabic: string;
  translation: string;
  narrator: string;
  source: string;
}

export interface Quote {
  id: string;
  text: string;
  author: string;
}

export type ContentKind = 'verse' | 'dua' | 'hadith' | 'quote';
