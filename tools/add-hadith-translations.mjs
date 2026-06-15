/**
 * add-hadith-translations.mjs
 * Mevcut content/hadiths/base.json'daki hadis ID'leri (collection_reference) için
 * yeni dil çevirilerini fawazahmed0/hadith-api'den çeker ve
 * content/hadiths/translations/<lang>.json üretir. Mevcut base'i DEĞİŞTİRMEZ.
 *
 * App'in mevcut hadisleri zaten bu kaynaktan geldiği için numaralandırma birebir
 * hizalı (bukhari_68 = fawazahmed0 bukhari #68).
 *
 * Kullanım:
 *   node tools/add-hadith-translations.mjs ur       # sadece urduca
 *   node tools/add-hadith-translations.mjs ur tr
 *
 * Not: Almanca (de) bu API'de YOK → atlanır.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CDN = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1';

const LANG_PREFIX = { ur: 'urd', tr: 'tur', en: 'eng', fr: 'fra', id: 'ind', ar: 'ara' };

async function fetchJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} → ${r.status}`);
  return r.json();
}

function rowText(row) {
  return (row.text ?? row.hadith ?? '').trim();
}
function rowNumber(row, i) {
  return String(row.hadithnumber ?? row.hadithNumber ?? row.number ?? row.id ?? i + 1);
}

async function main() {
  const targets = process.argv.slice(2).filter(Boolean);
  if (!targets.length) { console.error('Dil belirtin: node tools/add-hadith-translations.mjs ur'); process.exit(1); }

  const base = JSON.parse(await readFile(path.join(ROOT, 'content/hadiths/base.json'), 'utf8'));
  const collections = [...new Set(base.map(h => h.collection))];
  console.log(`base.json: ${base.length} hadis, koleksiyonlar: ${collections.join(', ')}`);

  for (const lang of targets) {
    const prefix = LANG_PREFIX[lang];
    if (!prefix) { console.error(`✗ ${lang}: desteklenmiyor`); continue; }

    // Her koleksiyon için edition'ı çek → numara haritası
    const numberMaps = new Map();
    for (const col of collections) {
      const url = `${CDN}/editions/${prefix}-${col}.min.json`;
      try {
        const payload = await fetchJson(url);
        const rows = payload.hadiths ?? payload.hadith ?? [];
        const map = new Map();
        rows.forEach((r, i) => map.set(rowNumber(r, i), r));
        numberMaps.set(col, map);
        process.stdout.write(`  ${lang}/${col}: ${rows.length} hadis  `);
      } catch (e) {
        numberMaps.set(col, new Map());
        process.stdout.write(`  ${lang}/${col}: YOK  `);
      }
    }
    console.log('');

    const out = [];
    let missing = 0;
    for (const h of base) {
      const map = numberMaps.get(h.collection);
      const row = map?.get(String(h.reference));
      const text = row ? rowText(row) : '';
      if (!text) { missing++; continue; }
      out.push({ id: h.id, language: lang, text, verified: false,
        translationSource: `fawazahmed0/hadith-api ${prefix}-${h.collection}` });
    }

    const file = path.join(ROOT, `content/hadiths/translations/${lang}.json`);
    await writeFile(file, JSON.stringify(out, null, 2) + '\n', 'utf8');
    console.log(`  ✓ ${lang}.json: ${out.length} kayıt${missing ? ` (${missing} eksik)` : ''}\n`);
  }

  console.log('DB import:');
  console.log('  SUPABASE_SERVICE_ROLE=<key> node tools/supabase-import.mjs --only=hadiths');
}

main().catch(e => { console.error(e); process.exit(1); });
