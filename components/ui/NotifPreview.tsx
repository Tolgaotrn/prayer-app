import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, fonts, radii, spacing } from '../../constants/theme';
import { Star } from '../anim/Sparkles';

interface NotifPreviewProps {
  title?: string;
  body?: string;
  time?: string;
}

/** Mock iOS-style notification banner. */
export function NotifPreview({
  title = 'Noor',
  body = 'Verily, with every difficulty there is relief. — Ash-Sharh 94:6',
  time = 'now',
}: NotifPreviewProps) {
  return (
    <BlurView intensity={40} tint="light" style={styles.card}>
      <View style={styles.iconBox}>
        <Star size={18} color={colors.bg.midnight} />
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.time}>{time}</Text>
        </View>
        <Text style={styles.body} numberOfLines={2}>
          {body}
        </Text>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: radii.lg,
    padding: spacing.sm,
    backgroundColor: 'rgba(245,245,250,0.9)',
    overflow: 'hidden',
    gap: spacing.sm,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 9,
    backgroundColor: colors.gold.bright,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: fonts.sansBold, fontSize: 13, color: '#1A1A1A' },
  time: { fontFamily: fonts.sans, fontSize: 11, color: '#6A6A6A' },
  body: { fontFamily: fonts.sans, fontSize: 13, color: '#2A2A2A', marginTop: 2, lineHeight: 18 },
});

export default NotifPreview;
