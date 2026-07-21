import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { usePostHog } from 'posthog-react-native';
import { OnboardingShell } from '../../components/layout/OnboardingShell';
import { ThemeTile } from '../../components/ui/ThemeTile';
import { spacing } from '../../constants/theme';
import { backgroundThemes, sortedThemes } from '../../data/themes';
import { useOnboardingStore } from '../../stores/useOnboardingStore';

// Tema listesi bir kez sıralanır — her render'da yeniden hesaplanmaz.
const THEMES = sortedThemes(backgroundThemes);

// Not: Eskiden burada TÜM temalar (38, tam çözünürlük) prefetch ediliyordu →
// cached-egress patlıyordu. Kaldırıldı; aşağıdaki grid tile'ları ExpoImage ile
// scroll'da lazy yükler (yalnız görünenler iner).

export default function ThemeSelect() {
  const router = useRouter();
  const posthog = usePostHog();
  const selectedTheme = useOnboardingStore((s) => s.selectedTheme);
  const set = useOnboardingStore((s) => s.set);

  // Tema seçildikten sonra aha-moment ekranına geçer: kullanıcı seçtiği temanın
  // üstünde, kendi diliyle ilk ayetini görür. complete() + feed yönlendirmesi
  // artık first-verse.tsx "Begin my journey" butonunda yapılıyor.
  // Not: Arka plan görselleri app'e gömülü → prefetch GEREKMİYOR (eski Supabase
  // render prefetch'i egress üretiyordu, kaldırıldı).

  const onFinish = () => {
    posthog?.capture('onboarding_theme_selected', { theme_id: selectedTheme });
    router.push('/(onboarding)/first-verse');
  };

  return (
    <OnboardingShell
      step={8}
      title="Select a theme to begin"
      subtitle="You can change this anytime in settings"
      onContinue={onFinish}
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
