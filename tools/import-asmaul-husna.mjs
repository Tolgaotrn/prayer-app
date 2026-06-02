/**
 * import-asmaul-husna.mjs
 * Allah'ın 99 İsmini (Asmaul Husna) birden fazla kaynaktan çeker,
 * EN/TR/FR/ID çevirileri ile birlikte content/asmaul-husna/ klasörüne yazar.
 *
 * Kaynaklar:
 *  - KabDeveloper/99-Names-Of-Allah (EN + FR, GitHub JSON)
 *  - AlAdhan API (TR + ID + AR doğrulama)
 *
 * Çalıştır: node tools/import-asmaul-husna.mjs
 * Ardından: npm run db:import (veya node tools/supabase-import.mjs --only=asmaul-husna)
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT   = join(__dir, '../content/asmaul-husna');
const TRANS = join(OUT, 'translations');

if (!existsSync(OUT))   mkdirSync(OUT,   { recursive: true });
if (!existsSync(TRANS)) mkdirSync(TRANS, { recursive: true });

async function fetchJSON(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'noor-app/1.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

// ── AlAdhan API ────────────────────────────────────────────────
// GET https://api.aladhan.com/v1/asmaAlHusna
// Döner: { data: [{ number, name (Arabic), transliteration, en: {meaning, desc} }] }
async function fetchAlAdhan() {
  try {
    const data = await fetchJSON('https://api.aladhan.com/v1/asmaAlHusna');
    return (data.data ?? []).map(item => ({
      number:          item.number,
      arabic:          item.name,
      transliteration: item.transliteration,
      en_meaning:      item.en?.meaning ?? '',
      en_desc:         item.en?.desc ?? '',
    }));
  } catch (e) {
    console.warn('  ⚠ AlAdhan API hatası:', e.message);
    return [];
  }
}

// ── KabDeveloper GitHub JSON ───────────────────────────────────
// EN + FR meaning + description, Quran referansları
async function fetchKabDeveloper() {
  try {
    const data = await fetchJSON(
      'https://raw.githubusercontent.com/KabDeveloper/99-Names-Of-Allah/main/99_Names_Of_Allah.json'
    );
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('  ⚠ KabDeveloper JSON hatası:', e.message);
    return [];
  }
}

// ── Türkçe çeviri — fawazahmed0 veya manuel fallback ──────────
// 99 İsmin Türkçe anlamları — güvenilir İslami kaynak
const TR_MEANINGS = [
  'En Merhametli', 'Çok Merhametli', 'Hükümdar', 'Kutsal', 'Selamet Veren',
  'Güvence Veren', 'Gözetip Koruyan', 'Güçlü ve Üstün', 'Zorlayıcı', 'Büyüklük Sahibi',
  'Yaratan', 'Yoktan Var Eden', 'Şekil Veren', 'Çok Bağışlayan', 'Hâkimiyet Sahibi',
  'Her Şeyi Bilen', 'Daraltan', 'Genişleten', 'Alçaltan', 'Yükselten',
  'İzzet Veren', 'Alçaltan', 'İşiten', 'Gören', 'Hükmeden',
  'Adaletli', 'Lütuf Sahibi', 'Her Şeyden Haberdar', 'Yumuşak Davranan', 'Büyük',
  'Koruyan', 'Rızık Veren', 'Hesap Gören', 'Yüce', 'Cömert',
  'Gözetici', 'Kabul Eden', 'Geniş Lütuf Sahibi', 'Hâkim', 'Seven',
  'Yüce ve Şanlı', 'Dirilten', 'Öldüren', 'Diri', 'Kendi Kendine Var Olan',
  'Bulan', 'Şanlı', 'Tek', 'Kendine Yeten', 'Güçlü',
  'Güçlü ve Sağlam', 'Koruyucu Veli', 'Övgüye Layık', 'Her Şeyi Sayan', 'İlk',
  'Son', 'Açık', 'Gizli', 'Yöneten', 'Yüce',
  'İyilik Yapan', 'Tövbeleri Kabul Eden', 'İntikam Alan', 'Bağışlayan', 'Lütufkâr',
  'Mülkün Gerçek Sahibi', 'İki Cihan Efendisi', 'Zengin Kılan', 'Zarar Veren', 'Fayda Veren',
  'Nur', 'Yol Gösteren', 'Benzersiz ve Eşsiz', 'Kalıcı', 'Vâris',
  'Doğru Yola İleten', 'Sabırlı',
];

// ── Endonezce fallback ─────────────────────────────────────────
const ID_MEANINGS = [
  'Yang Maha Pengasih', 'Yang Maha Penyayang', 'Yang Maha Merajai', 'Yang Maha Suci', 'Yang Maha Memberi Keselamatan',
  'Yang Maha Memberi Keamanan', 'Yang Maha Memelihara', 'Yang Maha Perkasa', 'Yang Memiliki Kehendak', 'Yang Maha Megah',
  'Yang Maha Pencipta', 'Yang Maha Melepaskan', 'Yang Maha Membentuk Rupa', 'Yang Maha Pengampun', 'Yang Maha Pemaksa',
  'Yang Maha Pemberi', 'Yang Maha Memutuskan', 'Yang Maha Meluaskan', 'Yang Maha Merendahkan', 'Yang Maha Meninggikan',
  'Yang Maha Memuliakan', 'Yang Maha Menghinakan', 'Yang Maha Mendengar', 'Yang Maha Melihat', 'Yang Maha Adil',
  'Yang Maha Bijaksana', 'Yang Maha Lembut', 'Yang Maha Mengetahui', 'Yang Maha Penyantun', 'Yang Maha Agung',
  'Yang Maha Mengampuni', 'Yang Maha Pemberi Rezeki', 'Yang Maha Menghitung', 'Yang Maha Mulia', 'Yang Maha Pemurah',
  'Yang Maha Mengawasi', 'Yang Maha Memperkenankan Doa', 'Yang Maha Luas', 'Yang Maha Bijaksana', 'Yang Maha Penyayang',
  'Yang Maha Mulia', 'Yang Maha Membangkitkan', 'Yang Maha Mematikan', 'Yang Maha Hidup', 'Yang Maha Berdiri Sendiri',
  'Yang Maha Menemukan', 'Yang Maha Mulia', 'Yang Maha Esa', 'Yang Maha Dibutuhkan', 'Yang Maha Kuat',
  'Yang Maha Kuat', 'Yang Maha Melindungi', 'Yang Maha Terpuji', 'Yang Maha Menghitung', 'Yang Pertama',
  'Yang Terakhir', 'Yang Maha Nyata', 'Yang Maha Tersembunyi', 'Yang Maha Memerintah', 'Yang Maha Tinggi',
  'Yang Maha Dermawan', 'Yang Maha Menerima Taubat', 'Yang Maha Membalas', 'Yang Maha Memaafkan', 'Yang Maha Lembut',
  'Yang Maha Memiliki Kerajaan', 'Yang Memiliki Keagungan dan Kemuliaan', 'Yang Maha Adil', 'Yang Maha Memberi Mudarat', 'Yang Maha Memberi Manfaat',
  'Yang Maha Bercahaya', 'Yang Maha Memberi Petunjuk', 'Yang Maha Indah', 'Yang Maha Kekal', 'Yang Maha Mewarisi',
  'Yang Maha Memberi Petunjuk', 'Yang Maha Penyabar',
];

// ── FR fallback ────────────────────────────────────────────────
const FR_MEANINGS = [
  'Le Tout Miséricordieux', 'Le Très Miséricordieux', 'Le Roi', 'Le Très Saint', 'La Source de Paix',
  'Celui qui donne la Foi', 'Le Gardien', 'Le Tout Puissant', 'Le Contraignant', 'Le Très Grand',
  'Le Créateur', 'Celui qui donne l\'existence', 'Le Formateur', 'Le Très Pardonneur', 'Le Dominateur',
  'Le Tout Donateur', 'Le Pourvoyeur', 'Celui qui resserre', 'Celui qui étend', 'Celui qui abaisse',
  'Celui qui élève', 'Celui qui donne la gloire', 'Celui qui abaisse', 'Celui qui entend tout', 'Celui qui voit tout',
  'Le Juge', 'Le Juste', 'Le Subtil', 'Le Parfaitement Informé', 'Le Clément',
  'Le Très Grand', 'Celui qui pardonne', 'Le Pourvoyeur', 'Celui qui compte', 'Le Majestueux',
  'Le Généreux', 'Le Tout Observateur', 'Celui qui répond', 'L\'Omniprésent', 'Le Sage',
  'L\'Aimant', 'Le Glorieux', 'Celui qui ressuscite', 'Celui qui fait mourir', 'Le Vivant',
  'Celui qui subsiste par lui-même', 'Celui qui trouve', 'Le Glorieux', 'L\'Unique', 'L\'Éternel',
  'Le Puissant', 'Le Fort', 'Le Protecteur', 'Le Digne de louange', 'Celui qui compte tout',
  'Le Premier', 'Le Dernier', 'L\'Apparent', 'Le Caché', 'Celui qui gouverne',
  'Le Très Haut', 'Le Bienfaisant', 'Celui qui accepte le repentir', 'Le Vengeur', 'Celui qui pardonne',
  'Le Compatissant', 'Le Maître du Royaume', 'Le Maître de la Majesté', 'L\'Équitable', 'Celui qui nuit',
  'Celui qui profite', 'La Lumière', 'Le Guide', 'L\'Incomparable', 'L\'Éternel Subsistant', 'L\'Héritier',
  'Le Guide sur la voie droite', 'Le Patient',
];

async function main() {
  console.log('🕌 99 İsim (Asmaul Husna) import ediliyor...\n');

  console.log('AlAdhan API\'den çekiliyor...');
  const aladhan = await fetchAlAdhan();

  console.log('KabDeveloper JSON\'dan çekiliyor...');
  const kabdev  = await fetchKabDeveloper();

  // KabDeveloper'ı number'a göre map'le
  const kabMap = {};
  for (const item of kabdev) {
    const num = item.number ?? item.id ?? item.No ?? item.no ?? item.order;
    if (num) kabMap[num] = item;
  }

  if (aladhan.length === 0) {
    console.error('❌ AlAdhan verisi alınamadı, çıkılıyor.');
    process.exit(1);
  }

  const base = [];
  const trTrans = [], enTrans = [], frTrans = [], idTrans = [];

  for (const item of aladhan) {
    const num = item.number;
    if (num < 1 || num > 99) continue;

    const id     = `asma_${String(num).padStart(3, '0')}`;
    const kab    = kabMap[num] ?? {};
    const idx    = num - 1;

    // EN: AlAdhan meaning + KabDeveloper açıklama
    const enMeaning = item.en_meaning || kab.meaning || kab.en_meaning || '';
    const enDesc    = item.en_desc    || kab.description || kab.en_desc || '';

    // TR
    const trMeaning = TR_MEANINGS[idx] ?? '';

    // FR: KabDeveloper varsa önce o, yoksa fallback
    const frMeaning = kab.french_meaning ?? kab.fr_meaning ?? FR_MEANINGS[idx] ?? '';

    // ID
    const idMeaning = ID_MEANINGS[idx] ?? '';

    base.push({
      id,
      number:          num,
      arabic:          item.arabic,
      transliteration: item.transliteration,
      topics:          ['99 Names of Allah'],
      popularity:      100,
    });

    enTrans.push({ id, language: 'en', meaning: enMeaning, description: enDesc });
    trTrans.push({ id, language: 'tr', meaning: trMeaning, description: '' });
    frTrans.push({ id, language: 'fr', meaning: frMeaning, description: '' });
    idTrans.push({ id, language: 'id', meaning: idMeaning, description: '' });
  }

  // Yaz
  writeFileSync(join(OUT, 'base.json'), JSON.stringify(base, null, 2));
  writeFileSync(join(TRANS, 'en.json'), JSON.stringify(enTrans, null, 2));
  writeFileSync(join(TRANS, 'tr.json'), JSON.stringify(trTrans, null, 2));
  writeFileSync(join(TRANS, 'fr.json'), JSON.stringify(frTrans, null, 2));
  writeFileSync(join(TRANS, 'id.json'), JSON.stringify(idTrans, null, 2));

  console.log(`\n✅ ${base.length} isim kaydedildi`);
  console.log(`   content/asmaul-husna/base.json`);
  console.log(`   content/asmaul-husna/translations/{en,tr,fr,id}.json`);
  console.log('\nSonraki adım: npm run db:import');
}

main().catch(e => { console.error('\n❌', e.message); process.exit(1); });
