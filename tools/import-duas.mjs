import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const SOURCE_BASE = 'https://raw.githubusercontent.com/fitrahive/dua-dhikr/main/data/dua-dhikr';
const CATEGORIES = ['daily-dua', 'morning-dhikr', 'evening-dhikr', 'dhikr-after-salah', 'selected-dua'];
const SOURCE_LANGUAGES = ['en', 'id'];
const OUTPUT_DIR = path.join(rootDir, 'content', 'duas');

function parseArgs(argv) {
  const args = { limit: 1000, outDir: OUTPUT_DIR };
  for (const arg of argv) {
    const [key, value = ''] = arg.split('=');
    if (key === '--limit') args.limit = Number.parseInt(value, 10);
    if (key === '--out') args.outDir = path.resolve(rootDir, value);
  }
  return args;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  return response.json();
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function makeId(category, index, row) {
  return `dua_${category}_${index + 1}_${slugify(row.title ?? 'item')}`.slice(0, 96);
}

function scoreDua(category, row) {
  let score = 0;
  if (category === 'daily-dua') score += 120;
  if (category === 'morning-dhikr' || category === 'evening-dhikr') score += 100;
  if (category === 'dhikr-after-salah') score += 90;
  if (category === 'selected-dua') score += 80;
  if (row.source) score += 40;
  if (row.arabic?.length >= 8 && row.arabic?.length <= 220) score += 30;
  if (row.translation?.length >= 15 && row.translation?.length <= 260) score += 20;
  if (row.notes) score += 5;
  return score;
}

async function loadCategory(category) {
  const byLanguage = new Map();
  for (const language of SOURCE_LANGUAGES) {
    byLanguage.set(language, await fetchJson(`${SOURCE_BASE}/${category}/${language}.json`));
  }

  const englishRows = byLanguage.get('en');
  const base = [];
  const translations = new Map(SOURCE_LANGUAGES.map((language) => [language, []]));

  englishRows.forEach((row, index) => {
    const id = makeId(category, index, row);
    base.push({
      id,
      arabic: row.arabic,
      transliteration: row.latin ?? '',
      occasion: row.title,
      category,
      source: row.source ?? '',
      notes: row.notes ?? null,
      benefits: row.benefits ?? null,
      popularityScore: scoreDua(category, row),
      displaySafe: true,
      needsContext: false,
    });

    for (const language of SOURCE_LANGUAGES) {
      const localized = byLanguage.get(language)?.[index];
      if (!localized?.translation) continue;
      translations.get(language).push({
        id,
        language,
        text: localized.translation,
        title: localized.title ?? row.title,
        notes: localized.notes ?? null,
        benefits: localized.benefits ?? null,
        verified: false,
        translationSource: `fitrahive/dua-dhikr ${language}`,
      });
    }
  });

  return { base, translations };
}

function mergeTranslations(target, incoming) {
  for (const [language, rows] of incoming.entries()) {
    if (!target.has(language)) target.set(language, []);
    target.get(language).push(...rows);
  }
}

async function writeJson(filePath, data) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const base = [];
  const translations = new Map(SOURCE_LANGUAGES.map((language) => [language, []]));

  for (const category of CATEGORIES) {
    const result = await loadCategory(category);
    base.push(...result.base);
    mergeTranslations(translations, result.translations);
  }

  const selected = base
    .sort((a, b) => b.popularityScore - a.popularityScore || a.id.localeCompare(b.id))
    .slice(0, args.limit)
    .sort((a, b) => a.category.localeCompare(b.category) || a.id.localeCompare(b.id));
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
    source: 'fitrahive/dua-dhikr',
    license: 'MIT',
    requestedLimit: args.limit,
    count: selected.length,
    languages: SOURCE_LANGUAGES,
    note: 'The source currently provides English and Indonesian JSON files. Add reviewed TR/FR translations later instead of machine-filling religious text.',
  });

  console.log(`Imported ${selected.length} dua records into ${path.relative(rootDir, args.outDir)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
