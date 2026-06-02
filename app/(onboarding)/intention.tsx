import React from 'react';
import { SelectScreen } from '../../components/onboarding/SelectScreen';

export default function Intention() {
  return (
    <SelectScreen
      step={2}
      multi
      storeKey="intentions"
      title="What is your intention?"
      subtitle="Select all that resonate with you"
      next="/(onboarding)/content-select"
      options={[
        { label: 'Grow closer to Allah', sublabel: 'Deepen my connection every day' },
        { label: 'Find calm & peace', sublabel: 'Ease my heart and mind' },
        { label: 'Learn the meanings', sublabel: 'Understand verses and hadith deeply' },
        { label: 'Stay consistent', sublabel: 'Build a lasting daily habit' },
        { label: 'Stay motivated', sublabel: 'Gentle reminders to keep me going' },
      ]}
    />
  );
}
