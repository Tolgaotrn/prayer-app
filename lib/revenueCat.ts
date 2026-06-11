import { Platform } from 'react-native';
import { useEffect } from 'react';
import Constants from 'expo-constants';
import { useAppStore } from '../stores/useAppStore';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;

// Production'da SADECE gerçek anahtar kullanılır. Test anahtarı yalnızca dev
// build'lerde fallback — prod'a test anahtarıyla çıkmak IAP'yi bozar ve Apple
// reddine yol açar.
const DEV_TEST_KEY = 'test_hjXfHNjRxKrFcFyGSgxGOjBCOrw';
const REVENUECAT_API_KEY: string =
  extra.revenueCatApiKey ||
  (process.env.REVENUECAT_API_KEY as string | undefined) ||
  (__DEV__ ? DEV_TEST_KEY : '');
const PREMIUM_ENTITLEMENT_ID = 'premium';

let configured = false;

type PurchasesModule = typeof import('react-native-purchases').default;
type PurchasesPackage = import('react-native-purchases').PurchasesPackage;
type CustomerInfo = import('react-native-purchases').CustomerInfo;

function isNativePurchasesSupported() {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

function hasPremiumEntitlement(customerInfo: CustomerInfo) {
  return Boolean(customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]);
}

async function loadPurchases(): Promise<PurchasesModule | null> {
  if (!isNativePurchasesSupported()) return null;

  if (!REVENUECAT_API_KEY) {
    console.error(
      'RevenueCat API key is missing. Set REVENUECAT_API_KEY (EAS secret) before building for release.',
    );
    return null;
  }

  const { default: Purchases, LOG_LEVEL } = await import('react-native-purchases');

  if (!configured) {
    await Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
    Purchases.configure({ apiKey: REVENUECAT_API_KEY });
    configured = true;
  }

  return Purchases;
}

export function useConfigureRevenueCat() {
  // applyRevenueCatPremium: RC durumu premium'u belirler ama promo tabanını ezmez.
  const applyRevenueCatPremium = useAppStore((s) => s.applyRevenueCatPremium);

  useEffect(() => {
    let mounted = true;

    async function configure() {
      try {
        const Purchases = await loadPurchases();
        if (!Purchases || !mounted) return;

        const customerInfo = await Purchases.getCustomerInfo();
        if (mounted) applyRevenueCatPremium(hasPremiumEntitlement(customerInfo));

        const listener = (updatedInfo: CustomerInfo) => {
          applyRevenueCatPremium(hasPremiumEntitlement(updatedInfo));
        };

        Purchases.addCustomerInfoUpdateListener(listener);
        // Cleanup configure() resolve olmadan çalıştıysa (hızlı unmount) listener
        // hiç temizlenmezdi → leak. Burada anında geri al.
        if (!mounted) {
          Purchases.removeCustomerInfoUpdateListener(listener);
          return undefined;
        }
        return () => Purchases.removeCustomerInfoUpdateListener(listener);
      } catch (error) {
        console.warn('RevenueCat configure failed', error);
      }
    }

    let removeListener: (() => boolean) | undefined;
    configure().then((cleanup) => {
      removeListener = cleanup;
    });

    return () => {
      mounted = false;
      removeListener?.();
    };
  }, [applyRevenueCatPremium]);
}

export async function getRevenueCatPackages() {
  const Purchases = await loadPurchases();
  if (!Purchases) {
    console.warn('[RC] Purchases yüklenemedi (web veya API key yok)');
    return [];
  }

  try {
    const offerings = await Purchases.getOfferings();

    // TANI: tüm offering'leri ve paketlerini logla — Xcode console'da görünür.
    const allKeys = Object.keys(offerings.all);
    console.log('[RC] offerings.all keys:', JSON.stringify(allKeys));
    console.log('[RC] offerings.current id:', offerings.current?.identifier ?? 'NULL');
    for (const [k, o] of Object.entries(offerings.all)) {
      console.log(
        `[RC] offering "${k}" → ${o.availablePackages.length} paket:`,
        JSON.stringify(o.availablePackages.map((p) => p.product.identifier)),
      );
    }

    // current = RevenueCat dashboard'da "current" işaretli offering.
    // Fallback: tüm offering'ler içinde paket içeren ilkini dene.
    const current = offerings.current
      ?? Object.values(offerings.all).find((o) => o.availablePackages.length > 0)
      ?? null;

    const packages = current?.availablePackages ?? [];
    if (packages.length === 0) {
      console.warn(
        '[RC] HİÇ paket yok. Sebep genelde: Apple Paid Apps Agreement aktif değil, ' +
        'ürünler henüz StoreKit\'e yayılmadı (birkaç saat), veya cihazda Sandbox hesabı yok.',
      );
    }
    return packages;
  } catch (e) {
    console.error('[RC] getOfferings hata:', e);
    return [];
  }
}

export async function purchaseRevenueCatPackage(pack: PurchasesPackage) {
  const Purchases = await loadPurchases();
  if (!Purchases) return false;

  const { customerInfo } = await Purchases.purchasePackage(pack);
  return hasPremiumEntitlement(customerInfo);
}

export async function restoreRevenueCatPurchases() {
  const Purchases = await loadPurchases();
  if (!Purchases) return false;

  const customerInfo = await Purchases.restorePurchases();
  return hasPremiumEntitlement(customerInfo);
}

export type { PurchasesPackage };
