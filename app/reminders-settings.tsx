import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Stepper } from '../components/ui/Stepper';
import { RangeSlider } from '../components/ui/RangeSlider';
import { NotifPreview } from '../components/ui/NotifPreview';
import { GoldButton } from '../components/ui/GoldButton';
import { colors, fonts, radii, spacing } from '../constants/theme';
import { useThemeColors } from '../lib/useThemeColors';
import { useOnboardingStore } from '../stores/useOnboardingStore';
import { haptic } from '../lib/haptics';

export default function RemindersSettings() {
  const router = useRouter();
  const tc = useThemeColors();

  const reminderCount = useOnboardingStore((s) => s.reminderCount);
  const reminderStart = useOnboardingStore((s) => s.reminderStart);
  const reminderEnd   = useOnboardingStore((s) => s.reminderEnd);
  const set = useOnboardingStore((s) => s.set);

  // "HH:MM" → dakika sayısına çevir
  function toMin(hhmm: string | undefined, fallback: number): number {
    if (!hhmm) return fallback;
    const [h, m] = hhmm.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }
  // Dakika → "HH:MM"
  function toHHMM(min: number): string {
    const h = Math.floor(min / 60) % 24;
    const m = min % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  const [count, setCount]       = React.useState(reminderCount);
  const [startMin, setStartMin] = React.useState(() => toMin(reminderStart, 360));
  const [endMin, setEndMin]     = React.useState(() => toMin(reminderEnd, 1320));

  const onSave = () => {
    haptic.success();
    set('reminderCount', count);
    set('reminderStart', toHHMM(startMin));
    set('reminderEnd',   toHHMM(endMin));
    router.back();
  };

  const cardStyle = [styles.card, { backgroundColor: tc.cardBg, borderColor: tc.border }];

  return (
    <ScreenContainer padded={false}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: tc.cardBg }]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={tc.heading} />
        </Pressable>
        <Text style={[styles.title, { color: tc.heading }]}>Reminders</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Bildirim önizleme */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <NotifPreview
            title="Noor"
            body="'And He found you lost and guided you.' — Quran 93:7"
          />
        </Animated.View>

        {/* Günlük kaç bildirim */}
        <Animated.View entering={FadeInDown.delay(100)} style={cardStyle}>
          <Text style={[styles.cardTitle, { color: tc.heading }]}>Daily reminders</Text>
          <Text style={[styles.cardSub, { color: tc.muted }]}>How many times per day?</Text>
          <View style={{ marginTop: spacing.md }}>
            <Stepper
              value={count}
              min={1}
              max={10}
              onChange={(v) => { haptic.select(); setCount(v); }}
            />
          </View>
        </Animated.View>

        {/* Saat aralığı */}
        <Animated.View entering={FadeInDown.delay(180)} style={cardStyle}>
          <Text style={[styles.cardTitle, { color: tc.heading }]}>Active hours</Text>
          <Text style={[styles.cardSub, { color: tc.muted }]}>
            Reminders will only be sent in this window
          </Text>
          <View style={{ marginTop: spacing.lg }}>
            <RangeSlider
              startMin={startMin}
              endMin={endMin}
              onChange={(s, e) => { setStartMin(s); setEndMin(e); }}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(260)}>
          <GoldButton label="Save" onPress={onSave} />
        </Animated.View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontFamily: fonts.serifBold, fontSize: 22 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 80,
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.md,
  },
  cardTitle: { fontFamily: fonts.sansSemibold, fontSize: 16 },
  cardSub: { fontFamily: fonts.sans, fontSize: 13, marginTop: 3 },
});
