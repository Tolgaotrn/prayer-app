import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { Crescent } from '../../components/anim/Crescent';
import { SparkleField } from '../../components/anim/Sparkles';
import { fonts, spacing } from '../../constants/theme';
import { useThemeColors } from '../../lib/useThemeColors';
import { allThemeImageURLs } from '../../data/themes';

// Kullanıcı bu ekrandayken TÜM tema görselleri (tam çözünürlük) arka planda iner
// → theme-select'e gelince hepsi cache'de, anında ve kaliteli açılır.
Image.prefetch(allThemeImageURLs(), 'memory-disk');

const { width, height } = Dimensions.get('window');

const STAGES = [
  'Gathering verses for your heart…',
  'Tuning your daily rhythm…',
  'Lighting your spiritual flow…',
];

export default function Preparing() {
  const router = useRouter();
  const tc = useThemeColors();
  const [stage, setStage] = React.useState(0);

  React.useEffect(() => {
    const stageId = setInterval(() => {
      setStage((s) => Math.min(s + 1, STAGES.length - 1));
    }, 1200);
    const done = setTimeout(() => router.replace('/(onboarding)/streak-intro'), 4000);
    return () => {
      clearInterval(stageId);
      clearTimeout(done);
    };
  }, [router]);

  return (
    <ScreenContainer
      backgroundImage={require('../../assets/themes/midnight.jpg')}
      imageOpacity={0.5}
    >
      <SparkleField count={16} width={width} height={height} />
      <View style={styles.center}>
        <Animated.View entering={FadeIn.duration(600)}>
          <Crescent size={130} />
        </Animated.View>
        <Animated.Text entering={FadeInDown.delay(300)} style={[styles.title, { color: tc.heading }]}>
          Let us prepare a spiritual flow just for you
        </Animated.Text>
        <Animated.Text key={stage} entering={FadeIn} style={[styles.stage, { color: tc.gold }]}>
          {STAGES[stage]}
        </Animated.Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: {
    fontFamily: fonts.serifBold,
    fontSize: 28,
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 36,
    paddingHorizontal: spacing.md,
  },
  stage: {
    fontFamily: fonts.sans,
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
