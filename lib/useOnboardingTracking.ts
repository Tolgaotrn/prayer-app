import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { usePostHog } from 'posthog-react-native';

export function useOnboardingTracking(step: string) {
  const posthog = usePostHog();
  useFocusEffect(
    useCallback(() => {
      posthog?.capture('onboarding_step_viewed', { step });
    }, [posthog, step]),
  );
}
