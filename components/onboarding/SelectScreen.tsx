import React from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '../layout/OnboardingShell';
import { OptionRow } from '../ui/OptionRow';
import { useOnboardingStore } from '../../stores/useOnboardingStore';

type ArrayKey = 'intentions' | 'contentTypes' | 'contentStyle' | 'usage' | 'homePreference';
type SingleKey = 'feeling' | 'quranRelation' | 'attribution';

interface Option {
  label: string;
  sublabel?: string;
}

interface SelectScreenProps {
  step: number;
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  options: (string | Option)[];
  next: string;
  onSkip?: () => void;
  variant?: 'check' | 'radio';
  /** when true, store key holds a string[]; otherwise a single string */
  multi: boolean;
  storeKey: ArrayKey | SingleKey;
}

/** Generic onboarding selection screen — handles multi and single select. */
export function SelectScreen({
  step,
  icon,
  title,
  subtitle,
  options,
  next,
  onSkip,
  variant = 'check',
  multi,
  storeKey,
}: SelectScreenProps) {
  const router = useRouter();
  const store = useOnboardingStore();

  const normalized = options.map((o) => (typeof o === 'string' ? { label: o } : o));

  const isSelected = (label: string): boolean => {
    if (multi) return (store[storeKey as ArrayKey] as string[]).includes(label);
    return (store[storeKey as SingleKey] as string) === label;
  };

  const onToggle = (label: string) => {
    if (multi) store.toggleArrayItem(storeKey as ArrayKey, label);
    else store.set(storeKey as SingleKey, label);
  };

  const hasSelection = multi
    ? (store[storeKey as ArrayKey] as string[]).length > 0
    : !!(store[storeKey as SingleKey] as string);

  return (
    <OnboardingShell
      step={step}
      icon={icon}
      title={title}
      subtitle={subtitle}
      onSkip={onSkip}
      ctaDisabled={!hasSelection}
      onContinue={() => router.push(next as never)}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
        {normalized.map((opt, i) => (
          <Animated.View key={opt.label} entering={FadeInDown.delay(i * 60).duration(400)}>
            <OptionRow
              label={opt.label}
              sublabel={opt.sublabel}
              variant={variant}
              selected={isSelected(opt.label)}
              onPress={() => onToggle(opt.label)}
            />
          </Animated.View>
        ))}
        <View style={{ height: 8 }} />
      </ScrollView>
    </OnboardingShell>
  );
}

export default SelectScreen;
