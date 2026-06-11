/**
 * prayerTimes — konum bazlı namaz vakitleri (adhan + expo-location).
 *
 * usePrayerTimes() hook'u: izin ister, konumu alır, adhan ile vakitleri
 * hesaplar, şehir adını reverse-geocode eder, sıradaki vakti + geri sayımı
 * döndürür. İzin yoksa/hatada en son bilinen konuma, o da yoksa İstanbul'a düşer.
 *
 * Sağlamlık notları:
 *  - Konum + şehir AsyncStorage'a cache'lenir → uygulama açılır açılmaz
 *    (izin diyaloğu beklemeden) en son konum gösterilir.
 *  - getCurrentPositionAsync bazı cihazlarda asılı kalabiliyor → timeout +
 *    getLastKnownPositionAsync fallback ile sarmalandı.
 *  - computeSlots / nextPrayerInfo widget senkronu için de export edilir.
 */
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import {
  Coordinates,
  CalculationParameters,
  PrayerTimes as AdhanPrayerTimes,
  Prayer,
} from 'adhan';
import {
  buildParams,
  getSettingsSnapshot,
  loadPrayerSettings,
  subscribePrayerSettings,
  effectiveMethod,
} from './prayerSettings';

export interface PrayerSlot {
  key: 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  name: string;
  icon: 'partly-sunny-outline' | 'sunny-outline' | 'moon-outline';
  time: string;   // "HH:MM"
  date: Date;
}

export interface PrayerInfo {
  slots: PrayerSlot[];
  nextKey: PrayerSlot['key'] | null;
  prevKey: PrayerSlot['key'] | null;
  countdown: string;   // "2h 14m"
  /** Bir önceki vakitten sıradakine geçişte 0..1 ilerleme (progress halkası için). */
  progress: number;
  /** Sıradaki vaktin tam zamanı (geri sayım/animasyon için). */
  nextTarget: Date | null;
  city: string;
  countryCode: string | null;
  coords: { latitude: number; longitude: number };
  loading: boolean;
  /** Gerçek (cihaz/cache) konum çözüldü mü? false → İstanbul fallback'i,
   *  UI bunu "Set location" olarak göstermeli (yanıltıcı şehir adı basmaz). */
  resolved: boolean;
}

// Varsayılan: İstanbul (izin yoksa ve cache de yoksa)
const FALLBACK = { latitude: 41.0082, longitude: 28.9784, city: 'Istanbul', countryCode: 'TR' };
const CACHE_KEY = 'huda_last_location';

// Son bilinen ülke kodu — 'auto' metot çözümü için senkron erişim gerekir.
let _lastCountryCode: string | null = 'TR';

/** Etkin hesaplama parametreleri (kayıtlı ayar + son ülke). */
function currentParams(countryCode?: string | null): CalculationParameters {
  return buildParams(getSettingsSnapshot(), countryCode ?? _lastCountryCode);
}

const META: Record<PrayerSlot['key'], { name: string; icon: PrayerSlot['icon'] }> = {
  fajr:    { name: 'Fajr',    icon: 'partly-sunny-outline' },
  sunrise: { name: 'Sunrise', icon: 'sunny-outline' },
  dhuhr:   { name: 'Dhuhr',   icon: 'sunny-outline' },
  asr:     { name: 'Asr',     icon: 'sunny-outline' },
  maghrib: { name: 'Maghrib', icon: 'partly-sunny-outline' },
  isha:    { name: 'Isha',    icon: 'moon-outline' },
};

// Hangi vakitler gösterilsin (sunrise namaz değil ama vakit olarak gösterilir)
const SLOT_ORDER: PrayerSlot['key'][] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

function fmt(d: Date): string {
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export function computeSlots(
  lat: number,
  lng: number,
  date: Date,
  params: CalculationParameters = currentParams(),
): PrayerSlot[] {
  const coords = new Coordinates(lat, lng);
  const pt = new AdhanPrayerTimes(coords, date, params);
  const byKey: Record<PrayerSlot['key'], Date> = {
    fajr: pt.fajr,
    sunrise: pt.sunrise,
    dhuhr: pt.dhuhr,
    asr: pt.asr,
    maghrib: pt.maghrib,
    isha: pt.isha,
  };
  return SLOT_ORDER.map((key) => ({
    key,
    name: META[key].name,
    icon: META[key].icon,
    time: fmt(byKey[key]),
    date: byKey[key],
  }));
}

export function nextPrayerInfo(
  lat: number,
  lng: number,
  now: Date,
  params: CalculationParameters = currentParams(),
): { key: PrayerSlot['key'] | null; target: Date | null } {
  const coords = new Coordinates(lat, lng);
  const pt = new AdhanPrayerTimes(coords, now, params);
  const next = pt.nextPrayer();
  if (next === Prayer.None) {
    // Bugünün vakitleri bitti → yarının Fajr'ı
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const ptT = new AdhanPrayerTimes(coords, tomorrow, params);
    return { key: 'fajr', target: ptT.fajr };
  }
  const map: Record<string, PrayerSlot['key']> = {
    [Prayer.Fajr]: 'fajr',
    [Prayer.Sunrise]: 'sunrise',
    [Prayer.Dhuhr]: 'dhuhr',
    [Prayer.Asr]: 'asr',
    [Prayer.Maghrib]: 'maghrib',
    [Prayer.Isha]: 'isha',
  };
  const key = map[next as unknown as string] ?? null;
  const target = key ? pt.timeForPrayer(next) ?? null : null;
  return { key, target };
}

/** Bir önceki vaktin zamanı (progress halkası için). */
function prevPrayerTime(
  lat: number,
  lng: number,
  now: Date,
  params: CalculationParameters,
): Date | null {
  const coords = new Coordinates(lat, lng);
  const pt = new AdhanPrayerTimes(coords, now, params);
  const cur = pt.currentPrayer();
  if (cur === Prayer.None) {
    // Gece yarısı civarı, bugünün ilk vaktinden önce → dünün Isha'sı
    const yest = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const ptY = new AdhanPrayerTimes(coords, yest, params);
    return ptY.isha;
  }
  return pt.timeForPrayer(cur) ?? null;
}

export function countdownStr(from: Date, to: Date): string {
  let mins = Math.max(0, Math.round((to.getTime() - from.getTime()) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

type StoredLoc = { latitude: number; longitude: number; city: string; countryCode?: string | null; resolved?: boolean; manual?: boolean };

// ── Konum değişimi pub/sub ──────────────────────────────────────────
// usePrayerTimes mount'ta bir kez çözüyor; manuel şehir seçimi sonrası
// (hook zaten mount'tayken) yeniden okuması için sinyal gerekir.
const _locListeners = new Set<() => void>();
function notifyLocationChange(): void {
  _locListeners.forEach((cb) => { try { cb(); } catch { /* yoksay */ } });
}
export function subscribeLocation(cb: () => void): () => void {
  _locListeners.add(cb);
  return () => { _locListeners.delete(cb); };
}

async function readCachedLocation(): Promise<StoredLoc | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.latitude === 'number' && typeof parsed?.longitude === 'number') {
      return parsed as StoredLoc;
    }
  } catch { /* yoksay */ }
  return null;
}

async function writeCachedLocation(loc: StoredLoc): Promise<void> {
  try { await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(loc)); } catch { /* yoksay */ }
}

/** Cihazda kayıtlı (cache'lenmiş) bir konum var mı? */
export async function hasStoredLocation(): Promise<boolean> {
  return (await readCachedLocation()) !== null;
}

/** Konum izninin mevcut durumu (dialog açmadan kontrol). */
export async function getLocationPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status as 'granted' | 'denied' | 'undetermined';
  } catch {
    return 'undetermined';
  }
}

/** Konum iznini iste, verilirse gerçek konumu çöz + cache'le. */
export async function enableDeviceLocation(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return false;
  await resolveLocation({ ignoreManual: true }); // GPS'i manuel seçimin önüne al
  notifyLocationChange();
  return true;
}

/** Kullanıcının seçtiği şehri manuel konum olarak kaydet.
 *  manual:true → resolveLocation bunu GPS ile EZMEZ (kullanıcı bilerek seçti). */
export async function setManualLocation(loc: StoredLoc): Promise<void> {
  await writeCachedLocation({ ...loc, resolved: true, manual: true });
  _lastCountryCode = loc.countryCode ?? _lastCountryCode;
  notifyLocationChange();
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error('location-timeout')), ms);
    p.then(
      (v) => { clearTimeout(id); resolve(v); },
      (e) => { clearTimeout(id); reject(e); },
    );
  });
}

/**
 * En güncel konumu çözer (izin → currentPosition → lastKnown → cache → fallback).
 * Widget senkronu da bunu kullanabilsin diye hook dışında da export edilir.
 */
export async function resolveLocation(opts?: { ignoreManual?: boolean }): Promise<StoredLoc> {
  // 1) Önce cache (anında bir değer dönsün diye çağıran taraf zaten cache okur,
  //    ama burada da güvenli taban olarak kullanılır)
  const cached = await readCachedLocation();
  if (cached?.countryCode) _lastCountryCode = cached.countryCode;
  // cache gerçek bir konumdur → resolved:true. Sadece FALLBACK resolved:false.
  const cachedOr = (): StoredLoc =>
    cached ? { ...cached, resolved: true } : { ...FALLBACK, resolved: false };

  // Manuel seçilmiş şehir GPS ile ezilmez (enableDeviceLocation hariç).
  if (cached?.manual && !opts?.ignoreManual) return { ...cached, resolved: true };
  try {
    // İzni SADECE kontrol et — istek (dialog) burada açılmamalı. İzin kullanıcı
    // aksiyonuyla (location-setup ekranı) alınır. Aksi halde widget sync / feed
    // açılışında beklenmedik izin diyaloğu çıkardı.
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') return cachedOr();

    let pos: Location.LocationObject | null = null;
    try {
      pos = await withTimeout(
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
        8000,
      );
    } catch {
      // currentPosition asılırsa/başarısızsa son bilinen konum
      try { pos = await Location.getLastKnownPositionAsync(); } catch { /* yoksay */ }
    }
    if (!pos) return cachedOr();

    let city = cached?.city || FALLBACK.city;
    let countryCode = cached?.countryCode ?? FALLBACK.countryCode;
    try {
      const geo = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      city = geo[0]?.city || geo[0]?.region || geo[0]?.country || city;
      countryCode = geo[0]?.isoCountryCode || countryCode;
    } catch { /* reverse geocode opsiyonel */ }

    const resolved: StoredLoc = {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      city,
      countryCode,
      resolved: true,
    };
    _lastCountryCode = countryCode ?? _lastCountryCode;
    await writeCachedLocation(resolved);
    return resolved;
  } catch {
    return cachedOr();
  }
}

export function usePrayerTimes(): PrayerInfo {
  const [coords, setCoords] = React.useState<StoredLoc>(FALLBACK);
  const [loading, setLoading] = React.useState(true);
  const [tick, setTick] = React.useState(0);
  // Ayar değişimi (metot/madhab) → yeniden hesaplama tetikleyicisi
  const [settingsV, setSettingsV] = React.useState(0);

  // Konum: önce cache (anında), sonra canlı çözümleme
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadPrayerSettings();
      const cached = await readCachedLocation();
      if (cached && !cancelled) {
        setCoords({ ...cached, resolved: true });
        if (cached.countryCode) _lastCountryCode = cached.countryCode;
      }
      const resolved = await resolveLocation();
      if (!cancelled) {
        setCoords(resolved);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Ayar (hesaplama metodu) değişimine abone ol
  React.useEffect(() => subscribePrayerSettings(() => setSettingsV((v) => v + 1)), []);

  // Konum değişimine abone ol — manuel şehir seçimi sonrası cache'i yeniden oku.
  // (mount effect tekrar çalışmadığından, sinyal olmadan eski şehir kalırdı.)
  React.useEffect(() => subscribeLocation(() => {
    (async () => {
      const cached = await readCachedLocation();
      if (cached) {
        setCoords({ ...cached, resolved: true });
        if (cached.countryCode) _lastCountryCode = cached.countryCode;
      }
    })();
  }), []);

  // Her 30 sn geri sayımı/ilerlemeyi güncelle
  React.useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  return React.useMemo<PrayerInfo>(() => {
    const now = new Date();
    const params = currentParams(coords.countryCode);
    let slots: PrayerSlot[] = [];
    let next: { key: PrayerSlot['key'] | null; target: Date | null } = { key: null, target: null };
    let prevTime: Date | null = null;
    try {
      slots = computeSlots(coords.latitude, coords.longitude, now, params);
      next = nextPrayerInfo(coords.latitude, coords.longitude, now, params);
      prevTime = prevPrayerTime(coords.latitude, coords.longitude, now, params);
    } catch {
      slots = [];
    }

    // İlerleme: önceki vakitten sıradaki vakte ne kadar yol alındı
    let progress = 0;
    if (prevTime && next.target) {
      const span = next.target.getTime() - prevTime.getTime();
      if (span > 0) {
        progress = Math.min(1, Math.max(0, (now.getTime() - prevTime.getTime()) / span));
      }
    }

    // prevKey: slots içinde next'ten bir önceki (sunrise dahil zincir)
    const order: PrayerSlot['key'][] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
    let prevKey: PrayerSlot['key'] | null = null;
    if (next.key) {
      const idx = order.indexOf(next.key);
      prevKey = idx > 0 ? order[idx - 1] : 'isha';
    }

    return {
      slots,
      nextKey: next.key,
      prevKey,
      countdown: next.target ? countdownStr(now, next.target) : '',
      progress,
      nextTarget: next.target,
      city: coords.city,
      countryCode: coords.countryCode ?? null,
      coords: { latitude: coords.latitude, longitude: coords.longitude },
      loading,
      resolved: coords.resolved === true,
    };
    // tick → periyodik, settingsV → metot değişince yeniden hesapla
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords, loading, tick, settingsV]);
}
