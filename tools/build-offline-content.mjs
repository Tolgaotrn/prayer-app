/**
 * build-offline-content.mjs — Supabase'ten ÇOK DİLLİ çevrimdışı içerik üretir.
 *
 * Her öğe: en/tr/fr/id çevirisi (hepsi zorunlu) + Arapça (verse/hadith için).
 * Konu etiketleri (topics[]) dahil → offline konu filtreleme çalışır.
 * EL İLE ÇEVİRİ YOK — tümü DB kaynaklı.
 *
 * Çalıştır: node tools/build-offline-content.mjs
 */
import fs from 'fs';

const BASE = 'https://hvxrsscrsqdbfewpmfhl.supabase.co';
const KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2eHJzc2Nyc3FkYmZld3BtZmhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNTI2NTksImV4cCI6MjA5NTcyODY1OX0.qBtfyL9mpzwLVHgq_Unvm99Q63T_IVloSHTte-xlArw';
const h = { apikey: KEY, Authorization: 'Bearer ' + KEY };
const need = ['en', 'tr', 'fr', 'id'];

// Hedef sayılar (mevcut veriyle sınırlı)
const TARGET = { verse: 140, hadith: 80, quote: 80 };
const MAXLEN = 300;

const esc = (s) =>
  String(s).replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');

function emit(it) {
  return (
    `  { id: ${JSON.stringify(it.id)}, kind: ${JSON.stringify(it.kind)}, ref: ${JSON.stringify(it.ref)},\n` +
    `    topics: ${JSON.stringify(it.topics || [])},\n` +
    `    arabic: \`${esc(it.arabic || '')}\`,\n` +
    `    t: { en: \`${esc(it.t.en)}\`, tr: \`${esc(it.t.tr)}\`, fr: \`${esc(it.t.fr)}\`, id: \`${esc(it.t.id)}\` } },`
  );
}

async function getAll(path) {
  const res = await fetch(`${BASE}/rest/v1/${path}`, { headers: h });
  return res.json();
}

async function main() {
  const items = [];

  // VERSES (Arapça dahil)
  const vr = await getAll(
    'verses?select=id,surah_name,ayah,arabic,topics,popularity,verse_translations(language,text)&display_safe=eq.true&order=popularity.desc&limit=400',
  );
  let vc = 0;
  for (const row of vr) {
    const m = {};
    (row.verse_translations || []).forEach((t) => (m[t.language] = t.text));
    if (row.arabic && need.every((l) => m[l] && m[l].length <= MAXLEN)) {
      items.push({ id: row.id, kind: 'verse', ref: `${row.surah_name} ${row.ayah}`, arabic: row.arabic, topics: row.topics || [], t: { en: m.en, tr: m.tr, fr: m.fr, id: m.id } });
      if (++vc >= TARGET.verse) break;
    }
  }

  // HADITHS (Arapça dahil)
  const hr = await getAll(
    'hadiths?select=id,collection_name,reference,arabic,topics,grade,hadith_translations(language,text)&display_safe=eq.true&grade=in.(sahih,hasan)&limit=500',
  );
  let hc = 0;
  for (const row of hr) {
    const m = {};
    (row.hadith_translations || []).forEach((t) => (m[t.language] = t.text));
    if (row.arabic && need.every((l) => m[l] && m[l].length <= MAXLEN + 120)) {
      items.push({ id: row.id, kind: 'hadith', ref: `${row.collection_name || 'Hadith'} ${row.reference || ''}`.trim(), arabic: row.arabic, topics: row.topics || [], t: { en: m.en, tr: m.tr, fr: m.fr, id: m.id } });
      if (++hc >= TARGET.hadith) break;
    }
  }

  // QUOTES (Arapça YOK — sadece en/tr/fr/id; Arapça modda otomatik dışlanır)
  const qr = await getAll(
    'quotes?select=id,author,topics,popularity,quote_translations(language,text)&order=popularity.desc&limit=400',
  );
  let qc = 0;
  for (const row of qr) {
    const m = {};
    (row.quote_translations || []).forEach((t) => (m[t.language] = t.text));
    if (need.every((l) => m[l] && m[l].length <= MAXLEN)) {
      items.push({ id: row.id, kind: 'quote', ref: row.author || 'Islamic Quote', arabic: '', topics: row.topics || [], t: { en: m.en, tr: m.tr, fr: m.fr, id: m.id } });
      if (++qc >= TARGET.quote) break;
    }
  }

  const header = `/**
 * offlineContent — ÇOK DİLLİ çevrimdışı varsayılan içerik (DB'den üretildi).
 *
 * İnternet + cache yokken feed ve bildirimler kullanıcının SEÇTİĞİ dilde çalışsın diye.
 * 5 dil: en/tr/fr/id → t[lang]; Arapça → arabic alanı (verse/hadith'te var, quote'ta yok).
 * topics[] → offline konu filtreleme. EL İLE ÇEVİRİ YOK — node tools/build-offline-content.mjs.
 */
export type OfflineLang = 'en' | 'tr' | 'fr' | 'id';

export interface OfflineItem {
  id: string;
  kind: 'verse' | 'hadith' | 'quote';
  ref: string;
  topics: string[];
  arabic: string;
  t: Record<OfflineLang, string>;
}

export const OFFLINE_CONTENT: OfflineItem[] = [
`;
  fs.writeFileSync('data/offlineContent.ts', header + items.map(emit).join('\n') + '\n];\n');

  // ── Rapor ──
  const byKind = { verse: vc, hadith: hc, quote: qc };
  console.log('TOPLAM offline öğe:', items.length, byKind);
  // Konu histogramı
  const topicHist = {};
  for (const it of items) for (const tag of it.topics) topicHist[tag] = (topicHist[tag] || 0) + 1;
  console.log('OFFLINE_REPORT_JSON', JSON.stringify({ total: items.length, byKind, topicHist }));
}

main();
