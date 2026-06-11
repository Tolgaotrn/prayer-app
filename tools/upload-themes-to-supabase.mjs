/**
 * Cloudinary'deki tema görsellerini Supabase Storage'a taşır.
 * Kullanım: node tools/upload-themes-to-supabase.mjs
 *
 * 1. Supabase'de "themes" bucket'ı oluşturur (public)
 * 2. Her görseli Cloudinary'den indirir
 * 3. Supabase Storage'a yükler
 * 4. Yeni URL'leri ekrana basar → data/themes.ts'e yapıştır
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL     = 'https://hvxrsscrsqdbfewpmfhl.supabase.co';
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE;
if (!SUPABASE_SERVICE) { console.error('✗ SUPABASE_SERVICE_ROLE env gerekli'); process.exit(1); }
const BUCKET           = 'themes';

const IMAGES = [
  { name: 'midnight.jpg',      url: 'https://res.cloudinary.com/dntc8zxaf/image/upload/v1780155040/midnight_kd6snr.jpg' },
  { name: 'night-mosque.png',  url: 'https://res.cloudinary.com/dntc8zxaf/image/upload/v1780155048/night-mosque_dd0joo.png' },
  { name: 'sunset-arch.png',   url: 'https://res.cloudinary.com/dntc8zxaf/image/upload/v1780155048/sunset-arch_m5ijpv.png' },
  { name: 'interior.png',      url: 'https://res.cloudinary.com/dntc8zxaf/image/upload/v1780155048/interior_rb3mor.png' },
  { name: 'sunrise-court.jpg', url: 'https://res.cloudinary.com/dntc8zxaf/image/upload/v1780155043/sunrise-court_lswvcu.jpg' },
  { name: 'serene-arch.jpg',   url: 'https://res.cloudinary.com/dntc8zxaf/image/upload/v1780155042/serene-arch_dkz3xe.jpg' },
  { name: 'quran-light.jpg',   url: 'https://res.cloudinary.com/dntc8zxaf/image/upload/v1780155042/quran-light_xwenus.jpg' },
  { name: 'bird-sunset.jpg',   url: 'https://res.cloudinary.com/dntc8zxaf/image/upload/v1780155040/bird-sunset_wzwrdg.jpg' },
  { name: 'kaaba.png',         url: 'https://res.cloudinary.com/dntc8zxaf/image/upload/v1780155047/kaaba_l5roa2.png' },
];

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE, { auth: { persistSession: false } });

async function ensureBucket() {
  const { data: buckets } = await sb.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET);
  if (!exists) {
    const { error } = await sb.storage.createBucket(BUCKET, { public: true });
    if (error) throw new Error(`Bucket oluşturulamadı: ${error.message}`);
    console.log(`✅ Bucket "${BUCKET}" oluşturuldu`);
  } else {
    console.log(`ℹ️  Bucket "${BUCKET}" zaten var`);
  }
}

async function uploadImage({ name, url }) {
  console.log(`⬇️  İndiriliyor: ${name}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`İndirilemedi: ${url} (${res.status})`);
  const buffer = await res.arrayBuffer();
  const contentType = name.endsWith('.png') ? 'image/png' : 'image/jpeg';

  const { error } = await sb.storage
    .from(BUCKET)
    .upload(name, buffer, { contentType, upsert: true });

  if (error) throw new Error(`Yükleme hatası ${name}: ${error.message}`);

  const { data } = sb.storage.from(BUCKET).getPublicUrl(name);
  console.log(`✅ ${name} → ${data.publicUrl}`);
  return { name, publicUrl: data.publicUrl };
}

async function main() {
  await ensureBucket();

  const results = [];
  for (const img of IMAGES) {
    const r = await uploadImage(img);
    results.push(r);
  }

  console.log('\n── data/themes.ts için yeni URL\'ler ──');
  for (const { name, publicUrl } of results) {
    console.log(`${name.padEnd(22)} → ${publicUrl}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
