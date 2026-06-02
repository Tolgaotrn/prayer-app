/**
 * import-riyadussalihin.mjs
 * Riyad as-Salihin'i fawazahmed0/hadith-api CDN'den çeker,
 * ilgili chapter'lara göre topic tag'ler atar,
 * mevcut content/hadiths/ dosyalarına merge eder.
 *
 * Çalıştır: node tools/import-riyadussalihin.mjs
 * Ardından: npm run db:import
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const CONTENT = join(__dir, '../content/hadiths');
const CDN = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions';

const MAX_ARABIC = 500;
const MAX_TEXT   = 300;

// Riyad as-Salihin chapter → topic tag mapping
// Kaynak: sunnah.com/riyadussalihin chapter list
const CHAPTER_TOPICS = {
  1:  ['kindness'],        // Introduction / Good Intentions & Sincerity
  2:  ['repentance'],      // Repentance
  3:  ['patience'],        // Patience
  4:  ['honesty'],         // Truthfulness
  5:  ['tawakkul'],        // Trust in Allah
  6:  ['guidance'],        // Seeking Guidance
  7:  ['hope'],            // Hope and Fear
  8:  ['love'],            // Love of Allah and His Prophet
  9:  ['dhikr'],           // Remembrance of Allah
  10: ['gratitude'],       // Gratitude to Allah
  11: ['forgiveness'],     // Seeking Forgiveness
  12: ['peace'],           // Inner Peace & Contentment
  13: ['kindness'],        // Kindness to People
  14: ['honesty'],         // Honesty in Dealings
  15: ['dhikr'],           // Morning/Evening Dhikr
  16: ['hope'],            // Supplication / Du'a
  17: ['tawakkul'],        // Reliance on Allah
  18: ['repentance'],      // Return to Allah
  19: ['forgiveness'],     // Forgiveness of Sins
  20: ['peace'],           // Contentment & Gratitude
};

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function fetchEdition(lang) {
  const url = `${CDN}/${lang}-riyadussalihin.min.json`;
  try {
    return await fetchJSON(url);
  } catch {
    console.warn(`  ⚠ ${lang}-riyadussalihin not found on CDN`);
    return null;
  }
}

function isReadable(arabic, translations) {
  if (arabic && arabic.length > MAX_ARABIC) return false;
  for (const text of Object.values(translations)) {
    if (text && text.length > MAX_TEXT) return false;
  }
  return true;
}

async function main() {
  console.log('Fetching Riyad as-Salihin from fawazahmed0 CDN...\n');

  // Fetch all language editions
  const LANGS = { en: 'eng', tr: 'tur', fr: 'fra', id: 'ind', ar: 'ara' };
  const editions = {};
  for (const [lang, prefix] of Object.entries(LANGS)) {
    console.log(`Fetching ${lang}...`);
    const data = await fetchEdition(`${prefix}`);
    if (data) editions[lang] = data;
  }

  const enData = editions['en'];
  if (!enData) {
    console.error('English edition not available. Cannot proceed.');
    process.exit(1);
  }

  // Build hadith map from Arabic/EN, keyed by hadith number
  const hadiths = enData.hadiths ?? [];
  console.log(`\nTotal hadiths in EN edition: ${hadiths.length}`);

  // Load existing content to merge
  const existingBase = JSON.parse(readFileSync(join(CONTENT, 'base.json'), 'utf8'));
  const existingIds = new Set(existingBase.map(h => h.id));

  const translations = {
    en: JSON.parse(readFileSync(join(CONTENT, 'translations/en.json'), 'utf8')),
    tr: existsSync(join(CONTENT, 'translations/tr.json'))
      ? JSON.parse(readFileSync(join(CONTENT, 'translations/tr.json'), 'utf8')) : [],
    fr: existsSync(join(CONTENT, 'translations/fr.json'))
      ? JSON.parse(readFileSync(join(CONTENT, 'translations/fr.json'), 'utf8')) : [],
    id: existsSync(join(CONTENT, 'translations/id.json'))
      ? JSON.parse(readFileSync(join(CONTENT, 'translations/id.json'), 'utf8')) : [],
  };

  // Build translation maps for quick lookup
  const arData = editions['ar'];
  const arMap = {};
  if (arData) {
    for (const h of (arData.hadiths ?? [])) {
      arMap[h.hadithnumber] = h.text;
    }
  }

  const langMaps = {};
  for (const [lang, data] of Object.entries(editions)) {
    if (lang === 'ar') continue;
    langMaps[lang] = {};
    for (const h of (data.hadiths ?? [])) {
      langMaps[lang][h.hadithnumber] = h.text;
    }
  }

  let added = 0;
  let skipped = 0;

  for (const hadith of hadiths) {
    const num = hadith.hadithnumber;
    const id = `riyadussalihin_${num}`;

    if (existingIds.has(id)) { skipped++; continue; }

    // Determine topics from chapter
    const chapterNum = hadith.reference?.book ?? null;
    const topics = CHAPTER_TOPICS[chapterNum] ?? [];

    // Additionally run keyword matching on EN text
    const enText = langMaps['en']?.[num] ?? hadith.text ?? '';
    const KEYWORD_TOPICS = [
      { tag: 'patience',    regex: /patien|steadfast|endure|sabr/i },
      { tag: 'gratitude',   regex: /grateful|thankful|shukr/i },
      { tag: 'hope',        regex: /\bhope\b|mercy.*allah|do not despair/i },
      { tag: 'repentance',  regex: /repent|tawbah|turn to allah/i },
      { tag: 'tawakkul',    regex: /trust.*allah|reliance.*allah/i },
      { tag: 'guidance',    regex: /\bguidance\b|straight path/i },
      { tag: 'forgiveness', regex: /forgi(v|ve|ving|veness)/i },
      { tag: 'peace',       regex: /tranquil|peace.*heart|contentment/i },
      { tag: 'love',        regex: /love.*allah|allah.*love/i },
      { tag: 'dhikr',       regex: /remembrance|dhikr|subhanallah/i },
      { tag: 'honesty',     regex: /truthful|trustworthy|amanah/i },
      { tag: 'kindness',    regex: /\bkindness\b|ihsan|be kind/i },
    ];
    const topicSet = new Set(topics);
    for (const { tag, regex } of KEYWORD_TOPICS) {
      if (regex.test(enText)) topicSet.add(tag);
    }

    // Skip hadiths with no relevant topic
    if (topicSet.size === 0) { skipped++; continue; }

    const arabic = arMap[num] ?? '';
    const langTexts = {};
    for (const lang of ['en', 'tr', 'fr', 'id']) {
      const text = langMaps[lang]?.[num] ?? '';
      if (text) langTexts[lang] = text;
    }

    // Length filter
    if (!isReadable(arabic, langTexts)) { skipped++; continue; }

    // Must have EN text
    if (!langTexts['en']) { skipped++; continue; }

    existingBase.push({
      id,
      collection: 'riyadussalihin',
      collectionName: 'Riyad as-Salihin',
      reference: String(num),
      source: 'Riyad as-Salihin',
      grade: 'sahih',
      arabic,
      narrator: hadith.narrator ?? undefined,
      section: { book: chapterNum },
      topics: [...topicSet],
      length: arabic.length < 280 ? 'short' : arabic.length < 900 ? 'medium' : 'long',
      displaySafe: true,
      needsContext: false,
      sourcePriority: 8,
    });

    // Translations
    for (const [lang, text] of Object.entries(langTexts)) {
      translations[lang].push({
        id,
        language: lang,
        text,
        verified: false,
        translationSource: `fawazahmed0/hadith-api 1 ${lang}-riyadussalihin`,
      });
    }

    existingIds.add(id);
    added++;
  }

  // Save merged files
  writeFileSync(join(CONTENT, 'base.json'), JSON.stringify(existingBase, null, 2));
  for (const [lang, data] of Object.entries(translations)) {
    writeFileSync(join(CONTENT, `translations/${lang}.json`), JSON.stringify(data, null, 2));
  }

  console.log(`\n✓ Added ${added} Riyad as-Salihin hadiths, skipped ${skipped}`);
  console.log(`  Total hadiths in base.json: ${existingBase.length}`);

  // Topic summary for new additions
  const summary = {};
  for (const h of existingBase.filter(h => h.collection === 'riyadussalihin')) {
    for (const t of (h.topics ?? [])) {
      summary[t] = (summary[t] ?? 0) + 1;
    }
  }
  console.log('\nRiyad as-Salihin topic distribution:');
  Object.entries(summary).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`  ${k.padEnd(20)} ${v}`);
  });
}

main().catch(console.error);
