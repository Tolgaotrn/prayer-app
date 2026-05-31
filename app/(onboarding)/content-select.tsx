import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '../../components/layout/OnboardingShell';
import { IconGridCard } from '../../components/ui/IconGridCard';
import { colors, spacing } from '../../constants/theme';
import { useOnboardingStore } from '../../stores/useOnboardingStore';

const ITEMS: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string }[] = [
  { icon: 'book', title: 'Quran Verses', subtitle: 'Daily ayat' },
  { icon: 'hand-left', title: 'Duas & Prayers', subtitle: 'Supplications' },
  { icon: 'sparkles', title: 'Islamic Quotes', subtitle: 'Wisdom' },
  { icon: 'chatbubbles', title: 'Hadiths', subtitle: 'Prophetic sayings' },
  { icon: 'moon', title: 'Dhikr', subtitle: 'Remembrance' },
  { icon: 'star', title: 'Asma ul-Husna', subtitle: '99 names' },
];

export default function ContentSelect() {
  const router = useRouter();
  const selected = useOnboardingStore((s) => s.contentTypes);
  const toggle = useOnboardingStore((s) => s.toggleArrayItem);

  return (
    <OnboardingShell
      step={5}
      title="What would you like to see every day?"
      subtitle="Pick everything you'd love in your feed"
      ctaDisabled={selected.length === 0}
      onContinue={() => router.push('/(onboarding)/content-style')}
    >
      <View style={styles.grid}>
        {ITEMS.map((item, i) => (
          <Animated.View
            key={item.title}
            entering={FadeInDown.delay(i * 70).duration(420)}
            style={styles.cell}
          >
            <IconGridCard
              icon={item.icon}
              title={item.title}
              subtitle={item.subtitle}
              selected={selected.includes(item.title)}
              onPress={() => toggle('contentTypes', item.title)}
            />
          </Animated.View>
        ))}
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cell: { width: '47.5%', flexGrow: 1 },
});
