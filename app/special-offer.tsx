/**
 * special-offer — Tek seferlik indirimli yıllık teklif (win-back)
 *
 * Tetikleyiciler:
 *  • Onboarding paywall'u skip edilince (paywall.tsx → finish(false))
 *  • 3+. soğuk açılışta bir kez (app/index.tsx → registerSession)
 *
 * Paket kaynağı: RevenueCat "winback" offering (yoksa current offering'in
 * Annual paketi). İndirim yüzdesi aylık fiyat üzerinden gerçek hesap —
 * paket yüklenemezse pazarlama metni gösterilmez, ekran paywall'a yönlendirir.
 * 24 saatlik geri sayım claimOfferExpiry() ile kalıcıdır (yeniden açılışta
 * sıfırlanmaz).
 */
import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usePostHog } from 'posthog-react-native';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { GoldButton } from '../components/ui/GoldButton';
import { fonts, radii, spacing } from '../constants/theme';
import { useThemeColors } from '../lib/useThemeColors';
import { useAppStore } from '../stores/useAppStore';
import { haptic } from '../lib/haptics';
import { claimOfferExpiry } from '../lib/monetization';
import {
  getSpecialOfferPackage,
  purchaseRevenueCatPackage,
  type PurchasesPackage,
} from '../lib/revenueCat';

function fmt(n: number): string {
  return String(Math.max(0, n)).padStart(2, '0');
}

export default function SpecialOffer() {
  const router = useRouter();
  const posthog = usePostHog();
  const tc = useThemeColors();
  const applyRevenueCatPremium = useAppStore((s) => s.applyRevenueCatPremium);

  const [pack, setPack] = React.useState<PurchasesPackage | null>(null);
  const [monthly, setMonthly] = React.useState<PurchasesPackage | null>(null);
  const [remaining, setRemaining] = React.useState<number | null>(null);
  const [isPurchasing, setIsPurchasing] = React.useState(false);

  React.useEffect(() => {
    posthog?.capture('special_offer_viewed');
    getSpecialOfferPackage().then(({ pack, monthly }) => {
      setPack(pack);
      setMonthly(monthly);
    });
    let timer: ReturnType<typeof setInterval> | undefined;
    claimOfferExpiry().then((expires) => {
      const tick = () => setRemaining(Math.max(0, expires - Date.now()));
      tick();
      timer = setInterval(tick, 1000);
    });
    return () => { if (timer) clearInterval(timer); };
  }, [posthog]);

  const goFeed = () => router.replace('/(tabs)/feed');

  const close = () => {
    haptic.light();
    posthog?.capture('special_offer_dismissed');
    goFeed();
  };

  const purchase = async () => {
    haptic.medium();
    if (!pack) {
      // Paket yüklenemedi → normal paywall'a düş
      router.replace('/(onboarding)/paywall?source=special_offer');
      return;
    }
    try {
      setIsPurchasing(true);
      posthog?.capture('special_offer_purchase_initiated');
      const ok = await purchaseRevenueCatPackage(pack);
      if (ok) {
        posthog?.capture('special_offer_purchase_completed');
        applyRevenueCatPremium(true);
      }
      goFeed();
    } catch (error: any) {
      if (!error?.userCancelled) {
        posthog?.capture('special_offer_purchase_failed', { error: error?.message });
        Alert.alert('Purchase failed', 'Please try again in a moment.');
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  // Gerçek indirim yüzdesi — aylık fiyat ile teklif paketinin aylık karşılığı
  const percentOff = React.useMemo(() => {
    const m = monthly?.product.price;
    const aPerMonth = pack?.product.pricePerMonth;
    if (m && aPerMonth && m > 0) return Math.round((1 - aPerMonth / m) * 100);
    return 0;
  }, [monthly, pack]);

  const price = pack?.product.priceString;
  const perMonth = pack?.product.pricePerMonthString;

  const hrs = remaining != null ? Math.floor(remaining / 3600000) : 0;
  const mins = remaining != null ? Math.floor((remaining % 3600000) / 60000) : 0;
  const secs = remaining != null ? Math.floor((remaining % 60000) / 1000) : 0;
  const expired = remaining != null && remaining <= 0;

  return (
    <ScreenContainer>
      <Pressable
        accessibilityLabel="Close"
        accessibilityRole="button"
        hitSlop={12}
        style={styles.close}
        onPress={close}
      >
        <Ionicons name="close" size={24} color={tc.muted} />
      </Pressable>

      <View style={styles.body}>
        {/* Hilal + yıldız vurgusu */}
        <Animated.View entering={FadeIn.duration(500)} style={[styles.iconWrap, { backgroundColor: tc.gold + '1C', borderColor: tc.gold + '55' }]}>
          <Ionicons name="gift-outline" size={40} color={tc.gold} />
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(80)} style={[styles.kicker, { color: tc.gold }]}>
          ONE-TIME OFFER
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(140)} style={[styles.title, { color: tc.heading }]}>
          {percentOff > 0
            ? `A special ${percentOff}% off,\njust for you`
            : 'A special offer,\njust for you'}
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(200)} style={[styles.sub, { color: tc.body }]}>
          Unlock 1000+ verses, hadiths & duas, all themes and the 99 Names of Allah — at our best price.
        </Animated.Text>

        {/* Geri sayım */}
        {!expired && remaining != null && (
          <Animated.View entering={FadeInDown.delay(260)} style={styles.countRow}>
            {[fmt(hrs), fmt(mins), fmt(secs)].map((v, i) => (
              <React.Fragment key={i}>
                {i > 0 && <Text style={[styles.countSep, { color: tc.muted }]}>:</Text>}
                <View style={[styles.countCell, { backgroundColor: tc.cardBg, borderColor: tc.border }]}>
                  <Text style={[styles.countNum, { color: tc.heading }]}>{v}</Text>
                </View>
              </React.Fragment>
            ))}
          </Animated.View>
        )}
      </View>

      <View style={styles.footer}>
        <View style={[styles.priceCard, { backgroundColor: tc.cardBg, borderColor: tc.gold }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.priceName, { color: tc.heading }]}>Annual · Premium</Text>
            {perMonth ? (
              <Text style={[styles.priceSub, { color: tc.muted }]}>{perMonth}/month, billed yearly</Text>
            ) : null}
          </View>
          <Text style={[styles.price, { color: tc.gold }]}>{price ?? '—'}</Text>
        </View>

        <GoldButton
          label={isPurchasing ? 'Please wait…' : 'Claim My Offer'}
          onPress={purchase}
        />
        <Text style={[styles.legal, { color: tc.muted }]}>
          {price ? `${price} per year · auto-renews · cancel anytime` : 'Cancel anytime'}
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  close: { position: 'absolute', top: 8, right: 4, zIndex: 10, padding: 6 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md },
  iconWrap: {
    width: 88, height: 88, borderRadius: 44, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg,
  },
  kicker: { fontFamily: fonts.sansBold, fontSize: 13, letterSpacing: 2, marginBottom: spacing.sm },
  title: { fontFamily: fonts.serifBold, fontSize: 30, lineHeight: 40, textAlign: 'center' },
  sub: {
    fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, textAlign: 'center',
    marginTop: spacing.md, maxWidth: 320,
  },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.xl },
  countCell: {
    minWidth: 52, borderRadius: radii.md, borderWidth: 1,
    paddingVertical: 10, alignItems: 'center',
  },
  countNum: { fontFamily: fonts.sansBold, fontSize: 22 },
  countSep: { fontFamily: fonts.sansBold, fontSize: 20 },
  footer: { paddingBottom: spacing.md, gap: spacing.sm },
  priceCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: radii.lg, borderWidth: 2, padding: spacing.md,
  },
  priceName: { fontFamily: fonts.sansBold, fontSize: 16 },
  priceSub: { fontFamily: fonts.sans, fontSize: 12, marginTop: 2 },
  price: { fontFamily: fonts.sansBold, fontSize: 22 },
  legal: { fontFamily: fonts.sans, fontSize: 12, textAlign: 'center' },
});
