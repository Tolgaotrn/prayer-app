import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SelectScreen } from '../../components/onboarding/SelectScreen';
import { colors } from '../../constants/theme';

export default function Attribution() {
  const router = useRouter();
  return (
    <SelectScreen
      step={5}
      multi={false}
      variant="radio"
      storeKey="attribution"
      title="How did you hear about us?"
      onSkip={() => router.push('/(onboarding)/name')}
      next="/(onboarding)/name"
      options={[
        'App Store',
        'Instagram',
        'TikTok',
        'YouTube',
        'A friend or family',
        'Google search',
        'Other',
      ]}
    />
  );
}
