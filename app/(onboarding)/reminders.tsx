import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '../../components/layout/OnboardingShell';
import { NotifPreview } from '../../components/ui/NotifPreview';
import { Stepper } from '../../components/ui/Stepper';
import { RangeSlider } from '../../components/ui/RangeSlider';
import { colors, fonts, radii, spacing } from '../../constants/theme';
import { useOnboardingStore } from '../../stores/useOnboardingStore';

function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}
function toHHMM(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export default function Reminders() {
  const router = useRouter();
  const { reminderCount, reminderStart, reminderEnd, set } = useOnboardingStore();

  return (
    <OnboardingShell
      step={5}
      title="Set up your daily reminders"
      subtitle="Gentle nudges to pause and reflect"
      ctaLabel="Allow and Save"
      onContinue={() => router.push('/(onboarding)/notifications')}
    >
      <Animated.View entering={FadeInDown.duration(450)}>
        <NotifPreview time={reminderStart >= '12:00' ? 'now' : '8:00 AM'} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120)} style={styles.card}>
        <Text style={styles.label}>How many times a day?</Text>
        <Stepper
          value={reminderCount}
          min={1}
          max={9}
          onChange={(v) => set('reminderCount', v)}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200)} style={styles.card}>
        <Text style={styles.label}>Active hours</Text>
        <RangeSlider
          startMin={toMin(reminderStart)}
          endMin={toMin(reminderEnd)}
          onChange={(s, e) => {
            set('reminderStart', toHHMM(s));
            set('reminderEnd', toHHMM(e));
          }}
        />
      </Animated.View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: spacing.md,
  },
  label: { fontFamily: fonts.sansSemibold, fontSize: 15, color: colors.text.heading },
});
