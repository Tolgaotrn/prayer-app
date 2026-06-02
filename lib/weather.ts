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
  label: string;
}

const TTL = 20 * 60 * 1000; // 20 dk
const keyFor = (lat: number, lng: number) =>
  `huda_weather_${lat.toFixed(1)}_${lng.toFixed(1)}`;

/** WMO weather code → ikon + etiket. */
function describe(code: number, isDay: boolean): { icon: Weather['icon']; label: string } {
  if (code === 0) return { icon: isDay ? 'sunny' : 'moon', label: isDay ? 'Clear' : 'Clear night' };
  if (code <= 2) return { icon: isDay ? 'partly-sunny' : 'cloudy-night', label: 'Partly cloudy' };
  if (code === 3) return { icon: 'cloud', label: 'Overcast' };
  if (code <= 48) return { icon: 'cloud-outline', label: 'Fog' };
  if (code <= 57) return { icon: 'rainy-outline', label: 'Drizzle' };
  if (code <= 67) return { icon: 'rainy', label: 'Rain' };
  if (code <= 77) return { icon: 'snow', label: 'Snow' };
  if (code <= 82) return { icon: 'rainy', label: 'Showers' };
  if (code <= 86) return { icon: 'snow', label: 'Snow showers' };
  if (code <= 99) return { icon: 'thunderstorm', label: 'Thunderstorm' };
  return { icon: 'partly-sunny', label: 'Weather' };
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
    const { icon, label } = describe(code, isDay);
    const weather: Weather = {
      tempC: Math.round(Number(cur.temperature_2m)),
      code, isDay, icon, label,
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
