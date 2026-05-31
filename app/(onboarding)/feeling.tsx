import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SelectScreen } from '../../components/onboarding/SelectScreen';
import { colors } from '../../constants/theme';

export default function Feeling() {
  return (
    <SelectScreen
      step={3}
      multi={false}
      variant="radio"
      storeKey="feeling"
      title="What is most present in your heart right now?"
      next="/(onboarding)/quran-relation"
      options={[
        'Seeking peace',
        'Seeking patience',
        'Hope',
        'Tawakkul (trust in Allah)',
        'Repentance',
      ]}
    />
  );
}
