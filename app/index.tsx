import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useOnboardingStore } from '../stores/useOnboardingStore';
import { colors } from '../constants/theme';

export default function Index() {
  const isCompleted = useOnboardingStore((s) => s.isCompleted);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    // Zustand v5 persist hydration check
    const store = useOnboardingStore.persist;
    if (store.hasHydrated()) {
      setHydrated(true);
      return;
    }
    const unsub = store.onFinishHydration(() => setHydrated(true));
    return () => unsub();
  }, []);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg.midnight, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.gold.primary} />
      </View>
    );
  }

  return <Redirect href={isCompleted ? '/(tabs)/feed' : '/(onboarding)/welcome'} />;
}
