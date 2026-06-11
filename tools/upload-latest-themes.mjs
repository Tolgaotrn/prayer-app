import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://hvxrsscrsqdbfewpmfhl.supabase.co';
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE;
if (!SUPABASE_SERVICE) { console.error('✗ SUPABASE_SERVICE_ROLE env gerekli'); process.exit(1); }
const BUCKET = 'themes';

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE, { auth: { persistSession: false } });

async function uploadAndInsert() {
  try {
    const { data: buckets } = await sb.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === BUCKET);
    if (!exists) {
      await sb.storage.createBucket(BUCKET, { public: true });
      console.log(`✅ Bucket oluşturuldu`);
    }

    // Determine the next ID for the themes table
    const { data: maxObj } = await sb.from('themes').select('id').order('id', { ascending: false }).limit(1);
    let nextId = maxObj && maxObj.length > 0 ? maxObj[0].id + 1 : 28; // fallback to 28

    const newRows = [];

    for (let i = 1; i <= 11; i++) {
        const fname = `new-theme-${i}.png`;
        const fpath = path.join('assets/themes', fname);
        if (!fs.existsSync(fpath)) {
            console.log(`⚠️  ${fname} bulunamadı`);
            continue;
        }

        const buffer = fs.readFileSync(fpath);
        const { error: uploadError } = await sb.storage.from(BUCKET).upload(fname, buffer, { contentType: 'image/png', upsert: true });
        if (uploadError) {
            console.log(`❌ Yükleme hatası ${fname}: ${uploadError.message}`);
        } else {
            console.log(`✅ ${fname} yüklendi`);
            const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${fname}`;
            
            newRows.push({
                id: nextId,
                name: `Theme ${nextId}`,
                image_url: url,
                gradient: ['#1A1A1A', '#2A2A2A', '#0A0A0A'], // Placeholder dark gradient
                badge: 'New',
                is_free: false,
                is_active: true,
                sort_order: nextId
            });
            nextId++;
        }
    }

    if (newRows.length > 0) {
        const { error: insertError } = await sb.from('themes').upsert(newRows);
        if (insertError) {
            console.log(`❌ Insert hatası: ${insertError.message}`);
        } else {
            console.log(`✅ ${newRows.length} satır eklendi`);
            console.log(JSON.stringify(newRows, null, 2));
        }
    }
  } catch (e) {
    console.error('Hata:', e.message);
    process.exit(1);
  }
}

uploadAndInsert();