import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Redirect } from 'expo-router';
import { useOnboardingStore } from '../stores/useOnboardingStore';
import { useAppStore } from '../stores/useAppStore';
import { colors } from '../constants/theme';
import { registerSession } from '../lib/monetization';

export default function Index() {
  // Gate hedefi — hydration + session sayacına göre belirlenir.
  // null = henüz karar verilmedi (splash gösterilir).
  const [target, setTarget] = React.useState<string | null>(null);

  const progress = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Progress animasyonu yalnızca KOZMETİK — gate kararı buna BAĞLI DEĞİL.
    // (Eskiden setHydrated, .start() callback'ine bağlıydı; callback web'de
    //  tetiklenmeyince uygulama splash'ta kalıcı takılıyordu → launch hang.)
    Animated.timing(progress, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: false,
    }).start();

    // Hem onboarding (gate kararı) hem app store (premium/streak/saves) hydrate
    // olmadan feed'e geçmeyiz → ilk frame'de yanlış premium/streak flash'ı olmaz.
    const onb = useOnboardingStore.persist;
    const app = useAppStore.persist;

    let onbDone = onb.hasHydrated();
    let appDone = app.hasHydrated();
    let finished = false;
    const maybeFinish = () => {
      if (!finished && onbDone && appDone) {
        finished = true;
        const completed = useOnboardingStore.getState().isCompleted;
        const premium   = useAppStore.getState().isPremium;
        const base = completed ? '/(tabs)/feed' : '/(onboarding)/welcome';
        // Free kullanıcıda 2. açılışta paywall, 3+. açılışta tek seferlik
        // indirimli teklif (lib/monetization). Hata olursa normal akış.
        registerSession(completed, premium)
          .then((show) => {
            if (show === 'paywall') setTarget('/(onboarding)/paywall?source=second_open');
            else if (show === 'offer') setTarget('/special-offer?source=auto');
            else setTarget(base);
          })
          .catch(() => setTarget(base));
      }
    };

    const unsubs: Array<() => void> = [];
    if (!onbDone) unsubs.push(onb.onFinishHydration(() => { onbDone = true; maybeFinish(); }));
    if (!appDone) unsubs.push(app.onFinishHydration(() => { appDone = true; maybeFinish(); }));
    maybeFinish();

    // Güvenlik ağı: hydration sinyali herhangi bir sebeple gelmezse bile
    // uygulama 3sn sonra mutlaka açılır — asla splash'ta kalıcı takılmaz.
    const safety = setTimeout(() => { onbDone = true; appDone = true; maybeFinish(); }, 3000);

    return () => { clearTimeout(safety); unsubs.forEach((u) => u()); };
  }, []);

  if (target) {
    return <Redirect href={target as any} />;
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
