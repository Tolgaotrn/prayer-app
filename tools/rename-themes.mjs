/**
 * "Generated Theme N" tema isimlerini Supabase themes tablosunda günceller.
 * Kullanım: node tools/rename-themes.mjs --list   (sadece listele)
 *           node tools/rename-themes.mjs           (güncelle)
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hvxrsscrsqdbfewpmfhl.supabase.co';
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE;
if (!SUPABASE_SERVICE) { console.error('✗ SUPABASE_SERVICE_ROLE env gerekli'); process.exit(1); }

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE, { auth: { persistSession: false } });

// image dosya adı parçası → yeni isim
const RENAMES = [
  ['new-theme-1.',  'Wadi Rum Sunset'],
  ['new-theme-2.',  'Cappadocia Quran'],
  ['new-theme-3.',  'Samarkand Glow'],
  ['new-theme-4.',  'Courtyard Spring'],
  ['new-theme-5.',  'Crescent Dunes'],
  ['new-theme-6.',  'Bosphorus Dawn'],
  ['new-theme-7.',  'Riad Fountain'],
  ['new-theme-8.',  'Misty Rose Garden'],
  ['new-theme-9.',  'Iznik Panel'],
  ['new-theme-10.', 'Fig Tree Shade'],
  ['new-theme-11.', 'Moonlit Harbor'],
];

async function main() {
  const { data, error } = await sb.from('themes').select('id, name, image_url').order('sort_order');
  if (error) throw new Error(error.message);
  console.log(`Toplam ${data.length} tema:\n`);
  for (const t of data) console.log(`  #${t.id}  ${t.name.padEnd(22)}  ${t.image_url}`);

  if (process.argv.includes('--list')) return;

  console.log('\n── Güncelleniyor ──');
  for (const [needle, newName] of RENAMES) {
    const row = data.find((t) => (t.image_url || '').includes(needle));
    if (!row) { console.log(`⚠️  ${needle} → eşleşme yok, atlandı`); continue; }
    if (row.name === newName) { console.log(`ℹ️  #${row.id} zaten "${newName}"`); continue; }
    const { error: upErr } = await sb.from('themes').update({ name: newName }).eq('id', row.id);
    if (upErr) { console.log(`❌ #${row.id} ${upErr.message}`); continue; }
    console.log(`✅ #${row.id}  "${row.name}" → "${newName}"`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
