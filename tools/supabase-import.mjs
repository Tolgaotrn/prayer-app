/**
 * Noor — Supabase import script
 * Tüm content/ JSON'larını Supabase tablolarına yükler.
 *
 * Kullanım:
 *   node tools/supabase-import.mjs
 *   node tools/supabase-import.mjs --only=verses
 *   node tools/supabase-import.mjs --only=hadiths,themes
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ── Credentials ──────────────────────────────────────────────
const SUPABASE_URL      = 'https://hvxrsscrsqdbfewpmfhl.supabase.co';
const SUPABASE_SERVICE  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2eHJzc2Nyc3FkYmZld3BtZmhsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDE1MjY1OSwiZXhwIjoyMDk1NzI4NjU5fQ.MQ_aQEeB0LorHRq180K5nnXk8REyNJoSx_JVi-iDjP8';

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE, {
  auth: { persistSession: false },
});

// ── Yardımcılar ───────────────────────────────────────────────
async function readJson(relPath) {
  const full = path.join(ROOT, relPath);
  return JSON.parse(await readFile(full, 'utf8'));
}

const TRANS_TABLES = new Set([
  'verse_translations','hadith_translations','dua_translations','quote_translations'
]);

/** Büyük diziyi chunk'lara bölerek upsert et */
async function upsert(table, rows, chunkSize = 200) {
  const conflict = TRANS_TABLES.has(table) ? 'id,language' : 'id';
  let inserted = 0;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await sb.from(table).upsert(chunk, { onConflict: conflict });
    if (error) throw new Error(`${table} upsert hatası: ${error.message}`);
    inserted += chunk.length;
    process.stdout.write(`\r  ${table}: ${inserted}/${rows.length}`);
  }
  console.log(`\r  ✓ ${table}: ${inserted} kayıt`);
}

// ── Okunabilirlik filtresi ────────────────────────────────────
// Feed kartına sığması için: Arapça ≤ MAX_ARABIC, çeviri ≤ MAX_TEXT.
// Bu eşiklerin üstündeki içerik telefonda taşıyor → hiç yüklenmez.
const MAX_ARABIC = 500;
const MAX_TEXT   = 300;

/** HERHANGİ bir dildeki çevirisi çok uzun olan ID'lerin set'i */
function tooLongTextIds(...transArrays) {
  const skip = new Set();
  for (const arr of transArrays) {
    for (const t of (arr || [])) {
      if ((t.text || '').length > MAX_TEXT) skip.add(t.id);
    }
  }
  return skip;
}

/** Arapçası çok uzun olan ID'leri set'e ekle */
function addLongArabic(skip, base) {
  base.forEach(r => { if ((r.arabic || '').length > MAX_ARABIC) skip.add(r.id); });
}

/**
 * Supabase'de olup yeni keep-set'te OLMAYAN tüm kayıtları sil.
 * Hem uzun (filtrelenen) hem de seçim değiştiği için artık kullanılmayan
 * (stale) kayıtları temizler. upsert silmediği için şart.
 */
async function removeOrphans(baseTable, transTable, keepIds) {
  const { data, error } = await sb.from(baseTable).select('id');
  if (error) throw new Error(`${baseTable} id listesi alınamadı: ${error.message}`);
  const orphans = (data || []).map(r => r.id).filter(id => !keepIds.has(id));
  for (let i = 0; i < orphans.length; i += 100) {
    const chunk = orphans.slice(i, i + 100);
    await sb.from(transTable).delete().in('id', chunk);
    await sb.from(baseTable).delete().in('id', chunk);
  }
  if (orphans.length) console.log(`  🗑  ${baseTable}: ${orphans.length} eski/uzun kayıt temizlendi`);
}

// ── Importerlar ───────────────────────────────────────────────
async function importVerses() {
  console.log('\n── Verses ──');
  const base  = await readJson('content/verses/base.json');
  const langs = ['en', 'tr', 'fr', 'id'];
  const allTrans = await Promise.all(langs.map(l => readJson(`content/verses/translations/${l}.json`).catch(() => [])));

  // Okunabilirlik filtresi: uzun Arapça VEYA herhangi bir dilde uzun çeviri at
  const skip = tooLongTextIds(...allTrans);
  addLongArabic(skip, base);
  const keepIds = new Set(base.filter(v => !skip.has(v.id)).map(v => v.id));
  await removeOrphans('verses', 'verse_translations', keepIds);

  const rows = base.filter(v => !skip.has(v.id)).map(v => ({
    id:           v.id,
    key:          v.key,
    surah:        v.surah,
    surah_name:   v.surahName,
    surah_arabic: v.surahArabicName ?? null,
    ayah:         v.ayah,
    juz:          v.juz ?? null,
    page:         v.page ?? null,
    arabic:       v.arabic,
    topics:       v.topics ?? [],
    popularity:   v.popularityScore ?? 0,
    display_safe: v.displaySafe ?? true,
  }));
  await upsert('verses', rows);

  for (const lang of langs) {
    const trans = await readJson(`content/verses/translations/${lang}.json`);
    const trows = trans.filter(t => !skip.has(t.id)).map(t => ({ id: t.id, language: lang, text: t.text, verified: false }));
    await upsert('verse_translations', trows);
  }
}

async function importHadiths() {
  console.log('\n── Hadiths ──');
  const base  = await readJson('content/hadiths/base.json');
  const langs = ['en', 'tr', 'fr', 'id'];
  const allTrans = await Promise.all(langs.map(l => readJson(`content/hadiths/translations/${l}.json`).catch(() => [])));

  // Okunabilirlik filtresi: uzun Arapça VEYA herhangi bir dilde uzun çeviri at
  const skip = tooLongTextIds(...allTrans);
  addLongArabic(skip, base);
  const keepIds = new Set(base.filter(h => !skip.has(h.id)).map(h => h.id));
  await removeOrphans('hadiths', 'hadith_translations', keepIds);

  const rows = base.filter(h => !skip.has(h.id)).map(h => ({
    id:              h.id,
    collection:      h.collection,
    collection_name: h.collectionName ?? null,
    reference:       String(h.reference ?? ''),
    arabic:          h.arabic,
    grade:           h.grade ?? null,
    topics:          h.topics ?? [],
    length:          h.length ?? null,
    display_safe:    h.displaySafe ?? true,
    source_priority: h.sourcePriority ?? 9,
  }));
  await upsert('hadiths', rows);

  for (const lang of langs) {
    try {
      const trans = await readJson(`content/hadiths/translations/${lang}.json`);
      const trows = trans.filter(t => !skip.has(t.id)).map(t => ({ id: t.id, language: lang, text: t.text, verified: false }));
      await upsert('hadith_translations', trows);
    } catch { console.log(`  ⚠ hadiths/${lang}: dosya yok, atlandı`); }
  }
}

async function importDuas() {
  console.log('\n── Duas ──');
  const base  = await readJson('content/duas/base.json');
  const langs = ['en', 'id'];
  const allTrans = await Promise.all(langs.map(l => readJson(`content/duas/translations/${l}.json`).catch(() => [])));

  // Okunabilirlik filtresi: uzun Arapça VEYA herhangi bir dilde uzun çeviri at
  const skip = tooLongTextIds(...allTrans);
  addLongArabic(skip, base);
  const keepIds = new Set(base.filter(d => !skip.has(d.id)).map(d => d.id));
  await removeOrphans('duas', 'dua_translations', keepIds);

  const rows = base.filter(d => !skip.has(d.id)).map(d => ({
    id:              d.id,
    arabic:          d.arabic,
    transliteration: d.transliteration ?? null,
    occasion:        d.occasion ?? null,
    category:        d.category ?? null,
    source:          d.source ?? null,
    notes:           d.notes ?? null,
    benefits:        d.benefits ?? null,
    popularity:      d.popularityScore ?? 0,
    display_safe:    d.displaySafe ?? true,
  }));
  await upsert('duas', rows);

  for (const lang of langs) {
    try {
      const trans = await readJson(`content/duas/translations/${lang}.json`);
      const trows = trans.filter(t => !skip.has(t.id)).map(t => ({
        id: t.id, language: lang, text: t.text,
        title: t.title ?? null, verified: false,
      }));
      await upsert('dua_translations', trows);
    } catch { console.log(`  ⚠ duas/${lang}: dosya yok, atlandı`); }
  }
}

async function importQuotes() {
  console.log('\n── Quotes ──');
  const base  = await readJson('content/quotes/base.json');
  const langs = ['en', 'tr', 'fr', 'id'];
  const allTrans = await Promise.all(langs.map(l => readJson(`content/quotes/translations/${l}.json`).catch(() => [])));

  // Quote'larda Arapça yok → sadece çeviri uzunluğu filtresi (tüm diller)
  const skip = tooLongTextIds(...allTrans);
  const keepIds = new Set(base.filter(q => !skip.has(q.id)).map(q => q.id));
  await removeOrphans('quotes', 'quote_translations', keepIds);

  const rows = base.filter(q => !skip.has(q.id)).map(q => ({
    id:          q.id,
    source_type: q.sourceType,
    source_id:   q.sourceId ?? null,
    author:      q.author ?? null,
    text:        q.text,
    topics:      q.topics ?? [],
    popularity:  q.popularityScore ?? 0,
  }));
  await upsert('quotes', rows);

  for (const lang of langs) {
    try {
      const trans = await readJson(`content/quotes/translations/${lang}.json`);
      const trows = trans.filter(t => !skip.has(t.id)).map(t => ({ id: t.id, language: lang, text: t.text, verified: false }));
      await upsert('quote_translations', trows);
    } catch { console.log(`  ⚠ quotes/${lang}: dosya yok, atlandı`); }
  }
}

async function importThemes() {
  console.log('\n── Themes ──');
  const rows = [
    { id: 0, name: 'Midnight Crescent', image_url: 'https://res.cloudinary.com/dntc8zxaf/image/upload/v1780155040/midnight_kd6snr.jpg',        gradient: ['#0A1230','#0D1A3A','#070C18'], badge: 'Free',  is_free: true,  is_active: true, sort_order: 0 },
    { id: 1, name: 'Night Mosque',      image_url: 'https://res.cloudinary.com/dntc8zxaf/image/upload/v1780155048/night-mosque_dd0joo.png',     gradient: ['#0B1530','#1A2A50','#080E1F'], badge: 'Free',  is_free: true,  is_active: true, sort_order: 1 },
    { id: 2, name: 'Sunset Arch',       image_url: 'https://res.cloudinary.com/dntc8zxaf/image/upload/v1780155048/sunset-arch_m5ijpv.png',     gradient: ['#3A2A18','#B98A4E','#2B1E12'], badge: 'New',   is_free: false, is_active: true, sort_order: 2 },
    { id: 3, name: 'Grand Interior',    image_url: 'https://res.cloudinary.com/dntc8zxaf/image/upload/v1780155048/interior_rb3mor.png',        gradient: ['#2B2418','#6E5A3E','#1A150E'], badge: null,    is_free: false, is_active: true, sort_order: 3 },
    { id: 4, name: 'Sunrise Court',     image_url: 'https://res.cloudinary.com/dntc8zxaf/image/upload/v1780155043/sunrise-court_lswvcu.jpg',   gradient: ['#4A3A22','#C9A765','#2A2014'], badge: 'New',   is_free: false, is_active: true, sort_order: 4 },
    { id: 5, name: 'Serene Gate',       image_url: 'https://res.cloudinary.com/dntc8zxaf/image/upload/v1780155042/serene-arch_dkz3xe.jpg',     gradient: ['#2A2018','#8A6A44','#181208'], badge: null,    is_free: false, is_active: true, sort_order: 5 },
    { id: 6, name: 'Quran Light',       image_url: 'https://res.cloudinary.com/dntc8zxaf/image/upload/v1780155042/quran-light_xwenus.jpg',     gradient: ['#2A1E0E','#9A6A2E','#160E04'], badge: null,    is_free: false, is_active: true, sort_order: 6 },
    { id: 7, name: "Bird's Eye Dusk",   image_url: 'https://res.cloudinary.com/dntc8zxaf/image/upload/v1780155040/bird-sunset_wzwrdg.jpg',     gradient: ['#3A2410','#7A4A1E','#0E0804'], badge: null,    is_free: false, is_active: true, sort_order: 7 },
    { id: 8, name: 'Holy Kaaba',        image_url: 'https://res.cloudinary.com/dntc8zxaf/image/upload/v1780155047/kaaba_l5roa2.png',           gradient: ['#1A1A1A','#4A4A4A','#0A0A0A'], badge: null,    is_free: false, is_active: true, sort_order: 8 },
  ];
  await upsert('themes', rows);
}

// ── Ana fonksiyon ─────────────────────────────────────────────
async function main() {
  const onlyArg = process.argv.find(a => a.startsWith('--only='));
  const only = onlyArg ? new Set(onlyArg.split('=')[1].split(',')) : null;

  const run = (name, fn) => (!only || only.has(name)) ? fn() : Promise.resolve();

  console.log('🚀 Supabase import başlıyor...');
  console.log('   URL:', SUPABASE_URL);

  // Bağlantı testi
  const { error: testErr } = await sb.from('verses').select('id').limit(1);
  if (testErr && testErr.code !== 'PGRST116') {
    console.error('\n❌ Bağlantı hatası:', testErr.message);
    console.error('   → Supabase Dashboard\'da SQL schema çalıştırıldı mı?');
    process.exit(1);
  }

  await run('verses',  importVerses);
  await run('hadiths', importHadiths);
  await run('duas',    importDuas);
  await run('quotes',  importQuotes);
  await run('themes',  importThemes);

  console.log('\n✅ Import tamamlandı!');
}

main().catch(e => { console.error('\n❌', e.message); process.exit(1); });
