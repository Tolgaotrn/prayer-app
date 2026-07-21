/**
 * monetization.ts — paywall/special-offer gösterim mantığı
 *
 * • registerSession(): soğuk açılış sayacı. Onboarding bitmiş + free kullanıcıda
 *   2. açılışta paywall'u bir kez daha, 3+. açılışta special offer'ı bir kez önerir.
 * • markOfferSeen(): special offer'ın bir daha tetiklenmemesi için işaretler
 *   (paywall skip'inde ve index tetiğinde çağrılır).
 * • claimOfferExpiry(): teklifin 24 saatlik geri sayım bitişini döner; ilk
 *   çağrıda başlatır, sonraki çağrılarda aynı değeri verir.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_COUNT_KEY   = 'huda_session_count';
const PAYWALL_RESHOWN_KEY = 'huda_paywall_reshown';
const OFFER_SEEN_KEY      = 'huda_special_offer_seen';
const OFFER_EXPIRES_KEY   = 'huda_special_offer_expires';

export const OFFER_DURATION_MS = 24 * 60 * 60 * 1000;

export async function markOfferSeen(): Promise<void> {
  try { await AsyncStorage.setItem(OFFER_SEEN_KEY, '1'); } catch {}
}

export async function isOfferSeen(): Promise<boolean> {
  try { return (await AsyncStorage.getItem(OFFER_SEEN_KEY)) === '1'; } catch { return true; }
}

/** Teklifin son geçerlilik anı (epoch ms). İlk çağrıda şimdi+24h olarak başlar. */
export async function claimOfferExpiry(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(OFFER_EXPIRES_KEY);
    if (raw) {
      const t = parseInt(raw, 10);
      if (Number.isFinite(t)) return t;
    }
    const expires = Date.now() + OFFER_DURATION_MS;
    await AsyncStorage.setItem(OFFER_EXPIRES_KEY, String(expires));
    return expires;
  } catch {
    return Date.now() + OFFER_DURATION_MS;
  }
}

/**
 * Soğuk açılışta çağrılır (index gate). Free + onboarding tamam kullanıcı için
 * bu açılışta gösterilecek monetizasyon ekranını döner (yoksa null).
 *  • 2. açılış → paywall (bir kez)
 *  • 3+. açılış → special offer (bir kez, daha önce görülmediyse)
 */
export async function registerSession(
  isCompleted: boolean,
  isPremium: boolean,
): Promise<'paywall' | 'offer' | null> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_COUNT_KEY);
    const count = (parseInt(raw ?? '0', 10) || 0) + 1;
    await AsyncStorage.setItem(SESSION_COUNT_KEY, String(count));

    if (!isCompleted || isPremium) return null;

    // 2. açılış paywall'ı KALDIRILDI (Tolga 2026-06). Tek gating mekanizması artık
    // feed'deki günlük 5-swipe limiti. Tekrar açmak için:
    //   if (count === 2 && !(await AsyncStorage.getItem(PAYWALL_RESHOWN_KEY))) {
    //     await AsyncStorage.setItem(PAYWALL_RESHOWN_KEY, '1'); return 'paywall'; }
    // Special offer tetiği de DEVRE DIŞI:
    //   if (count >= 3 && !(await isOfferSeen())) { await markOfferSeen(); return 'offer'; }
    return null;
  } catch {
    return null;
  }
}
