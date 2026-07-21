/**
 * build-offline-content.mjs — LOKAL content/ klasöründen çok dilli GÖMÜLÜ içerik
 * üretir. Supabase'e bağlı DEĞİL (Supabase tamamen kaldırıldı 2026-06).
 *
 * Çıktı: data/offlineContent.ts
 *   • OFFLINE_CONTENT     → verse + hadith + quote + dua (arabic + t[lang], ref, topics)
 *   • OFFLINE_REFLECTIONS → General/Daily Wisdom feed (dil başına bağımsız, ar dahil)
 *   • OFFLINE_NAMES       → 99 Names of Allah (asmaul-husna)
 *
 * Çalıştır: node tools/build-offline-content.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const C = (p) => path.join(ROOT, 'content', p);

const LANGS = ['en', 'tr', 'fr', 'id', 'de', 'ur'];
const TR_MAXLEN = 400;   // çeviri uzunluk sınırı (feed okunabilirliği)
const AR_MAXLEN = 700;   // Arapça uzunluk sınırı

const readJSON = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const esc = (s) =>
  String(s ?? '').replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');

// translations/{lang}.json → { lang: { id: text } }
function transMap(dir, field = 'text') {
  const out = {};
  for (const lang of LANGS) {
    const fp = C(`${dir}/translations/${lang}.json`);
    if (!fs.existsSync(fp)) continue;
    const rows = readJSON(fp);
    const m = {};
    for (const r of rows) if (r && r.id != null) m[r.id] = r[field] ?? '';
    out[lang] = m;
  }
  return out;
}

function buildTField(id, maps) {
  const parts = [];
  for (const lang of LANGS) {
    const txt = maps[lang]?.[id];
    if (txt && txt.trim() && txt.length <= TR_MAXLEN) {
      parts.push(`${lang}: \`${esc(txt)}\``);
    }
  }
  return parts;
}

const items = [];
let nVerse = 0, nHadith = 0, nQuote = 0, nDua = 0;

// ── VERSES ───────────────────────────────────────────────────
{
  const base = readJSON(C('verses/base.json'));
  const tr = transMap('verses');
  for (const v of base) {
    if (v.displaySafe === false) continue;
    if (!v.arabic || v.arabic.length > AR_MAXLEN) continue;
    const t = buildTField(v.id, tr);
    if (t.length === 0) continue; // hiçbir dilde uygun çeviri yok
    const ref = `${v.surahName ?? 'Quran'} · Ayah ${v.ayah}`;
    items.push({ id: v.id, kind: 'verse', ref, topics: v.topics ?? [], arabic: v.arabic, t });
    nVerse++;
  }
}

// ── HADITHS ──────────────────────────────────────────────────
{
  const base = readJSON(C('hadiths/base.json'));
  const tr = transMap('hadiths');
  const OK_GRADE = new Set(['sahih', 'hasan', 'mixed_canonical']);
  for (const h of base) {
    if (h.displaySafe === false) continue;
    if (h.grade && !OK_GRADE.has(h.grade)) continue;
    if (!h.arabic || h.arabic.length > AR_MAXLEN) continue;
    const t = buildTField(h.id, tr);
    if (t.length === 0) continue;
    const ref = `${h.collectionName ?? 'Hadith'} ${h.reference ?? ''}`.trim();
    items.push({ id: h.id, kind: 'hadith', ref, topics: h.topics ?? [], arabic: h.arabic, t });
    nHadith++;
  }
}

// ── QUOTES (Arapça yok) ──────────────────────────────────────
{
  const base = readJSON(C('quotes/base.json'));
  const tr = transMap('quotes');
  for (const q of base) {
    const t = buildTField(q.id, tr);
    if (t.length === 0) continue;
    const ref = q.author ?? 'Islamic Quote';
    items.push({ id: q.id, kind: 'quote', ref, topics: q.topics ?? [], arabic: '', t });
    nQuote++;
  }
}

// ── DUAS (sadece en/id çeviri; uzunluk sınırı yok) ───────────
{
  const base = readJSON(C('duas/base.json'));
  const tr = transMap('duas');
  for (const d of base) {
    if (d.displaySafe === false) continue;
    const parts = [];
    for (const lang of ['en', 'id']) {
      const txt = tr[lang]?.[d.id];
      if (txt && txt.trim()) parts.push(`${lang}: \`${esc(txt)}\``);
    }
    if (parts.length === 0) continue;
    const ref = d.occasion ?? 'Dua';
    items.push({ id: d.id, kind: 'dua', ref, topics: [d.category ?? 'dua'], arabic: d.arabic ?? '', t: parts });
    nDua++;
  }
}

// ── REFLECTIONS (dil başına bağımsız, ar dahil) ──────────────
const reflections = [];
for (const lang of [...LANGS, 'ar']) {
  const fp = C(`reflections/${lang}.json`);
  if (!fs.existsSync(fp)) continue;
  for (const r of readJSON(fp)) {
    if (r && r.id != null && r.text && r.text.trim()) {
      reflections.push({ lang, id: r.id, text: r.text });
    }
  }
}

// ── 99 NAMES ─────────────────────────────────────────────────
const names = [];
{
  const base = readJSON(C('asmaul-husna/base.json'));
  const meaning = transMap('asmaul-husna', 'meaning');
  for (const n of base) {
    const m = [];
    for (const lang of LANGS) {
      const txt = meaning[lang]?.[n.id];
      if (txt && txt.trim()) m.push(`${lang}: \`${esc(txt)}\``);
    }
    names.push({ id: n.id, number: n.number, arabic: n.arabic, translit: n.transliteration ?? '', m });
  }
}

// ── EMIT ─────────────────────────────────────────────────────
const emitItem = (it) =>
  `  { id: ${JSON.stringify(it.id)}, kind: ${JSON.stringify(it.kind)}, ref: \`${esc(it.ref)}\`,\n` +
  `    topics: ${JSON.stringify(it.topics)}, arabic: \`${esc(it.arabic)}\`,\n` +
  `    t: { ${it.t.join(', ')} } },`;

const emitRefl = (r) =>
  `  { lang: ${JSON.stringify(r.lang)}, id: ${JSON.stringify(r.id)}, text: \`${esc(r.text)}\` },`;

const emitName = (n) =>
  `  { id: ${JSON.stringify(n.id)}, number: ${n.number}, arabic: \`${esc(n.arabic)}\`,\n` +
  `    translit: ${JSON.stringify(n.translit)}, m: { ${n.m.join(', ')} } },`;

// Büyük diziyi parçalara böl — tek dev literal TS2590 ("union too complex")
// veriyor. Her parça ayrı annotate'li const → küçük birleşim, sonra spread.
const CHUNK = 150;
function chunkArray(type, prefix, arr, emit) {
  const out = [];
  for (let i = 0; i * CHUNK < arr.length; i++) {
    const slice = arr.slice(i * CHUNK, (i + 1) * CHUNK);
    out.push(`const ${prefix}${i}: ${type}[] = [\n${slice.map(emit).join('\n')}\n];`);
  }
  return out.join('\n');
}
function chunkRefs(prefix, arr) {
  const n = Math.ceil(arr.length / CHUNK);
  return Array.from({ length: n }, (_, i) => `...${prefix}${i}`).join(', ');
}

const out = `/**
 * offlineContent — GÖMÜLÜ çok dilli içerik (content/ klasöründen üretildi).
 *
 * Supabase TAMAMEN kaldırıldı (2026-06). Tüm içerik app bundle'ında → 0 egress,
 * offline çalışır, anında açılır. İçeriği değiştirmek için content/'i güncelle +
 * \`node tools/build-offline-content.mjs\` çalıştır + app güncellemesi yayınla.
 *
 * EL İLE DÜZENLEME YOK — bu dosya generator çıktısıdır.
 */
export type OfflineLang = 'en' | 'tr' | 'fr' | 'id' | 'de' | 'ur';

// NOT: Açık opsiyonel alanlar — Partial<Record<...>> 1390 büyük literal üstünde
// TS2590 ("union type too complex") veriyordu. Düz alanlar ucuz tip kontrolü sağlar.
export interface OfflineTexts {
  en?: string; tr?: string; fr?: string; id?: string; de?: string; ur?: string;
}

export interface OfflineItem {
  id: string;
  kind: 'verse' | 'hadith' | 'quote' | 'dua';
  ref: string;
  topics: string[];
  arabic: string;
  t: OfflineTexts;
}

export interface OfflineReflection {
  lang: string; // 'en' | 'tr' | ... | 'ar'
  id: string;
  text: string;
}

export interface OfflineName {
  id: string;
  number: number;
  arabic: string;
  translit: string;
  m: OfflineTexts;
}

${chunkArray('OfflineItem', '_C', items, emitItem)}
export const OFFLINE_CONTENT: OfflineItem[] = [${chunkRefs('_C', items)}];

export const OFFLINE_REFLECTIONS: OfflineReflection[] = [
${reflections.map(emitRefl).join('\n')}
];

export const OFFLINE_NAMES: OfflineName[] = [
${names.map(emitName).join('\n')}
];
`;

fs.writeFileSync(path.join(ROOT, 'data', 'offlineContent.ts'), out, 'utf8');
console.log('✓ offlineContent.ts yazıldı');
console.log(`  verses=${nVerse} hadiths=${nHadith} quotes=${nQuote} duas=${nDua}`);
console.log(`  reflections=${reflections.length} names=${names.length}`);
console.log(`  toplam item=${items.length}`);
