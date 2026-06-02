/**
 * prayerSettings — Namaz vakti hesaplama ayarları (yüksek doğruluk)
 *
 * Namaz vakitleri `adhan` ile YERELDE (offline, astronomik kesin) hesaplanır.
 * Doğruluğun anahtarı bölgeye DOĞRU hesaplama metodunu uygulamaktır:
 *  - Twilight açıları (Fajr/Isha) ülkeden ülkeye değişir.
 *  - Her ülkenin resmî dinî otoritesi (Diyanet, Umm al-Qura, ISNA, vb.) farklı
 *    açı kullanır. Yanlış metot → 10-20 dk sapma. Bu yüzden ülke kodundan
 *    OTOMATİK doğru metot seçilir; kullanıcı dilerse manuel değiştirir.
 *
 * Ayarlar AsyncStorage'da. Senkron erişim için bellek-içi snapshot + abonelik
 * (hook ve widget senkronu sync `computeSlots` çağırır).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CalculationMethod,
  CalculationParameters,
  Madhab,
  HighLatitudeRule,
} from 'adhan';

export type MethodKey =
  | 'MuslimWorldLeague' | 'Egyptian' | 'Karachi' | 'UmmAlQura' | 'Dubai'
  | 'MoonsightingCommittee' | 'NorthAmerica' | 'Kuwait' | 'Qatar'
  | 'Singapore' | 'Tehran' | 'Turkey' | 'Indonesia';

export type MadhabKey = 'shafi' | 'hanafi';
export type HighLatKey = 'middleOfNight' | 'seventhOfNight' | 'twilightAngle';

export interface PrayerSettings {
  /** 'auto' → ülkeye göre otomatik seçilir. */
  method: MethodKey | 'auto';
  madhab: MadhabKey;
  highLat: HighLatKey;
}

const KEY = 'huda_prayer_settings';

export const DEFAULT_SETTINGS: PrayerSettings = {
  method: 'auto',
  madhab: 'shafi',
  highLat: 'middleOfNight',
};

/** İnsan-okunur metot etiketleri (ülke otoritesi parantezde). */
export const METHOD_LABELS: Record<MethodKey, string> = {
  Turkey: 'Diyanet (Turkey)',
  UmmAlQura: 'Umm al-Qura (Makkah)',
  Egyptian: 'Egyptian Authority',
  Karachi: 'Univ. of Islamic Sciences, Karachi',
  NorthAmerica: 'ISNA (North America)',
  MuslimWorldLeague: 'Muslim World League',
  Dubai: 'Dubai (UAE)',
  Qatar: 'Qatar',
  Kuwait: 'Kuwait',
  Singapore: 'Singapore (MUIS)',
  Indonesia: 'Kemenag (Indonesia)',
  Tehran: 'Univ. of Tehran',
  MoonsightingCommittee: 'Moonsighting Committee',
};

/** Metot seçim listesinin gösterim sırası. */
export const METHOD_ORDER: MethodKey[] = [
  'MuslimWorldLeague', 'Turkey', 'NorthAmerica', 'Egyptian', 'UmmAlQura',
  'Karachi', 'Dubai', 'Qatar', 'Kuwait', 'Singapore', 'Indonesia',
  'Tehran', 'MoonsightingCommittee',
];

/**
 * ISO ülke kodu → resmî hesaplama metodu.
 * Kaynak: her ülkenin resmî dinî otoritesinin yayımladığı twilight açıları.
 */
const COUNTRY_METHOD: Record<string, MethodKey> = {
  // Türkiye
  TR: 'Turkey',
  // Körfez & Suudi Arabistan
  SA: 'UmmAlQura', YE: 'UmmAlQura',
  AE: 'Dubai',
  QA: 'Qatar',
  KW: 'Kuwait',
  BH: 'UmmAlQura', OM: 'UmmAlQura',
  // Mısır otoritesi bölgesi (Levant + Kuzey/Batı Afrika çoğunluğu)
  EG: 'Egyptian', SD: 'Egyptian', SY: 'Egyptian', IQ: 'Egyptian',
  JO: 'Egyptian', LB: 'Egyptian', PS: 'Egyptian',
  DZ: 'Egyptian', TN: 'Egyptian', LY: 'Egyptian', MA: 'Egyptian',
  SO: 'Egyptian', DJ: 'Egyptian', MR: 'Egyptian',
  // Karaçi (Güney/Orta Asya)
  PK: 'Karachi', IN: 'Karachi', BD: 'Karachi', AF: 'Karachi',
  LK: 'Karachi', NP: 'Karachi',
  // Kuzey Amerika
  US: 'NorthAmerica', CA: 'NorthAmerica', MX: 'NorthAmerica',
  // Güneydoğu Asya
  SG: 'Singapore', MY: 'Singapore', BN: 'Singapore',
  ID: 'Indonesia',
  // İran
  IR: 'Tehran',
};

/** Ülke kodundan metot çöz (bilinmiyorsa Muslim World League). */
export function methodForCountry(code?: string | null): MethodKey {
  if (!code) return 'MuslimWorldLeague';
  return COUNTRY_METHOD[code.toUpperCase()] ?? 'MuslimWorldLeague';
}

/** Verili ayar + ülke için etkin (resolved) metot anahtarı. */
export function effectiveMethod(s: PrayerSettings, countryCode?: string | null): MethodKey {
  return s.method === 'auto' ? methodForCountry(countryCode) : s.method;
}

function baseParams(method: MethodKey): CalculationParameters {
  switch (method) {
    // Endonezya Kemenag: Fajr 20° / Isha 18° (adhan'da hazır metot yok)
    case 'Indonesia': return new CalculationParameters('Other', 20, 18);
    default: return CalculationMethod[method]();
  }
}

/** adhan CalculationParameters üret (madhab + yüksek enlem kuralı uygulanmış). */
export function buildParams(
  s: PrayerSettings,
  countryCode?: string | null,
): CalculationParameters {
  const params = baseParams(effectiveMethod(s, countryCode));
  params.madhab = s.madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  params.highLatitudeRule =
    s.highLat === 'seventhOfNight' ? HighLatitudeRule.SeventhOfTheNight
    : s.highLat === 'twilightAngle' ? HighLatitudeRule.TwilightAngle
    : HighLatitudeRule.MiddleOfTheNight;
  return params;
}

// ── Bellek-içi snapshot + abonelik (senkron erişim) ────────────────────────

let _snapshot: PrayerSettings = DEFAULT_SETTINGS;
let _loaded = false;
const _listeners = new Set<() => void>();

export function getSettingsSnapshot(): PrayerSettings {
  return _snapshot;
}

export function subscribePrayerSettings(fn: () => void): () => void {
  _listeners.add(fn);
  return () => { _listeners.delete(fn); };
}

function notify() { _listeners.forEach((fn) => fn()); }

export async function loadPrayerSettings(): Promise<PrayerSettings> {
  if (_loaded) return _snapshot;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) _snapshot = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { /* yoksay */ }
  _loaded = true;
  notify();
  return _snapshot;
}

export async function savePrayerSettings(s: PrayerSettings): Promise<void> {
  _snapshot = s;
  _loaded = true;
  notify();
  try { await AsyncStorage.setItem(KEY, JSON.stringify(s)); } catch { /* yoksay */ }
}
