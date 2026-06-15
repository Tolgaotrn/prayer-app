/**
 * widgetSync — uygulama verisini iOS App Group'a yazıp WidgetKit'i tazeler.
 * 8 widget tipi için: feed items (topic-filtered), prayer times, weather, streak.
 */
import { Platform } from 'react-native';
import { computeSlots, resolveLocation } from './prayerTimes';
import { loadPrayerSettings, buildParams } from './prayerSettings';
import { fetchFeedItems, resolveLang } from './contentDb';
import { translate, resolveUILang, type UILang } from './i18n';

const APP_GROUP = 'group.com.tolgaoturan.huda';
const DATA_KEY  = 'hudaWidgetData';
const DHIKR_KEY = 'hudaDhikr';

type Storage = {
  set: (k: string, v: string) => void;
  get: (k: string) => string | null;
};
let _storage: Storage | null = null;
let _reload: (() => void) | null = null;

function getBridge(): { storage: Storage; reload: () => void } | null {
  if (Platform.OS !== 'ios') return null;
  if (!_storage) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { ExtensionStorage } = require('@bacons/apple-targets');
      _storage = new ExtensionStorage(APP_GROUP);
      _reload  = () => ExtensionStorage.reloadWidget();
    } catch { return null; }
  }
  return _storage && _reload ? { storage: _storage, reload: _reload } : null;
}

// ── Weather via Open-Meteo (ücretsiz, API key yok) ──────────────

const WMO_SYMBOL: Record<number, string> = {
  0: 'sun.max.fill', 1: 'cloud.sun.fill', 2: 'cloud.sun.fill', 3: 'cloud.fill',
  45: 'cloud.fog.fill', 48: 'cloud.fog.fill',
  51: 'cloud.drizzle.fill', 53: 'cloud.drizzle.fill', 55: 'cloud.drizzle.fill',
  61: 'cloud.rain.fill', 63: 'cloud.rain.fill', 65: 'cloud.heavyrain.fill',
  71: 'cloud.snow.fill', 73: 'cloud.snow.fill', 75: 'cloud.snow.fill',
  80: 'cloud.rain.fill', 81: 'cloud.rain.fill', 82: 'cloud.heavyrain.fill',
  95: 'cloud.bolt.rain.fill', 96: 'cloud.bolt.rain.fill', 99: 'cloud.bolt.rain.fill',
};

// WMO kodu → i18n anahtarı (widget'ta da çeviri görünsün diye)
const WMO_CONDITION_KEY: Record<number, string> = {
  0: 'weather.clear', 1: 'weather.clear', 2: 'weather.partlyCloudy', 3: 'weather.overcast',
  45: 'weather.fog', 48: 'weather.fog',
  51: 'weather.drizzle', 53: 'weather.drizzle', 55: 'weather.drizzle',
  61: 'weather.rain', 63: 'weather.rain', 65: 'weather.rain',
  71: 'weather.snow', 73: 'weather.snow', 75: 'weather.snow',
  80: 'weather.showers', 81: 'weather.showers', 82: 'weather.showers',
  95: 'weather.thunderstorm', 96: 'weather.thunderstorm', 99: 'weather.thunderstorm',
};

async function fetchWeather(lat: number, lon: number, uiLang: UILang): Promise<{
  temp: string; condition: string; sfSymbol: string; high: string; low: string
} | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&temperature_unit=celsius&forecast_days=1&timezone=auto`;
    const res  = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const code = json.current?.weather_code ?? 0;
    const temp = Math.round(json.current?.temperature_2m ?? 0);
    const high = Math.round(json.daily?.temperature_2m_max?.[0] ?? temp);
    const low  = Math.round(json.daily?.temperature_2m_min?.[0] ?? temp);
    return {
      temp:      `${temp}°`,
      high:      `${high}°`,
      low:       `${low}°`,
      condition: translate(uiLang, WMO_CONDITION_KEY[code] ?? 'weather.clear'),
      sfSymbol:  WMO_SYMBOL[code]    ?? 'sun.max.fill',
    };
  } catch { return null; }
}

// ── Main sync ────────────────────────────────────────────────────

let _lastSync = 0;

export async function syncWidget(opts: {
  language?:       string;
  streakDays:      number;
  force?:          boolean;
  followedTopics?: string[];
  isPremium?:      boolean;
  savedVerseIds?:  string[];
  themeImageURL?:  string;
  homeContent?:    string; // 'auto'|'prayer'|'verse'|'hadith'|'quote'|'streak'
  lockContent?:    string;
}): Promise<void> {
  const bridge = getBridge();
  if (!bridge) return;

  const now = Date.now();
  if (!opts.force && now - _lastSync < 60_000) return;
  _lastSync = now;

  const lang       = resolveLang(opts.language);
  const uiLang     = resolveUILang(opts.language);
  const arabicOnly = opts.language === 'Arabic';
  const topics  = opts.followedTopics ?? ['General'];
  const premium = opts.isPremium      ?? false;
  const saved   = opts.savedVerseIds  ?? [];

  // ── Namaz vakitleri (bağımsız, hata olursa boş) ──────────────
  let city = 'Istanbul';
  let prayers: { name: string; time: string; epoch: number }[] = [];
  let tomorrowFajrOut: { name: string; time: string; epoch: number } | null = null;
  let lat = 41.0082, lon = 28.9784; // İstanbul fallback

  try {
    const settings = await loadPrayerSettings();
    const loc      = await resolveLocation();
    city = loc.city || city;
    lat  = loc.latitude;
    lon  = loc.longitude;
    const params   = buildParams(settings, loc.countryCode);
    const today    = new Date();
    const tomorrow = new Date(today.getTime() + 86_400_000);

    const slots = computeSlots(lat, lon, today, params)
      .filter((s) => s.key !== 'sunrise');
    prayers = slots.map((s) => ({
      name:  s.name,
      time:  s.time,
      epoch: Math.floor(s.date.getTime() / 1000),
    }));

    const tf = computeSlots(lat, lon, tomorrow, params).find((s) => s.key === 'fajr');
    if (tf) tomorrowFajrOut = {
      name: tf.name, time: tf.time, epoch: Math.floor(tf.date.getTime() / 1000),
    };
  } catch { /* namaz vakti hesaplanamadı — boş geç */ }

  // ── Feed + hava durumu (bağımsız, best-effort) ───────────────
  let feedItems: { id: string; kind: string; arabic: string; text: string; meta: string }[] = [];
  let weather: Awaited<ReturnType<typeof fetchWeather>> = null;

  try {
    const [rawItems, w] = await Promise.all([
      fetchFeedItems(lang, 10, topics, premium, saved, false, arabicOnly).catch(() => []),
      fetchWeather(lat, lon, uiLang).catch(() => null),
    ]);
    feedItems = rawItems.slice(0, 10).map((item: any) => ({
      id:     item.id,
      kind:   item.kind,
      arabic: item.arabic ?? '',
      // Arapça modunda İngilizce çeviri widget'a sızmasın → sadece Arapça
      text:   arabicOnly ? '' : (item.translation ?? item.text ?? ''),
      meta:   item.reference ?? item.source ?? item.author ?? '',
    }));
    weather = w;
  } catch { /* feed/hava alınamadı — boş geç */ }

  // ── HER ZAMAN yaz (streak + eldeki ne varsa) ─────────────────
  const payload = {
    feedItems,
    weather,
    city,
    prayers,
    tomorrowFajr:  tomorrowFajrOut,
    streakDays:    opts.streakDays ?? 0,
    themeImageURL: opts.themeImageURL || null,
    // Widget içerik tercihleri — Swift Provider 'auto' dışındaki seçimi
    // ilgili feed item'ına göre göstermeli (rebuild gerekir).
    homeContent:   opts.homeContent ?? 'auto',
    lockContent:   opts.lockContent ?? 'verse',
    updatedAt:     Math.floor(Date.now() / 1000),
  };

  try {
    bridge.storage.set(DATA_KEY, JSON.stringify(payload));
    bridge.reload();
  } catch { /* yazma başarısız */ }
}

// ── Dhikr (tesbih) köprüsü — app ↔ widget aynı sayacı paylaşır ────

export type DhikrShared = {
  arabic:   string;
  translit: string;
  target:   number;
  count:    number;
  rounds:   number;
  total:    number;
};

/** Widget'ın paylaşılan dhikr durumunu oku (widget'ta yapılan dokunuşları yakalamak için). */
export function readDhikr(): DhikrShared | null {
  const bridge = getBridge();
  if (!bridge) return null;
  try {
    const raw = bridge.storage.get(DHIKR_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (typeof d?.total !== 'number') return null;
    return d as DhikrShared;
  } catch { return null; }
}

/** Paylaşılan dhikr durumunu yaz + widget'ı yenile. */
export function writeDhikr(state: DhikrShared): void {
  const bridge = getBridge();
  if (!bridge) return;
  try {
    bridge.storage.set(DHIKR_KEY, JSON.stringify(state));
    bridge.reload();
  } catch { /* yazma başarısız */ }
}
