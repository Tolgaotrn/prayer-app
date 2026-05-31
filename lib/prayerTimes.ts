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
  CalculationMethod,
  Coordinates,
  PrayerTimes as AdhanPrayerTimes,
  Prayer,
} from 'adhan';

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
  countdown: string;   // "2h 14m"
  city: string;
  coords: { latitude: number; longitude: number };
  loading: boolean;
}

// Varsayılan: İstanbul (izin yoksa ve cache de yoksa)
const FALLBACK = { latitude: 41.0082, longitude: 28.9784, city: 'Istanbul' };
const CACHE_KEY = 'noor_last_location';

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

export function computeSlots(lat: number, lng: number, date: Date): PrayerSlot[] {
  const coords = new Coordinates(lat, lng);
  const params = CalculationMethod.MuslimWorldLeague();
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
): { key: PrayerSlot['key'] | null; target: Date | null } {
  const coords = new Coordinates(lat, lng);
  const params = CalculationMethod.MuslimWorldLeague();
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

export function countdownStr(from: Date, to: Date): string {
  let mins = Math.max(0, Math.round((to.getTime() - from.getTime()) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

type StoredLoc = { latitude: number; longitude: number; city: string };

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
export async function resolveLocation(): Promise<StoredLoc> {
  // 1) Önce cache (anında bir değer dönsün diye çağıran taraf zaten cache okur,
  //    ama burada da güvenli taban olarak kullanılır)
  const cached = await readCachedLocation();
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return cached ?? FALLBACK;

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
    if (!pos) return cached ?? FALLBACK;

    let city = cached?.city || FALLBACK.city;
    try {
      const geo = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      city = geo[0]?.city || geo[0]?.region || geo[0]?.country || city;
    } catch { /* reverse geocode opsiyonel */ }

    const resolved: StoredLoc = {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      city,
    };
    await writeCachedLocation(resolved);
    return resolved;
  } catch {
    return cached ?? FALLBACK;
  }
}

export function usePrayerTimes(): PrayerInfo {
  const [coords, setCoords] = React.useState<StoredLoc>(FALLBACK);
  const [loading, setLoading] = React.useState(true);
  const [tick, setTick] = React.useState(0);

  // Konum: önce cache (anında), sonra canlı çözümleme
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const cached = await readCachedLocation();
      if (cached && !cancelled) setCoords(cached);
      const resolved = await resolveLocation();
      if (!cancelled) {
        setCoords(resolved);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Her dakika geri sayımı güncelle
  React.useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  return React.useMemo<PrayerInfo>(() => {
    const now = new Date();
    let slots: PrayerSlot[] = [];
    let next: { key: PrayerSlot['key'] | null; target: Date | null } = { key: null, target: null };
    try {
      slots = computeSlots(coords.latitude, coords.longitude, now);
      next = nextPrayerInfo(coords.latitude, coords.longitude, now);
    } catch {
      slots = [];
    }
    return {
      slots,
      nextKey: next.key,
      countdown: next.target ? countdownStr(now, next.target) : '',
      city: coords.city,
      coords: { latitude: coords.latitude, longitude: coords.longitude },
      loading,
    };
    // tick → her dakika yeniden hesapla
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords, loading, tick]);
}
