import React, { useEffect } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { GoldButton } from '../components/ui/GoldButton';
import { fonts, spacing } from '../constants/theme';
import { useThemeColors } from '../lib/useThemeColors';
import { useAppStore } from '../stores/useAppStore';
import { haptic } from '../lib/haptics';
import {
  getRevenueCatPackages,
  purchaseRevenueCatPackage,
  restoreRevenueCatPurchases,
  type PurchasesPackage,
} from '../lib/revenueCat';

/**
 * Special offer — ara sıra gösterilen "7 gün ücretsiz" teklif ekranı.
 * router.push('/special-offer') ile açılır; premium ayarlayıp geri döner.
 */
export default function SpecialOffer() {
  const router = useRouter();
  const tc = useThemeColors();
  const setPremium = useAppStore((s) => s.setPremium);
  const [packages, setPackages] = React.useState<PurchasesPackage[]>([]);
  const [isPurchasing, setIsPurchasing] = React.useState(false);

  useEffect(() => {
    getRevenueCatPackages()
      .then(setPackages)
      .catch((error) => console.warn('RevenueCat offerings failed', error));
  }, []);

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/feed');
  };

  const selectedPackage = React.useMemo(() => (
    packages.find((p) => p.packageType === 'ANNUAL') ??
    packages.find((p) => p.identifier.toLowerCase().includes('year')) ??
    packages[0]
  ), [packages]);

  const tryNow = async () => {
    haptic.medium();
    if (!selectedPackage) { setPremium(true); close(); return; }
    try {
      setIsPurchasing(true);
      const ok = await purchaseRevenueCatPackage(selectedPackage);
      setPremium(ok);
      close();
    } catch (error: any) {
      if (!error?.userCancelled) Alert.alert('Purchase failed', 'Please try again in a moment.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const restore = async () => {
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
        accessibilityLabel="Close"
        accessibilityRole="button"
        hitSlop={12}
        style={styles.close}
        onPress={() => { haptic.light(); close(); }}
      >
        <Ionicons name="close" size={26} color={tc.muted} />
      </Pressable>

      <View style={styles.body}>
        <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.iconWrap}>
          <Image source={require('../assets/icons/icon.png')} style={styles.icon} contentFit="cover" />
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(140)} style={[styles.title, { color: tc.heading }]}>
          We offer <Text style={{ color: tc.gold }}>7 days</Text> of premium access, just for you
        </Animated.Text>
      </View>

      <View style={styles.footer}>
        <Animated.View entering={FadeIn.delay(360)} style={styles.noPay}>
          <Ionicons name="checkmark" size={18} color={tc.gold} />
          <Text style={[styles.noPayText, { color: tc.body }]}>No Payment Due Now</Text>
        </Animated.View>
        <GoldButton
          label={isPurchasing ? 'Please wait…' : 'Try now for $0.00'}
          onPress={tryNow}
        />
        <View style={styles.legalRow}>
          <Text style={[styles.legalLink, { color: tc.muted }]} onPress={restore}>Restore</Text>
          <Text style={[styles.legalLink, { color: tc.muted }]}>Terms</Text>
          <Text style={[styles.legalLink, { color: tc.muted }]} onPress={close}>Not now</Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  close: { position: 'absolute', top: 8, left: 4, zIndex: 10, padding: 6 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconWrap: {
    width: 132, height: 132, borderRadius: 32, overflow: 'hidden', marginBottom: spacing.xxl,
  },
  icon: { width: '100%', height: '100%' },
  title: {
    fontFamily: fonts.serifBold, fontSize: 32, textAlign: 'center', lineHeight: 42,
    paddingHorizontal: spacing.sm,
  },
  footer: { paddingBottom: spacing.sm },
  noPay: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: spacing.md },
  noPayText: { fontFamily: fonts.sansSemibold, fontSize: 15 },
  legalRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg, marginTop: spacing.md },
  legalLink: { fontFamily: fonts.sans, fontSize: 13 },
});
