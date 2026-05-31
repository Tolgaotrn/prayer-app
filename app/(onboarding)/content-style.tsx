import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SelectScreen } from '../../components/onboarding/SelectScreen';
import { colors } from '../../constants/theme';

export default function ContentStyle() {
  return (
    <SelectScreen
      step={5}
      multi
      storeKey="contentStyle"
      title="What type of content speaks to you most?"
      next="/(onboarding)/usage"
      options={[
        'Comforting & gentle',
        'Motivational',
        'Reflective & deep',
        'Practical guidance',
        'Stories & lessons',
        'Short & simple',
      ]}
    />
  );
}
