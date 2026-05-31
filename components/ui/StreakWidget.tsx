import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors, fonts, radii, spacing } from '../../constants/theme';
import { useThemeColors } from '../../lib/useThemeColors';

const DAY_LETTERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface StreakWidgetProps {
  streakDays: number;
  banner?: boolean;
  title?: string;
  caption?: string;
  style?: ViewStyle;
}

/** Framed streak card — day labels on top, circles below, completed days
 *  show a gold badge with a check. Pops on cream via a near-white card. */
export function StreakWidget({ streakDays, title, caption, style }: StreakWidgetProps) {
  const tc = useThemeColors();
  const filled = Math.min(streakDays, 7);

  // Bugünden geriye doğru günleri sırala (bugün en sonda görünür)
  const today = new Date().getDay();
  const days = Array.from({ length: 7 }, (_, i) => {
    const idx = (today - (6 - i) + 7) % 7;
    return DAY_LETTERS[idx];
  });

  const cardBg = tc.isDark ? tc.cardBg : '#FFFFFF';
  const cardBorder = tc.isDark ? 'rgba(212,175,55,0.3)' : 'rgba(120,100,70,0.22)';
  const emptyBg = tc.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(120,100,70,0.10)';

  return (
    <View style={[styles.wrap, { backgroundColor: cardBg, borderColor: cardBorder }, style]}>
      <Text style={[styles.titleText, { color: tc.heading }]}>
        {title ?? `${streakDays} day streak`}
      </Text>

      <View style={styles.days}>
        {days.map((d, i) => {
          const done = i >= 7 - filled; // son `filled` gün dolu
          return (
            <View key={i} style={styles.dayCol}>
              <Text style={[styles.dayLabel, { color: done ? tc.gold : tc.muted }]}>{d}</Text>
              <Animated.View
                entering={FadeIn.delay(i * 70)}
                style={[
                  styles.dot,
                  done
                    ? { backgroundColor: tc.gold, borderColor: tc.gold }
                    : { backgroundColor: emptyBg, borderColor: 'transparent' },
                ]}
              >
                {done && <Ionicons name="checkmark" size={14} color={colors.white} />}
              </Animated.View>
            </View>
          );
        })}
      </View>

      <Text style={[styles.caption, { color: tc.muted }]}>
        {caption ?? 'Build a streak, one day at a time'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 2,
    gap: spacing.md,
    alignItems: 'center',
  },
  titleText: {
    fontFamily: fonts.sansSemibold,
    fontSize: 14,
    textAlign: 'center',
  },
  days: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  dayCol: { alignItems: 'center', gap: 8, flex: 1 },
  dayLabel: { fontFamily: fonts.sansSemibold, fontSize: 12 },
  dot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    fontFamily: fonts.sans,
    fontSize: 13,
    textAlign: 'center',
  },
});

export default StreakWidget;
