import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { ArabicText } from '../arabic/ArabicText';
import { colors, fonts, radii, spacing } from '../../constants/theme';
import type { Verse } from '../../data/types';

interface VerseCardProps {
  verse: Verse;
  frosted?: boolean;
  arabicSize?: number;
  style?: ViewStyle;
  compact?: boolean;
}

/** Frosted-glass verse card: Arabic + translation + surah reference. */
export function VerseCard({
  verse,
  frosted = true,
  arabicSize = 28,
  style,
  compact,
}: VerseCardProps) {
  const Inner = (
    <View style={[styles.inner, compact && { padding: spacing.md }]}>
      <ArabicText size={arabicSize} color={colors.text.heading}>
        {verse.arabic}
      </ArabicText>
      <Text style={[styles.translation, compact && { fontSize: 14 }]}>
        {verse.translation}
      </Text>
      <Text style={styles.reference}>
        Quran {verse.surah} · {verse.ayah}
      </Text>
    </View>
  );

  if (frosted) {
    return (
      <View style={[styles.card, style]}>
        <BlurView intensity={30} tint="dark" style={styles.blur}>
          {Inner}
        </BlurView>
      </View>
    );
  }
  return <View style={[styles.card, styles.solid, style]}>{Inner}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: 'rgba(22,30,61,0.55)',
  },
  solid: {
    backgroundColor: colors.bg.card,
  },
  blur: { width: '100%' },
  inner: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  translation: {
    fontFamily: fonts.serif,
    fontSize: 17,
    color: colors.text.body,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 25,
  },
  reference: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: spacing.md,
    letterSpacing: 0.3,
  },
});

export default VerseCard;
