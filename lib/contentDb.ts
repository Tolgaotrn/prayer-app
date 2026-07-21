/**
 * contentDb — GÖMÜLÜ içerik katmanı (Supabase YOK)
 *
 * Tüm içerik app bundle'ında (data/offlineContent.ts). Supabase tamamen
 * kaldırıldı (2026-06, egress 402). Ağ çağrısı yok → anında, offline, 0 egress.
 * İçeriği değiştirmek: content/ güncelle → node tools/build-offline-content.mjs.
 *
 * İçerik kuralları:
 *  ÜCRETSİZ: General (Daily Wisdom = reflections), Favorites
 *  PREMİUM:  Quran Verses, Hadiths, Duas & Prayers, Islamic Quotes, 99 Names, konular
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  OFFLINE_CONTENT,
  OFFLINE_REFLECTIONS,
  OFFLINE_NAMES,
  type OfflineLang,
  type OfflineItem,
} from '../data/offlineContent';

// ── Tipler ───────────────────────────────────────────────────
export type Lang = 'en' | 'tr' | 'fr' | 'id' | 'de' | 'ur';

export interface FeedItem {
  id:          string;
  kind:        'verse' | 'hadith' | 'quote' | 'dua';
  arabic:      string;
  translation: string;
  reference:   string;
  topics:      string[];
}

export interface ThemeItem {
  id:        number;
  name:      string;
  image_url: string;
  gradient:  string[];
  badge:     string | null;
  is_free:   boolean;
}

// Ücretli olmayan konular — sadece General ve Favorites ücretsiz
const FREE_TOPICS = new Set(['General', 'Favorites']);

// Dua çevirisi SADECE bu dillerde mevcut (tr/fr yok). Diğer dillerde dualar
// feed'e HİÇ katılmaz — İngilizce'ye düşürmek "tek dil" kuralını bozardı.
const DUA_LANGS = new Set<Lang>(['en', 'id']);

// UI topic label → topics[] tag
const TOPIC_TAG_MAP: Record<string, string> = {
  'Patience':             'patience',
  'Gratitude':            'gratitude',
  'Hope':                 'hope',
  'Repentance':           'repentance',
  'Tawakkul':             'tawakkul',
  'Seeking Guidance':     'guidance',
  'Forgiveness':          'forgiveness',
  'Inner Peace':          'peace',
  'Love of Allah':        'love',
  'Honesty':              'honesty',
  'Kindness':             'kindness',
  'Dhikr & Remembrance':  'dhikr',
};

// Kind-tabanlı topic → öğe türü eşlemesi
const KIND_TOPIC: Record<string, FeedItem['kind']> = {
  'Quran Verses':   'verse',
  'Hadiths':        'hadith',
  'Islamic Quotes': 'quote',
};

// Onboarding dil değerini → Lang'e çevir
export function resolveLang(stored: string | undefined): Lang {
  if (!stored) return 'en';
  if (stored === 'Turkish')    return 'tr';
  if (stored === 'French')     return 'fr';
  if (stored === 'Indonesian') return 'id';
  if (stored === 'German')     return 'de';
  if (stored === 'Urdu')       return 'ur';
  // 'English', 'Arabic' → English translation kullanır
  return 'en';
}

// ── Gömülü havuzlar (modül yüklenince bir kez) ───────────────
const VERSES  = OFFLINE_CONTENT.filter(i => i.kind === 'verse');
const HADITHS = OFFLINE_CONTENT.filter(i => i.kind === 'hadith');
const QUOTES  = OFFLINE_CONTENT.filter(i => i.kind === 'quote');
const DUAS    = OFFLINE_CONTENT.filter(i => i.kind === 'dua');

// OfflineItem → FeedItem (seçili dilde; metni yoksa null = strict dil kuralı)
function toFeedItem(it: OfflineItem, lang: Lang, arabicOnly: boolean): FeedItem | null {
  const body = arabicOnly ? it.arabic : it.t[lang as OfflineLang];
  if (!body || !body.trim()) return null;
  return {
    id: it.id,
    kind: it.kind,
    arabic: it.arabic,
    translation: arabicOnly ? '' : body,
    reference: it.ref,
    topics: it.topics,
  };
}

// Reflections (Daily Wisdom) — dil başına bağımsız liste
function reflFeed(lang: string, arabicOnly: boolean): FeedItem[] {
  return OFFLINE_REFLECTIONS
    .filter(r => r.lang === lang)
    .map(r => ({
      id: r.id,
      kind: 'quote' as const,
      arabic: arabicOnly ? r.text : '',
      translation: arabicOnly ? '' : r.text,
      reference: '',
      topics: ['Reflections'],
    }));
}

// 99 Names → FeedItem
function namesFeed(lang: Lang, arabicOnly: boolean): FeedItem[] {
  return OFFLINE_NAMES
    .map(n => {
      const meaning = n.m[lang as OfflineLang] ?? n.m.en ?? '';
      return {
        id: n.id,
        kind: 'quote' as const,
        arabic: n.arabic,
        translation: arabicOnly ? '' : `${n.translit} — ${meaning}`.trim(),
        reference: `99 Names of Allah · #${n.number}`,
        topics: ['99 Names of Allah'],
      };
    })
    .filter(f => (arabicOnly ? f.arabic.trim() : f.translation.trim()));
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Çevrimdışı içerik havuzu — SEÇİLİ dilde döner; metni olmayan öğe elenir.
 * topics verilirse konuya göre süzer. (notifications.ts kullanır.)
 */
export function getOfflineFeedItems(
  lang: Lang,
  arabicOnly = false,
  topics: string[] = [],
): FeedItem[] {
  let pool: FeedItem[] = [];
  for (const it of OFFLINE_CONTENT) {
    const f = toFeedItem(it, lang, arabicOnly);
    if (f) pool.push(f);
  }

  const wantsGeneral =
    topics.length === 0 || topics.includes('General') || topics.includes('Favorites');

  if (!wantsGeneral) {
    const dbTags = topics.map(t => TOPIC_TAG_MAP[t]).filter(Boolean);
    const kinds  = topics.map(t => KIND_TOPIC[t]).filter(Boolean) as FeedItem['kind'][];
    pool = pool.filter(
      it =>
        (kinds.length > 0 && kinds.includes(it.kind)) ||
        (dbTags.length > 0 && it.topics.some(tg => dbTags.includes(tg))),
    );
  }

  return pool;
}

// ── Feed ──────────────────────────────────────────────────────
export async function fetchFeedItems(
  lang: Lang = 'en',
  limit = 30,
  followedTopics: string[] = [],
  isPremium = false,
  savedIds: string[] = [],
  _forceFresh = false,   // imza korunur (çağıranlar geçiyor); artık ağ yok → anlamsız
  arabicOnly = false,
): Promise<FeedItem[]> {
  // Premium olmayan kullanıcı sadece ücretsiz konulara erişebilir
  const effectiveTopics = isPremium
    ? followedTopics
    : followedTopics.filter(t => FREE_TOPICS.has(t));

  // Daily Wisdom feed'i (General) → Quran ayeti gösterme. ANCAK saf Favorites
  // feed'i (saved-verses ekranı) verse'leri ELEMEZ — kullanıcı kaydettiği ayeti
  // görebilmeli. Yani drop yalnız General varken / topic boşken uygulanır.
  const isDailyWisdomFeed =
    effectiveTopics.length === 0 || effectiveTopics.includes('General');
  const dropVerses = (arr: FeedItem[]): FeedItem[] =>
    isDailyWisdomFeed ? arr.filter(i => i.kind !== 'verse') : arr;

  return dropVerses(buildFeed(lang, limit, effectiveTopics, savedIds, arabicOnly));
}

function buildFeed(
  lang: Lang,
  limit: number,
  topics: string[],
  savedIds: string[],
  arabicOnly: boolean,
): FeedItem[] {
  const hasGeneral   = topics.includes('General') || topics.length === 0;
  const hasVerses    = topics.includes('Quran Verses');
  const hasFavorites = topics.includes('Favorites') || hasGeneral;
  const hasDuas      = topics.includes('Duas & Prayers') || hasGeneral;
  const hasHadiths   = topics.includes('Hadiths')        || hasGeneral;
  const hasQuotes    = topics.includes('Islamic Quotes')  || hasGeneral;
  const has99Names   = topics.includes('99 Names of Allah');
  const dbTags       = topics.filter(t => TOPIC_TAG_MAP[t]).map(t => TOPIC_TAG_MAP[t]);

  // ── General → SADECE Reflections (Daily Wisdom) ──
  if (hasGeneral && topics.filter(t => t !== 'Favorites').length <= 1) {
    let refl = reflFeed(arabicOnly ? 'ar' : lang, arabicOnly);
    // Dilde yetersizse İngilizce ile tamamla (Arapça hariç — RTL kuralı)
    if (refl.length < 8 && !arabicOnly && lang !== 'en') {
      const seen = new Set(refl.map(r => r.id));
      refl = refl.concat(reflFeed('en', false).filter(r => !seen.has(r.id)));
    }
    if (refl.length > 0) return shuffle(refl).slice(0, limit);
    // Hiç reflection yoksa aşağıdaki klasik karışıma düşer
  }

  const results: FeedItem[] = [];
  const push = (it: OfflineItem) => {
    const f = toFeedItem(it, lang, arabicOnly);
    if (f) results.push(f);
  };

  if (hasVerses)                       VERSES.forEach(push);
  if (hasHadiths)                      HADITHS.forEach(push);
  if (hasQuotes && !arabicOnly)        QUOTES.forEach(push);
  if (hasDuas && DUA_LANGS.has(lang))  DUAS.forEach(push);
  if (has99Names)                      namesFeed(lang, arabicOnly).forEach(f => results.push(f));

  // ── Konuya özel (Patience, Gratitude, ...) ──
  if (dbTags.length > 0) {
    [...VERSES, ...HADITHS].forEach(it => {
      if (it.topics.some(tg => dbTags.includes(tg))) push(it);
    });
    if (dbTags.includes('dhikr') && DUA_LANGS.has(lang)) {
      const DHIKR_CATS = ['morning-dhikr', 'evening-dhikr', 'dhikr-after-salah'];
      DUAS.forEach(it => { if (DHIKR_CATS.includes(it.topics[0])) push(it); });
    }
  }

  // ── Favorites — her türden kayıtlı içerik (reflection + name dahil) ──
  if (savedIds.length > 0 && hasFavorites) {
    const idset = new Set(savedIds);
    OFFLINE_CONTENT.forEach(it => { if (idset.has(it.id)) push(it); });
    reflFeed(arabicOnly ? 'ar' : lang, arabicOnly).forEach(f => { if (idset.has(f.id)) results.push(f); });
    if (!arabicOnly) reflFeed('en', false).forEach(f => { if (idset.has(f.id)) results.push(f); });
    namesFeed(lang, arabicOnly).forEach(f => { if (idset.has(f.id)) results.push(f); });
  }

  // dedupe (id) + karıştır + limit
  const seen = new Set<string>();
  const unique = results.filter(r => (seen.has(r.id) ? false : (seen.add(r.id), true)));
  return shuffle(unique).slice(0, limit);
}

// ── Günün yansıması (onboarding aha-moment, first-verse.tsx) ──
// SADECE Daily Wisdom (reflections) — Quran ayeti ASLA. Dilde yoksa İngilizce.
export function getDailyReflection(lang: Lang, arabicOnly = false): FeedItem | null {
  const pick = (l: string): FeedItem | null => {
    const pool = reflFeed(l, arabicOnly);
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
  };
  return pick(arabicOnly ? 'ar' : lang) ?? pick('en');
}

// ── Tek içerik (id ile) — verse/hadith/dua/quote/reflection/name ──
export async function fetchItemById(
  id: string,
  lang: Lang = 'en',
): Promise<FeedItem | null> {
  const it = OFFLINE_CONTENT.find(x => x.id === id);
  if (it) {
    return {
      id: it.id, kind: it.kind, arabic: it.arabic,
      translation: it.t[lang as OfflineLang] ?? it.t.en ?? '',
      reference: it.ref, topics: it.topics,
    };
  }
  const refl = OFFLINE_REFLECTIONS.find(r => r.id === id);
  if (refl) {
    const isAr = refl.lang === 'ar';
    return {
      id: refl.id, kind: 'quote',
      arabic: isAr ? refl.text : '',
      translation: isAr ? '' : refl.text,
      reference: '', topics: ['Reflections'],
    };
  }
  const name = OFFLINE_NAMES.find(n => n.id === id);
  if (name) {
    const meaning = name.m[lang as OfflineLang] ?? name.m.en ?? '';
    return {
      id: name.id, kind: 'quote', arabic: name.arabic,
      translation: `${name.translit} — ${meaning}`.trim(),
      reference: `99 Names of Allah · #${name.number}`,
      topics: ['99 Names of Allah'],
    };
  }
  return null;
}

// ── Cache temizle — eski Supabase cache anahtarlarını siler (geriye dönük) ──
export async function clearContentCache() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const ours = keys.filter(k => k.startsWith('huda_cache_'));
    if (ours.length > 0) await AsyncStorage.multiRemove(ours);
  } catch { /* yoksay */ }
}
