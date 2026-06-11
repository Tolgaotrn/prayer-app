import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,

  I18nManager,} from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';

import { ScreenContainer } from '../components/layout/ScreenContainer';
import { ArabicText } from '../components/arabic/ArabicText';
import { fonts, radii, spacing } from '../constants/theme';
import { useThemeColors } from '../lib/useThemeColors';
import { useT } from '../lib/i18n';
import { haptic } from '../lib/haptics';
import { useAppStore } from '../stores/useAppStore';
import { readDhikr, writeDhikr } from '../lib/widgetSync';

type Dhikr = {
  key: string;
  arabic: string;
  translit: string;
  meaning: string;
  target: number;
  custom?: boolean;
};

const DEFAULT_DHIKRS: Dhikr[] = [
  { key: 'subhan',    arabic: 'سُبْحَانَ اللهِ',           translit: 'SubhanAllah',       meaning: 'Glory be to God',           target: 33 },
  { key: 'alhamd',    arabic: 'الْحَمْدُ لِلَّهِ',          translit: 'Alhamdulillah',     meaning: 'All praise is to God',      target: 33 },
  { key: 'akbar',     arabic: 'اللهُ أَكْبَر',              translit: 'Allahu Akbar',      meaning: 'God is the Greatest',       target: 34 },
  { key: 'tahlil',    arabic: 'لَا إِلٰهَ إِلَّا اللّٰه',    translit: 'La ilaha illallah', meaning: 'There is no god but God',   target: 100 },
  { key: 'istighfar', arabic: 'أَسْتَغْفِرُ اللهَ',          translit: 'Astaghfirullah',    meaning: "I seek God's forgiveness",  target: 100 },
];

const RING_SIZE = 260;
const STROKE = 12;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function DhikrScreen() {
  const router = useRouter();
  const tc = useThemeColors();
  const t = useT();

  const addDhikr = useAppStore((s) => s.addDhikr);
  const absorbDhikrTotal = useAppStore((s) => s.absorbDhikrTotal);
  const dhikrToday = useAppStore((s) => s.dhikrToday);
  const dhikrLifetime = useAppStore((s) => s.dhikrTotal);

  const [dhikrs, setDhikrs] = React.useState<Dhikr[]>(DEFAULT_DHIKRS);
  const [idx, setIdx] = React.useState(0);
  const [count, setCount] = React.useState(0);
  const [rounds, setRounds] = React.useState(0);

  // Custom modal state
  const [modalVisible, setModalVisible] = React.useState(false);
  const [customArabic, setCustomArabic] = React.useState('');
  const [customTranslit, setCustomTranslit] = React.useState('');
  const [customTarget, setCustomTarget] = React.useState('33');

  const dhikr = dhikrs[idx];

  const progress = useSharedValue(0);
  const scale = useSharedValue(1);
  const glow = useSharedValue(0.6);

  // Paylaşılan dhikr durumunu (widget ile ortak) yaz
  const pushShared = (d: Dhikr, c: number, r: number) => {
    writeDhikr({
      arabic: d.arabic,
      translit: d.translit,
      target: d.target,
      count: c,
      rounds: r,
      total: useAppStore.getState().dhikrTotal,
    });
  };

  // Ekrana her dönüşte widget'taki çekimleri içeri al + görünümü senkronla
  useFocusEffect(
    React.useCallback(() => {
      const shared = readDhikr();
      if (shared) {
        absorbDhikrTotal(shared.total);
        const i = dhikrs.findIndex(
          (d) => d.translit === shared.translit && d.target === shared.target,
        );
        if (i >= 0) {
          setIdx(i);
          setCount(shared.count);
          setRounds(shared.rounds);
          progress.value = withTiming(shared.count / dhikrs[i].target, { duration: 200 });
        }
      } else {
        pushShared(dhikrs[idx], count, rounds);
      }
      // dhikrs deps'te: custom dhikr eklendikten sonra findIndex güncel listede arar
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dhikrs]),
  );

  const selectDhikr = (i: number) => {
    if (i === idx) return;
    haptic.select();
    setIdx(i);
    setCount(0);
    setRounds(0);
    progress.value = withTiming(0, { duration: 200 });
    pushShared(dhikrs[i], 0, 0);
  };

  const onTap = () => {
    const next = count + 1;
    scale.value = withSequence(
      withSpring(0.91, { damping: 10, stiffness: 500 }),
      withSpring(1, { damping: 14, stiffness: 300 }),
    );
    glow.value = withSequence(
      withTiming(1, { duration: 80 }),
      withTiming(0.6, { duration: 300 }),
    );

    addDhikr(1); // kalıcı toplam + bugün

    let newCount = next;
    let newRounds = rounds;
    if (next >= dhikr.target) {
      haptic.success();
      newRounds = rounds + 1;
      newCount = 0;
      setRounds(newRounds);
      setCount(0);
      progress.value = withTiming(1, { duration: 150 }, () => {
        progress.value = withTiming(0, { duration: 300 });
      });
    } else {
      haptic.light();
      setCount(next);
      progress.value = withTiming(next / dhikr.target, { duration: 180 });
    }
    pushShared(dhikr, newCount, newRounds);
  };

  const onReset = () => {
    haptic.medium();
    setCount(0);
    setRounds(0);
    progress.value = withTiming(0, { duration: 250 });
    pushShared(dhikr, 0, 0);
  };

  const addCustom = () => {
    const name = customTranslit.trim() || customArabic.trim();
    if (!name) return;
    const target = parseInt(customTarget, 10) || 33;
    const newDhikr: Dhikr = {
      key: `custom_${Date.now()}`,
      arabic: customArabic.trim(),
      translit: customTranslit.trim() || name,
      meaning: '',
      target,
      custom: true,
    };
    const updated = [...dhikrs, newDhikr];
    setDhikrs(updated);
    setIdx(updated.length - 1);
    setCount(0);
    setRounds(0);
    progress.value = withTiming(0, { duration: 200 });
    pushShared(newDhikr, 0, 0);
    setModalVisible(false);
    setCustomArabic('');
    setCustomTranslit('');
    setCustomTarget('33');
    haptic.success();
  };

  const animatedCircleProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRC * (1 - progress.value),
  }));
  const tapStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  const trackColor = tc.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(120,95,55,0.12)';

  return (
    <ScreenContainer padded={false}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.headerBtn, { backgroundColor: tc.cardBg }]}
          accessibilityRole="button" accessibilityLabel="Go back"
        >
          <Ionicons name={I18nManager.isRTL ? 'arrow-forward' : 'arrow-back'} size={20} color={tc.heading} />
        </Pressable>
        <Text style={[styles.title, { color: tc.heading }]}>{t('tasbih.title')}</Text>
        <Pressable
          onPress={onReset}
          style={[styles.headerBtn, { backgroundColor: tc.cardBg }]}
          accessibilityRole="button" accessibilityLabel="Reset"
        >
          <Ionicons name="refresh-outline" size={20} color={tc.muted} />
        </Pressable>
      </View>

      {/* Main area */}
      <View style={styles.main}>
        {/* Arabic + meaning */}
        <View style={styles.textBlock}>
          <ArabicText size={36} color={tc.heading} style={{ textAlign: 'center' }}>
            {dhikr.arabic}
          </ArabicText>
          <Text style={[styles.translit, { color: tc.gold }]}>{dhikr.translit.toUpperCase()}</Text>
          {dhikr.meaning ? (
            <Text style={[styles.meaning, { color: tc.muted }]}>{dhikr.meaning}</Text>
          ) : null}
        </View>

        {/* Ring tap area */}
        <Pressable
          onPress={onTap}
          style={styles.ringWrap}
          accessibilityRole="button"
          accessibilityLabel={`Count ${dhikr.translit}, ${count} of ${dhikr.target}`}
        >
          <Animated.View style={tapStyle}>
            <Animated.View style={[styles.glowRing, { shadowColor: tc.gold }, glowStyle]} />
            <Svg width={RING_SIZE} height={RING_SIZE}>
              <Defs>
                <SvgGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0%" stopColor={tc.gold} stopOpacity="1" />
                  <Stop offset="100%" stopColor={tc.isDark ? '#E8C766' : '#C9963A'} stopOpacity="0.7" />
                </SvgGradient>
              </Defs>
              <Circle
                cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS}
                stroke={trackColor} strokeWidth={STROKE} fill="none"
              />
              <AnimatedCircle
                cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS}
                stroke="url(#ringGrad)" strokeWidth={STROKE} fill="none"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                animatedProps={animatedCircleProps}
                transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
              />
            </Svg>
            <View style={styles.ringCenter} pointerEvents="none">
              <Text style={[styles.countNum, { color: tc.heading }]}>{count}</Text>
              <Text style={[styles.countOf, { color: tc.muted }]}>/ {dhikr.target}</Text>
            </View>
          </Animated.View>
        </Pressable>

        {/* İstatistikler — turlar (oturum) + bugün + tüm zamanlar (kalıcı) */}
        <View style={[styles.roundsRow, { backgroundColor: tc.cardBg, borderColor: tc.border }]}>
          <View style={styles.roundsItem}>
            <Text style={[styles.roundsNum, { color: tc.gold }]}>{rounds}</Text>
            <Text style={[styles.roundsLabel, { color: tc.muted }]}>rounds</Text>
          </View>
          <View style={[styles.roundsDivider, { backgroundColor: tc.border }]} />
          <View style={styles.roundsItem}>
            <Text style={[styles.roundsNum, { color: tc.gold }]}>{dhikrToday}</Text>
            <Text style={[styles.roundsLabel, { color: tc.muted }]}>today</Text>
          </View>
          <View style={[styles.roundsDivider, { backgroundColor: tc.border }]} />
          <View style={styles.roundsItem}>
            <Text style={[styles.roundsNum, { color: tc.gold }]}>{dhikrLifetime}</Text>
            <Text style={[styles.roundsLabel, { color: tc.muted }]}>all time</Text>
          </View>
        </View>
      </View>

      {/* Bottom selector */}
      <View style={[styles.selectorWrap, { backgroundColor: tc.cardBg, borderTopColor: tc.border }]}>
        <View style={styles.selectorHeader}>
          <Text style={[styles.selectorLabel, { color: tc.muted }]}>CHOOSE DHIKR</Text>
          <Pressable
            onPress={() => setModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Add custom dhikr"
          >
            <Text style={[styles.customBtn, { color: tc.gold }]}>+ Custom</Text>
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tilesRow}
        >
          {dhikrs.map((d, i) => {
            const active = i === idx;
            return (
              <Pressable
                key={d.key}
                onPress={() => selectDhikr(i)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[
                  styles.dhikrTile,
                  {
                    backgroundColor: active
                      ? (tc.isDark ? '#1A1A2E' : '#2C2418')
                      : tc.raisedBg,
                    borderColor: active ? (tc.isDark ? '#3A3A5E' : '#4A3828') : tc.border,
                  },
                ]}
              >
                {d.arabic ? (
                  <ArabicText
                    size={22}
                    color={active ? '#fff' : tc.heading}
                    style={{ textAlign: 'center' }}
                  >
                    {d.arabic}
                  </ArabicText>
                ) : (
                  <Text style={[styles.dhikrTranslit, { color: active ? '#fff' : tc.heading }]}>
                    {d.translit}
                  </Text>
                )}
                <Text style={[styles.dhikrTarget, { color: active ? 'rgba(255,255,255,0.55)' : tc.muted }]}>
                  {d.translit} ×{d.target}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Custom Dhikr Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable
            style={[styles.modalSheet, { backgroundColor: tc.cardBg }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.modalHandle, { backgroundColor: tc.border }]} />
            <Text style={[styles.modalTitle, { color: tc.heading }]}>New Dhikr</Text>

            <Text style={[styles.fieldLabel, { color: tc.muted }]}>Arabic text (optional)</Text>
            <TextInput
              style={[styles.input, { color: tc.heading, borderColor: tc.border, backgroundColor: tc.raisedBg, textAlign: 'right', fontFamily: fonts.arabic, fontSize: 20 }]}
              value={customArabic}
              onChangeText={setCustomArabic}
              placeholder="اكتب هنا..."
              placeholderTextColor={tc.muted}
            />

            <Text style={[styles.fieldLabel, { color: tc.muted }]}>Name / Transliteration</Text>
            <TextInput
              style={[styles.input, { color: tc.heading, borderColor: tc.border, backgroundColor: tc.raisedBg }]}
              value={customTranslit}
              onChangeText={setCustomTranslit}
              placeholder="e.g. Bismillah"
              placeholderTextColor={tc.muted}
            />

            <Text style={[styles.fieldLabel, { color: tc.muted }]}>Target count</Text>
            <TextInput
              style={[styles.input, { color: tc.heading, borderColor: tc.border, backgroundColor: tc.raisedBg }]}
              value={customTarget}
              onChangeText={setCustomTarget}
              keyboardType="number-pad"
              placeholder="33"
              placeholderTextColor={tc.muted}
            />

            <Pressable
              onPress={addCustom}
              style={[styles.addBtn, { backgroundColor: tc.gold }]}
              accessibilityRole="button"
              accessibilityLabel="Add dhikr"
            >
              <Text style={styles.addBtnText}>Add Dhikr</Text>
            </Pressable>

            <Pressable
              onPress={() => setModalVisible(false)}
              style={styles.cancelBtn}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={[styles.cancelText, { color: tc.muted }]}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xs,
  },
  headerBtn: {
    width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
  },
  title: { fontFamily: fonts.serifBold, fontSize: 20, lineHeight: 33 },

  main: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing.lg, gap: spacing.lg,
  },

  textBlock: { alignItems: 'center', gap: 4 },
  translit: { fontFamily: fonts.sansSemibold, fontSize: 13, letterSpacing: 1.2 },
  meaning: { fontFamily: fonts.sans, fontSize: 13 },

  ringWrap: { alignItems: 'center', justifyContent: 'center' },
  glowRing: {
    position: 'absolute',
    width: RING_SIZE - 20, height: RING_SIZE - 20,
    borderRadius: (RING_SIZE - 20) / 2,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 28,
    shadowOpacity: 0.45,
    elevation: 12,
  },
  ringCenter: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  countNum: { fontFamily: fonts.serifBold, fontSize: 72, lineHeight: 78 },
  countOf: { fontFamily: fonts.sansMedium, fontSize: 15 },

  roundsRow: {
    flexDirection: 'row', borderRadius: radii.xl, borderWidth: 1,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, gap: spacing.lg,
  },
  roundsItem: { alignItems: 'center', gap: 2, minWidth: 56 },
  roundsNum: { fontFamily: fonts.serifBold, fontSize: 22, lineHeight: 36 },
  roundsLabel: { fontFamily: fonts.sans, fontSize: 11 },
  roundsDivider: { width: 1, height: 32, alignSelf: 'center' },

  selectorWrap: {
    borderTopWidth: 1, paddingTop: spacing.md, paddingBottom: spacing.xl,
  },
  selectorHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, marginBottom: spacing.sm,
  },
  selectorLabel: { fontFamily: fonts.sansSemibold, fontSize: 11, letterSpacing: 1.2 },
  customBtn: { fontFamily: fonts.sansSemibold, fontSize: 13 },
  tilesRow: { paddingHorizontal: spacing.md, gap: spacing.sm, flexDirection: 'row' },
  dhikrTile: {
    borderRadius: radii.lg, borderWidth: 1.5,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    alignItems: 'center', minWidth: 110,
  },
  dhikrTranslit: { fontFamily: fonts.sansSemibold, fontSize: 15 },
  dhikrTarget: { fontFamily: fonts.sans, fontSize: 11, marginTop: 4 },

  // Modal
  modalOverlay: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.xl, paddingBottom: 40,
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.lg,
  },
  modalTitle: { fontFamily: fonts.serifBold, fontSize: 22, marginBottom: spacing.lg },
  fieldLabel: { fontFamily: fonts.sansSemibold, fontSize: 12, letterSpacing: 0.8, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderRadius: radii.lg,
    paddingHorizontal: spacing.md, paddingVertical: 12,
    fontFamily: fonts.sans, fontSize: 15,
    marginBottom: spacing.md,
  },
  addBtn: {
    borderRadius: radii.xl, paddingVertical: 14,
    alignItems: 'center', marginTop: spacing.sm,
  },
  addBtnText: { fontFamily: fonts.sansBold, fontSize: 15, color: '#fff' },
  cancelBtn: { alignItems: 'center', paddingVertical: spacing.md },
  cancelText: { fontFamily: fonts.sans, fontSize: 14 },
});
