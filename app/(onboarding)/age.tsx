import React from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '../../components/layout/OnboardingShell';
import { OptionRow } from '../../components/ui/OptionRow';
import { colors } from '../../constants/theme';
import { useOnboardingStore } from '../../stores/useOnboardingStore';
import { useOnboardingTracking } from '../../lib/useOnboardingTracking';

const OPTIONS = ['Under 18', '18 – 25', '26 – 35', '36 – 50', '50+'];

export default function AgeScreen() {
  const router = useRouter();
  useOnboardingTracking('age');
  const age = useOnboardingStore((s) => s.age);
  const set = useOnboardingStore((s) => s.set);

  return (
    <OnboardingShell
      step={2}
      title="How old are you?"
      subtitle="We'll adapt content tone and depth for your age group"
      ctaDisabled={!age}
      onContinue={() => router.push('/(onboarding)/faith-intro')}
    >
      <View>
        {OPTIONS.map((opt, i) => (
          <Animated.View key={opt} entering={FadeInDown.delay(i * 70).duration(420)}>
            <OptionRow
              label={opt}
              variant="radio"
              selected={age === opt}
              onPress={() => set('age', opt)}
            />
          </Animated.View>
        ))}
      </View>
    </OnboardingShell>
  );
}
