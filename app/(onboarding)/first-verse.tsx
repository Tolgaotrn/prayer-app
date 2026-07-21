import React from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { usePostHog } from 'posthog-react-native';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { ArabicText } from '../../components/arabic/ArabicText';
import { SparkleField } from '../../components/anim/Sparkles';
import { fonts, spacing } from '../../constants/theme';
import { useThemeColors } from '../../lib/useThemeColors';
import { useOnboardingStore } from '../../stores/useOnboardingStore';
import { backgroundThemes } from '../../data/themes';
import { localThemeSource } from '../../data/themeAssets';
import { resolveLang, getDailyReflection, type FeedItem } from '../../lib/contentDb';
import { haptic } from '../../lib/haptics';

const { width, height } = Dimensions.get('window');

// Aha-moment: onboarding'in son adımı. Kullanıcıya seçtiği temanın üstünde,
// kendi diliyle "ilk ayetini" gösterir. Yukarı kaydırınca feed'e girer —
// böylece feed'in kaydırma jesti de burada öğretilmiş olur.
export default function FirstVerse() {
  const router = useRouter();
  const posthog = usePostHog();
  const tc = useThemeColors();

  const name = useOnboardingStore((s) => s.name);
  const rawLang = useOnboardingStore((s) => s.language);
  const selectedTheme = useOnboardingStore((s) => s.selectedTheme);
  const complete = useOnboardingStore((s) => s.complete);

  const showArabic = rawLang === 'Arabic';
  // Arka plan app'e GÖMÜLÜ görselden gelir (0 Supabase egress, anında açılır).
  // Eskiden Supabase render/image endpoint'inden çekiliyordu → egress kaynağıydı.
  const fullTheme = backgroundThemes.find((t) => t.id === selectedTheme);
  const themeBg = fullTheme ? localThemeSource(fullTheme.image) : undefined;

  const [item, setItem] = React.useState<FeedItem | null>(null);
  const [loading, setLoading] = React.useState(true);
  const done = React.useRef(false);

  React.useEffect(() => {
    let active = true;
    (async () => {
      // SADECE Daily Wisdom (reflections) — Quran ayeti ASLA gösterme.
      const lang = resolveLang(rawLang ?? undefined);
      const v = getDailyReflection(lang, showArabic);
      if (!active) return;
      setItem(v);
      setLoading(false);
      posthog?.capture('onboarding_first_verse_shown', { has_content: !!v });
    })();
    return () => {
      active = false;
    };
  }, [rawLang, posthog]);

  const onBegin = React.useCallback(() => {
    if (done.current) return; // tek seferlik — çift tetiklemeyi engeller
    done.current = true;
    haptic.success();
    const ob = useOnboardingStore.getState();
    posthog?.register({
      signup_source: ob.attribution ?? 'unknown',
      app_language: ob.language ?? 'unknown',
    });
    posthog?.capture('onboarding_completed', {
      signup_source: ob.attribution ?? 'unknown',
      premium: false,
    });
    complete();
    // Onboarding tamamlandıktan sonra paywall'a git (Tolga kararı: onboarding
    // sonuna geri eklendi). complete() zaten çağrıldı — kullanıcı paywall'ı X
    // ile kapatsa bile welcome'a geri dönmez, direkt feed'e girer.
    router.replace('/(onboarding)/paywall?source=onboarding');
  }, [complete, posthog, router]);

  // Yukarı kaydırma jesti → feed'e geç (bir kez)
  const swipeUp = Gesture.Pan().onEnd((e) => {
    if (e.translationY < -60 || e.velocityY < -600) {
      runOnJS(onBegin)();
    }
  });

  // Parmak/chevron ipucu — yukarı zıplayan döngü
  const ty = useSharedValue(0);
  React.useEffect(() => {
    ty.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [ty]);
  const hintStyle = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }] }));

  const greeting = name ? `${name}, this is for you` : 'This is for you';

  return (
    <GestureDetector gesture={swipeUp}>
      <View style={{ flex: 1 }}>
        <ScreenContainer backgroundImage={themeBg} imageOpacity={0.55} forceDark>
          <SparkleField count={14} width={width} height={height} />

          <View style={styles.body}>
            <Animated.Text
              entering={FadeInDown.duration(600)}
              style={[styles.kicker, { color: tc.gold }]}
            >
              YOUR DAILY WISDOM
            </Animated.Text>
            <Animated.Text entering={FadeInDown.delay(150).duration(600)} style={styles.greeting}>
              {greeting}
            </Animated.Text>

            <View style={styles.cardWrap}>
              {loading ? (
                <ActivityIndicator color={tc.gold} style={{ marginTop: spacing.xl }} />
              ) : item ? (
                <Animated.View entering={FadeIn.delay(200).duration(800)} style={styles.card}>
                  {showArabic ? (
                    <ArabicText size={30} color="#F5F0E1" style={styles.arabic}>
                      {item.arabic}
                    </ArabicText>
                  ) : (
                    <Text style={styles.translation}>{item.translation}</Text>
                  )}
                  {item.reference ? (
                    <Text style={[styles.reference, { color: tc.gold }]}>{item.reference}</Text>
                  ) : null}
                </Animated.View>
              ) : (
                <Text style={styles.translation}>
                  Your daily verses are ready. Let’s begin.
                </Text>
              )}
            </View>
          </View>

          <Animated.View
            entering={FadeInUp.delay(500).duration(600)}
            style={styles.footer}
            accessibilityRole="button"
            accessibilityLabel="Swipe up to begin"
          >
            <Animated.View style={hintStyle}>
              <MaterialCommunityIcons
                name="gesture-swipe-up"
                size={34}
                color="rgba(245,240,225,0.92)"
              />
            </Animated.View>
            <Text style={styles.hintText}>Swipe up to begin</Text>
          </Animated.View>
        </ScreenContainer>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  kicker: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  greeting: {
    fontFamily: fonts.serifBold,
    fontSize: 26,
    color: '#F5F0E1',
    textAlign: 'center',
  },
  cardWrap: { width: '100%', alignItems: 'center', minHeight: 160, justifyContent: 'center' },
  card: { alignItems: 'center', paddingHorizontal: spacing.md },
  arabic: { textAlign: 'center', marginBottom: spacing.lg },
  translation: {
    fontFamily: fonts.serif,
    fontSize: 22,
    lineHeight: 34,
    color: '#F5F0E1',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  reference: {
    fontFamily: fonts.sansSemibold,
    fontSize: 14,
    textAlign: 'center',
  },
  footer: { alignItems: 'center', paddingBottom: spacing.xl },
  hintText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: 'rgba(245,240,225,0.85)',
    marginTop: spacing.xs,
  },
});
