import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Redirect } from 'expo-router';
import { useOnboardingStore } from '../stores/useOnboardingStore';
import { colors } from '../constants/theme';

export default function Index() {
  const isCompleted = useOnboardingStore((s) => s.isCompleted);
  const [hydrated, setHydrated] = React.useState(false);

  const progress = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Progress animasyonu — 1.2sn içinde 0→0.85, sonra hydration tamamlayınca 1.0
    Animated.timing(progress, {
      toValue: 0.85,
      duration: 1200,
      useNativeDriver: false,
    }).start();

    const store = useOnboardingStore.persist;
    const finish = () => {
      Animated.timing(progress, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start(() => setHydrated(true));
    };

    if (store.hasHydrated()) {
      finish();
      return;
    }
    const unsub = store.onFinishHydration(finish);
    return () => unsub();
  }, []);

  if (hydrated) {
    return <Redirect href={isCompleted ? '/(tabs)/feed' : '/(onboarding)/welcome'} />;
  }

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Logo / İsim */}
      <View style={styles.center}>
        <Animated.Text style={styles.logo}>هدى</Animated.Text>
        <Animated.Text style={styles.logoLatin}>HUDA</Animated.Text>
      </View>

      {/* Progress bar */}
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, { width: barWidth }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.midnight,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  center: {
    alignItems: 'center',
    marginBottom: 64,
  },
  logo: {
    fontSize: 52,
    color: '#D4AF37',
    fontFamily: 'Amiri-Bold',
    lineHeight: 70,
  },
  logoLatin: {
    fontSize: 18,
    color: '#D4AF37',
    letterSpacing: 6,
    opacity: 0.75,
    fontFamily: 'PlusJakartaSans-Medium',
    marginTop: 4,
  },
  barTrack: {
    position: 'absolute',
    bottom: 60,
    left: 48,
    right: 48,
    height: 2,
    backgroundColor: 'rgba(212,175,55,0.18)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#D4AF37',
    borderRadius: 2,
  },
});
