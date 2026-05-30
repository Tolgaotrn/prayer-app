import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { GoldButton } from '../../components/ui/GoldButton';
import { GhostButton } from '../../components/ui/GhostButton';
import { Crescent, RadialRays } from '../../components/anim/Crescent';
import { colors, fonts, radii, spacing } from '../../constants/theme';

const TAGS = ['Daily Ayahs', 'Duas', 'Hadiths'];

export default function NotificationsScreen() {
  const router = useRouter();

  const pulse = useSharedValue(0.4);
  React.useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [pulse]);
  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.85 + pulse.value * 0.3 }],
    opacity: 0.6 + pulse.value * 0.4,
  }));

  const next = () => router.push('/(onboarding)/preparing');

  const allow = async () => {
    try {
      await Notifications.requestPermissionsAsync();
    } catch {
      // ignore — proceed regardless
    }
    next();
  };

  return (
    <ScreenContainer
      backgroundImage={require('../../assets/themes/midnight.jpg')}
      imageOpacity={0.45}
    >
      <View style={styles.center}>
        <View style={styles.iconStage}>
          <View style={styles.raysAbs}>
            <RadialRays size={300} />
          </View>
          <Crescent size={120} />
          <Animated.View style={[styles.badge, dotStyle]}>
            <Text style={styles.badgeText}>3</Text>
          </Animated.View>
        </View>

        <Animated.Text entering={FadeInDown.delay(200)} style={styles.title}>
          Never Miss a Moment of Reflection
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(300)} style={styles.subtitle}>
          We'll send gentle reminders with verses, duas and wisdom throughout your day.
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(400)} style={styles.tags}>
          {TAGS.map((t) => (
            <View key={t} style={styles.tag}>
              <Text style={styles.tagText}>{t}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <GoldButton label="Allow Notifications" onPress={allow} />
        <View style={{ height: spacing.sm }} />
        <GhostButton label="Maybe later" subtle onPress={next} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconStage: { width: 300, height: 300, alignItems: 'center', justifyContent: 'center' },
  raysAbs: { position: 'absolute' },
  badge: {
    position: 'absolute',
    top: 92,
    right: 96,
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E5484D',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.white },
  title: {
    fontFamily: fonts.serifBold,
    fontSize: 28,
    color: colors.text.heading,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 36,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 22,
    paddingHorizontal: spacing.sm,
  },
  tags: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  tag: {
    backgroundColor: colors.bg.raised,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  tagText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.gold.bright },
  footer: { paddingBottom: spacing.sm },
});
