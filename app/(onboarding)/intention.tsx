import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SelectScreen } from '../../components/onboarding/SelectScreen';
import { colors } from '../../constants/theme';

export default function Intention() {
  const router = useRouter();
  return (
    <SelectScreen
      step={2}
      multi
      storeKey="intentions"
      title="What is your intention?"
      subtitle="Select all that resonate with you"
      onSkip={() => router.push('/(onboarding)/feeling')}
      next="/(onboarding)/feeling"
      options={[
        { label: 'Grow closer to Allah', sublabel: 'Strengthen my connection daily' },
        { label: 'Build a Quran habit', sublabel: 'Read and reflect consistently' },
        { label: 'Find calm & peace', sublabel: 'Ease my heart and mind' },
        { label: 'Learn the meanings', sublabel: 'Understand verses deeply' },
        { label: 'Stay motivated', sublabel: 'Gentle daily reminders' },
      ]}
    />
  );
}
