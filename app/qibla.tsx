/**
 * qibla — Premium 3D Qibla finder
 *
 * Üç durum:
 *  1) calibrating — "Finding North": altın yaylar döner, telefonu düz tut.
 *  2) seeking      — varsayılan: dönen kadran + Kâbe işareti + "Turn right/left N°".
 *  3) aligned      — Kâbe üstteki işarete oturur, altın parıltı + "Facing Qibla".
 *
 * Kadran cihaz pusulasıyla (-heading) sürekli döner; Kâbe işareti qibla
 * bearing'inde durur. "3D" pill kadrana hafif perspektif eğimi verir.
 */
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Line,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
} from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
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
const ALIGN_THRESHOLD = 7; // derece

const MAKKAH = { lat: 21.4225, lng: 39.8262 };

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export default function QiblaScreen() {
  const router = useRouter();
  const tc = useThemeColors();
  const t = useT();
  const prayer = usePrayerTimes();

  const [qibla, setQibla] = React.useState<number | null>(null);
  const [heading, setHeading] = React.useState(0);
  const [hasCompass, setHasCompass] = React.useState(Platform.OS !== 'web');
  const [calibDone, setCalibDone] = React.useState(false);
  const [is3D, setIs3D] = React.useState(true);

  // sürekli (devamlı) açı için reanimated shared value
  const dial = useSharedValue(0);
  const accum = React.useRef(0);
  const lastH = React.useRef<number | null>(null);
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

  // Kalibrasyon: qibla hazır + min süre → seeking
  React.useEffect(() => {
    if (qibla === null) return;
    const id = setTimeout(() => setCalibDone(true), 1700);
    return () => clearTimeout(id);
  }, [qibla]);

  // Kadran dönüşü: kısa-yol delta ile sürekli açı (359→0 zıplaması yok)
  React.useEffect(() => {
    if (lastH.current === null) { lastH.current = heading; accum.current = heading; }
    const delta = ((heading - lastH.current + 540) % 360) - 180;
    accum.current += delta;
    lastH.current = heading;
    dial.value = withTiming(accum.current, { duration: 130, easing: Easing.out(Easing.quad) });
  }, [heading]);

  // Hizalama tespiti + haptic
  const screenAngle = qibla !== null ? ((qibla - heading + 360) % 360) : null;
  const aligned =
    calibDone && hasCompass && screenAngle !== null &&
    (screenAngle < ALIGN_THRESHOLD || screenAngle > 360 - ALIGN_THRESHOLD);

  React.useEffect(() => {
    if (aligned && !alignedRef.current) { haptic.success(); alignedRef.current = true; }
    if (!aligned) alignedRef.current = false;
  }, [aligned]);

  const phase: 'calibrating' | 'seeking' | 'aligned' =
    !calibDone ? 'calibrating' : aligned ? 'aligned' : 'seeking';

  // Turn yönü ve açısı
  const turn = React.useMemo(() => {
    if (screenAngle === null) return null;
    if (screenAngle <= 180) return { dir: 'right' as const, deg: Math.round(screenAngle) };
    return { dir: 'left' as const, deg: Math.round(360 - screenAngle) };
  }, [screenAngle]);

  const distance = React.useMemo(
    () => haversineKm(prayer.coords.latitude, prayer.coords.longitude, MAKKAH.lat, MAKKAH.lng),
    [prayer.coords],
  );

  // 3D perspektif eğimi
  const tilt = useSharedValue(1);
  React.useEffect(() => {
    tilt.value = withTiming(is3D ? 1 : 0, { duration: 420, easing: Easing.out(Easing.cubic) });
  }, [is3D]);

  const dialStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateX: `${interpolate(tilt.value, [0, 1], [0, 16])}deg` },
      { rotate: `${-dial.value}deg` },
    ],
  }));

  const tickColor = tc.isDark ? 'rgba(255,255,255,0.16)' : 'rgba(120,95,55,0.22)';
  const goldSoft = tc.gold + '55';

  // Kaabe pozisyonu (qibla bearing, 0=N=top)
  const kaabaPos = React.useMemo(() => {
    const q = qibla ?? 0;
    const rad = (q * Math.PI) / 180;
    return {
      left: R + RING * Math.sin(rad) - 19,
      top: R - RING * Math.cos(rad) - 19,
    };
  }, [qibla]);

  // needle uç koordinatı (qibla yönü)
  const needle = React.useMemo(() => {
    const q = qibla ?? 0;
    const rad = (q * Math.PI) / 180;
    return { x: R + RING * Math.sin(rad), y: R - RING * Math.cos(rad) };
  }, [qibla]);

  return (
    <ScreenContainer padded={false}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons
          name="chevron-back"
          size={26}
          color={tc.heading}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        />
        <Pressable
          onPress={() => { haptic.light(); setIs3D((v) => !v); }}
          style={[styles.d3Pill, { borderColor: tc.border, backgroundColor: tc.cardBg }]}
          accessibilityRole="button"
          accessibilityLabel="Toggle 3D view"
        >
          <Ionicons name={is3D ? 'cube' : 'cube-outline'} size={13} color={tc.gold} />
          <Text style={[styles.d3Text, { color: tc.body }]}>3D</Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        {/* ── Pusula alanı ── */}
        <View style={styles.compassWrap}>
          {/* Sabit üst işaretçi (cihaz yönü) */}
          <View style={[
            styles.topPointer,
            { borderTopColor: phase === 'aligned' ? tc.gold : tc.muted },
          ]} />

          {phase === 'calibrating' ? (
            <CalibrationArcs tc={tc} />
          ) : (
            <Animated.View style={dialStyle}>
              <Svg width={SIZE} height={SIZE}>
                <Defs>
                  <SvgGradient id="needle" x1="0" y1="1" x2="0" y2="0">
                    <Stop offset="0" stopColor={tc.gold} stopOpacity={0.15} />
                    <Stop offset="1" stopColor={tc.gold} stopOpacity={1} />
                  </SvgGradient>
                </Defs>

                {/* Dış halkalar */}
                <Circle
                  cx={R} cy={R} r={RING}
                  stroke={phase === 'aligned' ? goldSoft : tc.border}
                  strokeWidth={phase === 'aligned' ? 2 : 1.5}
                  fill="none"
                />
                <Circle cx={R} cy={R} r={RING - 16} stroke={tickColor} strokeWidth={1} fill="none" />

                {/* Tikler her 5° */}
                {Array.from({ length: 72 }).map((_, i) => {
                  const a = (i * 5 * Math.PI) / 180;
                  const major = i % 6 === 0;
                  const r1 = RING;
                  const r2 = RING - (major ? 13 : 6);
                  return (
                    <Line
                      key={i}
                      x1={R + r1 * Math.sin(a)} y1={R - r1 * Math.cos(a)}
                      x2={R + r2 * Math.sin(a)} y2={R - r2 * Math.cos(a)}
                      stroke={major ? tc.gold : tickColor}
                      strokeWidth={major ? 2 : 1}
                      opacity={major ? 0.75 : 1}
                    />
                  );
                })}

                {/* Needle: merkez → Kâbe yönü */}
                <Line
                  x1={R} y1={R} x2={needle.x} y2={needle.y}
                  stroke="url(#needle)" strokeWidth={3} strokeLinecap="round"
                />
                <Circle cx={R} cy={R} r={5} fill={tc.heading} />
              </Svg>

              {/* Cardinal labels */}
              {(['N', 'E', 'S', 'W'] as const).map((d, i) => {
                const a = (i * 90 * Math.PI) / 180;
                const rr = RING - 32;
                return (
                  <Text
                    key={d}
                    style={[
                      styles.cardinal,
                      {
                        color: d === 'N' ? tc.gold : tc.muted,
                        left: R + rr * Math.sin(a) - 10,
                        top: R - rr * Math.cos(a) - 12,
                      },
                    ]}
                  >
                    {d}
                  </Text>
                );
              })}

              {/* Kâbe işareti */}
              <View style={[
                styles.kaaba,
                kaabaPos,
                { backgroundColor: tc.isDark ? '#FFFFFF' : '#FFFFFF', borderColor: tc.gold },
                phase === 'aligned' && styles.kaabaActive,
              ]}>
                <Text style={styles.kaabaEmoji}>🕋</Text>
              </View>
            </Animated.View>
          )}
        </View>

        {/* ── Alt yazı bloğu ── */}
        <View style={styles.readout}>
          {phase === 'calibrating' && (
            <>
              <Text style={[styles.eyebrow, { color: tc.gold }]}>{t('qibla.calibrating')}</Text>
              <Text style={[styles.bigSerif, { color: tc.heading }]}>{t('qibla.findingNorth')}</Text>
              <Text style={[styles.sub, { color: tc.muted }]}>{t('qibla.holdFlat')}</Text>
            </>
          )}

          {phase === 'seeking' && (
            <>
              {hasCompass && turn ? (
                <>
                  <Text style={[styles.eyebrowWide, { color: tc.muted }]}>
                    {turn.dir === 'right' ? t('qibla.turnRight') : t('qibla.turnLeft')}
                  </Text>
                  <Text style={[styles.degHero, { color: tc.heading }]}>{turn.deg}°</Text>
                  <Text style={[styles.sub, { color: tc.muted }]}>{t('qibla.rotateUntil')}</Text>
                </>
              ) : (
                <>
                  <Text style={[styles.eyebrowWide, { color: tc.muted }]}>{t('qibla.toMakkah')}</Text>
                  <Text style={[styles.degHero, { color: tc.heading }]}>
                    {qibla !== null ? `${Math.round(qibla)}°` : '—'}
                  </Text>
                  <Text style={[styles.sub, { color: tc.muted }]}>
                    {t('qibla.note', { d: qibla !== null ? Math.round(qibla) : 0 })}
                  </Text>
                </>
              )}
            </>
          )}

          {phase === 'aligned' && (
            <>
              <Text style={[styles.eyebrowWide, { color: tc.gold }]}>{t('qibla.aligned')}</Text>
              <Text style={[styles.bigSerif, { color: tc.heading }]}>{t('qibla.facingQibla')}</Text>
              <Text style={[styles.sub, { color: tc.muted }]}>{t('qibla.holdSteady')}</Text>
            </>
          )}
        </View>

        {/* ── Konum footer ── */}
        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <View style={[styles.dot, { backgroundColor: tc.gold }]} />
            <Text style={[styles.footerCity, { color: tc.heading }]}>{t('qibla.makkah')}</Text>
          </View>
          <Text style={[styles.footerDist, { color: tc.muted }]}>
            {t('qibla.kmAway', { d: distance.toLocaleString() })}
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

/** Kalibrasyon: iki ters yönde dönen altın yay + merkez Kâbe. */
function CalibrationArcs({ tc }: { tc: ReturnType<typeof useThemeColors> }) {
  const spinA = useSharedValue(0);
  const spinB = useSharedValue(0);
  React.useEffect(() => {
    spinA.value = withRepeat(withTiming(360, { duration: 2600, easing: Easing.linear }), -1);
    spinB.value = withRepeat(withTiming(-360, { duration: 4200, easing: Easing.linear }), -1);
  }, []);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spinA.value}deg` }] }));
  const bStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spinB.value}deg` }] }));

  const circ = 2 * Math.PI * (RING - 4);
  const circ2 = 2 * Math.PI * (RING - 22);

  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[StyleSheet.absoluteFill, aStyle]}>
        <Svg width={SIZE} height={SIZE}>
          <Circle
            cx={R} cy={R} r={RING - 4}
            stroke={tc.gold} strokeWidth={2.5} fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circ * 0.22} ${circ * 0.78}`}
            opacity={0.9}
          />
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, bStyle]}>
        <Svg width={SIZE} height={SIZE}>
          <Circle
            cx={R} cy={R} r={RING - 22}
            stroke={tc.gold} strokeWidth={1.5} fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circ2 * 0.12} ${circ2 * 0.88}`}
            opacity={0.5}
          />
        </Svg>
      </Animated.View>
      <View style={[styles.kaaba, {
        position: 'absolute', backgroundColor: '#FFFFFF', borderColor: tc.gold,
      }]}>
        <Text style={styles.kaabaEmoji}>🕋</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  d3Pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: radii.full,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  d3Text: { fontFamily: fonts.sansSemibold, fontSize: 12 },

  body: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },

  compassWrap: {
    width: SIZE, height: SIZE + 20,
    alignItems: 'center', justifyContent: 'center',
    marginTop: spacing.lg,
  },
  topPointer: {
    // aşağı bakan üçgen: üst kenar renkli, sağ/sol şeffaf
    position: 'absolute', top: 0, zIndex: 10,
    width: 0, height: 0,
    borderLeftWidth: 8, borderRightWidth: 8, borderTopWidth: 13,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
  },
  cardinal: { position: 'absolute', fontFamily: fonts.sansBold, fontSize: 14, width: 20, textAlign: 'center' },
  kaaba: {
    width: 38, height: 38, borderRadius: 19, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
    position: 'absolute',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18, shadowRadius: 6, elevation: 4,
  },
  kaabaActive: {
    shadowColor: '#C9963A', shadowOpacity: 0.6, shadowRadius: 14, elevation: 10,
  },
  kaabaEmoji: { fontSize: 22 },

  readout: { alignItems: 'center', gap: 6, paddingHorizontal: spacing.md },
  eyebrow: { fontFamily: fonts.sansBold, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' },
  eyebrowWide: { fontFamily: fonts.sansBold, fontSize: 13, letterSpacing: 3, textTransform: 'uppercase' },
  bigSerif: { fontFamily: fonts.serifBold, fontSize: 30, lineHeight: 44, textAlign: 'center' },
  degHero: { fontFamily: fonts.serifBold, fontSize: 64, lineHeight: 78 },
  sub: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, textAlign: 'center', maxWidth: 300 },

  footer: { alignItems: 'center', gap: 4 },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  footerCity: { fontFamily: fonts.sansBold, fontSize: 15 },
  footerDist: { fontFamily: fonts.sans, fontSize: 13 },
});
