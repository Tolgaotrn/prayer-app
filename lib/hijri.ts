/**
 * hijri — Gregoryen → Hicrî tarih dönüşümü (tablo tabanlı Kuveyti algoritması).
 *
 * Çevrimdışı çalışır, ek bağımlılık yok. ±1 gün resmî hilal gözlemine göre
 * normaldir (her ülke ayı kendi gözlemine göre başlatır) — bu yüzden küçük bir
 * `offset` (gün) desteklenir. Sadece dekoratif/bilgilendirici; namaz vakti
 * hesabını ETKİLEMEZ.
 */
export interface HijriDate { day: number; month: number; year: number; }

const MONTHS_EN = [
  'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Jumada al-Awwal',
  'Jumada al-Thani', 'Rajab', 'Shaban', 'Ramadan', 'Shawwal',
  'Dhul-Qadah', 'Dhul-Hijjah',
];

const MONTHS_AR = [
  'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى',
  'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال',
  'ذو القعدة', 'ذو الحجة',
];

export function gregorianToHijri(date: Date, offsetDays = 0): HijriDate {
  const d = new Date(date.getTime() + offsetDays * 86_400_000);
  const day = d.getDate();
  let m = d.getMonth() + 1;
  let y = d.getFullYear();
  if (m < 3) { y -= 1; m += 12; }

  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  let jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524;

  jd = jd - 1948440 + 10632;
  const n = Math.floor((jd - 1) / 10631);
  jd = jd - 10631 * n + 354;
  const j = Math.floor((10985 - jd) / 5316) * Math.floor((50 * jd) / 17719)
          + Math.floor(jd / 5670) * Math.floor((43 * jd) / 15238);
  jd = jd - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50)
         - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const month = Math.floor((24 * jd) / 709);
  const dayOut = jd - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;

  return { day: dayOut, month, year };
}

/** "12 Ramadan 1447 AH" gibi biçim. lang='ar' → Arapça ay adı. */
export function formatHijri(h: HijriDate, lang: 'en' | 'ar' = 'en'): string {
  const names = lang === 'ar' ? MONTHS_AR : MONTHS_EN;
  const name = names[(h.month - 1 + 12) % 12];
  if (lang === 'ar') return `${h.day} ${name} ${h.year}`;
  return `${h.day} ${name} ${h.year} AH`;
}
