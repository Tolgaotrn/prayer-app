import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { GoldButton } from '../../components/ui/GoldButton';
import { GlowArch } from '../../components/anim/GlowArch';
import { fonts, spacing } from '../../constants/theme';
import { useThemeColors } from '../../lib/useThemeColors';
import { useOnboardingTracking } from '../../lib/useOnboardingTracking';
import { useOnboardingStore } from '../../stores/useOnboardingStore';
import { nextOnboardingRoute } from '../../lib/onboardingFlow';

export default function FaithIntro() {
  const router = useRouter();
  const tc = useThemeColors();
  const variant = useOnboardingStore((s) => s.flowVariant);
  useOnboardingTracking('faith_intro');
  // Kısa akışta faith-intro'dan sonra soru ekranı yok → alt yazıyı uyarla.
  const subtitle = variant === 'short'
    ? 'A moment to center your heart before we begin.'
    : 'A few gentle questions help us shape a path that meets you where you are.';
  return (
    <ScreenContainer
      backgroundImage={require('../../assets/themes/serene-arch.jpg')}
      imageOpacity={0.32}
    >
      <View style={styles.center}>
        <Animated.View entering={FadeIn.duration(700)}>
          <GlowArch size={240} />
        </Animated.View>
        <Animated.Text entering={FadeInDown.delay(300)} style={[styles.title, { color: tc.heading }]}>
          Let's talk about your faith journey
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(420)} style={[styles.subtitle, { color: tc.muted }]}>
          {subtitle}
        </Animated.Text>
      </View>
      <View style={styles.footer}>
        <GoldButton label="Continue" onPress={() => router.push(nextOnboardingRoute('faith-intro', useOnboardingStore.getState().flowVariant))} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: {
    fontFamily: fonts.serifBold,
    fontSize: 30,
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 38,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 15,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  footer: { paddingBottom: spacing.sm },
});
