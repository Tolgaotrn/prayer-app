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
import { colors, fonts, radii } from '../../constants/theme';
import { useOnboardingStore } from '../../stores/useOnboardingStore';

export default function NameScreen() {
  const router = useRouter();
  // Read the persisted value once; keep typing in local state so the whole
  // shell does NOT re-render on every keystroke (that was stealing focus).
  const initialName = React.useRef(useOnboardingStore.getState().name).current;
  const [name, setName] = React.useState(initialName);
  const [focused, setFocused] = React.useState(false);
  const inputRef = React.useRef<TextInput>(null);

  const inputStyle = useAnimatedStyle(() => ({
    borderColor: withTiming(focused ? colors.gold.primary : colors.hairline),
    shadowOpacity: withTiming(focused ? 0.4 : 0),
  }));

  const onContinue = () => {
    Keyboard.dismiss();
    useOnboardingStore.getState().set('name', name.trim());
    router.push('/(onboarding)/age');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <OnboardingShell
        step={0}
        icon={<Star size={30} />}
        title="What is your name?"
        subtitle="We'll use it to make your daily reflections feel personal."
        ctaDisabled={name.trim().length === 0}
        onContinue={onContinue}
      >
        <Pressable onPress={() => inputRef.current?.focus()}>
          <Animated.View style={[styles.inputWrap, inputStyle]}>
            <TextInput
              ref={inputRef}
              value={name}
              onChangeText={setName}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Your name"
              placeholderTextColor={colors.text.muted}
              selectionColor={colors.gold.primary}
              style={styles.input}
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
    backgroundColor: colors.bg.card,
    shadowColor: colors.gold.primary,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  input: {
    height: 60,
    paddingHorizontal: 18,
    fontFamily: fonts.sansMedium,
    fontSize: 18,
    color: colors.text.heading,
  },
});
