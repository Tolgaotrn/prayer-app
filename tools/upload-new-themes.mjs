import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://hvxrsscrsqdbfewpmfhl.supabase.co';
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE;
if (!SUPABASE_SERVICE) { console.error('✗ SUPABASE_SERVICE_ROLE env gerekli'); process.exit(1); }
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
