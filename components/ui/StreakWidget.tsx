import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors, fonts, radii, spacing } from '../../constants/theme';
import { useThemeColors } from '../../lib/useThemeColors';

const DAYS = ['F', 'S', 'S', 'M', 'T', 'W', 'T'];

interface StreakWidgetProps {
  streakDays: number;
  banner?: boolean;
  title?: string;
  style?: ViewStyle;
}

export function StreakWidget({ streakDays, banner, title, style }: StreakWidgetProps) {
  const tc = useThemeColors();
  const filled = Math.min(streakDays, 7);

  const wrapBg = banner
    ? (tc.isDark ? 'rgba(46,125,50,0.22)' : 'rgba(201,150,58,0.12)')
    : tc.cardBg;

  const wrapBorder = banner
    ? (tc.isDark ? 'rgba(76,175,114,0.45)' : 'rgba(201,150,58,0.4)')
    : (tc.isDark ? 'rgba(212,175,55,0.3)' : tc.border);

  const emptyDotBg = tc.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.09)';

  return (
    <View style={[styles.wrap, { backgroundColor: wrapBg, borderColor: wrapBorder }, style]}>
      {/* başlık */}
      <Text style={[styles.titleText, { color: tc.heading }]}>
        {title ?? `${streakDays} day streak`}
      </Text>

      {/* günler */}
      <View style={styles.dots}>
        {DAYS.map((d, i) => {
          const done = i < filled;
          return (
            <View key={i} style={styles.dayCol}>
              <Animated.View
                entering={FadeIn.delay(i * 80)}
                style={[
                  styles.dot,
                  done
                    ? styles.dotDone
                    : { backgroundColor: emptyDotBg },
                ]}
              >
                {done && <Ionicons name="checkmark" size={11} color={colors.white} />}
              </Animated.View>
              <Text style={[
                styles.dayLabel,
                { color: done ? tc.gold : tc.muted },
              ]}>{d}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    gap: spacing.sm,
    alignItems: 'center',
  },
  titleText: {
    fontFamily: fonts.sansSemibold,
    fontSize: 14,
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    width: '100%',
  },
  dayCol: { alignItems: 'center', gap: 5, flex: 1 },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { backgroundColor: colors.green.accent },
  dayLabel: { fontFamily: fonts.sans, fontSize: 10 },
});

export default StreakWidget;
