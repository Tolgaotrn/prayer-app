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
  const setPremium = useAppStore((s) => s.setPremium);

  useEffect(() => {
    let mounted = true;

    async function configure() {
      try {
        const Purchases = await loadPurchases();
        if (!Purchases || !mounted) return;

        const customerInfo = await Purchases.getCustomerInfo();
        if (mounted) setPremium(hasPremiumEntitlement(customerInfo));

        const listener = (updatedInfo: CustomerInfo) => {
          setPremium(hasPremiumEntitlement(updatedInfo));
        };

        Purchases.addCustomerInfoUpdateListener(listener);
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
  }, [setPremium]);
}

export async function getRevenueCatPackages() {
  const Purchases = await loadPurchases();
  if (!Purchases) return [];

  const offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages ?? [];
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
