/**
 * Uploads both welcome videos to Supabase Storage (media bucket, public).
 * Run: node tools/upload-welcome-video.mjs
 * Requires SUPABASE_SERVICE_KEY env var.
 *
 *   $env:SUPABASE_SERVICE_KEY = "your-service-role-key"
 *   node tools/upload-welcome-video.mjs
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = 'https://hvxrsscrsqdbfewpmfhl.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SERVICE_KEY) {
  console.error('❌ Set SUPABASE_SERVICE_KEY env var first.');
  console.error('   $env:SUPABASE_SERVICE_KEY = "your-service-role-key"');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const BUCKET = 'media';

const VIDEOS = [
  { src: '../widget-resim/0531.mp4', dest: '0531.mp4' },
  { src: '../widget-resim/0532.mp4', dest: '0532.mp4' },
];

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some(b => b.name === BUCKET);
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (error) { console.error('Bucket create error:', error); process.exit(1); }
    console.log(`✅ Created bucket: ${BUCKET}`);
  }
}

async function uploadVideo({ src, dest }) {
  const filePath = path.join(__dirname, src);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  File not found, skipping: ${filePath}`);
    return;
  }
  const fileBuffer = fs.readFileSync(filePath);
  console.log(`⬆️  Uploading ${dest} (${(fileBuffer.length / 1024 / 1024).toFixed(1)} MB)...`);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(dest, fileBuffer, { contentType: 'video/mp4', upsert: true });

  if (error) { console.error(`Upload error (${dest}):`, error); return; }

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(dest);
  console.log(`✅ ${dest} → ${publicUrl}`);
}

async function main() {
  await ensureBucket();
  for (const v of VIDEOS) await uploadVideo(v);
  console.log('\n🎉 All done!');
}

main();
