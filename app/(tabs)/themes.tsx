import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { ThemeTile } from '../../components/ui/ThemeTile';
import { BackButton } from '../../components/ui/BackButton';
import { fonts, spacing } from '../../constants/theme';
import { useThemeColors } from '../../lib/useThemeColors';
import { backgroundThemes } from '../../data/themes';
import { useOnboardingStore } from '../../stores/useOnboardingStore';
import { haptic } from '../../lib/haptics';

const FILTERS = ['All', 'Free', 'New'] as const;

export default function Themes() {
  const tc = useThemeColors();
  const selectedTheme = useOnboardingStore((s) => s.selectedTheme);
  const set = useOnboardingStore((s) => s.set);
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]>('All');

  const data = backgroundThemes.filter((t) =>
    filter === 'All' ? true : t.badge === filter,
  );

  return (
    <ScreenContainer padded={false}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <BackButton style={{ marginRight: spacing.sm }} />
          <Text style={[styles.title, { color: tc.heading }]}>Themes</Text>
        </View>
        <View style={styles.filters}>
          {FILTERS.map((f) => {
            const active = filter === f;
            return (
              <Pressable
                key={f}
                onPress={() => { haptic.select(); setFilter(f); }}
                style={[
                  styles.filter,
                  {
                    backgroundColor: active ? tc.gold : tc.cardBg,
                    borderColor: active ? tc.gold : tc.border,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[
                  styles.filterText,
                  { color: active ? tc.onGold : tc.muted },
                ]}>
                  {f}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 120 }}
      >
        <View style={styles.grid}>
          {data.map((t, i) => (
            <Animated.View
              key={t.id}
              entering={FadeInDown.delay(i * 50).duration(420)}
              style={styles.cell}
            >
              <ThemeTile
                theme={t}
                selected={selectedTheme === t.id}
                showEdit
                aspectRatio={0.58}
                onPress={() => set('selectedTheme', t.id)}
              />
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  title: { fontFamily: fonts.serifBold, fontSize: 28 },
  filters: { flexDirection: 'row', gap: spacing.xs },
  filter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterText: { fontFamily: fonts.sansMedium, fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  cell: { width: '31%', flexGrow: 1, maxWidth: '32%' },
});
