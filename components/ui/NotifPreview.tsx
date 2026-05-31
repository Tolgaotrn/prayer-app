import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { fonts, radii, spacing } from '../../constants/theme';

const APP_ICON = require('../../assets/icons/icon.png');

interface NotifPreviewProps {
  title?: string;
  body?: string;
  time?: string;
}

/** Mock iOS-style notification banner — shows the real app icon + name,
 *  with a faint second notification stacked behind it. */
export function NotifPreview({
  title = 'Noor',
  body = '“The best among you are those who have the best character.” — Prophet Muhammad (peace be upon him)',
  time = 'now',
}: NotifPreviewProps) {
  return (
    <View style={styles.stack}>
      {/* arkadaki ikinci bildirim (peek efekti) */}
      <View style={styles.behind} />

      <BlurView intensity={45} tint="light" style={styles.card}>
        <Image source={APP_ICON} style={styles.iconBox} contentFit="cover" />
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.time}>{time}</Text>
          </View>
          <Text style={styles.body} numberOfLines={3}>
            {body}
          </Text>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { position: 'relative' },
  behind: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: -10,
    height: 40,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(245,245,250,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  card: {
    flexDirection: 'row',
    borderRadius: radii.lg,
    padding: spacing.sm,
    backgroundColor: 'rgba(248,248,250,0.95)',
    overflow: 'hidden',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 9,
  },
  content: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: fonts.sansBold, fontSize: 13, color: '#1A1A1A' },
  time: { fontFamily: fonts.sans, fontSize: 11, color: '#6A6A6A' },
  body: { fontFamily: fonts.sans, fontSize: 13, color: '#2A2A2A', marginTop: 2, lineHeight: 18 },
});

export default NotifPreview;
