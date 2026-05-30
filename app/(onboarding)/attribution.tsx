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
      icon={<Ionicons name="megaphone-outline" size={28} color={colors.gold.primary} />}
      title="How did you hear about us?"
      onSkip={() => router.push('/(onboarding)/paywall')}
      next="/(onboarding)/paywall"
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
