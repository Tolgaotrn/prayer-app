/**
 * Onboarding A/B akışı — PostHog feature flag `onboarding-short` ile yönetilir.
 *
 * control: tam 14 ekranlık akış (mevcut).
 * short:   soru ekranları (attribution, age, intention, content-select,
 *          home-pref) atlanır → 9 ekran. Tüm store alanlarının default'u
 *          olduğu için atlanan ekranlar app'i kırmaz.
 *
 * Variant welcome'da bir kez okunup store'a (`flowVariant`) yazılır; her ekran
 * "sıradaki" rotayı buradan alır → kullanıcı baştan sona tek versiyonda kalır.
 */
import type { Href } from 'expo-router';

export type FlowVariant = 'control' | 'short';

// welcome HER ZAMAN ilk ekran; aşağıdaki diziler welcome SONRASI sırayı tutar.
const FULL: readonly string[] = [
  'attribution', 'name', 'age', 'faith-intro', 'intention',
  'content-select', 'home-pref', 'language', 'preparing',
  'streak-intro', 'reminders', 'theme-select', 'paywall',
];

const SHORT: readonly string[] = [
  'name', 'faith-intro', 'language', 'preparing',
  'streak-intro', 'reminders', 'theme-select', 'paywall',
];

const flow = (variant: FlowVariant): readonly string[] =>
  variant === 'short' ? SHORT : FULL;

const route = (step: string): Href => `/(onboarding)/${step}` as Href;

/** welcome'dan sonraki ilk ekran. */
export function firstOnboardingRoute(variant: FlowVariant): Href {
  return route(flow(variant)[0]);
}

/**
 * Verilen adımdan sonraki ekran. Adım bulunamazsa veya sonuncuysa paywall'a
 * düşer (güvenli fallback).
 */
export function nextOnboardingRoute(current: string, variant: FlowVariant): Href {
  const f = flow(variant);
  const i = f.indexOf(current);
  return route(i >= 0 && i < f.length - 1 ? f[i + 1] : 'paywall');
}
