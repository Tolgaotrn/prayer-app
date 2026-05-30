import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const API_BASE = 'https://api.alquran.cloud/v1';
const OUTPUT_DIR = path.join(rootDir, 'content', 'verses');

const DEFAULT_LIMIT = 3000;
const DEFAULT_LANGUAGES = ['ar', 'en', 'tr', 'fr', 'id'];
const DEFAULT_EDITIONS = {
  ar: 'quran-uthmani',
  en: 'en.sahih',
  tr: 'tr.diyanet',
  fr: 'fr.hamidullah',
  id: 'id.indonesian',
};

const SURAH_NAMES = {
  1: ['Al-Fatihah', 'الفاتحة'],
  2: ['Al-Baqarah', 'البقرة'],
  3: ['Ali Imran', 'آل عمران'],
  4: ['An-Nisa', 'النساء'],
  5: ['Al-Maidah', 'المائدة'],
  6: ['Al-Anam', 'الأنعام'],
  7: ['Al-Araf', 'الأعراف'],
  8: ['Al-Anfal', 'الأنفال'],
  9: ['At-Tawbah', 'التوبة'],
  10: ['Yunus', 'يونس'],
  11: ['Hud', 'هود'],
  12: ['Yusuf', 'يوسف'],
  13: ['Ar-Rad', 'الرعد'],
  14: ['Ibrahim', 'إبراهيم'],
  15: ['Al-Hijr', 'الحجر'],
  16: ['An-Nahl', 'النحل'],
  17: ['Al-Isra', 'الإسراء'],
  18: ['Al-Kahf', 'الكهف'],
  19: ['Maryam', 'مريم'],
  20: ['Ta-Ha', 'طه'],
  21: ['Al-Anbiya', 'الأنبياء'],
  22: ['Al-Hajj', 'الحج'],
  23: ['Al-Muminun', 'المؤمنون'],
  24: ['An-Nur', 'النور'],
  25: ['Al-Furqan', 'الفرقان'],
  26: ['Ash-Shuara', 'الشعراء'],
  27: ['An-Naml', 'النمل'],
  28: ['Al-Qasas', 'القصص'],
  29: ['Al-Ankabut', 'العنكبوت'],
  30: ['Ar-Rum', 'الروم'],
  31: ['Luqman', 'لقمان'],
  32: ['As-Sajdah', 'السجدة'],
  33: ['Al-Ahzab', 'الأحزاب'],
  34: ['Saba', 'سبأ'],
  35: ['Fatir', 'فاطر'],
  36: ['Ya-Sin', 'يس'],
  37: ['As-Saffat', 'الصافات'],
  38: ['Sad', 'ص'],
  39: ['Az-Zumar', 'الزمر'],
  40: ['Ghafir', 'غافر'],
  41: ['Fussilat', 'فصلت'],
  42: ['Ash-Shura', 'الشورى'],
  43: ['Az-Zukhruf', 'الزخرف'],
  44: ['Ad-Dukhan', 'الدخان'],
  45: ['Al-Jathiyah', 'الجاثية'],
  46: ['Al-Ahqaf', 'الأحقاف'],
  47: ['Muhammad', 'محمد'],
  48: ['Al-Fath', 'الفتح'],
  49: ['Al-Hujurat', 'الحجرات'],
  50: ['Qaf', 'ق'],
  51: ['Adh-Dhariyat', 'الذاريات'],
  52: ['At-Tur', 'الطور'],
  53: ['An-Najm', 'النجم'],
  54: ['Al-Qamar', 'القمر'],
  55: ['Ar-Rahman', 'الرحمن'],
  56: ['Al-Waqiah', 'الواقعة'],
  57: ['Al-Hadid', 'الحديد'],
  58: ['Al-Mujadila', 'المجادلة'],
  59: ['Al-Hashr', 'الحشر'],
  60: ['Al-Mumtahanah', 'الممتحنة'],
  61: ['As-Saff', 'الصف'],
  62: ['Al-Jumuah', 'الجمعة'],
  63: ['Al-Munafiqun', 'المنافقون'],
  64: ['At-Taghabun', 'التغابن'],
  65: ['At-Talaq', 'الطلاق'],
  66: ['At-Tahrim', 'التحريم'],
  67: ['Al-Mulk', 'الملك'],
  68: ['Al-Qalam', 'القلم'],
  69: ['Al-Haqqah', 'الحاقة'],
  70: ['Al-Maarij', 'المعارج'],
  71: ['Nuh', 'نوح'],
  72: ['Al-Jinn', 'الجن'],
  73: ['Al-Muzzammil', 'المزمل'],
  74: ['Al-Muddaththir', 'المدثر'],
  75: ['Al-Qiyamah', 'القيامة'],
  76: ['Al-Insan', 'الإنسان'],
  77: ['Al-Mursalat', 'المرسلات'],
  78: ['An-Naba', 'النبأ'],
  79: ['An-Naziat', 'النازعات'],
  80: ['Abasa', 'عبس'],
  81: ['At-Takwir', 'التكوير'],
  82: ['Al-Infitar', 'الإنفطار'],
  83: ['Al-Mutaffifin', 'المطففين'],
  84: ['Al-Inshiqaq', 'الإنشقاق'],
  85: ['Al-Buruj', 'البروج'],
  86: ['At-Tariq', 'الطارق'],
  87: ['Al-Ala', 'الأعلى'],
  88: ['Al-Ghashiyah', 'الغاشية'],
  89: ['Al-Fajr', 'الفجر'],
  90: ['Al-Balad', 'البلد'],
  91: ['Ash-Shams', 'الشمس'],
  92: ['Al-Layl', 'الليل'],
  93: ['Ad-Duha', 'الضحى'],
  94: ['Ash-Sharh', 'الشرح'],
  95: ['At-Tin', 'التين'],
  96: ['Al-Alaq', 'العلق'],
  97: ['Al-Qadr', 'القدر'],
  98: ['Al-Bayyinah', 'البينة'],
  99: ['Az-Zalzalah', 'الزلزلة'],
  100: ['Al-Adiyat', 'العاديات'],
  101: ['Al-Qariah', 'القارعة'],
  102: ['At-Takathur', 'التكاثر'],
  103: ['Al-Asr', 'العصر'],
  104: ['Al-Humazah', 'الهمزة'],
  105: ['Al-Fil', 'الفيل'],
  106: ['Quraysh', 'قريش'],
  107: ['Al-Maun', 'الماعون'],
  108: ['Al-Kawthar', 'الكوثر'],
  109: ['Al-Kafirun', 'الكافرون'],
  110: ['An-Nasr', 'النصر'],
  111: ['Al-Masad', 'المسد'],
  112: ['Al-Ikhlas', 'الإخلاص'],
  113: ['Al-Falaq', 'الفلق'],
  114: ['An-Nas', 'الناس'],
};

const FEATURED_KEYS = new Set([
  '1:1', '1:2', '1:3', '1:4', '1:5', '1:6', '1:7',
  '2:45', '2:152', '2:155', '2:156', '2:186', '2:201', '2:255', '2:286',
  '3:8', '3:26', '3:139', '3:159', '3:173',
  '9:40', '13:28', '14:7', '17:23', '18:10', '20:25', '20:114',
  '21:87', '24:35', '25:63', '28:24', '33:35', '39:53',
  '40:60', '49:10', '49:13', '55:13', '65:2', '65:3', '93:5',
  '94:5', '94:6', '112:1', '112:2', '112:3', '112:4',
  '113:1', '113:2', '113:3', '113:4', '113:5',
  '114:1', '114:2', '114:3', '114:4', '114:5', '114:6',
]);

const TOPIC_PATTERNS = [
  ['hope', /hope|mercy|forgiv|relief|despair|rahman|rahim|compassion/i],
  ['patience', /patien|steadfast|endure|sabr|persever/i],
  ['gratitude', /grateful|gratitude|thank|praise|favor|blessing/i],
  ['prayer', /prayer|supplication|call upon|remember me|worship|guide us/i],
  ['tawakkul', /trust|rely|sufficient|protector|guardian|provider/i],
  ['peace', /peace|heart|tranquil|light|near|comfort|fear not|grieve/i],
  ['character', /kind|parents|justice|charity|good|righteous|humble/i],
];

function parseArgs(argv) {
  const args = {
    limit: DEFAULT_LIMIT,
    languages: DEFAULT_LANGUAGES,
    outDir: OUTPUT_DIR,
  };

  for (const arg of argv) {
    const [key, value = ''] = arg.split('=');
    if (key === '--limit') args.limit = Number.parseInt(value, 10);
    if (key === '--languages') args.languages = value.split(',').map((v) => v.trim()).filter(Boolean);
    if (key === '--out') args.outDir = path.resolve(rootDir, value);
  }

  return args;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  return response.json();
}

async function loadEdition(identifier) {
  const payload = await fetchJson(`${API_BASE}/quran/${identifier}`);
  if (payload.code !== 200 || !payload.data?.surahs) throw new Error(`Unexpected Quran API payload for ${identifier}`);
  return payload.data.surahs.flatMap((surah) => surah.ayahs.map((ayah) => ({
    surah: surah.number,
    ayah: ayah.numberInSurah,
    globalAyah: ayah.number,
    juz: ayah.juz,
    page: ayah.page,
    text: ayah.text,
  })));
}

function keyOf(row) {
  return `${row.surah}:${row.ayah}`;
}

function getTopics(englishText) {
  return TOPIC_PATTERNS.filter(([, pattern]) => pattern.test(englishText)).map(([topic]) => topic);
}

function scoreVerse(row, englishText) {
  const key = keyOf(row);
  const topics = getTopics(englishText);
  const textLength = englishText.length;
  let score = 0;

  if (FEATURED_KEYS.has(key)) score += 1000;
  score += topics.length * 70;
  if (row.surah >= 78) score += 40;
  if (row.surah === 1) score += 80;
  if ([18, 36, 55, 56, 67, 93, 94, 112, 113, 114].includes(row.surah)) score += 60;
  if (textLength >= 35 && textLength <= 220) score += 35;
  if (textLength > 450) score -= 40;
  if (textLength > 800) score -= 80;

  return { score, topics };
}

function selectVerses(arabicRows, englishRows, limit) {
  const englishByKey = new Map(englishRows.map((row) => [keyOf(row), row]));
  return arabicRows
    .map((row) => {
      const english = englishByKey.get(keyOf(row))?.text ?? '';
      const { score, topics } = scoreVerse(row, english);
      return { row, score, topics };
    })
    .sort((a, b) => b.score - a.score || a.row.globalAyah - b.row.globalAyah)
    .slice(0, limit)
    .sort((a, b) => a.row.globalAyah - b.row.globalAyah);
}

async function writeJson(filePath, data) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.languages.includes('ar')) args.languages.unshift('ar');
  if (!args.languages.includes('en')) args.languages.push('en');

  const editions = new Map();
  for (const language of args.languages) {
    const edition = DEFAULT_EDITIONS[language];
    if (!edition) throw new Error(`Unsupported language "${language}". Add an edition first.`);
    editions.set(language, await loadEdition(edition));
  }

  const selected = selectVerses(editions.get('ar'), editions.get('en'), args.limit);
  const selectedKeys = new Set(selected.map(({ row }) => keyOf(row)));

  const base = selected.map(({ row, score, topics }) => {
    const [surahName, surahArabicName] = SURAH_NAMES[row.surah] ?? [`Surah ${row.surah}`, ''];
    return {
      id: `quran_${row.surah}_${row.ayah}`,
      key: keyOf(row),
      surah: row.surah,
      surahName,
      surahArabicName,
      ayah: row.ayah,
      juz: row.juz,
      page: row.page,
      arabic: row.text,
      topics,
      popularityScore: score,
      displaySafe: true,
      needsContext: false,
      source: DEFAULT_EDITIONS.ar,
    };
  });

  await writeJson(path.join(args.outDir, 'base.json'), base);

  for (const language of args.languages.filter((l) => l !== 'ar')) {
    const rows = editions.get(language)
      .filter((row) => selectedKeys.has(keyOf(row)))
      .sort((a, b) => a.globalAyah - b.globalAyah)
      .map((row) => ({
        id: `quran_${row.surah}_${row.ayah}`,
        key: keyOf(row),
        language,
        text: row.text,
        verified: false,
        translationSource: DEFAULT_EDITIONS[language],
      }));
    await writeJson(path.join(args.outDir, 'translations', `${language}.json`), rows);
  }

  await writeJson(path.join(args.outDir, 'manifest.json'), {
    generatedAt: new Date().toISOString(),
    source: 'Al Quran Cloud API',
    editions: Object.fromEntries(args.languages.map((language) => [language, DEFAULT_EDITIONS[language]])),
    count: base.length,
    selection: 'Scored subset using featured keys, Noor-friendly topics, short/medium verse length, and well-known surahs.',
    note: 'These are real Quran verses from the selected editions. Translation verification should be reviewed before marking verified=true.',
  });

  console.log(`Imported ${base.length} Quran verses into ${path.relative(rootDir, args.outDir)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
