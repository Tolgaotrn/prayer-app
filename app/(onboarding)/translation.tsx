import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '../../components/layout/OnboardingShell';
import { ToggleSwitch } from '../../components/ui/ToggleSwitch';
import { ArabicText } from '../../components/arabic/ArabicText';
import { colors, fonts, radii, spacing } from '../../constants/theme';
import { verses } from '../../data/verses';
import { haptic } from '../../lib/haptics';

const RECITERS = ['Mishary Alafasy', 'Abdul Basit', 'Sudais', 'Maher Al-Muaiqly'];

export default function Translation() {
  const router = useRouter();
  const [showTranslation, setShowTranslation] = React.useState(true);
  const [reciter, setReciter] = React.useState(0);

  const float = useSharedValue(0);
  useEffect(() => {
    float.value = withRepeat(
      withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [float]);
  const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -float.value * 10 }] }));

  return (
    <OnboardingShell
      step={5}
      title="Translation & Reciter"
      subtitle="Tune how verses are shown and heard"
      onContinue={() => router.push('/(onboarding)/reminders')}
    >
      <Animated.View style={[styles.phoneWrap, floatStyle]} entering={FadeInDown.duration(500)}>
        <View style={styles.phone}>
          <LinearGradient colors={['#3A2A18', '#B98A4E', '#2B2233']} style={StyleSheet.absoluteFill} />
          <View style={styles.phoneInner}>
            <ArabicText size={24}>{verses[0].arabic}</ArabicText>
            {showTranslation ? (
              <Text style={styles.phoneTrans}>{verses[0].translation}</Text>
            ) : null}
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120)} style={styles.card}>
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Show translation</Text>
            <Text style={styles.cardSub}>Display the meaning under each verse</Text>
          </View>
          <ToggleSwitch value={showTranslation} onChange={setShowTranslation} label="Show translation" />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(180)} style={styles.card}>
        <Text style={styles.cardTitle}>Reciter</Text>
        <View style={styles.reciterList}>
          {RECITERS.map((r, i) => (
            <Pressable
              key={r}
              onPress={() => {
                haptic.select();
                setReciter(i);
              }}
              style={[styles.reciterRow, reciter === i && styles.reciterActive]}
            >
              <Ionicons
                name={reciter === i ? 'radio-button-on' : 'radio-button-off'}
                size={18}
                color={reciter === i ? colors.gold.primary : colors.text.muted}
              />
              <Text style={styles.reciterText}>{r}</Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  phoneWrap: { alignItems: 'center', marginBottom: spacing.lg },
  phone: {
    width: 150,
    height: 200,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#0A0A0A',
  },
  phoneInner: { flex: 1, padding: spacing.md, justifyContent: 'center', alignItems: 'center' },
  phoneTrans: {
    fontFamily: fonts.serif,
    fontSize: 11,
    color: colors.white,
    textAlign: 'center',
    marginTop: 8,
  },
  card: {
    backgroundColor: colors.bg.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  toggleRow: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontFamily: fonts.sansSemibold, fontSize: 15, color: colors.text.heading },
  cardSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.text.muted, marginTop: 2 },
  reciterList: { marginTop: spacing.sm, gap: 4 },
  reciterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  reciterActive: { backgroundColor: colors.bg.raised },
  reciterText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.text.body },
});
