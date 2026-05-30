import React, { useEffect } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { GoldButton } from '../../components/ui/GoldButton';
import { Star } from '../../components/anim/Sparkles';
import { colors, fonts, radii, shadow, spacing } from '../../constants/theme';
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
  'All widget themes & sizes',
  'Bilingual Arabic + English',
  'Unlimited daily reminders',
  'All content categories',
  'Live Islamic wallpapers',
  'Premium calligraphy themes',
];

export default function Paywall() {
  const router = useRouter();
  const complete = useOnboardingStore((s) => s.complete);
  const setPremium = useAppStore((s) => s.setPremium);
  const [plan, setPlan] = React.useState<'weekly' | 'yearly'>('yearly');
  const [packages, setPackages] = React.useState<PurchasesPackage[]>([]);
  const [isPurchasing, setIsPurchasing] = React.useState(false);

  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [pulse]);

  useEffect(() => {
    getRevenueCatPackages()
      .then(setPackages)
      .catch((error) => console.warn('RevenueCat offerings failed', error));
  }, []);
  const yearlyPulse = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.02 }],
  }));

  const finish = (premium: boolean) => {
    setPremium(premium);
    complete();
    router.replace('/(tabs)/feed');
  };

  const selectedPackage = React.useMemo(() => {
    const preferredType = plan === 'yearly' ? 'ANNUAL' : 'WEEKLY';
    return (
      packages.find((pack) => pack.packageType === preferredType) ??
      packages.find((pack) => pack.identifier.toLowerCase().includes(plan)) ??
      packages[plan === 'yearly' ? 1 : 0] ??
      packages[0]
    );
  }, [packages, plan]);

  const startTrial = async () => {
    haptic.medium();

    if (!selectedPackage) {
      finish(true);
      return;
    }

    try {
      setIsPurchasing(true);
      const isPremium = await purchaseRevenueCatPackage(selectedPackage);
      finish(isPremium);
    } catch (error: any) {
      if (!error?.userCancelled) {
        Alert.alert('Purchase failed', 'Please try again in a moment.');
        console.warn('RevenueCat purchase failed', error);
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const restorePurchase = async () => {
    haptic.medium();

    try {
      setIsPurchasing(true);
      const isPremium = await restoreRevenueCatPurchases();
      setPremium(isPremium);
      Alert.alert(isPremium ? 'Restored' : 'No purchase found');
    } catch (error) {
      Alert.alert('Restore failed', 'Please try again in a moment.');
      console.warn('RevenueCat restore failed', error);
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <ScreenContainer
      gradient={[colors.bg.premium, colors.bg.deep, colors.bg.premium]}
      backgroundImage={require('../../assets/themes/midnight.jpg')}
      imageOpacity={0.4}
    >
      <Pressable
        accessibilityLabel="Close"
        accessibilityRole="button"
        hitSlop={12}
        style={styles.close}
        onPress={() => {
          haptic.light();
          finish(false);
        }}
      >
        <Ionicons name="close" size={24} color={colors.text.muted} />
      </Pressable>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Animated.View entering={FadeInDown.duration(500)} style={styles.sparkle}>
          <Star size={30} color={colors.gold.bright} />
        </Animated.View>
        <Animated.Text entering={FadeInDown.delay(80)} style={styles.title}>
          Unlock Your Full{'\n'}Spiritual Journey
        </Animated.Text>
        <Animated.View entering={FadeInDown.delay(160)} style={styles.trialBadge}>
          <Text style={styles.trialText}>3-Day Free Trial — No Charge Today ✦</Text>
        </Animated.View>

        <View style={styles.plans}>
          <Animated.View entering={FadeInDown.delay(220)} style={styles.planWrap}>
            <PlanCard
              title="Weekly"
              price="$4.99"
              period="/week"
              selected={plan === 'weekly'}
              onPress={() => {
                haptic.select();
                setPlan('weekly');
              }}
            />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(280)} style={[styles.planWrap, yearlyPulse]}>
            <PlanCard
              title="Yearly"
              price="$29.99"
              period="/year · Save 88%"
              best
              selected={plan === 'yearly'}
              onPress={() => {
                haptic.select();
                setPlan('yearly');
              }}
            />
          </Animated.View>
        </View>

        <View style={styles.features}>
          {FEATURES.map((f, i) => (
            <Animated.View key={f} entering={FadeInDown.delay(340 + i * 70)} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={18} color={colors.gold.primary} />
              <Text style={styles.featureText}>{f}</Text>
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <GoldButton
          label={isPurchasing ? 'Please wait...' : 'Start Free Trial — 3 Days Free'}
          onPress={startTrial}
        />
        <Text style={styles.fine}>
          {plan === 'yearly' ? 'Then $29.99/year' : 'Then $4.99/week'} · Cancel anytime
        </Text>
        <View style={styles.legalRow}>
          <Text style={styles.legalLink} onPress={restorePurchase}>
            Restore Purchase
          </Text>
          <Text style={styles.legalLink}>Terms & Privacy</Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

function PlanCard({
  title,
  price,
  period,
  best,
  selected,
  onPress,
}: {
  title: string;
  price: string;
  period: string;
  best?: boolean;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={[styles.plan, selected && styles.planSelected, selected && best && shadow.goldGlow]}
    >
      {best ? (
        <View style={styles.bestBadge}>
          <Text style={styles.bestText}>BEST VALUE</Text>
        </View>
      ) : null}
      <Text style={styles.planTitle}>{title}</Text>
      <Text style={styles.planPrice}>{price}</Text>
      <Text style={styles.planPeriod}>{period}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  close: { position: 'absolute', top: 54, right: 20, zIndex: 10, padding: 6 },
  scroll: { paddingTop: spacing.xl, paddingBottom: spacing.md },
  sparkle: { alignItems: 'center', marginBottom: spacing.sm },
  title: {
    fontFamily: fonts.serifBold,
    fontSize: 30,
    color: colors.text.heading,
    textAlign: 'center',
    lineHeight: 38,
  },
  trialBadge: { alignSelf: 'center', marginTop: spacing.sm },
  trialText: { fontFamily: fonts.sansSemibold, fontSize: 13, color: colors.gold.bright },
  plans: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  planWrap: { flex: 1 },
  plan: {
    backgroundColor: colors.bg.card,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    padding: spacing.md,
    minHeight: 110,
    justifyContent: 'center',
  },
  planSelected: { borderColor: colors.gold.primary, backgroundColor: colors.bg.raised },
  bestBadge: {
    position: 'absolute',
    top: -1,
    right: -1,
    backgroundColor: colors.gold.primary,
    borderTopRightRadius: radii.lg,
    borderBottomLeftRadius: radii.md,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  bestText: { fontFamily: fonts.sansBold, fontSize: 9, color: colors.text.onGold, letterSpacing: 0.5 },
  planTitle: { fontFamily: fonts.sansSemibold, fontSize: 14, color: colors.text.body },
  planPrice: { fontFamily: fonts.sansBold, fontSize: 24, color: colors.text.heading, marginTop: 4 },
  planPeriod: { fontFamily: fonts.sans, fontSize: 12, color: colors.text.muted, marginTop: 2 },
  features: { marginTop: spacing.xl, flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.sm },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, width: '50%', paddingRight: spacing.xs },
  featureText: { fontFamily: fonts.sans, fontSize: 13, color: colors.text.body, flexShrink: 1 },
  footer: { paddingBottom: spacing.sm },
  fine: { fontFamily: fonts.sans, fontSize: 12, color: colors.text.muted, textAlign: 'center', marginTop: spacing.sm },
  legalRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg, marginTop: spacing.sm },
  legalLink: { fontFamily: fonts.sans, fontSize: 12, color: colors.text.muted, textDecorationLine: 'underline' },
});
