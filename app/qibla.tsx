/**
 * qibla — Premium Qibla finder
 *
 * Dönen pusula kadranı: cihaz pusulasına göre kadran -heading kadar döner,
 * Kaabe işareti Qibla bearing'inde durur. Üstteki sabit işaretçi cihazın
 * baktığı yönü gösterir. Kaabe işaretçiye gelince "aligned" highlight.
 */
import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  Animated as RNAnimated,
} from 'react-native';
import Svg, { Circle, Line, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Qibla, Coordinates } from 'adhan';

import { ScreenContainer } from '../components/layout/ScreenContainer';
import { fonts, radii, spacing } from '../constants/theme';
import { useThemeColors } from '../lib/useThemeColors';
import { useT } from '../lib/i18n';
import { usePrayerTimes } from '../lib/prayerTimes';
import { haptic } from '../lib/haptics';

const SIZE = 300;
const R = SIZE / 2;
const RING = R - 26;

export default function QiblaScreen() {
  const router = useRouter();
  const tc = useThemeColors();
  const t = useT();
  const prayer = usePrayerTimes();

  const [qibla, setQibla] = React.useState<number | null>(null);
  const [heading, setHeading] = React.useState(0);
  const [hasCompass, setHasCompass] = React.useState(Platform.OS !== 'web');
  const rot = React.useRef(new RNAnimated.Value(0)).current;
  const alignedRef = React.useRef(false);

  // Qibla bearing
  React.useEffect(() => {
    if (prayer.loading) return;
    try {
      setQibla(Qibla(new Coordinates(prayer.coords.latitude, prayer.coords.longitude)));
    } catch { /* yoksay */ }
  }, [prayer.coords, prayer.loading]);

  // Cihaz pusulası
  React.useEffect(() => {
    if (Platform.OS === 'web') return;
    let sub: Location.LocationSubscription | null = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setHasCompass(false); return; }
      sub = await Location.watchHeadingAsync((h) => {
        setHeading(h.trueHeading >= 0 ? h.trueHeading : h.magHeading);
      });
    })();
    return () => { sub?.remove(); };
  }, []);

  // Kadran dönüşü = -heading
  React.useEffect(() => {
    RNAnimated.timing(rot, {
      toValue: -heading,
      duration: 120,
      useNativeDriver: true,
    }).start();
  }, [heading]);

  // Hizalama tespiti + haptic
  const screenAngle = qibla !== null ? ((qibla - heading + 360) % 360) : null;
  const aligned = screenAngle !== null && (screenAngle < 6 || screenAngle > 354);
  React.useEffect(() => {
    if (aligned && !alignedRef.current) { haptic.success(); alignedRef.current = true; }
    if (!aligned) alignedRef.current = false;
  }, [aligned]);

  const dialRotate = rot.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });

  // Kaabe pozisyonu (qibla bearing, 0=N=top)
  const kaabaPos = React.useMemo(() => {
    const q = qibla ?? 0;
    const rad = (q * Math.PI) / 180;
    return {
      left: R + RING * Math.sin(rad) - 16,
      top: R - RING * Math.cos(rad) - 16,
    };
  }, [qibla]);

  const tickColor = tc.isDark ? 'rgba(255,255,255,0.18)' : 'rgba(120,95,55,0.25)';
  const cardinalColor = tc.muted;

  return (
    <ScreenContainer padded={false}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons
          name="arrow-back"
          size={24}
          color={tc.heading}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        />
        <Text style={[styles.title, { color: tc.heading }]}>{t('qibla.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.body}>
        {/* Durum */}
        <View style={[
          styles.statusPill,
          { backgroundColor: aligned ? tc.gold : tc.cardBg, borderColor: tc.border },
        ]}>
          <Ionicons
            name={aligned ? 'checkmark-circle' : 'navigate-outline'}
            size={15}
            color={aligned ? '#FFFFFF' : tc.gold}
          />
          <Text style={[styles.statusText, { color: aligned ? '#FFFFFF' : tc.body }]}>
            {aligned ? t('qibla.facing') : hasCompass ? t('qibla.rotate') : t('qibla.noCompass')}
          </Text>
        </View>

        {/* Pusula */}
        <View style={styles.compassWrap}>
          {/* Sabit üst işaretçi */}
          <View style={[styles.topPointer, { borderBottomColor: aligned ? tc.gold : tc.heading }]} />

          <RNAnimated.View style={{ transform: [{ rotate: dialRotate }] }}>
            <Svg width={SIZE} height={SIZE}>
              {/* Dış çember */}
              <Circle cx={R} cy={R} r={RING} stroke={tc.border} strokeWidth={1.5} fill="none" />
              <Circle cx={R} cy={R} r={RING - 14} stroke={tickColor} strokeWidth={1} fill="none" />
              {/* Tikler her 5° */}
              {Array.from({ length: 72 }).map((_, i) => {
                const a = (i * 5 * Math.PI) / 180;
                const major = i % 6 === 0;
                const r1 = RING;
                const r2 = RING - (major ? 12 : 6);
                return (
                  <Line
                    key={i}
                    x1={R + r1 * Math.sin(a)}
                    y1={R - r1 * Math.cos(a)}
                    x2={R + r2 * Math.sin(a)}
                    y2={R - r2 * Math.cos(a)}
                    stroke={major ? tc.gold : tickColor}
                    strokeWidth={major ? 2 : 1}
                    opacity={major ? 0.7 : 1}
                  />
                );
              })}
            </Svg>

            {/* Cardinal labels */}
            {(['N', 'E', 'S', 'W'] as const).map((d, i) => {
              const a = (i * 90 * Math.PI) / 180;
              const rr = RING - 30;
              return (
                <Text
                  key={d}
                  style={[
                    styles.cardinal,
                    {
                      color: d === 'N' ? tc.gold : cardinalColor,
                      left: R + rr * Math.sin(a) - 10,
                      top: R - rr * Math.cos(a) - 12,
                    },
                  ]}
                >
                  {d}
                </Text>
              );
            })}

            {/* Kaabe işareti */}
            <View style={[styles.kaaba, kaabaPos, aligned && styles.kaabaActive]}>
              <Text style={styles.kaabaEmoji}>🕋</Text>
            </View>
          </RNAnimated.View>

          {/* Merkez okuma */}
          <View style={styles.centerReadout} pointerEvents="none">
            <Text style={[styles.centerDeg, { color: tc.heading }]}>
              {qibla !== null ? `${Math.round(qibla)}°` : '—'}
            </Text>
            <Text style={[styles.centerLabel, { color: tc.muted }]}>{t('qibla.toMakkah')}</Text>
          </View>
        </View>

        {/* Alt bilgi */}
        <View style={[styles.infoCard, { backgroundColor: tc.cardBg, borderColor: tc.border }]}>
          <InfoItem tc={tc} icon="location-outline" label={t('qibla.location')} value={prayer.loading ? '…' : prayer.city} />
          <View style={[styles.infoDivider, { backgroundColor: tc.border }]} />
          <InfoItem
            tc={tc}
            icon="compass-outline"
            label={t('qibla.heading')}
            value={hasCompass ? `${Math.round(heading)}°` : 'N/A'}
          />
          <View style={[styles.infoDivider, { backgroundColor: tc.border }]} />
          <InfoItem
            tc={tc}
            icon="navigate-outline"
            label={t('qibla.title')}
            value={qibla !== null ? `${Math.round(qibla)}°` : '—'}
          />
        </View>

        {!hasCompass && (
          <Text style={[styles.note, { color: tc.muted }]}>
            {t('qibla.note', { d: qibla !== null ? Math.round(qibla) : 0 })}
          </Text>
        )}
      </View>
    </ScreenContainer>
  );
}

function InfoItem({
  tc, icon, label, value,
}: {
  tc: ReturnType<typeof useThemeColors>;
  icon: keyof typeof Ionicons.glyphMap;
  label: string; value: string;
}) {
  return (
    <View style={styles.infoItem}>
      <Ionicons name={icon} size={16} color={tc.gold} />
      <Text style={[styles.infoLabel, { color: tc.muted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: tc.heading }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  title: { fontFamily: fonts.serifBold, fontSize: 22 },
  body: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.lg, gap: spacing.lg },

  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    borderRadius: radii.pill, borderWidth: 1,
    paddingHorizontal: 16, paddingVertical: 9, marginTop: spacing.sm,
  },
  statusText: { fontFamily: fonts.sansMedium, fontSize: 13 },

  compassWrap: {
    width: SIZE, height: SIZE + 16,
    alignItems: 'center', justifyContent: 'center',
    marginTop: spacing.sm,
  },
  topPointer: {
    position: 'absolute', top: -2, zIndex: 10,
    width: 0, height: 0,
    borderLeftWidth: 9, borderRightWidth: 9, borderBottomWidth: 16,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
  },
  cardinal: { position: 'absolute', fontFamily: fonts.sansBold, fontSize: 15, width: 20, textAlign: 'center' },
  kaaba: {
    position: 'absolute', width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  kaabaActive: {
    backgroundColor: 'rgba(201,150,58,0.18)',
  },
  kaabaEmoji: { fontSize: 22 },
  centerReadout: { position: 'absolute', alignItems: 'center' },
  centerDeg: { fontFamily: fonts.serifBold, fontSize: 38 },
  centerLabel: { fontFamily: fonts.sansMedium, fontSize: 12, marginTop: 2 },

  infoCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: radii.xl, borderWidth: 1,
    paddingVertical: spacing.md, width: '100%',
  },
  infoItem: { flex: 1, alignItems: 'center', gap: 3 },
  infoLabel: { fontFamily: fonts.sans, fontSize: 11 },
  infoValue: { fontFamily: fonts.sansBold, fontSize: 15 },
  infoDivider: { width: 1, height: 32 },

  note: { fontFamily: fonts.sans, fontSize: 12, textAlign: 'center', lineHeight: 18, paddingHorizontal: spacing.md },
});
