/**
 * rtl.ts — Arapça RTL desteği
 *
 * React Native layout sistemi RTL'yi native seviyede yönetir.
 * I18nManager.forceRTL ayarlandıktan sonra uygulamanın yeniden
 * başlatılması gerekir — bu olmadan layout LTR kalır.
 *
 * Kullanım:
 *   applyRTL(isArabic)          → RTL'yi ayarla, true döndü = reload gerekiyor
 *   syncRTLOnStartup(language)  → Açılışta mevcut durumla senkronize et
 */

import { I18nManager } from 'react-native';

// Sağdan-sola yazılan diller. Arapça + Urduca aynı layout davranışını paylaşır.
const RTL_LANGUAGES = new Set(['Arabic', 'Urdu']);

/** Onboarding dil etiketi RTL mi? (Arabic/Urdu) */
export function isRTLLanguage(storedLanguage: string | undefined): boolean {
  return storedLanguage ? RTL_LANGUAGES.has(storedLanguage) : false;
}

/** İstenen RTL durumunu uygula. Değişim olduysa true döner. */
export function applyRTL(rtl: boolean): boolean {
  const changed = I18nManager.isRTL !== rtl;
  I18nManager.allowRTL(rtl);
  I18nManager.forceRTL(rtl);
  return changed;
}

/**
 * Uygulama açılışında çağrılır. Kayıtlı dil ile mevcut I18nManager
 * durumu tutarsızsa (örn. önceki oturumda Arapça/Urduca seçilip restart
 * yapılmadıysa) RTL'yi düzeltir. Değişim olduysa true döner.
 */
export function syncRTLOnStartup(storedLanguage: string | undefined): boolean {
  return applyRTL(isRTLLanguage(storedLanguage));
}
