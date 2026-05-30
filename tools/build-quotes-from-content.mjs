import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(rootDir, 'content', 'quotes');

const LANGUAGES = ['en', 'tr', 'fr', 'id'];

function parseArgs(argv) {
  const args = { limit: 1000, outDir: OUTPUT_DIR };
  for (const arg of argv) {
    const [key, value = ''] = arg.split('=');
    if (key === '--limit') args.limit = Number.parseInt(value, 10);
    if (key === '--out') args.outDir = path.resolve(rootDir, value);
  }
  return args;
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

function cleanText(text) {
  return String(text ?? '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isQuoteLength(text) {
  return text.length >= 24 && text.length <= 220;
}

function authorForVerse(row) {
  return `The Quran ${row.key}`;
}

function authorForHadith(row) {
  return row.source && row.reference ? `${row.source} ${row.reference}` : row.source || row.collectionName;
}

function scoreText(text, baseScore = 0) {
  let score = baseScore;
  if (text.length <= 120) score += 60;
  if (text.length <= 170) score += 30;
  if (/mercy|forgiv|hope|patien|grateful|prayer|trust|heart|Allah|good|kind/i.test(text)) score += 50;
  if (text.length > 200) score -= 30;
  return score;
}

function getTranslationMap(rows) {
  return new Map(rows.map((row) => [row.id, row]));
}

async function loadVerseQuotes(limit) {
  const base = await readJson(path.join(rootDir, 'content', 'verses', 'base.json'));
  const translations = new Map();
  for (const language of LANGUAGES) {
    translations.set(language, getTranslationMap(await readJson(path.join(rootDir, 'content', 'verses', 'translations', `${language}.json`))));
  }

  return base
    .map((row) => {
      const english = cleanText(translations.get('en')?.get(row.id)?.text);
      return {
        id: `quote_${row.id}`,
        sourceType: 'quran',
        sourceId: row.id,
        author: authorForVerse(row),
        text: english,
        topics: row.topics ?? [],
        popularityScore: scoreText(english, row.popularityScore ?? 0),
        translations: Object.fromEntries(LANGUAGES.map((language) => [
          language,
          cleanText(translations.get(language)?.get(row.id)?.text),
        ])),
      };
    })
    .filter((row) => isQuoteLength(row.text))
    .sort((a, b) => b.popularityScore - a.popularityScore)
    .slice(0, limit);
}

async function loadHadithQuotes(limit) {
  const base = await readJson(path.join(rootDir, 'content', 'hadiths', 'base.json'));
  const translations = new Map();
  for (const language of LANGUAGES) {
    translations.set(language, getTranslationMap(await readJson(path.join(rootDir, 'content', 'hadiths', 'translations', `${language}.json`))));
  }

  return base
    .map((row) => {
      const english = cleanText(translations.get('en')?.get(row.id)?.text);
      return {
        id: `quote_${row.id}`,
        sourceType: 'hadith',
        sourceId: row.id,
        author: authorForHadith(row),
        text: english,
        topics: row.topics ?? [],
        popularityScore: scoreText(english, row.collection === 'nawawi' ? 400 : 100),
        translations: Object.fromEntries(LANGUAGES.map((language) => [
          language,
          cleanText(translations.get(language)?.get(row.id)?.text),
        ])),
      };
    })
    .filter((row) => isQuoteLength(row.text))
    .sort((a, b) => b.popularityScore - a.popularityScore)
    .slice(0, limit);
}

async function writeJson(filePath, data) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const verseTarget = Math.ceil(args.limit * 0.65);
  const hadithTarget = args.limit - verseTarget;
  const quotes = [
    ...(await loadVerseQuotes(verseTarget)),
    ...(await loadHadithQuotes(hadithTarget)),
  ]
    .sort((a, b) => b.popularityScore - a.popularityScore)
    .slice(0, args.limit);

  const base = quotes.map(({ translations, ...row }) => row);
  await writeJson(path.join(args.outDir, 'base.json'), base);

  for (const language of LANGUAGES) {
    await writeJson(path.join(args.outDir, 'translations', `${language}.json`), quotes
      .filter((row) => row.translations[language])
      .map((row) => ({
        id: row.id,
        language,
        text: row.translations[language],
        author: row.author,
        verified: false,
        translationSource: row.sourceType === 'quran' ? 'content/verses' : 'content/hadiths',
      })));
  }

  await writeJson(path.join(args.outDir, 'manifest.json'), {
    generatedAt: new Date().toISOString(),
    source: 'Derived quote cards from imported Quran verses and hadith collections.',
    requestedLimit: args.limit,
    count: base.length,
    note: 'This avoids unsourced internet quote scraping. The author field stays compatible with data/quotes.ts.',
  });

  console.log(`Built ${base.length} quote records into ${path.relative(rootDir, args.outDir)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
