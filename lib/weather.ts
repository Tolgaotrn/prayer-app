/**
 * weather — Open-Meteo ile anlık hava durumu (API anahtarı gerektirmez).
 *
 * Open-Meteo ücretsiz, anahtarsız ve güvenilir. WMO weather_code'u
 * Ionicons ikonu + kısa etikete eşlenir. Sonuç 20 dk cache'lenir
 * (konuma göre, ~11km yuvarlama) → fazla istek atmaz, offline'da son değeri verir.
 */
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export interface Weather {
  tempC: number;
  code: number;
  isDay: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  /** Dil-bağımsız i18n anahtarı (ör. 'weather.partlyCloudy'). Render'da t() ile çevrilir. */
  labelKey: string;
  /** İngilizce yedek (eski cache / non-i18n bağlam). */
  label: string;
}

const TTL = 20 * 60 * 1000; // 20 dk
const keyFor = (lat: number, lng: number) =>
  `huda_weather_${lat.toFixed(1)}_${lng.toFixed(1)}`;

/** WMO weather code → ikon + etiket. */
function describe(code: number, isDay: boolean): { icon: Weather['icon']; labelKey: string; label: string } {
  if (code === 0) return isDay
    ? { icon: 'sunny', labelKey: 'weather.clear', label: 'Clear' }
    : { icon: 'moon', labelKey: 'weather.clearNight', label: 'Clear night' };
  if (code <= 2) return { icon: isDay ? 'partly-sunny' : 'cloudy-night', labelKey: 'weather.partlyCloudy', label: 'Partly cloudy' };
  if (code === 3) return { icon: 'cloud', labelKey: 'weather.overcast', label: 'Overcast' };
  if (code <= 48) return { icon: 'cloud-outline', labelKey: 'weather.fog', label: 'Fog' };
  if (code <= 57) return { icon: 'rainy-outline', labelKey: 'weather.drizzle', label: 'Drizzle' };
  if (code <= 67) return { icon: 'rainy', labelKey: 'weather.rain', label: 'Rain' };
  if (code <= 77) return { icon: 'snow', labelKey: 'weather.snow', label: 'Snow' };
  if (code <= 82) return { icon: 'rainy', labelKey: 'weather.showers', label: 'Showers' };
  if (code <= 86) return { icon: 'snow', labelKey: 'weather.snowShowers', label: 'Snow showers' };
  if (code <= 99) return { icon: 'thunderstorm', labelKey: 'weather.thunderstorm', label: 'Thunderstorm' };
  return { icon: 'partly-sunny', labelKey: 'weather.weather', label: 'Weather' };
}

/**
 * Render anında koddan i18n anahtarı türet. Eski cache'lerde `labelKey` alanı
 * olmayabilir; ama `code` + `isDay` her zaman vardır → bu yol dile-bağımsızdır
 * ve eski cache'lerde bile doğru çeviriyi verir.
 */
export function weatherLabelKey(code: number, isDay: boolean): string {
  return describe(code, isDay).labelKey;
}

async function readCache(lat: number, lng: number): Promise<Weather | null> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(lat, lng));
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > TTL) return { ...data, _stale: true } as Weather;
    return data as Weather;
  } catch { return null; }
}

export async function fetchWeather(lat: number, lng: number): Promise<Weather | null> {
  // Önce taze cache
  const cached = await readCache(lat, lng);
  if (cached && !(cached as any)._stale) return cached;

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,weather_code,is_day&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) return cached;
    const json = await res.json();
    const cur = json?.current;
    if (!cur) return cached;
    const code = Number(cur.weather_code ?? 0);
    const isDay = Number(cur.is_day ?? 1) === 1;
    const { icon, labelKey, label } = describe(code, isDay);
    const weather: Weather = {
      tempC: Math.round(Number(cur.temperature_2m)),
      code, isDay, icon, labelKey, label,
    };
    await AsyncStorage.setItem(keyFor(lat, lng), JSON.stringify({ ts: Date.now(), data: weather }));
    return weather;
  } catch {
    return cached; // offline → son bilinen (varsa)
  }
}

/** Hook: konum verilince hava durumunu çeker, 20 dk'da bir yeniler. */
export function useWeather(lat?: number, lng?: number): Weather | null {
  const [weather, setWeather] = React.useState<Weather | null>(null);

  React.useEffect(() => {
    if (lat == null || lng == null) return;
    let cancelled = false;
    const run = () => {
      fetchWeather(lat, lng).then((w) => { if (!cancelled && w) setWeather(w); });
    };
    run();
    const id = setInterval(run, TTL);
    return () => { cancelled = true; clearInterval(id); };
  }, [lat != null ? lat.toFixed(2) : null, lng != null ? lng.toFixed(2) : null]);

  return weather;
}
