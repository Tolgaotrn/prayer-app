import { Platform } from 'react-native';
import { useEffect } from 'react';
import Constants from 'expo-constants';
import { useAppStore } from '../stores/useAppStore';
import { analytics } from './analytics';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;

// Priority: EAS extra (app.config.ts) → env var → sandbox fallback
const REVENUECAT_API_KEY: string =
  extra.revenueCatApiKey ||
  (process.env.REVENUECAT_API_KEY as string | undefined) ||
  'test_hjXfHNjRxKrFcFyGSgxGOjBCOrw';
const PREMIUM_ENTITLEMENT_ID = 'premium';

let configured = false;

type PurchasesModule = typeof import('react-native-purchases').default;
type PurchasesPackage = import('react-native-purchases').PurchasesPackage;
type CustomerInfo = import('react-native-purchases').CustomerInfo;

function isNativePurchasesSupported() {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

function hasPremiumEntitlement(customerInfo: CustomerInfo) {
  const activeEntitlements = customerInfo.entitlements.active;
  return Boolean(
    activeEntitlements[PREMIUM_ENTITLEMENT_ID] ||
      Object.keys(activeEntitlements).length > 0,
  );
}

async function loadPurchases(): Promise<PurchasesModule | null> {
  if (!isNativePurchasesSupported()) return null;

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

  analytics.track('purchase_started', {
    plan: pack.packageType,
    product_id: pack.product.identifier,
  });

  try {
    const { customerInfo } = await Purchases.purchasePackage(pack);
    const ok = hasPremiumEntitlement(customerInfo);
    analytics.track(ok ? 'purchase_completed' : 'purchase_failed', {
      plan: pack.packageType,
      product_id: pack.product.identifier,
    });
    return ok;
  } catch (err: any) {
    if (err?.userCancelled) {
      analytics.track('purchase_cancelled', { plan: pack.packageType });
    } else {
      analytics.track('purchase_failed', { plan: pack.packageType, error: String(err) });
    }
    throw err;
  }
}

export async function restoreRevenueCatPurchases() {
  const Purchases = await loadPurchases();
  if (!Purchases) return false;

  const customerInfo = await Purchases.restorePurchases();
  const ok = hasPremiumEntitlement(customerInfo);
  analytics.track('purchase_restored', { success: ok });
  return ok;
}

export type { PurchasesPackage };
