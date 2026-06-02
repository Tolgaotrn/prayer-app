import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://hvxrsscrsqdbfewpmfhl.supabase.co';
const SUPABASE_SERVICE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2eHJzc2Nyc3FkYmZld3BtZmhsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDE1MjY1OSwiZXhwIjoyMDk1NzI4NjU5fQ.MQ_aQEeB0LorHRq180K5nnXk8REyNJoSx_JVi-iDjP8';
const BUCKET = 'themes';

const IMAGES = [
  'sheikh-zayed.jpg',
  'ottoman-courtyard.jpg',
  'topkapi-corridor.jpg',
  'persian-dome.jpg',
  'ottoman-sunrise.jpg',
  'cedar-forest.jpg',
];

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE, { auth: { persistSession: false } });

async function upload() {
  try {
    const { data: buckets } = await sb.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === BUCKET);
    if (!exists) {
      await sb.storage.createBucket(BUCKET, { public: true });
      console.log(`✅ Bucket oluşturuldu`);
    }

    for (const fname of IMAGES) {
      const fpath = path.join('assets/themes', fname);
      if (!fs.existsSync(fpath)) {
        console.log(`⚠️  ${fname} bulunamadı`);
        continue;
      }

      const buffer = fs.readFileSync(fpath);
      const ct = fname.endsWith('.png') ? 'image/png' : 'image/jpeg';
      const { error } = await sb.storage.from(BUCKET).upload(fname, buffer, { contentType: ct, upsert: true });
      if (error) {
        console.log(`❌ ${fname}: ${error.message}`);
      } else {
        console.log(`✅ ${fname} yüklendi`);
      }
    }
  } catch (e) {
    console.error('Hata:', e.message);
    process.exit(1);
  }
}

upload();
