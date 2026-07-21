import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { usePostHog } from 'posthog-react-native';
import { OnboardingShell } from '../../components/layout/OnboardingShell';
import { NotifShowcase } from '../../components/ui/NotifShowcase';
import { Stepper } from '../../components/ui/Stepper';
import { RangeSlider } from '../../components/ui/RangeSlider';
import { fonts, radii, spacing } from '../../constants/theme';
import { useThemeColors } from '../../lib/useThemeColors';
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
  const posthog = usePostHog();
  const tc = useThemeColors();
  const { reminderCount, reminderStart, reminderEnd, set } = useOnboardingStore();

  const allowAndSave = async () => {
    try {
      const result = await Notifications.requestPermissionsAsync();
      posthog?.capture('notification_permission_requested', {
        granted: result.granted,
        status: result.status,
      });
    } catch (e) {
      posthog?.capture('notification_permission_error', { error: String(e) });
    }
    router.push('/(onboarding)/theme-select');
  };

  return (
    <OnboardingShell
      step={7}
      title="Get words throughout the day"
      subtitle="Allow notifications to get daily verses"
      ctaLabel="Allow and Save"
      onContinue={allowAndSave}
    >
      <Animated.View entering={FadeInDown.duration(450)}>
        <NotifShowcase />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120)} style={[styles.card, { backgroundColor: tc.cardBg, borderColor: tc.border }]}>
        <Text style={[styles.label, { color: tc.heading }]}>How many times a day?</Text>
        <Stepper
          value={reminderCount}
          min={1}
          max={9}
          onChange={(v) => set('reminderCount', v)}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200)} style={[styles.card, { backgroundColor: tc.cardBg, borderColor: tc.border }]}>
        <Text style={[styles.label, { color: tc.heading }]}>Active hours</Text>
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
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: spacing.md,
  },
  label: { fontFamily: fonts.sansSemibold, fontSize: 15 },
});
