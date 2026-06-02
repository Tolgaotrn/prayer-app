/**
 * contentDb — Offline-first içerik katmanı
 *
 * Strateji:
 *  1. AsyncStorage cache taze (<24h) → cache döner
 *  2. Cache yok/bayat → Supabase çeker → cache günceller
 *  3. Supabase erişilemez → eski cache (bayat bile olsa)
 *  4. Cache de yok → seed data (ilk açılışta garanti)
 *
 * İçerik kuralları:
 *  ÜCRETSİZ: General (tüm türlerden karma), Favorites
 *  PREMİUM: Quran Verses, Hadiths, Duas & Prayers, Islamic Quotes, 99 Names, diğerleri
 *
 *  General → verse(~15%) + hadith(~30%) + quote(~30%) + dua(~25%) karışımı, ~250 item
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { verses as seedVerses } from '../data/verses';

// ── Tipler ───────────────────────────────────────────────────
export type Lang = 'en' | 'tr' | 'fr' | 'id';

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

// UI topic label → Supabase topics[] tag
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

// Onboarding dil değerini → Lang'e çevir
export function resolveLang(stored: string | undefined): Lang {
  if (!stored) return 'en';
  if (stored === 'Turkish')    return 'tr';
  if (stored === 'French')     return 'fr';
  if (stored === 'Indonesian') return 'id';
  // 'English', 'Arabic' → English translation kullanır
  return 'en';
}

// ── Cache ─────────────────────────────────────────────────────
const TTL_MS = 24 * 60 * 60 * 1000;
const KEY    = (k: string) => `huda_cache_${k}`;

async function readCache<T>(k: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY(k));
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > TTL_MS) return null;
    return data as T;
  } catch { return null; }
}

async function writeCache<T>(k: string, data: T) {
  try { await AsyncStorage.setItem(KEY(k), JSON.stringify({ data, ts: Date.now() })); } catch {}
}

async function staleCache<T>(k: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY(k));
    return raw ? JSON.parse(raw).data as T : null;
  } catch { return null; }
}

// ── Feed ──────────────────────────────────────────────────────
export async function fetchFeedItems(
  lang: Lang = 'en',
  limit = 30,
  followedTopics: string[] = [],
  isPremium = false,
  savedIds: string[] = [],
  forceFresh = false,
): Promise<FeedItem[]> {
  // Premium olmayan kullanıcı sadece ücretsiz konulara erişebilir
  const effectiveTopics = isPremium
    ? followedTopics
    : followedTopics.filter(t => FREE_TOPICS.has(t));

  const cacheId = `feed_${lang}_${limit}_${isPremium}_${effectiveTopics.sort().join(',')}_${savedIds.slice(0,5).join(',')}`;

  // forceFresh: dil değişimi gibi durumlarda cache'i atla, doğrudan Supabase'den çek
  if (!forceFresh) {
    const cached = await readCache<FeedItem[]>(cacheId);
    if (cached) return cached;
  }

  // Sadece Favorites seçiliyse boş sonuç GEÇERLİDİR → seed'e düşme (rastgele ayet gösterme)
  const onlyFavorites = effectiveTopics.length === 1 && effectiveTopics[0] === 'Favorites';

  try {
    const { items, ok } = await buildFeed(lang, limit, effectiveTopics, savedIds);
    if (items.length > 0 || onlyFavorites) {
      // Sadece TÜM sorgular başarılıysa cache'le — kısmi/eksik feed'i kalıcılaştırma
      if (ok) await writeCache(cacheId, items);
      return items;
    }
  } catch {}

  const stale = await staleCache<FeedItem[]>(cacheId);
  if (stale) return stale;

  return seedVerses.map(v => ({
    id: v.id, kind: 'verse' as const,
    arabic: v.arabic, translation: v.translation,
    reference: `${v.surah} · Ayah ${v.ayah}`,
    topics: [v.category],
  }));
}

async function buildFeed(
  lang: Lang,
  limit: number,
  topics: string[],
  savedIds: string[],
): Promise<{ items: FeedItem[]; ok: boolean }> {
  // ok=false → en az bir sorgu hata döndü; çağıran kısmi sonucu CACHE'LEMEZ
  // (bozuk/eksik feed'in 24 saat servis edilmesini önler).
  let ok = true;
  const hasGeneral   = topics.includes('General') || topics.length === 0;
  const hasVerses    = topics.includes('Quran Verses');   // artık sadece premium
  const hasFavorites = topics.includes('Favorites') || hasGeneral;
  const hasDuas      = topics.includes('Duas & Prayers') || hasGeneral;
  const hasHadiths   = topics.includes('Hadiths')        || hasGeneral;
  const hasQuotes    = topics.includes('Islamic Quotes')  || hasGeneral;
  const has99Names   = topics.includes('99 Names of Allah');

  // Topic'lere karşılık gelen DB tag'leri (TOPIC_TAG_MAP'ten)
  const specificTopics = topics.filter(t => TOPIC_TAG_MAP[t]);
  const dbTags = specificTopics.map(t => TOPIC_TAG_MAP[t]);

  const promises: PromiseLike<void>[] = [];
  const results: FeedItem[] = [];

  // ── Verses — premium Quran Verses topic veya General'dan küçük sample ──
  if (hasVerses || hasGeneral) {
    const verseLimit = hasVerses ? 493 : 150; // General'da sadece ~30 verse
    const verseSlice = hasVerses ? Math.ceil(limit * 0.6) : Math.min(30, Math.ceil(limit * 0.15));
    promises.push(
      supabase
        .from('verses')
        .select('id, arabic, surah_name, ayah, topics, verse_translations!inner(text)')
        .eq('verse_translations.language', lang)
        .eq('display_safe', true)
        .limit(verseLimit)
        .then(({ data, error }) => {
          if (error) ok = false;
          shuffle(data ?? []).slice(0, verseSlice).forEach((v: any) => results.push({
            id: v.id, kind: 'verse',
            arabic: v.arabic,
            translation: v.verse_translations[0]?.text ?? '',
            reference: `${v.surah_name} · Ayah ${v.ayah}`,
            topics: v.topics ?? [],
          }));
        })
    );
  }

  // ── Hadiths ──
  if (hasHadiths) {
    const hadithSlice = hasGeneral ? Math.ceil(limit * 0.30) : Math.ceil(limit * 0.5);
    promises.push(
      supabase
        .from('hadiths')
        .select('id, arabic, collection_name, reference, topics, hadith_translations!inner(text)')
        .eq('hadith_translations.language', lang)
        .eq('display_safe', true)
        .in('grade', ['sahih', 'hasan', 'mixed_canonical'])
        .limit(367)
        .then(({ data, error }) => {
          if (error) ok = false;
          shuffle(data ?? []).slice(0, hadithSlice).forEach((h: any) => results.push({
            id: h.id, kind: 'hadith',
            arabic: h.arabic,
            translation: h.hadith_translations[0]?.text ?? '',
            reference: `${h.collection_name ?? 'Hadith'} ${h.reference ?? ''}`.trim(),
            topics: h.topics ?? [],
          }));
        })
    );
  }

  // ── Duas ──
  // TR/FR çevirisi yok → her zaman EN çek (EN + ID mevcut)
  if (hasDuas) {
    const duaLang = (lang === 'id') ? 'id' : 'en';
    promises.push(
      supabase
        .from('duas')
        .select('id, arabic, occasion, category, dua_translations!inner(text)')
        .eq('dua_translations.language', duaLang)
        .eq('display_safe', true)
        .limit(89)
        .then(({ data, error }) => {
          if (error) ok = false;
          shuffle(data ?? []).slice(0, Math.ceil(limit * 0.3)).forEach((d: any) => results.push({
            id: d.id, kind: 'dua',
            arabic: d.arabic,
            translation: d.dua_translations[0]?.text ?? '',
            reference: d.occasion ?? 'Dua',
            topics: [d.category ?? 'dua'],
          }));
        })
    );
  }

  // ── Quotes ──
  if (hasQuotes) {
    const quoteSlice = hasGeneral ? Math.ceil(limit * 0.30) : Math.ceil(limit * 0.3);
    promises.push(
      supabase
        .from('quotes')
        .select('id, author, topics, quote_translations!inner(text)')
        .eq('quote_translations.language', lang)
        .limit(300)
        .then(({ data, error }) => {
          if (error) ok = false;
          shuffle(data ?? []).slice(0, quoteSlice).forEach((q: any) => results.push({
            id: q.id, kind: 'quote',
            arabic: '',
            translation: q.quote_translations[0]?.text ?? '',
            reference: q.author ?? 'Islamic Quote',
            topics: q.topics ?? [],
          }));
        })
    );
  }

  // ── 99 Names of Allah ──
  if (has99Names) {
    promises.push(
      supabase
        .from('asmaul_husna')
        .select('id, number, arabic, transliteration, asmaul_husna_translations!inner(meaning, description)')
        .eq('asmaul_husna_translations.language', lang)
        .then(({ data, error }) => {
          if (error) ok = false;
          (data ?? []).forEach((n: any) => results.push({
            id: n.id,
            kind: 'quote',
            arabic: n.arabic,
            translation: `${n.transliteration} — ${n.asmaul_husna_translations[0]?.meaning ?? ''}`,
            reference: `99 Names of Allah · #${n.number}`,
            topics: ['99 Names of Allah'],
          }));
        })
    );
  }

  // ── Topic-specific: Patience, Gratitude, Hope, vb. ──
  if (dbTags.length > 0) {
    // Verses filtered by topic tag
    promises.push(
      supabase
        .from('verses')
        .select('id, arabic, surah_name, ayah, topics, verse_translations!inner(text)')
        .eq('verse_translations.language', lang)
        .eq('display_safe', true)
        .overlaps('topics', dbTags)
        .limit(200)
        .then(({ data, error }) => {
          if (error) ok = false;
          shuffle(data ?? []).slice(0, Math.ceil(limit * 0.6)).forEach((v: any) => {
            if (!results.find(r => r.id === v.id)) results.push({
              id: v.id, kind: 'verse',
              arabic: v.arabic,
              translation: v.verse_translations[0]?.text ?? '',
              reference: `${v.surah_name} · Ayah ${v.ayah}`,
              topics: v.topics ?? [],
            });
          });
        })
    );

    // Hadiths filtered by topic tag
    promises.push(
      supabase
        .from('hadiths')
        .select('id, arabic, collection_name, reference, topics, hadith_translations!inner(text)')
        .eq('hadith_translations.language', lang)
        .eq('display_safe', true)
        .in('grade', ['sahih', 'hasan', 'mixed_canonical'])
        .overlaps('topics', dbTags)
        .limit(200)
        .then(({ data, error }) => {
          if (error) ok = false;
          shuffle(data ?? []).slice(0, Math.ceil(limit * 0.4)).forEach((h: any) => {
            if (!results.find(r => r.id === h.id)) results.push({
              id: h.id, kind: 'hadith',
              arabic: h.arabic,
              translation: h.hadith_translations[0]?.text ?? '',
              reference: `${h.collection_name ?? 'Hadith'} ${h.reference ?? ''}`.trim(),
              topics: h.topics ?? [],
            });
          });
        })
    );

    // Dhikr topic için duas'ı da dahil et
    if (dbTags.includes('dhikr')) {
      const duaLang = lang === 'id' ? 'id' : 'en';
      promises.push(
        supabase
          .from('duas')
          .select('id, arabic, occasion, category, dua_translations!inner(text)')
          .eq('dua_translations.language', duaLang)
          .eq('display_safe', true)
          .in('category', ['morning-dhikr', 'evening-dhikr', 'dhikr-after-salah'])
          .limit(89)
          .then(({ data, error }) => {
          if (error) ok = false;
            shuffle(data ?? []).slice(0, Math.ceil(limit * 0.3)).forEach((d: any) => {
              if (!results.find(r => r.id === d.id)) results.push({
                id: d.id, kind: 'dua',
                arabic: d.arabic,
                translation: d.dua_translations[0]?.text ?? '',
                reference: d.occasion ?? 'Dhikr',
                topics: ['dhikr'],
              });
            });
          })
      );
    }
  }

  // ── Favorites — kaydedilen içerik HER TÜRDEN olabilir (verse/hadith/dua/quote) ──
  // Bu yüzden tüm tablolarda ID ile ara. ID'ler UUID, her ID tek bir tabloya ait.
  if (savedIds.length > 0 && hasFavorites) {
    const ids = savedIds.slice(0, 200);
    const dl = (lang === 'id') ? 'id' : 'en'; // duas TR/FR yok

    promises.push(
      supabase
        .from('verses')
        .select('id, arabic, surah_name, ayah, topics, verse_translations!inner(text)')
        .eq('verse_translations.language', lang)
        .in('id', ids)
        .then(({ data, error }) => {
          if (error) ok = false;
          (data ?? []).forEach((v: any) => {
            if (!results.find(r => r.id === v.id)) results.push({
              id: v.id, kind: 'verse', arabic: v.arabic,
              translation: v.verse_translations[0]?.text ?? '',
              reference: `${v.surah_name} · Ayah ${v.ayah}`,
              topics: v.topics ?? [],
            });
          });
        })
    );

    promises.push(
      supabase
        .from('hadiths')
        .select('id, arabic, collection_name, reference, topics, hadith_translations!inner(text)')
        .eq('hadith_translations.language', lang)
        .in('id', ids)
        .then(({ data, error }) => {
          if (error) ok = false;
          (data ?? []).forEach((h: any) => {
            if (!results.find(r => r.id === h.id)) results.push({
              id: h.id, kind: 'hadith', arabic: h.arabic,
              translation: h.hadith_translations[0]?.text ?? '',
              reference: `${h.collection_name ?? 'Hadith'} ${h.reference ?? ''}`.trim(),
              topics: h.topics ?? [],
            });
          });
        })
    );

    promises.push(
      supabase
        .from('duas')
        .select('id, arabic, occasion, category, dua_translations!inner(text)')
        .eq('dua_translations.language', dl)
        .in('id', ids)
        .then(({ data, error }) => {
          if (error) ok = false;
          (data ?? []).forEach((d: any) => {
            if (!results.find(r => r.id === d.id)) results.push({
              id: d.id, kind: 'dua', arabic: d.arabic,
              translation: d.dua_translations[0]?.text ?? '',
              reference: d.occasion ?? 'Dua',
              topics: [d.category ?? 'dua'],
            });
          });
        })
    );

    promises.push(
      supabase
        .from('quotes')
        .select('id, author, topics, quote_translations!inner(text)')
        .eq('quote_translations.language', lang)
        .in('id', ids)
        .then(({ data, error }) => {
          if (error) ok = false;
          (data ?? []).forEach((q: any) => {
            if (!results.find(r => r.id === q.id)) results.push({
              id: q.id, kind: 'quote', arabic: '',
              translation: q.quote_translations[0]?.text ?? '',
              reference: q.author ?? 'Islamic Quote',
              topics: q.topics ?? [],
            });
          });
        })
    );
  }

  await Promise.all(promises);

  // Karıştır ve limit uygula
  return { items: shuffle(results).slice(0, limit), ok };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Günün ayeti ───────────────────────────────────────────────
export async function fetchDailyVerse(lang: Lang = 'en'): Promise<FeedItem | null> {
  const today = new Date().toISOString().slice(0, 10);
  const key   = `daily_${lang}_${today}`;

  const cached = await readCache<FeedItem>(key);
  if (cached) return cached;

  try {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
    );
    const offset = dayOfYear % 500;

    const { data, error } = await supabase
      .from('verses')
      .select('id, arabic, surah_name, ayah, verse_translations!inner(text)')
      .eq('verse_translations.language', lang)
      .eq('display_safe', true)
      .order('popularity', { ascending: false })
      .range(offset, offset)
      .single();

    if (error || !data) return null;
    const d = data as any;
    const item: FeedItem = {
      id: d.id, kind: 'verse',
      arabic: d.arabic,
      translation: d.verse_translations[0]?.text ?? '',
      reference: `${d.surah_name} · Ayah ${d.ayah}`,
      topics: [],
    };
    await writeCache(key, item);
    return item;
  } catch { return null; }
}

// ── Temalar ───────────────────────────────────────────────────
export async function fetchThemes(): Promise<ThemeItem[]> {
  const key = 'themes_v1';
  const cached = await readCache<ThemeItem[]>(key);
  if (cached) return cached;

  try {
    const { data, error } = await supabase
      .from('themes')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    if (error) throw error;
    const items = (data ?? []) as ThemeItem[];
    await writeCache(key, items);
    return items;
  } catch {
    return (await staleCache<ThemeItem[]>(key)) ?? [];
  }
}

// ── Cache temizle ─────────────────────────────────────────────
export async function clearContentCache() {
  const keys = await AsyncStorage.getAllKeys();
  const ours = keys.filter(k => k.startsWith('huda_cache_'));
  if (ours.length > 0) await AsyncStorage.multiRemove(ours);
}
