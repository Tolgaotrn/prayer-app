import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '../../components/layout/OnboardingShell';
import { ThemeTile } from '../../components/ui/ThemeTile';
import { spacing } from '../../constants/theme';
import { backgroundThemes, sortedThemes, allThemeImageURLs } from '../../data/themes';
import { useOnboardingStore } from '../../stores/useOnboardingStore';

// Tema listesi bir kez sıralanır — her render'da yeniden hesaplanmaz.
const THEMES = sortedThemes(backgroundThemes);

// Yedek prefetch (preparing'de başlamış olabilir) — TÜM temalar, tam çözünürlük.
Image.prefetch(allThemeImageURLs(), 'memory-disk');

export default function ThemeSelect() {
  const router = useRouter();
  const selectedTheme = useOnboardingStore((s) => s.selectedTheme);
  const set = useOnboardingStore((s) => s.set);

  return (
    <OnboardingShell
      step={5}
      title="Select a theme to begin"
      subtitle="You can change this anytime in settings"
      onContinue={() => router.push('/(onboarding)/paywall')}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
        <View style={styles.grid}>
          {THEMES.map((t, i) => (
            <Animated.View
              key={t.id}
              entering={FadeInDown.delay(i * 40).duration(340)}
              style={styles.cell}
            >
              <ThemeTile
                theme={t}
                selected={selectedTheme === t.id}
                onPress={() => set('selectedTheme', t.id)}
              />
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  cell: { width: '47.5%', flexGrow: 1 },
});
