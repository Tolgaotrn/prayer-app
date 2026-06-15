import React from 'react';
import { Dimensions, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { usePostHog, useFeatureFlag } from 'posthog-react-native';
import { colors, fonts, spacing } from '../../constants/theme';
import { PRIVACY_URL, TERMS_URL } from '../../constants/legal';
import { useOnboardingStore } from '../../stores/useOnboardingStore';
import { firstOnboardingRoute, type FlowVariant } from '../../lib/onboardingFlow';

const WELCOME_VIDEO_URL =
  'https://hvxrsscrsqdbfewpmfhl.supabase.co/storage/v1/object/public/media/0532.mp4';

const { width, height } = Dimensions.get('window');

// 🧪 TEST: A/B akışını elle denemek için 'short' veya 'control' yaz.
// Canlıya çıkmadan ÖNCE mutlaka null'a geri al → flag devreye girsin.
const FORCE_VARIANT: FlowVariant | null = null;

export default function Welcome() {
  const router = useRouter();
  const posthog = usePostHog();
  const [btnVisible, setBtnVisible] = React.useState(false);

  // A/B test: onboarding-short flag → kısa akış. 'test' variant = short.
  const flag = useFeatureFlag('onboarding-short');
  const variant: FlowVariant =
    FORCE_VARIANT ?? (flag === 'test' || flag === true ? 'short' : 'control');

  // Variant'ı store'a yaz → sonraki ekranlar (name, faith-intro) buradan okur.
  React.useEffect(() => {
    useOnboardingStore.getState().set('flowVariant', variant);
  }, [variant]);

  // Track onboarding start + atanan variant (analiz için).
  React.useEffect(() => {
    posthog?.capture('onboarding_started');
  }, [posthog]);
  React.useEffect(() => {
    posthog?.capture('onboarding_variant_assigned', { variant });
  }, [posthog, variant]);

  // Show button after 2.5 seconds
  React.useEffect(() => {
    const t = setTimeout(() => setBtnVisible(true), 2500);
    return () => clearTimeout(t);
  }, []);

  const player = useVideoPlayer(WELCOME_VIDEO_URL, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <View style={styles.root}>
      {/* Full-screen video background */}
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
      />

      {/* Gradient overlay — bottom fade for text legibility */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.68)', 'rgba(0,0,0,0.86)']}
        locations={[0.3, 0.55, 0.78, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Bottom content — fades in after video plays for 2.5s */}
      {btnVisible && (
        <Animated.View entering={FadeInDown.duration(600)} style={styles.bottom}>
          <Text style={styles.headline}>Your Daily{'\n'}Islamic Guide</Text>
          <Text style={styles.subtitle}>
            Verses, duas, and hadith to inspire every day.
          </Text>

          <Animated.View entering={FadeIn.delay(150).duration(500)} style={styles.ctaWrap}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Begin Your Journey"
              onPress={() => router.push(firstOnboardingRoute(variant))}
              style={({ pressed }) => [styles.btn, pressed && { opacity: 0.88 }]}
            >
              <Text style={styles.btnText}>Begin Your Journey</Text>
            </Pressable>
          </Animated.View>

          <View style={styles.legal}>
            <Pressable onPress={() => Linking.openURL(TERMS_URL).catch(() => {})}>
              <Text style={styles.legalLink}>Terms of Service</Text>
            </Pressable>
            <Text style={styles.legalSep}>&nbsp;and&nbsp;</Text>
            <Pressable onPress={() => Linking.openURL(PRIVACY_URL).catch(() => {})}>
              <Text style={styles.legalLink}>Privacy Policy</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl + 8,
  },
  headline: {
    fontFamily: fonts.serifBold,
    fontSize: 44,
    lineHeight: 50,
    color: '#F5F0E1',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: 'rgba(245,240,225,0.72)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  ctaWrap: { marginBottom: spacing.lg },
  btn: {
    height: 60,
    borderRadius: 999,
    backgroundColor: '#F5F0E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontFamily: fonts.serifBold,
    fontSize: 18,
    color: colors.bg.midnight,
    letterSpacing: 0.2,
  },
  legal: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  legalLink: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: 'rgba(245,240,225,0.5)',
    textDecorationLine: 'underline',
  },
  legalSep: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: 'rgba(245,240,225,0.5)',
  },
});
