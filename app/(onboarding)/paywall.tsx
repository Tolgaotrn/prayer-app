import React, { useEffect } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { GoldButton } from '../../components/ui/GoldButton';
import { fonts, radii, spacing } from '../../constants/theme';
import { useThemeColors } from '../../lib/useThemeColors';
import { useOnboardingStore } from '../../stores/useOnboardingStore';
import { useAppStore } from '../../stores/useAppStore';
import { haptic } from '../../lib/haptics';
import {
  getRevenueCatPackages,
  purchaseRevenueCatPackage,
  restoreRevenueCatPurchases,
  type PurchasesPackage,
} from '../../lib/revenueCat';

const FEATURES = [
  '5000+ verses, hadiths & duas',
  'Every premium theme & background',
  'Choose your reading mode',
  'Fresh lock-screen widgets weekly',
  'A completely ad-free experience',
];

type Plan = 'annual' | 'monthly' | 'weekly';

const PLANS: { id: Plan; title: string; sub: string; price: string; note: string; badge?: string; old?: string; trial?: string }[] = [
  { id: 'annual',  title: 'Annual Premium',  sub: '12 months', price: '$2.50/mo', note: 'Billed annually', badge: '-65% OFF', old: '$83.88', trial: '7 days free trial' },
  { id: 'monthly', title: 'Monthly Premium', sub: '30 days',   price: '$6.99/mo', note: '' },
  { id: 'weekly',  title: 'Weekly Premium',  sub: '7 days',    price: '$3.99/wk', note: '' },
];

export default function Paywall() {
  const router = useRouter();
  const tc = useThemeColors();
  const complete = useOnboardingStore((s) => s.complete);
  const setPremium = useAppStore((s) => s.setPremium);
  const [plan, setPlan] = React.useState<Plan>('annual');
  const [packages, setPackages] = React.useState<PurchasesPackage[]>([]);
  const [isPurchasing, setIsPurchasing] = React.useState(false);
  const [countdown, setCountdown] = React.useState(5);

  React.useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  useEffect(() => {
    getRevenueCatPackages()
      .then(setPackages)
      .catch((error) => console.warn('RevenueCat offerings failed', error));
  }, []);

  const finish = (premium: boolean) => {
    setPremium(premium);
    complete();
    router.replace('/(tabs)/feed');
  };

  const selectedPackage = React.useMemo(() => {
    const map: Record<Plan, string> = { annual: 'ANNUAL', monthly: 'MONTHLY', weekly: 'WEEKLY' };
    const t = map[plan];
    return (
      packages.find((p) => p.packageType === t) ??
      packages.find((p) => p.identifier.toLowerCase().includes(plan)) ??
      packages[0]
    );
  }, [packages, plan]);

  const startTrial = async () => {
    haptic.medium();
    if (!selectedPackage) { finish(true); return; }
    try {
      setIsPurchasing(true);
      const ok = await purchaseRevenueCatPackage(selectedPackage);
      finish(ok);
    } catch (error: any) {
      if (!error?.userCancelled) Alert.alert('Purchase failed', 'Please try again in a moment.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const restorePurchase = async () => {
    haptic.medium();
    try {
      const ok = await restoreRevenueCatPurchases();
      setPremium(ok);
      Alert.alert(ok ? 'Restored' : 'No purchase found');
    } catch {
      Alert.alert('Restore failed', 'Please try again in a moment.');
    }
  };

  return (
    <ScreenContainer>
      <Pressable
        accessibilityLabel={countdown > 0 ? `Close in ${countdown}` : 'Close'}
        accessibilityRole="button"
        hitSlop={12}
        style={styles.close}
        onPress={() => { if (countdown > 0) return; haptic.light(); finish(false); }}
        disabled={countdown > 0}
      >
        {countdown > 0 ? (
          <View style={[styles.countdownCircle, { borderColor: tc.border }]}>
            <Text style={[styles.countdownText, { color: tc.muted }]}>{countdown}</Text>
          </View>
        ) : (
          <Ionicons name="close" size={24} color={tc.muted} />
        )}
      </Pressable>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.brandRow}>
          <Image source={require('../../assets/icons/icon.png')} style={styles.brand} contentFit="cover" />
        </View>

        <Animated.Text entering={FadeInDown.delay(80)} style={[styles.title, { color: tc.heading }]}>
          Unlock the complete{'\n'}Noor experience
        </Animated.Text>

        <View style={styles.features}>
          {FEATURES.map((f, i) => (
            <Animated.View key={f} entering={FadeInDown.delay(140 + i * 60)} style={styles.featureRow}>
              <View style={[styles.fCheck, { backgroundColor: tc.gold }]}>
                <Ionicons name="checkmark" size={14} color={tc.onGold} />
              </View>
              <Text style={[styles.featureText, { color: tc.body }]}>{f}</Text>
            </Animated.View>
          ))}
        </View>

        <View style={styles.plans}>
          {PLANS.map((p, i) => (
            <Animated.View key={p.id} entering={FadeInDown.delay(420 + i * 70)}>
              <PlanCard
                data={p}
                selected={plan === p.id}
                tc={tc}
                onPress={() => { haptic.select(); setPlan(p.id); }}
              />
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <GoldButton
          label={isPurchasing ? 'Please wait…' : 'Start my free trial'}
          onPress={startTrial}
        />
        <View style={styles.assure}>
          <Ionicons name="checkmark" size={15} color={tc.gold} />
          <Text style={[styles.assureText, { color: tc.gold }]}>You will not be charged today</Text>
        </View>
        <View style={styles.legalRow}>
          <Text style={[styles.legalLink, { color: tc.muted }]} onPress={restorePurchase}>Restore</Text>
          <Text style={[styles.legalLink, { color: tc.muted }]}>Terms of Use</Text>
          <Text style={[styles.legalLink, { color: tc.muted }]}>Privacy Policy</Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

function PlanCard({
  data, selected, tc, onPress,
}: {
  data: typeof PLANS[number];
  selected: boolean;
  tc: ReturnType<typeof useThemeColors>;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={[
        styles.plan,
        { backgroundColor: tc.isDark ? tc.cardBg : '#FFFFFF', borderColor: selected ? tc.gold : tc.border },
        selected && { borderWidth: 2 },
      ]}
    >
      {data.badge ? (
        <View style={[styles.badge, { backgroundColor: tc.gold }]}>
          <Text style={[styles.badgeText, { color: tc.onGold }]}>{data.badge}</Text>
        </View>
      ) : null}

      <View style={{ flex: 1 }}>
        <Text style={[styles.planTitle, { color: tc.heading }]}>{data.title}</Text>
        <Text style={[styles.planSub, { color: tc.muted }]}>{data.sub}</Text>
        {data.trial ? <Text style={[styles.planTrial, { color: tc.gold }]}>{data.trial}</Text> : null}
      </View>

      <View style={styles.priceCol}>
        {data.old ? <Text style={[styles.oldPrice, { color: tc.muted }]}>{data.old}</Text> : null}
        <Text style={[styles.planPrice, { color: tc.heading }]}>{data.price}</Text>
        {data.note ? <Text style={[styles.planNote, { color: tc.muted }]}>{data.note}</Text> : null}
      </View>

      <View style={[styles.radio, { borderColor: selected ? tc.gold : tc.muted }]}>
        {selected ? <View style={[styles.radioDot, { backgroundColor: tc.gold }]} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  close: { position: 'absolute', top: 8, left: 4, zIndex: 10, padding: 6 },
  countdownCircle: {
    width: 30, height: 30, borderRadius: 15, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  countdownText: { fontFamily: fonts.sansBold, fontSize: 13 },
  scroll: { paddingTop: spacing.md, paddingBottom: spacing.md },
  brandRow: { alignItems: 'center', marginBottom: spacing.md },
  brand: { width: 72, height: 72, borderRadius: 18 },
  title: { fontFamily: fonts.serifBold, fontSize: 26, textAlign: 'center', lineHeight: 34 },
  features: { marginTop: spacing.lg, gap: spacing.sm, alignSelf: 'stretch', paddingHorizontal: spacing.xs },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  fCheck: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  featureText: { fontFamily: fonts.sansMedium, fontSize: 15, flexShrink: 1 },
  plans: { marginTop: spacing.xl, gap: spacing.sm },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    padding: spacing.md,
    minHeight: 78,
  },
  badge: {
    position: 'absolute', top: -10, right: spacing.md,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  badgeText: { fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 0.5 },
  planTitle: { fontFamily: fonts.sansBold, fontSize: 16 },
  planSub: { fontFamily: fonts.sans, fontSize: 12, marginTop: 1 },
  planTrial: { fontFamily: fonts.sansSemibold, fontSize: 12, marginTop: 3 },
  priceCol: { alignItems: 'flex-end' },
  oldPrice: { fontFamily: fonts.sans, fontSize: 12, textDecorationLine: 'line-through' },
  planPrice: { fontFamily: fonts.sansBold, fontSize: 17 },
  planNote: { fontFamily: fonts.sans, fontSize: 11, marginTop: 1 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 12, height: 12, borderRadius: 6 },
  footer: { paddingBottom: spacing.sm },
  assure: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: spacing.sm },
  assureText: { fontFamily: fonts.sansSemibold, fontSize: 13 },
  legalRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg, marginTop: spacing.sm },
  legalLink: { fontFamily: fonts.sans, fontSize: 12, textDecorationLine: 'underline' },
});
