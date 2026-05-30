import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { BottomSheet } from '../components/layout/BottomSheet';
import { GoldButton } from '../components/ui/GoldButton';
import { GhostButton } from '../components/ui/GhostButton';
import { colors, fonts, radii, spacing } from '../constants/theme';
import { haptic } from '../lib/haptics';

const CATS: { label: string; gradient: readonly [string, string] }[] = [
  { label: 'Introduction', gradient: ['#162A52', '#0A1230'] },
  { label: 'Quotes', gradient: ['#7A4A1E', '#3A1F0E'] },
  { label: 'Prayer', gradient: ['#0E5C3F', '#06241B'] },
  { label: 'Azkar', gradient: ['#2A2A6E', '#0B0B2B'] },
];

export default function Categories() {
  const router = useRouter();
  const [selected, setSelected] = React.useState<string[]>(['Quotes']);

  const toggle = (label: string) => {
    haptic.select();
    setSelected((s) => (s.includes(label) ? s.filter((x) => x !== label) : [...s, label]));
  };

  return (
    <BottomSheet onClose={() => router.back()} height={0.66}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose Categories</Text>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Close" accessibilityRole="button">
          <Ionicons name="close" size={24} color={colors.text.muted} />
        </Pressable>
      </View>

      <View style={styles.grid}>
        {CATS.map((c, i) => {
          const isSel = selected.includes(c.label);
          return (
            <Animated.View key={c.label} entering={FadeInDown.delay(i * 70)} style={styles.cell}>
              <Pressable
                onPress={() => toggle(c.label)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSel }}
                style={[styles.tile, isSel && styles.tileSelected]}
              >
                <LinearGradient colors={c.gradient} style={StyleSheet.absoluteFill} />
                {isSel ? (
                  <View style={styles.check}>
                    <Ionicons name="checkmark" size={14} color={colors.text.onGold} />
                  </View>
                ) : null}
                <Text style={styles.tileLabel}>{c.label}</Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      <View style={styles.footer}>
        <View style={{ flex: 1 }}>
          <GhostButton label="Shuffle" onPress={() => haptic.medium()} />
        </View>
        <View style={{ flex: 1 }}>
          <GoldButton
            label="Start"
            shimmer={false}
            onPress={() => router.replace('/(tabs)/feed')}
          />
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  title: { fontFamily: fonts.serifBold, fontSize: 22, color: colors.text.heading },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  cell: { width: '47.5%', flexGrow: 1 },
  tile: {
    aspectRatio: 1.4,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'flex-end',
    padding: spacing.sm,
  },
  tileSelected: { borderColor: colors.gold.primary },
  check: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.gold.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: { fontFamily: fonts.sansSemibold, fontSize: 14, color: colors.white },
  footer: { flexDirection: 'row', gap: spacing.sm, marginTop: 'auto', paddingTop: spacing.lg },
});
