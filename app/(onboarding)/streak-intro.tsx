import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { GoldButton } from '../../components/ui/GoldButton';
import { StreakWidget } from '../../components/ui/StreakWidget';
import { Crescent } from '../../components/anim/Crescent';
import { SparkleField } from '../../components/anim/Sparkles';
import { colors, fonts, spacing } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function StreakIntro() {
  const router = useRouter();
  return (
    <ScreenContainer
      backgroundImage={require('../../assets/themes/midnight.jpg')}
      imageOpacity={0.45}
    >
      <SparkleField count={10} width={width} height={260} />
      <View style={styles.center}>
        <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.crescentWrap}>
          <Crescent size={140} />
          <View style={styles.badge}>
            <Text style={styles.badgeNum}>1</Text>
          </View>
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(300)} style={styles.title}>
          Remain close to Allah with a consistent routine
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(420)} style={styles.streak}>
          <StreakWidget streakDays={1} title="Day 1 complete" />
        </Animated.View>

        <Animated.Text entering={FadeIn.delay(560)} style={styles.caption}>
          Every streak starts with Day 1
        </Animated.Text>
      </View>

      <View style={styles.footer}>
        <GoldButton label="Continue" onPress={() => router.push('/(onboarding)/theme-select')} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  crescentWrap: { alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    bottom: 6,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.green.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.bg.midnight,
  },
  badgeNum: { fontFamily: fonts.sansBold, fontSize: 18, color: colors.white },
  title: {
    fontFamily: fonts.serifBold,
    fontSize: 26,
    color: colors.text.heading,
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 34,
    paddingHorizontal: spacing.sm,
  },
  streak: { width: '100%', marginTop: spacing.xl },
  caption: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.text.muted,
    marginTop: spacing.lg,
  },
  footer: { paddingBottom: spacing.sm },
});
