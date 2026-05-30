import React from 'react';
import {
  Dimensions,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { VerseCard } from '../../components/ui/VerseCard';
import { GoldButton } from '../../components/ui/GoldButton';
import { StarTrails } from '../../components/anim/Crescent';
import { Star } from '../../components/anim/Sparkles';
import { colors, fonts, spacing } from '../../constants/theme';
import { verses } from '../../data/verses';

const { width } = Dimensions.get('window');
const CARD_W = width - spacing.lg * 2;
const featured = [verses[0], verses[12], verses[3]];

export default function Welcome() {
  const router = useRouter();
  const scrollRef = React.useRef<ScrollView>(null);
  const [page, setPage] = React.useState(0);
  const pageRef = React.useRef(0);

  // auto-advance cards every 3s
  React.useEffect(() => {
    const id = setInterval(() => {
      const next = (pageRef.current + 1) % featured.length;
      scrollRef.current?.scrollTo({ x: next * CARD_W, animated: true });
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const p = Math.round(e.nativeEvent.contentOffset.x / CARD_W);
    pageRef.current = p;
    if (p !== page) setPage(p);
  };

  return (
    <ScreenContainer
      padded={false}
      backgroundImage={require('../../assets/themes/midnight.jpg')}
      imageOpacity={0.5}
    >
      <View style={styles.starsLayer} pointerEvents="none">
        <StarTrails size={width * 1.1} />
      </View>

      <View style={styles.top}>
        <Animated.View entering={FadeInDown.duration(600)}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            decelerationRate="fast"
            snapToInterval={CARD_W}
          >
            {featured.map((v) => (
              <View key={v.id} style={{ width: CARD_W, paddingHorizontal: 0 }}>
                <VerseCard verse={v} />
              </View>
            ))}
          </ScrollView>
        </Animated.View>

        <View style={styles.dots}>
          {featured.map((_, i) => (
            <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
          ))}
        </View>
      </View>

      <View style={styles.bottom}>
        <Animated.View entering={FadeIn.delay(300)} style={styles.sparkleRow}>
          <Star size={14} color={colors.gold.deep} />
          <Star size={22} color={colors.gold.bright} />
          <Star size={12} color={colors.gold.primary} />
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(380)} style={styles.headline}>
          Explore Quran{'\n'}Quotes
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(460)} style={styles.subtitle}>
          Discover Quran verses to inspire your day and deepen your connection.
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(560)} style={styles.cta}>
          <WhiteButton onPress={() => router.push('/(onboarding)/name')} />
        </Animated.View>

        <View style={styles.legal}>
          <LegalLink label="Terms of Service" />
          <Text style={styles.legalSep}>and</Text>
          <LegalLink label="Privacy Policy" />
        </View>
      </View>
    </ScreenContainer>
  );
}

function WhiteButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Get Started"
      onPress={onPress}
      style={({ pressed }) => [styles.whiteBtn, pressed && { opacity: 0.85 }]}
    >
      <Text style={styles.whiteBtnText}>Get Started</Text>
    </Pressable>
  );
}

function LegalLink({ label }: { label: string }) {
  return (
    <Pressable onPress={() => Linking.openURL('https://example.com').catch(() => {})}>
      <Text style={styles.legalLink}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  starsLayer: {
    position: 'absolute',
    top: -width * 0.15,
    alignSelf: 'center',
    opacity: 0.9,
  },
  top: { paddingTop: spacing.xl, paddingHorizontal: spacing.lg },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 7, marginTop: spacing.lg },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' },
  dotActive: { width: 22, backgroundColor: colors.white },
  bottom: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  sparkleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
    marginBottom: spacing.md,
  },
  headline: {
    fontFamily: fonts.serifBold,
    fontSize: 46,
    lineHeight: 52,
    color: colors.text.heading,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 22,
    paddingHorizontal: spacing.lg,
  },
  cta: { marginTop: spacing.xl },
  whiteBtn: {
    height: 60,
    borderRadius: 999,
    backgroundColor: '#F5F0E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whiteBtnText: { fontFamily: fonts.serifBold, fontSize: 18, color: colors.bg.midnight },
  legal: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: spacing.lg },
  legalLink: { fontFamily: fonts.sans, fontSize: 12, color: colors.text.muted, textDecorationLine: 'underline' },
  legalSep: { fontFamily: fonts.sans, fontSize: 12, color: colors.text.muted },
});
