/**
 * push-topics.mjs
 * Supabase'deki verses / hadiths / quotes tablolarında SADECE topics[] kolonunu günceller.
 *
 * ÖNEMLİ: upsert DEĞİL, UPDATE kullanır → Arapça, çeviri, popülerlik vb. HİÇBİR ŞEYE dokunmaz,
 * satır SİLMEZ. Sadece local content/<tür>/base.json'daki topics dizisini Supabase'e yansıtır.
 *
 * Çalıştır: node tools/push-topics.mjs
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const SUPABASE_URL     = 'https://hvxrsscrsqdbfewpmfhl.supabase.co';
const SUPABASE_SERVICE  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2eHJzc2Nyc3FkYmZld3BtZmhsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDE1MjY1OSwiZXhwIjoyMDk1NzI4NjU5fQ.MQ_aQEeB0LorHRq180K5nnXk8REyNJoSx_JVi-iDjP8';

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE, { auth: { persistSession: false } });

async function readJson(rel) {
  return JSON.parse(await readFile(path.join(ROOT, rel), 'utf8'));
}

/** Belirli bir tabloda topics[] kolonunu güncelle (paralel chunk'lar) */
async function pushTopics(table, baseRel) {
  const base = await readJson(baseRel);

  // Supabase'de gerçekten var olan id'leri al (yoksa update no-op olur ama gereksiz çağrı)
  const existing = new Set();
  {
    let from = 0;
    const page = 1000;
    while (true) {
      const { data, error } = await sb.from(table).select('id').range(from, from + page - 1);
      if (error) throw new Error(`${table} id listesi: ${error.message}`);
      (data ?? []).forEach(r => existing.add(r.id));
      if (!data || data.length < page) break;
      from += page;
    }
  }

  const rows = base.filter(r => existing.has(r.id));
  let done = 0, changed = 0;
  const CONC = 25;

  for (let i = 0; i < rows.length; i += CONC) {
    const chunk = rows.slice(i, i + CONC);
    await Promise.all(chunk.map(async (r) => {
      const topics = r.topics ?? [];
      const { error } = await sb.from(table).update({ topics }).eq('id', r.id);
      if (error) throw new Error(`${table} update ${r.id}: ${error.message}`);
      changed++;
    }));
    done += chunk.length;
    process.stdout.write(`\r  ${table}: ${done}/${rows.length}`);
  }
  console.log(`\r  ✓ ${table}: ${changed} satırın topics[] güncellendi (${existing.size} satır mevcut, ${base.length} local)`);
}

async function main() {
  console.log('🏷  Supabase topics[] güncelleniyor (sadece topics kolonu, başka hiçbir şey)...\n');
  await pushTopics('verses',  'content/verses/base.json');
  await pushTopics('hadiths', 'content/hadiths/base.json');
  await pushTopics('quotes',  'content/quotes/base.json');
  console.log('\n✅ Tamamlandı. Topic filtreleme artık çalışmalı.');
}

main().catch(e => { console.error('\n❌', e.message); process.exit(1); });
