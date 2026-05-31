import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SelectScreen } from '../../components/onboarding/SelectScreen';
import { colors } from '../../constants/theme';

export default function QuranRelation() {
  return (
    <SelectScreen
      step={4}
      multi={false}
      variant="radio"
      storeKey="quranRelation"
      title="What is your relationship with the Quran right now?"
      next="/(onboarding)/content-select"
      options={[
        'I read it daily',
        'I read it sometimes',
        'I want to reconnect',
        'I am just beginning',
      ]}
    />
  );
}
