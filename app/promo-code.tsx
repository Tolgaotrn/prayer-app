import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { GoldButton } from '../components/ui/GoldButton';
import { fonts, radii, spacing } from '../constants/theme';
import { useThemeColors } from '../lib/useThemeColors';
import { useAppStore } from '../stores/useAppStore';
import { haptic } from '../lib/haptics';

// Valid promo codes → unlock premium
const PROMO_CODES = new Set([
  'NOOR2025',
  'BISMILLAH',
  'RAMADAN2025',
  'HUDA2025',
  'PREMIUM',
]);

type State = 'idle' | 'success' | 'error';

export default function PromoCodeScreen() {
  const router = useRouter();
  const tc = useThemeColors();
  const redeemPromo = useAppStore((s) => s.redeemPromo);
  const isPremium = useAppStore((s) => s.isPremium);

  const [code, setCode] = React.useState('');
  const [status, setStatus] = React.useState<State>('idle');
  const shake = useSharedValue(0);
  const iconScale = useSharedValue(1);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const handleRedeem = () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    haptic.medium();

    if (isPremium) {
      setStatus('success');
      return;
    }

    if (PROMO_CODES.has(trimmed)) {
      redeemPromo();
      setStatus('success');
      iconScale.value = withSequence(
        withSpring(1.4, { damping: 8 }),
        withSpring(1, { damping: 12 }),
      );
      haptic.success();
    } else {
      setStatus('error');
      shake.value = withSequence(
        withTiming(-10, { duration: 60 }),
        withTiming(10, { duration: 60 }),
        withTiming(-8, { duration: 55 }),
        withTiming(8, { duration: 55 }),
        withTiming(0, { duration: 50 }),
      );
      haptic.light();
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: tc.cardBg }]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color={tc.heading} />
          </Pressable>
        </View>

        <View style={styles.body}>
          {/* Icon */}
          <Animated.View
            entering={FadeIn.duration(500)}
            style={[styles.iconRing, { backgroundColor: tc.gold + '18', borderColor: tc.gold + '44' }]}
          >
            <Animated.View style={iconStyle}>
              {status === 'success' ? (
                <Ionicons name="checkmark-circle" size={44} color={tc.gold} />
              ) : (
                <Ionicons name="gift-outline" size={44} color={tc.gold} />
              )}
            </Animated.View>
          </Animated.View>

          <Animated.Text entering={FadeInDown.delay(100)} style={[styles.title, { color: tc.heading }]}>
            {status === 'success' ? 'Premium Unlocked!' : 'Redeem a Code'}
          </Animated.Text>

          <Animated.Text entering={FadeInDown.delay(180)} style={[styles.subtitle, { color: tc.muted }]}>
            {status === 'success'
              ? 'You now have full access to all premium features. Enjoy!'
              : 'Enter a promo code to unlock premium features for free.'}
          </Animated.Text>

          {status !== 'success' && (
            <Animated.View entering={FadeInDown.delay(260)} style={styles.inputSection}>
              <Animated.View style={shakeStyle}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: tc.heading,
                      backgroundColor: tc.cardBg,
                      borderColor: status === 'error' ? '#E05555' : tc.border,
                    },
                  ]}
                  value={code}
                  onChangeText={(t) => {
                    setCode(t);
                    if (status === 'error') setStatus('idle');
                  }}
                  placeholder="Enter promo code"
                  placeholderTextColor={tc.muted}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleRedeem}
                />
              </Animated.View>

              {status === 'error' && (
                <Animated.View entering={FadeIn.duration(200)} style={styles.errorRow}>
                  <Ionicons name="close-circle" size={15} color="#E05555" />
                  <Text style={styles.errorText}>Invalid code. Please try again.</Text>
                </Animated.View>
              )}
            </Animated.View>
          )}
        </View>

        {/* CTA */}
        <View style={styles.footer}>
          {status === 'success' ? (
            <GoldButton label="Continue" onPress={() => router.back()} />
          ) : (
            <GoldButton
              label="Redeem"
              onPress={handleRedeem}
              disabled={!code.trim()}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: spacing.sm,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  body: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing.lg, gap: spacing.lg,
  },
  iconRing: {
    width: 100, height: 100, borderRadius: 50, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.serifBold, fontSize: 28,
    textAlign: 'center', lineHeight: 36,
  },
  subtitle: {
    fontFamily: fonts.sans, fontSize: 15,
    textAlign: 'center', lineHeight: 22,
    paddingHorizontal: spacing.sm,
  },
  inputSection: { width: '100%', gap: spacing.xs },
  input: {
    width: '100%', height: 56, borderRadius: radii.lg, borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.sansBold, fontSize: 18,
    textAlign: 'center', letterSpacing: 3,
  },
  errorRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 5,
  },
  errorText: {
    fontFamily: fonts.sans, fontSize: 13, color: '#E05555',
  },
  footer: { paddingBottom: spacing.sm },
});
