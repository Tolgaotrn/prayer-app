import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,

  I18nManager,} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { GoldButton } from '../components/ui/GoldButton';
import { colors, fonts, radii, spacing } from '../constants/theme';
import { useThemeColors } from '../lib/useThemeColors';
import { useOnboardingStore } from '../stores/useOnboardingStore';
import { haptic } from '../lib/haptics';

export default function NameSettings() {
  const router = useRouter();
  const tc = useThemeColors();
  const stored = useOnboardingStore((s) => s.name);
  const set = useOnboardingStore((s) => s.set);

  // LOCAL state — store'a sadece kaydet butonunda yazılır
  const [value, setValue] = React.useState(stored || '');

  const onSave = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    haptic.success();
    set('name', trimmed);
    router.back();
  };

  return (
    <ScreenContainer padded={false}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: tc.cardBg }]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name={I18nManager.isRTL ? 'arrow-forward' : 'arrow-back'} size={22} color={tc.heading} />
          </Pressable>
          <Text style={[styles.title, { color: tc.heading }]}>Your Name</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          <Text style={[styles.label, { color: tc.muted }]}>
            How should Huda call you?
          </Text>

          <View style={[styles.inputWrap, { backgroundColor: tc.cardBg, borderColor: tc.border }]}>
            <Ionicons name="person-outline" size={18} color={tc.gold} style={{ marginRight: 10 }} />
            <TextInput
              value={value}
              onChangeText={setValue}
              placeholder="Enter your name"
              placeholderTextColor={tc.muted}
              style={[styles.input, { color: tc.heading }]}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={onSave}
              maxLength={40}
              accessibilityLabel="Name input"
            />
            {value.length > 0 && (
              <Pressable onPress={() => setValue('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={tc.muted} />
              </Pressable>
            )}
          </View>

          <GoldButton
            label="Save"
            onPress={onSave}
            disabled={!value.trim()}
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontFamily: fonts.serifBold, fontSize: 22, lineHeight: 36 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
  label: { fontFamily: fonts.sans, fontSize: 14 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  input: {
    flex: 1,
    fontFamily: fonts.sansMedium,
    fontSize: 18,
    paddingVertical: 0,
  },
});
