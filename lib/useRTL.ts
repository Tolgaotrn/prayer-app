/**
 * useRTL — Mevcut layout yönünü döndürür.
 *
 * I18nManager.isRTL doğrudan kullanılabilir ama bu hook merkileştirir
 * ve Arapça modda bileşenlerin ihtiyaç duyduğu yardımcıları sağlar.
 */

import { I18nManager } from 'react-native';
import { useOnboardingStore } from '../stores/useOnboardingStore';

export function useRTL() {
  const language = useOnboardingStore((s) => s.language);
  // I18nManager.isRTL = native layout RTL mi? (forceRTL + reload sonrası aktif)
  // isArabic = kullanıcı Arapça seçti mi?
  const isRTL    = I18nManager.isRTL;
  const isArabic = language === 'Arabic';

  return {
    isRTL,
    isArabic,
    // Satır yönü: RTL'de row → row-reverse
    rowDir:    isRTL ? ('row-reverse' as const) : ('row' as const),
    // Metin hizalama
    textAlign: isRTL ? ('right' as const) : ('left' as const),
    // Yön bağımlı iç boşluk (örn. icon + metin arası)
    paddingStart: (v: number) => isRTL ? { paddingRight: v } : { paddingLeft: v },
    paddingEnd:   (v: number) => isRTL ? { paddingLeft: v  } : { paddingRight: v },
    marginStart:  (v: number) => isRTL ? { marginRight: v  } : { marginLeft: v },
    marginEnd:    (v: number) => isRTL ? { marginLeft: v   } : { marginRight: v },
  };
}
