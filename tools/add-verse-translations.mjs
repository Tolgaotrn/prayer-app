/**
 * add-verse-translations.mjs
 * Mevcut content/verses/base.json'daki ayet ID'leri (S:A key) için yeni dil
 * çevirilerini alquran.cloud'dan çeker ve content/verses/translations/<lang>.json
 * dosyalarını üretir. Otantik kaynak, auth gerektirmez.
 *
 * Kullanım:
 *   node tools/add-verse-translations.mjs            # de + ur
 *   node tools/add-verse-translations.mjs de ur
 *
 * Sonra DB'ye yüklemek için:
 *   SUPABASE_SERVICE_ROLE=<key> node tools/supabase-import.mjs --only=verses
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const API_BASE = 'https://api.alquran.cloud/v1';

// Dil → alquran.cloud edition. Otantik, yaygın kabul gören çeviriler.
const EDITIONS = {
  de: 'de.bubenheim',   // Bubenheim & Elyas — standart Almanca meal
  ur: 'ur.jalandhry',   // Fateh Muhammad Jalandhry — klasik Urduca meal
};

async function fetchJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} → ${r.status}`);
  return r.json();
}

// Edition'ı tek seferde çek → "S:A" → text haritası
async function loadEdition(identifier) {
  const payload = await fetchJson(`${API_BASE}/quran/${identifier}`);
  if (payload.code !== 200 || !payload.data?.surahs) {
    throw new Error(`Beklenmeyen payload: ${identifier}`);
  }
  const map = new Map();
  for (const surah of payload.data.surahs) {
    for (const ayah of surah.ayahs) {
      map.set(`${surah.number}:${ayah.numberInSurah}`, (ayah.text || '').trim());
    }
  }
  return map;
}

async function main() {
  const langs = process.argv.slice(2).filter(Boolean);
  const targets = langs.length ? langs : ['de', 'ur'];

  const base = JSON.parse(
    await readFile(path.join(ROOT, 'content/verses/base.json'), 'utf8'),
  );
  console.log(`base.json: ${base.length} ayet`);

  for (const lang of targets) {
    const edition = EDITIONS[lang];
    if (!edition) { console.error(`✗ ${lang}: edition tanımlı değil`); continue; }
    process.stdout.write(`  ${lang} (${edition}) çekiliyor… `);
    const map = await loadEdition(edition);
    console.log(`${map.size} ayet`);

    const rows = [];
    let missing = 0;
    for (const v of base) {
      const text = map.get(v.key);
      if (!text) { missing++; continue; }
      rows.push({
        id: v.id,
        key: v.key,
        language: lang,
        text,
        verified: false,
        translationSource: edition,
      });
    }

    const out = path.join(ROOT, `content/verses/translations/${lang}.json`);
    await writeFile(out, JSON.stringify(rows, null, 2) + '\n', 'utf8');
    console.log(`  ✓ ${lang}.json yazıldı: ${rows.length} kayıt${missing ? ` (${missing} eksik)` : ''}`);
  }

  console.log('\nDB\'ye yüklemek için:');
  console.log('  SUPABASE_SERVICE_ROLE=<key> node tools/supabase-import.mjs --only=verses');
}

main().catch((e) => { console.error(e); process.exit(1); });
