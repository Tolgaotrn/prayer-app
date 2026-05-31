import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SelectScreen } from '../../components/onboarding/SelectScreen';
import { colors } from '../../constants/theme';

export default function Usage() {
  return (
    <SelectScreen
      step={5}
      multi
      storeKey="usage"
      title="How do you plan to use this app?"
      next="/(onboarding)/home-pref"
      options={[
        'Morning reflection',
        'Evening wind-down',
        'During commute',
        'Before sleep',
        'In moments of stress',
        'After prayer',
        'Daily learning',
        'Sharing with others',
      ]}
    />
  );
}
