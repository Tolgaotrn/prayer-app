/**
 * add-quote-translations.mjs
 * Quotes %100 türetilmiş (sourceType quran/hadith, sourceId → verse/hadith id).
 * Mevcut content/quotes/base.json'daki her quote için, kaynağın yeni dildeki
 * çevirisini bulup content/quotes/translations/<lang>.json üretir.
 * Dış kaynak/çeviri gerekmez — mevcut verse/hadith çevirilerinden derler.
 *
 * Kullanım:
 *   node tools/add-quote-translations.mjs de ur
 *
 * Not: Almanca hadis çevirisi yok → de quote'ları sadece ayet kaynaklı olanları
 * kapsar (hadis kaynaklılar atlanır). Urduca hem ayet hem hadis kapsar.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

async function readJson(rel) {
  return JSON.parse(await readFile(path.join(ROOT, rel), 'utf8'));
}
function toMap(arr) {
  const m = new Map();
  for (const t of arr) m.set(t.id, t.text);
  return m;
}

async function main() {
  const targets = process.argv.slice(2).filter(Boolean);
  if (!targets.length) { console.error('Dil belirtin: node tools/add-quote-translations.mjs de ur'); process.exit(1); }

  const base = await readJson('content/quotes/base.json');
  console.log(`quotes/base.json: ${base.length} quote`);

  for (const lang of targets) {
    const verses  = toMap(await readJson(`content/verses/translations/${lang}.json`).catch(() => []));
    const hadiths = toMap(await readJson(`content/hadiths/translations/${lang}.json`).catch(() => []));

    const out = [];
    let noVerse = 0, noHadith = 0;
    for (const q of base) {
      const src = q.sourceType === 'quran' ? verses : hadiths;
      const text = (src.get(q.sourceId) ?? '').trim();
      if (!text) { q.sourceType === 'quran' ? noVerse++ : noHadith++; continue; }
      out.push({ id: q.id, language: lang, text, author: q.author, verified: false,
        translationSource: q.sourceType === 'quran' ? 'content/verses' : 'content/hadiths' });
    }

    const file = path.join(ROOT, `content/quotes/translations/${lang}.json`);
    await writeFile(file, JSON.stringify(out, null, 2) + '\n', 'utf8');
    console.log(`  ✓ ${lang}.json: ${out.length} quote (ayet eksik ${noVerse}, hadis eksik ${noHadith})`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
