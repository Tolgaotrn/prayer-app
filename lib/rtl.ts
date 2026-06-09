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

/** Seçilen dile göre RTL'yi ayarla. Değişim olduysa true döner. */
export function applyRTL(isArabic: boolean): boolean {
  const changed = I18nManager.isRTL !== isArabic;
  I18nManager.allowRTL(isArabic);
  I18nManager.forceRTL(isArabic);
  return changed;
}

/**
 * Uygulama açılışında çağrılır. Kayıtlı dil ile mevcut I18nManager
 * durumu tutarsızsa (örn. önceki oturumda Arapça seçilip restart
 * yapılmadıysa) RTL'yi düzeltir. Değişim olduysa true döner.
 */
export function syncRTLOnStartup(storedLanguage: string | undefined): boolean {
  const isArabic = storedLanguage === 'Arabic';
  return applyRTL(isArabic);
}
