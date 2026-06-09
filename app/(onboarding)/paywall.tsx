import React, { useEffect } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usePostHog } from 'posthog-react-native';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { GoldButton } from '../../components/ui/GoldButton';
import { fonts, radii, spacing } from '../../constants/theme';
import { useThemeColors } from '../../lib/useThemeColors';
import { useOnboardingStore } from '../../stores/useOnboardingStore';
import { useAppStore } from '../../stores/useAppStore';
import { haptic } from '../../lib/haptics';
import { PRIVACY_URL, TERMS_URL } from '../../constants/legal';
import {
  getRevenueCatPackages,
  purchaseRevenueCatPackage,
  restoreRevenueCatPurchases,
  type PurchasesPackage,
} from '../../lib/revenueCat';

// ─── Fiyat fallback'leri — StoreKit/RevenueCat yüklenene kadar gösterilir ────
// Gerçek fiyat & trial DAİMA selectedPackage.product'tan okunur (Apple uyumu).
const FALLBACK_MONTHLY_PRICE = '€3,99';
const FALLBACK_ANNUAL_PER_MONTH = '€1,50';
const FALLBACK_ANNUAL_TOTAL = '€17,99';
const FALLBACK_PERCENT_OFF = 62;

// Yıllık plana geçince gösterilen premium avantajlar (uygulamadaki gerçek içerik)
const BENEFITS: { title: string; sub: string }[] = [
  {
    title: 'Unlimited notification content',
    sub: 'Unlock every category for ayah, hadith & quote notifications.',
  },
  {
    title: '1000+ verses, hadiths & duas',
    sub: 'Full access to the complete library prepared for every moment.',
  },
  {
    title: 'All themes & backgrounds',
    sub: 'Unlock every theme and lock-screen widget in the app.',
  },
  {
    title: 'Asma ul-Husna — 99 Names of Allah',
    sub: 'Read all the names of Allah together with their meanings.',
  },
];

type Plan = 'monthly' | 'annual';

function billingDate(trialDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + trialDays);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Bir paketin introductory free-trial gün sayısını döndürür (yoksa 0).
function trialDaysOf(pack?: PurchasesPackage): number {
  const intro = pack?.product?.introPrice;
  if (!intro || intro.price > 0) return 0; // sadece gerçekten ÜCRETSIZ trial
  const n = intro.periodNumberOfUnits * (intro.cycles || 1);
  switch (intro.periodUnit) {
    case 'DAY': return n;
    case 'WEEK': return n * 7;
    case 'MONTH': return n * 30;
    case 'YEAR': return n * 365;
    default: return n;
  }
}

export default function Paywall() {
  const router = useRouter();
  const posthog = usePostHog();
  const tc = useThemeColors();
  const complete = useOnboardingStore((s) => s.complete);
  const applyRevenueCatPremium = useAppStore((s) => s.applyRevenueCatPremium);
  const [plan, setPlan] = React.useState<Plan>('monthly');
  const [packages, setPackages] = React.useState<PurchasesPackage[]>([]);
  const [isPurchasing, setIsPurchasing] = React.useState(false);

  useEffect(() => {
    posthog?.capture('premium_purchase_viewed');
    getRevenueCatPackages()
      .then(setPackages)
      .catch((error) => console.warn('RevenueCat offerings failed', error));
  }, [posthog]);

  const finish = (premium: boolean) => {
    if (premium) {
      posthog?.capture('premium_purchase_completed', { plan });
      // SADECE gerçek satın alma/restore başarısında yükselt. Kapatma/skip
      // (premium=false) premium'u ASLA düşürmemeli — RC ile ödeme yapmış bir
      // kullanıcı paywall'ı kapatınca premium'unu kaybetmesin. Downgrade'in tek
      // kaynağı RC listener/getCustomerInfo'dur (useConfigureRevenueCat).
      applyRevenueCatPremium(true);
    } else {
      posthog?.capture('premium_purchase_skipped');
    }
    complete();
    router.replace('/(tabs)/feed');
  };

  const findPackage = React.useCallback(
    (p: Plan) => {
      const t = p === 'annual' ? 'ANNUAL' : 'MONTHLY';
      return (
        packages.find((pkg) => pkg.packageType === t) ??
        packages.find((pkg) => pkg.identifier.toLowerCase().includes(p))
      );
    },
    [packages],
  );

  const monthlyPkg = React.useMemo(() => findPackage('monthly'), [findPackage]);
  const annualPkg = React.useMemo(() => findPackage('annual'), [findPackage]);
  const selectedPackage = (plan === 'annual' ? annualPkg : monthlyPkg) ?? packages[0];

  // Gerçek fiyatlar StoreKit'ten — paket gelene kadar Euro fallback gösterilir.
  const monthlyPrice = monthlyPkg?.product.priceString ?? FALLBACK_MONTHLY_PRICE;
  const annualTotal = annualPkg?.product.priceString ?? FALLBACK_ANNUAL_TOTAL;
  const annualPerMonth =
    annualPkg?.product.pricePerMonthString ?? FALLBACK_ANNUAL_PER_MONTH;

  // Yıllık indirim yüzdesi — aylık & yıllık/ay fiyatından gerçek hesap.
  const percentOff = React.useMemo(() => {
    const m = monthlyPkg?.product.price;
    const aPerMonth = annualPkg?.product.pricePerMonth;
    if (m && aPerMonth && m > 0) return Math.round((1 - aPerMonth / m) * 100);
    return FALLBACK_PERCENT_OFF;
  }, [monthlyPkg, annualPkg]);

  // Trial — GERÇEK Apple intro offer'a göre (Apple 3.1.2 uyumu):
  //  • Paket YÜKLENDİYSE → Apple'ın verdiği gerçek trial gününü kullan.
  //    Trial'ı daha önce kullanmış kullanıcıda Apple intro vermez → 0 →
  //    timeline yerine benefits görünür, buton "Subscribe Now" der.
  //    Böylece UI ile Apple satın alma sheet'i ASLA çelişmez.
  //  • Paket HENÜZ yüklenmediyse → StoreKit gelene kadar 3 göster (iyimser
  //    fallback; App Store Connect'te Monthly'ye 3 günlük free intro tanımlı).
  const monthlyTrialDays = monthlyPkg ? trialDaysOf(monthlyPkg) : 3;
  const annualTrialDays = annualPkg ? trialDaysOf(annualPkg) : 0;
  const trialDays = plan === 'annual' ? annualTrialDays : monthlyTrialDays;

  const purchase = async () => {
    haptic.medium();
    if (!selectedPackage) {
      Alert.alert('Not available', 'Premium plans could not be loaded. Please try again later.');
      return;
    }
    try {
      setIsPurchasing(true);
      posthog?.capture('premium_purchase_initiated', { plan });
      const ok = await purchaseRevenueCatPackage(selectedPackage);
      finish(ok);
    } catch (error: any) {
      if (!error?.userCancelled) {
        posthog?.capture('premium_purchase_failed', { plan, error: error?.message });
        Alert.alert('Purchase failed', 'Please try again in a moment.');
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const restorePurchase = async () => {
    haptic.medium();
    try {
      const ok = await restoreRevenueCatPurchases();
      applyRevenueCatPremium(ok);
      Alert.alert(ok ? 'Restored' : 'No purchase found');
    } catch {
      Alert.alert('Restore failed', 'Please try again in a moment.');
    }
  };

  const isTrial = trialDays > 0;

  return (
    <ScreenContainer>
      <Pressable
        accessibilityLabel="Close"
        accessibilityRole="button"
        hitSlop={12}
        style={styles.close}
        onPress={() => { haptic.light(); finish(false); }}
      >
        <Ionicons name="close" size={24} color={tc.muted} />
      </Pressable>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Animated.Text entering={FadeInDown.delay(60)} style={[styles.title, { color: tc.heading }]}>
          {isTrial
            ? `Start your ${trialDays}-day FREE\ntrial to continue.`
            : 'Unlock Premium to grow\ncloser to Allah.'}
        </Animated.Text>

        {isTrial ? (
          <Animated.View entering={FadeIn} style={styles.timeline}>
            <TimelineStep
              tc={tc}
              icon="lock-open"
              filled={false}
              connector
              title="Today"
              sub="Unlock all features — verses, hadiths, duas, themes and more."
            />
            <TimelineStep
              tc={tc}
              icon="notifications"
              filled={false}
              connector
              title={`In ${Math.max(trialDays - 1, 1)} days · Reminder`}
              sub="We'll send you a reminder that your trial is ending soon."
            />
            <TimelineStep
              tc={tc}
              icon="star"
              filled
              connector={false}
              title={`In ${trialDays} days · Billing starts`}
              sub={`You'll be charged on ${billingDate(trialDays)} unless you cancel anytime before.`}
            />
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn} style={styles.benefits}>
            {BENEFITS.map((b, i) => (
              <Animated.View key={b.title} entering={FadeInDown.delay(80 + i * 70)} style={styles.benefitRow}>
                <View style={[styles.bCheck, { backgroundColor: tc.gold }]}>
                  <Ionicons name="checkmark" size={15} color={tc.onGold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.benefitTitle, { color: tc.heading }]}>{b.title}</Text>
                  <Text style={[styles.benefitSub, { color: tc.body }]}>{b.sub}</Text>
                </View>
              </Animated.View>
            ))}
          </Animated.View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.plansRow}>
          <PlanCard
            tc={tc}
            selected={plan === 'monthly'}
            tag={monthlyTrialDays > 0 ? `${monthlyTrialDays} Days Free Trial` : undefined}
            name="Monthly"
            price={monthlyPrice}
            unit="/month"
            onPress={() => { haptic.select(); posthog?.capture('premium_plan_selected', { plan: 'monthly' }); setPlan('monthly'); }}
          />
          <PlanCard
            tc={tc}
            selected={plan === 'annual'}
            badge={percentOff > 0 ? `${percentOff}% OFF` : undefined}
            name="Annual"
            price={annualTotal}
            unit="/year"
            subPrice={`${annualPerMonth}/month`}
            onPress={() => { haptic.select(); posthog?.capture('premium_plan_selected', { plan: 'annual' }); setPlan('annual'); }}
          />
        </View>

        <View style={styles.assure}>
          <Ionicons name="checkmark" size={15} color={tc.gold} />
          <Text style={[styles.assureText, { color: tc.gold }]}>
            {isTrial ? 'No Payment Due Now' : 'Cancel Anytime'}
          </Text>
        </View>

        <GoldButton
          label={isPurchasing ? 'Please wait…' : isTrial ? `Start My ${trialDays}-Day Free Trial` : 'Subscribe Now'}
          onPress={purchase}
        />

        <Text style={[styles.subPrice, { color: tc.muted }]}>
          {plan === 'annual'
            ? `${isTrial ? `${trialDays} days free, then ` : ''}${annualTotal} per year (${annualPerMonth}/month) · auto-renews`
            : `${isTrial ? `${trialDays} days free, then ` : ''}${monthlyPrice} per month · auto-renews`}
        </Text>

        <View style={styles.legalRow}>
          <Text style={[styles.legalLink, { color: tc.muted }]} onPress={restorePurchase}>Restore</Text>
          <Text
            style={[styles.legalLink, { color: tc.muted }]}
            onPress={() => Linking.openURL(PRIVACY_URL).catch(() => {})}
          >
            Privacy Policy
          </Text>
          <Text
            style={[styles.legalLink, { color: tc.muted }]}
            onPress={() => Linking.openURL(TERMS_URL).catch(() => {})}
          >
            Terms of Use (EULA)
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

function TimelineStep({
  tc, icon, filled, connector, title, sub,
}: {
  tc: ReturnType<typeof useThemeColors>;
  icon: keyof typeof Ionicons.glyphMap;
  filled: boolean;
  connector: boolean;
  title: string;
  sub: string;
}) {
  return (
    <View style={styles.tlRow}>
      <View style={styles.tlRail}>
        <View
          style={[
            styles.tlDot,
            {
              backgroundColor: filled ? tc.gold : (tc.isDark ? tc.raisedBg : '#FFFFFF'),
              borderColor: tc.gold,
            },
          ]}
        >
          <Ionicons name={icon} size={20} color={filled ? tc.onGold : tc.gold} />
        </View>
        {connector ? <View style={[styles.tlLine, { backgroundColor: tc.gold }]} /> : null}
      </View>
      <View style={styles.tlBody}>
        <Text style={[styles.tlTitle, { color: tc.heading }]}>{title}</Text>
        <Text style={[styles.tlSub, { color: tc.body }]}>{sub}</Text>
      </View>
    </View>
  );
}

function PlanCard({
  tc, selected, name, price, unit, tag, badge, subPrice, onPress,
}: {
  tc: ReturnType<typeof useThemeColors>;
  selected: boolean;
  name: string;
  price: string;
  unit: string;
  tag?: string;
  badge?: string;
  subPrice?: string;
  onPress: () => void;
}) {
  const selBg = tc.isDark ? 'rgba(212,175,55,0.12)' : 'rgba(201,150,58,0.10)';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={[
        styles.plan,
        {
          backgroundColor: selected ? selBg : (tc.isDark ? tc.cardBg : '#FFFFFF'),
          borderColor: selected ? tc.gold : tc.border,
          borderWidth: selected ? 2 : 1.5,
        },
        selected && styles.planShadow,
      ]}
    >
      {badge ? (
        <View style={[styles.badge, { backgroundColor: tc.gold }]}>
          <Text style={[styles.badgeText, { color: tc.onGold }]}>{badge}</Text>
        </View>
      ) : null}

      <View style={styles.planHead}>
        {tag ? <Text style={[styles.planTag, { color: tc.gold }]}>{tag}</Text> : <View />}
        <View style={[styles.radio, { borderColor: selected ? tc.gold : tc.muted, backgroundColor: selected ? tc.gold : 'transparent' }]}>
          {selected ? <Ionicons name="checkmark" size={13} color={tc.onGold} /> : null}
        </View>
      </View>

      <Text style={[styles.planName, { color: tc.heading }]}>{name}</Text>
      <View style={styles.priceRow}>
        <Text style={[styles.planPrice, { color: tc.heading }]}>{price}</Text>
        <Text style={[styles.planUnit, { color: tc.muted }]}>{unit}</Text>
      </View>
      {subPrice ? (
        <Text style={[styles.planSubPrice, { color: tc.muted }]}>{subPrice}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  close: { position: 'absolute', top: 8, right: 4, zIndex: 10, padding: 6 },
  scroll: { paddingTop: spacing.xl, paddingBottom: spacing.md },
  title: { fontFamily: fonts.serifBold, fontSize: 30, lineHeight: 40, marginTop: spacing.lg },

  // Timeline (monthly + trial)
  timeline: { marginTop: spacing.xl, gap: 0 },
  tlRow: { flexDirection: 'row', gap: spacing.md },
  tlRail: { alignItems: 'center', width: 56 },
  tlDot: {
    width: 56, height: 56, borderRadius: 28, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  tlLine: { width: 3, flex: 1, minHeight: 28, marginVertical: 2, borderRadius: 2 },
  tlBody: { flex: 1, paddingTop: 6, paddingBottom: spacing.lg },
  tlTitle: { fontFamily: fonts.sansBold, fontSize: 18 },
  tlSub: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, marginTop: 3 },

  // Benefits (yearly)
  benefits: { marginTop: spacing.xl, gap: spacing.lg },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  bCheck: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  benefitTitle: { fontFamily: fonts.sansBold, fontSize: 17 },
  benefitSub: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, marginTop: 2 },

  // Footer
  footer: { paddingBottom: spacing.sm },
  plansRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  plan: {
    flex: 1, borderRadius: radii.lg, padding: spacing.md, minHeight: 110, justifyContent: 'space-between',
  },
  planShadow: {
    shadowColor: '#C9963A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 12, elevation: 4,
  },
  planHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  planTag: { fontFamily: fonts.sansBold, fontSize: 11, flexShrink: 1, paddingRight: 6 },
  planName: { fontFamily: fonts.sansBold, fontSize: 20, marginTop: spacing.xs },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2, marginTop: 2 },
  planPrice: { fontFamily: fonts.sansBold, fontSize: 22 },
  planUnit: { fontFamily: fonts.sansMedium, fontSize: 13 },
  // Aylık karşılık — faturalanan yıllık tutardan belirgin şekilde küçük & ikincil
  // (Apple 3.1.2(c): faturalanan tutar en belirgin fiyat öğesi olmalı).
  planSubPrice: { fontFamily: fonts.sansMedium, fontSize: 11, marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute', top: -11, right: spacing.md,
    borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4,
  },
  badgeText: { fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 0.5 },

  assure: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: spacing.sm },
  assureText: { fontFamily: fonts.sansSemibold, fontSize: 14 },
  subPrice: { fontFamily: fonts.sansMedium, fontSize: 14, textAlign: 'center', marginTop: spacing.sm },
  legalRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg, marginTop: spacing.sm },
  legalLink: { fontFamily: fonts.sans, fontSize: 12 },
});
