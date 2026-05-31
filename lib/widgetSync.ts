/**
 * widgetSync — uygulama verisini iOS App Group'a yazıp WidgetKit'i tazeler.
 *
 * Swift tarafı (targets/widget/NoorWidgetData.swift) "noorWidgetData" anahtarından
 * JSON okur. Sadece iOS'ta çalışır; web/Android'de no-op.
 *
 * Çağrı noktaları: home-card açılışı, feed açılışı, streak/dil değişimi,
 * konum güncellemesi. syncWidget() debounce'lu — sık çağrılsa da zarar vermez.
 */
import { Platform } from 'react-native';
import { computeSlots, resolveLocation } from './prayerTimes';
import { fetchDailyVerse, resolveLang } from './contentDb';

const APP_GROUP = 'group.com.noor.app';
const DATA_KEY = 'noorWidgetData';

// @bacons/apple-targets'i sadece iOS'ta lazy yükle (web'de global `expo` yok → import patlar)
type Storage = { set: (k: string, v: string) => void };
let _storage: Storage | null = null;
let _reload: (() => void) | null = null;

function getBridge(): { storage: Storage; reload: () => void } | null {
  if (Platform.OS !== 'ios') return null;
  if (!_storage) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { ExtensionStorage } = require('@bacons/apple-targets');
      _storage = new ExtensionStorage(APP_GROUP);
      _reload = () => ExtensionStorage.reloadWidget();
    } catch {
      return null;
    }
  }
  return _storage && _reload ? { storage: _storage, reload: _reload } : null;
}

let _lastSync = 0;

export async function syncWidget(opts: {
  language?: string;
  streakDays: number;
  force?: boolean;
}): Promise<void> {
  const bridge = getBridge();
  if (!bridge) return;

  // 60 sn debounce (force ile atlanır)
  const now = Date.now();
  if (!opts.force && now - _lastSync < 60_000) return;
  _lastSync = now;

  try {
    const loc = await resolveLocation();
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 86_400_000);

    const slots = computeSlots(loc.latitude, loc.longitude, today)
      .filter((s) => s.key !== 'sunrise');
    const tomorrowFajrSlot = computeSlots(loc.latitude, loc.longitude, tomorrow)
      .find((s) => s.key === 'fajr');

    const lang = resolveLang(opts.language);
    let daily = null;
    try { daily = await fetchDailyVerse(lang); } catch { /* offline → boş */ }

    const payload = {
      verseArabic: daily?.arabic ?? '',
      verseTranslation: daily?.translation ?? '',
      verseReference: daily?.reference ?? '',
      city: loc.city,
      prayers: slots.map((s) => ({
        name: s.name,
        time: s.time,
        epoch: Math.floor(s.date.getTime() / 1000),
      })),
      tomorrowFajr: tomorrowFajrSlot
        ? {
            name: tomorrowFajrSlot.name,
            time: tomorrowFajrSlot.time,
            epoch: Math.floor(tomorrowFajrSlot.date.getTime() / 1000),
          }
        : null,
      streakDays: opts.streakDays,
      updatedAt: Math.floor(Date.now() / 1000),
    };

    bridge.storage.set(DATA_KEY, JSON.stringify(payload));
    bridge.reload();
  } catch {
    /* widget senkronu kritik değil — sessiz geç */
  }
}
