import React from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '../../components/layout/OnboardingShell';
import { Star } from '../../components/anim/Sparkles';
import { fonts, radii } from '../../constants/theme';
import { useThemeColors } from '../../lib/useThemeColors';
import { useOnboardingStore } from '../../stores/useOnboardingStore';
import { useOnboardingTracking } from '../../lib/useOnboardingTracking';
import { nextOnboardingRoute } from '../../lib/onboardingFlow';

export default function NameScreen() {
  const router = useRouter();
  const tc = useThemeColors();
  useOnboardingTracking('name');
  // Read the persisted value once; keep typing in local state so the whole
  // shell does NOT re-render on every keystroke (that was stealing focus).
  const initialName = React.useRef(useOnboardingStore.getState().name).current;
  const [name, setName] = React.useState(initialName);
  const [focused, setFocused] = React.useState(false);
  const inputRef = React.useRef<TextInput>(null);

  const inputStyle = useAnimatedStyle(() => ({
    borderColor: withTiming(focused ? tc.gold : tc.border),
    shadowOpacity: withTiming(focused ? 0.4 : 0),
  }));

  const onContinue = () => {
    Keyboard.dismiss();
    useOnboardingStore.getState().set('name', name.trim());
    router.push(nextOnboardingRoute('name', useOnboardingStore.getState().flowVariant));
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <OnboardingShell
        step={1}
        icon={<Star size={30} />}
        title="What is your name?"
        subtitle="We'll use it to make your daily reflections feel personal."
        ctaDisabled={name.trim().length === 0}
        onContinue={onContinue}
      >
        <Pressable onPress={() => inputRef.current?.focus()}>
          <Animated.View style={[styles.inputWrap, { backgroundColor: tc.cardBg, shadowColor: tc.gold }, inputStyle]}>
            <TextInput
              ref={inputRef}
              value={name}
              onChangeText={setName}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Your name"
              placeholderTextColor={tc.muted}
              selectionColor={tc.gold}
              style={[styles.input, { color: tc.heading }]}
              returnKeyType="done"
              onSubmitEditing={() => {
                if (name.trim().length > 0) onContinue();
              }}
              autoCorrect={false}
              accessibilityLabel="Name input"
            />
          </Animated.View>
        </Pressable>
      </OnboardingShell>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  inputWrap: {
    borderWidth: 1.5,
    borderRadius: radii.md,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  input: {
    height: 60,
    paddingHorizontal: 18,
    fontFamily: fonts.sansMedium,
    fontSize: 18,
  },
});
