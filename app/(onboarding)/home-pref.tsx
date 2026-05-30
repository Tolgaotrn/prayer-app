import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SelectScreen } from '../../components/onboarding/SelectScreen';
import { colors } from '../../constants/theme';

export default function HomePref() {
  return (
    <SelectScreen
      step={5}
      multi
      storeKey="homePreference"
      icon={<Ionicons name="home-outline" size={28} color={colors.gold.primary} />}
      title="What would you like to see most on the home screen?"
      next="/(onboarding)/language"
      options={[
        'A verse of the day',
        'My streak & progress',
        'Saved favorites',
        'A daily dua',
        'Inspirational quotes',
      ]}
    />
  );
}
