/**
 * create-asma-tables.mjs
 * Supabase'de asmaul_husna tablolarını oluşturur.
 * Supabase Management API kullanır (personal access token gerekli).
 *
 * Çalıştır: node tools/create-asma-tables.mjs
 *
 * Eğer hata alırsan manuel yol:
 *   Supabase Dashboard → SQL Editor → New query → aşağıdaki SQL'i yapıştır
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL     = 'https://hvxrsscrsqdbfewpmfhl.supabase.co';
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE;
if (!SUPABASE_SERVICE) { console.error('✗ SUPABASE_SERVICE_ROLE env gerekli'); process.exit(1); }
const PROJECT_REF = 'hvxrsscrsqdbfewpmfhl';

const SQL = `
CREATE TABLE IF NOT EXISTS asmaul_husna (
  id              text primary key,
  number          int  not null,
  arabic          text not null,
  transliteration text not null,
  topics          text[] default array['99 Names of Allah'],
  popularity      int  default 100,
  created_at      timestamptz default now()
);

CREATE INDEX IF NOT EXISTS asma_number_idx ON asmaul_husna(number);

CREATE TABLE IF NOT EXISTS asmaul_husna_translations (
  id          text not null,
  language    text not null,
  meaning     text not null,
  description text,
  primary key (id, language),
  foreign key (id) references asmaul_husna(id) on delete cascade
);

CREATE INDEX IF NOT EXISTS asmatrans_lang_idx ON asmaul_husna_translations(language);

ALTER TABLE asmaul_husna ENABLE ROW LEVEL SECURITY;
ALTER TABLE asmaul_husna_translations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'asmaul_husna' AND policyname = 'public read'
  ) THEN
    CREATE POLICY "public read" ON asmaul_husna FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'asmaul_husna_translations' AND policyname = 'public read'
  ) THEN
    CREATE POLICY "public read" ON asmaul_husna_translations FOR SELECT USING (true);
  END IF;
END $$;
`;

async function main() {
  // Supabase Management API ile SQL çalıştır
  // Bu endpoint service_role JWT ile çalışır
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/rpc/query`,
    {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE,
        'Authorization': `Bearer ${SUPABASE_SERVICE}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: SQL }),
    }
  );

  if (!res.ok) {
    // Alternatif endpoint dene
    const res2 = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: SQL }),
      }
    );

    if (!res2.ok) {
      console.log('\n⚠️  Otomatik tablo oluşturma başarısız.');
      console.log('   Supabase Dashboard → SQL Editor → New query → şunu yapıştır:\n');
      console.log('─'.repeat(60));
      console.log(SQL);
      console.log('─'.repeat(60));
      console.log('\n   Sonra tekrar çalıştır: node tools/supabase-import.mjs --only=asmaul-husna');
      return;
    }
  }

  console.log('✅ Tablolar oluşturuldu!');
  console.log('   Şimdi çalıştır: node tools/supabase-import.mjs --only=asmaul-husna');
}

main().catch(console.error);
