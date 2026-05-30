import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const API_VERSION = '1';
const CDN_BASE = `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@${API_VERSION}`;

const COLLECTIONS = {
  nawawi: {
    id: 'nawawi',
    name: "Forty Hadith of an-Nawawi",
    grade: 'mixed_canonical',
    sourcePriority: 1,
  },
  bukhari: {
    id: 'bukhari',
    name: 'Sahih al-Bukhari',
    grade: 'sahih',
    sourcePriority: 2,
  },
  muslim: {
    id: 'muslim',
    name: 'Sahih Muslim',
    grade: 'sahih',
    sourcePriority: 3,
  },
  abudawud: {
    id: 'abudawud',
    name: 'Sunan Abu Dawud',
    grade: 'hasan',
    sourcePriority: 4,
  },
  tirmidhi: {
    id: 'tirmidhi',
    name: "Jami' at-Tirmidhi",
    grade: 'hasan',
    sourcePriority: 5,
  },
  ibnmajah: {
    id: 'ibnmajah',
    name: 'Sunan Ibn Majah',
    grade: 'hasan',
    sourcePriority: 6,
  },
  malik: {
    id: 'malik',
    name: 'Muwatta Malik',
    grade: 'sahih',
    sourcePriority: 7,
  },
};

const LANGUAGE_PREFIX = {
  ar: 'ara',
  en: 'eng',
  tr: 'tur',
  fr: 'fra',
  id: 'ind',
  ur: 'urd',
  ru: 'rus',
  bn: 'ben',
};

const DEFAULT_COLLECTIONS = ['nawawi', 'bukhari', 'muslim', 'abudawud', 'tirmidhi', 'ibnmajah', 'malik'];
const DEFAULT_LANGUAGES = ['ar', 'en', 'tr', 'fr', 'id'];
const OUTPUT_DIR = path.join(rootDir, 'content', 'hadiths');

// ── Okunabilirlik eşikleri (supabase-import.mjs ile AYNI olmalı) ──
// Feed kartına sığması için: Arapça ≤ MAX_ARABIC, HER DİLDEKİ çeviri ≤ MAX_TEXT.
const MAX_ARABIC = 500;
const MAX_TEXT   = 300;

/**
 * Sadece okunabilir hadisleri tut: Arapçası kısa VE mevcut tüm dil
 * çevirileri kısa olanlar. Herhangi bir dilde uzun çeviri varsa elenir.
 */
function filterReadable(base, translations) {
  const maxTextLen = new Map();
  for (const rows of translations.values()) {
    for (const t of rows) {
      const cur = maxTextLen.get(t.id) ?? 0;
      const len = (t.text || '').length;
      if (len > cur) maxTextLen.set(t.id, len);
    }
  }
  return base.filter(r =>
    (r.arabic || '').length <= MAX_ARABIC &&
    (maxTextLen.get(r.id) ?? 0) <= MAX_TEXT
  );
}

function parseArgs(argv) {
  const args = {
    collections: DEFAULT_COLLECTIONS,
    languages: DEFAULT_LANGUAGES,
    limit: 500,
    perCollection: 0,
    outDir: OUTPUT_DIR,
    localRiyad: '',
  };

  for (const arg of argv) {
    const [key, value = ''] = arg.split('=');
    if (key === '--collections') args.collections = value.split(',').map((v) => v.trim()).filter(Boolean);
    if (key === '--languages') args.languages = value.split(',').map((v) => v.trim()).filter(Boolean);
    if (key === '--limit') args.limit = Number.parseInt(value, 10);
    if (key === '--per-collection') args.perCollection = Number.parseInt(value, 10);
    if (key === '--out') args.outDir = path.resolve(rootDir, value);
    if (key === '--local-riyad') args.localRiyad = path.resolve(rootDir, value);
  }

  return args;
}

async function fetchJson(url, { optional = false } = {}) {
  const response = await fetch(url);
  if (!response.ok) {
    if (optional && (response.status === 403 || response.status === 404)) return null;
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function editionUrl(language, collection) {
  const prefix = LANGUAGE_PREFIX[language];
  if (!prefix) throw new Error(`Unsupported language "${language}". Add it to LANGUAGE_PREFIX first.`);
  return `${CDN_BASE}/editions/${prefix}-${collection}.min.json`;
}

function getHadithRows(payload) {
  if (Array.isArray(payload?.hadiths)) return payload.hadiths;
  if (Array.isArray(payload?.hadith)) return payload.hadith;
  if (Array.isArray(payload)) return payload;
  throw new Error('Unknown hadith payload shape');
}

function getText(row) {
  return (
    row.text ??
    row.hadith ??
    row.hadithText ??
    row.hadith_english ??
    row.arabic ??
    ''
  ).trim();
}

function getNumber(row, fallbackIndex) {
  return String(
    row.hadithnumber ??
    row.hadithNumber ??
    row.number ??
    row.id ??
    fallbackIndex + 1
  );
}

function makeNumberMap(rows) {
  const map = new Map();
  rows.forEach((row, index) => {
    map.set(getNumber(row, index), row);
  });
  return map;
}

function referenceSortValue(reference) {
  const numeric = Number.parseInt(String(reference).match(/\d+/)?.[0] ?? '', 10);
  return Number.isFinite(numeric) ? numeric : Number.MAX_SAFE_INTEGER;
}

function sortRecords(records) {
  return [...records].sort((a, b) => (
    a.sourcePriority - b.sourcePriority ||
    referenceSortValue(a.reference) - referenceSortValue(b.reference) ||
    a.id.localeCompare(b.id)
  ));
}

function normalizeSection(row) {
  if (!row.reference && !row.book && !row.chapter && !row.section) return undefined;
  return {
    book: row.book ?? row.reference?.book ?? undefined,
    chapter: row.chapter ?? row.reference?.chapter ?? undefined,
    section: row.section ?? undefined,
  };
}

function makeId(collection, number) {
  return `${collection}_${String(number).replace(/[^0-9a-zA-Z_-]/g, '_')}`;
}

async function loadCollection(collection, languages) {
  const collectionMeta = COLLECTIONS[collection];
  if (!collectionMeta) throw new Error(`Unknown collection "${collection}"`);

  const byLanguage = new Map();
  for (const language of languages) {
    const url = editionUrl(language, collection);
    const payload = await fetchJson(url, { optional: language !== 'ar' });
    if (!payload) {
      console.warn(`Skipping missing edition: ${LANGUAGE_PREFIX[language]}-${collection}`);
      continue;
    }
    byLanguage.set(language, getHadithRows(payload));
  }

  const arabicRows = byLanguage.get('ar');
  if (!arabicRows) throw new Error('Arabic must be included so base hadith records have a source text.');
  const rowMaps = new Map([...byLanguage.entries()].map(([language, rows]) => [language, makeNumberMap(rows)]));

  const base = [];
  const translations = new Map(languages.filter((l) => l !== 'ar').map((l) => [l, []]));

  arabicRows.forEach((arabicRow, index) => {
    const number = getNumber(arabicRow, index);
    const id = makeId(collection, number);
    const arabic = getText(arabicRow);

    if (!arabic) return;

    base.push({
      id,
      collection,
      collectionName: collectionMeta.name,
      reference: number,
      source: collectionMeta.name,
      grade: collectionMeta.grade,
      arabic,
      narrator: arabicRow.narrator ?? undefined,
      section: normalizeSection(arabicRow),
      topics: [],
      length: arabic.length < 280 ? 'short' : arabic.length < 900 ? 'medium' : 'long',
      displaySafe: true,
      needsContext: false,
      sourcePriority: collectionMeta.sourcePriority,
    });

    for (const language of translations.keys()) {
      const row = rowMaps.get(language)?.get(number);
      const text = row ? getText(row) : '';
      if (!text) continue;
      translations.get(language).push({
        id,
        language,
        text,
        verified: false,
        translationSource: `fawazahmed0/hadith-api ${API_VERSION} ${LANGUAGE_PREFIX[language]}-${collection}`,
      });
    }
  });

  return { base, translations };
}

async function loadLocalRiyad(filePath, languages) {
  if (!filePath) return { base: [], translations: new Map() };

  const raw = await readFile(filePath, 'utf8');
  const rows = JSON.parse(raw);
  if (!Array.isArray(rows)) throw new Error('--local-riyad must point to a JSON array');

  const translations = new Map(languages.filter((l) => l !== 'ar').map((l) => [l, []]));
  const base = rows.map((row, index) => {
    const reference = String(row.reference ?? row.number ?? index + 1);
    const id = row.id ?? makeId('riyad_saliheen', reference);

    for (const language of translations.keys()) {
      const text = row.translations?.[language] ?? row[language] ?? '';
      if (text) {
        translations.get(language).push({
          id,
          language,
          text,
          verified: Boolean(row.verified),
          translationSource: row.translationSource ?? 'local-riyad',
        });
      }
    }

    return {
      id,
      collection: 'riyad_saliheen',
      collectionName: 'Riyad as-Salihin',
      reference,
      source: 'Riyad as-Salihin',
      grade: row.grade ?? 'mixed_canonical',
      arabic: row.arabic,
      narrator: row.narrator,
      section: row.section,
      topics: row.topics ?? [],
      length: row.arabic.length < 280 ? 'short' : row.arabic.length < 900 ? 'medium' : 'long',
      displaySafe: row.displaySafe ?? true,
      needsContext: row.needsContext ?? false,
      sourcePriority: 4,
    };
  });

  return { base, translations };
}

function mergeTranslations(target, incoming) {
  for (const [language, rows] of incoming.entries()) {
    if (!target.has(language)) target.set(language, []);
    target.get(language).push(...rows);
  }
}

function selectPerCollection(records, perCollection) {
  if (!Number.isFinite(perCollection) || perCollection <= 0) return null;
  const groups = new Map();

  for (const row of sortRecords(records)) {
    if (!groups.has(row.collection)) groups.set(row.collection, []);
    const rows = groups.get(row.collection);
    if (rows.length < perCollection) rows.push(row);
  }

  return sortRecords([...groups.values()].flat());
}

function selectBalanced(records, limit) {
  const sorted = sortRecords(records);
  if (!Number.isFinite(limit) || limit <= 0 || sorted.length <= limit) return sorted;

  const core = sorted.filter((row) => row.collection === 'nawawi');
  const remainingLimit = Math.max(limit - core.length, 0);
  const remaining = sorted.filter((row) => row.collection !== 'nawawi');
  const groups = new Map();

  for (const row of remaining) {
    if (!groups.has(row.collection)) groups.set(row.collection, []);
    groups.get(row.collection).push(row);
  }

  const groupEntries = [...groups.entries()].sort((a, b) => (
    (a[1][0]?.sourcePriority ?? 99) - (b[1][0]?.sourcePriority ?? 99)
  ));
  const perGroup = Math.floor(remainingLimit / groupEntries.length);
  let extra = remainingLimit % groupEntries.length;
  const selected = [...core];

  for (const [, rows] of groupEntries) {
    const take = perGroup + (extra > 0 ? 1 : 0);
    extra -= extra > 0 ? 1 : 0;
    selected.push(...sortRecords(rows).slice(0, take));
  }

  return sortRecords(selected).slice(0, limit);
}

async function writeJson(filePath, data) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.languages.includes('ar')) args.languages.unshift('ar');

  const base = [];
  const translations = new Map(args.languages.filter((l) => l !== 'ar').map((l) => [l, []]));

  for (const collection of args.collections) {
    const result = await loadCollection(collection, args.languages);
    base.push(...result.base);
    mergeTranslations(translations, result.translations);
  }

  const riyad = await loadLocalRiyad(args.localRiyad, args.languages);
  base.push(...riyad.base);
  mergeTranslations(translations, riyad.translations);

  // Okunabilirlik filtresi SEÇİMDEN ÖNCE → 500 dengeli hadis hepsi okunabilir olur
  const readableBase = filterReadable(base, translations);
  console.log(`Readability filter: ${base.length} → ${readableBase.length} okunabilir (Arapça≤${MAX_ARABIC}, çeviri≤${MAX_TEXT})`);

  const selected = selectPerCollection(readableBase, args.perCollection) ?? selectBalanced(readableBase, args.limit);
  const selectedIds = new Set(selected.map((row) => row.id));

  await writeJson(path.join(args.outDir, 'base.json'), selected);
  for (const [language, rows] of translations.entries()) {
    await writeJson(
      path.join(args.outDir, 'translations', `${language}.json`),
      rows.filter((row) => selectedIds.has(row.id)),
    );
  }

  await writeJson(path.join(args.outDir, 'manifest.json'), {
    generatedAt: new Date().toISOString(),
    source: 'fawazahmed0/hadith-api via jsDelivr CDN',
    apiVersion: API_VERSION,
    collections: args.collections,
    languages: args.languages,
    count: selected.length,
    note: 'Translations are imported as source text and should be reviewed before marking verified=true.',
  });

  console.log(`Imported ${selected.length} hadith records into ${path.relative(rootDir, args.outDir)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
