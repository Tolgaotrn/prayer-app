import React from 'react';
import { I18nManager, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { GoldButton } from '../components/ui/GoldButton';
import { fonts, radii, spacing } from '../constants/theme';
import { useThemeColors } from '../lib/useThemeColors';
import { useOnboardingStore } from '../stores/useOnboardingStore';
import { useAppStore, type WidgetContentType } from '../stores/useAppStore';
import { haptic } from '../lib/haptics';
import { syncWidget } from '../lib/widgetSync';
import { backgroundThemes, resolveWidgetBgURL, sortedThemes, getTheme } from '../data/themes';
import { localThemeThumb } from '../data/themeAssets';

type ContentOption = {
  key: WidgetContentType;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  desc: string;
  premiumOnly?: boolean;
};

const CONTENT_OPTIONS: ContentOption[] = [
  { key: 'prayer',  icon: 'time-outline',      label: 'Prayer Times',     desc: 'Next prayer + countdown' },
  { key: 'verse',   icon: 'book-outline',       label: 'Verse of the Day', desc: 'Daily Quran verse' },
  { key: 'hadith',  icon: 'chatbubble-outline', label: 'Hadith',           desc: 'Daily hadith', premiumOnly: true },
  { key: 'quote',   icon: 'sparkles-outline',   label: 'Quote',            desc: 'Islamic inspiration', premiumOnly: true },
  { key: 'streak',  icon: 'flame-outline',      label: 'My Streak',        desc: 'Daily habit tracker' },
  { key: 'auto',    icon: 'shuffle-outline',    label: 'Smart (Auto)',     desc: 'Best content for size' },
];

const HOME_STEPS = [
  'Long-press an empty spot on your Home Screen.',
  'Tap the + button and search for "Huda".',
  'Pick Small, Medium or Large.',
  'Long-press the widget → "Edit Widget" to change content.',
];

const LOCK_STEPS = [
  'On your Lock Screen, long-press → Customize.',
  'Tap the widget area above or below the clock.',
  'Search for "Huda" and pick a widget.',
  'Tap the widget to choose what it shows.',
];

function ContentSelector({
  value,
  onChange,
  isPremium,
  onLockedPress,
}: {
  value: WidgetContentType;
  onChange: (t: WidgetContentType) => void;
  isPremium: boolean;
  onLockedPress: () => void;
}) {
  const tc = useThemeColors();
  return (
    <View style={styles.optionGrid}>
      {CONTENT_OPTIONS.map((opt) => {
        const locked = opt.premiumOnly && !isPremium;
        const active = value === opt.key;
        return (
          <Pressable
            key={opt.key}
            onPress={() => {
              if (locked) { haptic.medium(); onLockedPress(); return; }
              haptic.select();
              onChange(opt.key);
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            style={[
              styles.optionTile,
              {
                backgroundColor: active ? tc.gold + '18' : tc.cardBg,
                borderColor: active ? tc.gold : tc.border,
                opacity: locked ? 0.5 : 1,
              },
            ]}
          >
            <View style={[styles.optionIconWrap, { backgroundColor: active ? tc.gold + '28' : tc.raisedBg }]}>
              <Ionicons name={opt.icon} size={18} color={active ? tc.gold : tc.muted} />
            </View>
            <Text style={[styles.optionLabel, { color: active ? tc.gold : tc.heading }]} numberOfLines={1}>
              {opt.label}
            </Text>
            <Text style={[styles.optionDesc, { color: tc.muted }]} numberOfLines={1}>
              {locked ? '👑 Premium' : opt.desc}
            </Text>
            {active && (
              <View style={[styles.activeCheck, { backgroundColor: tc.gold }]}>
                <Ionicons name="checkmark" size={10} color="#fff" />
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

function StepsList({ steps }: { steps: string[] }) {
  const tc = useThemeColors();
  return (
    <View style={[styles.stepsCard, { backgroundColor: tc.cardBg, borderColor: tc.border }]}>
      {steps.map((s, i) => (
        <View key={i} style={styles.stepRow}>
          <View style={[styles.stepNum, { backgroundColor: tc.gold }]}>
            <Text style={styles.stepNumText}>{i + 1}</Text>
          </View>
          <Text style={[styles.stepText, { color: tc.body }]}>{s}</Text>
        </View>
      ))}
    </View>
  );
}

function BackgroundSelector({
  value,
  appThemeId,
  isPremium,
  onChange,
  onLockedPress,
}: {
  value: number | null;
  appThemeId: number;
  isPremium: boolean;
  onChange: (id: number | null) => void;
  onLockedPress: () => void;
}) {
  const tc = useThemeColors();
  const appTheme = getTheme(appThemeId);
  const themes = sortedThemes(backgroundThemes);

  const Tile = ({
    selected,
    locked,
    onPress,
    label,
    children,
  }: {
    selected: boolean;
    locked?: boolean;
    onPress: () => void;
    label: string;
    children: React.ReactNode;
  }) => (
    <Pressable
      onPress={() => {
        if (locked) { haptic.medium(); onLockedPress(); return; }
        haptic.select();
        onPress();
      }}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={locked ? `${label} (Premium)` : label}
      style={styles.bgTileWrap}
    >
      <View style={[styles.bgTile, { borderColor: selected ? tc.gold : tc.border }]}>
        {children}
        {locked && !selected && (
          <View style={styles.bgLock}>
            <Ionicons name="lock-closed" size={11} color="#fff" />
          </View>
        )}
        {selected && (
          <View style={[styles.bgCheck, { backgroundColor: tc.gold }]}>
            <Ionicons name="checkmark" size={12} color="#fff" />
          </View>
        )}
      </View>
      <Text style={[styles.bgLabel, { color: selected ? tc.gold : tc.muted }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bgRow}>
      {/* App teması — her zaman serbest (içerik kilidini açmaz, sadece yansıtır) */}
      <Tile selected={value === null} onPress={() => onChange(null)} label="App theme">
        <Image source={localThemeThumb(appTheme.image)} style={styles.bgImg} contentFit="cover" transition={150} />
      </Tile>

      {/* Temalar — video temalar (badge=Live) widget'ta çalışmaz, gizlenir.
          home themes'teki gibi: free olmayan temalar premium kilitli. */}
      {themes.filter((th) => th.badge !== 'Live').map((th) => {
        const locked = !th.isFree && !isPremium;
        return (
          <Tile
            key={th.id}
            selected={value === th.id}
            locked={locked}
            onPress={() => onChange(th.id)}
            label={th.name}
          >
            <Image source={localThemeThumb(th.image)} style={styles.bgImg} contentFit="cover" transition={150} />
          </Tile>
        );
      })}
    </ScrollView>
  );
}

export default function WidgetSettings() {
  const router = useRouter();
  const tc = useThemeColors();
  const language = useOnboardingStore((s) => s.language);
  const selectedTheme = useOnboardingStore((s) => s.selectedTheme);
  const streakDays = useAppStore((s) => s.streakDays);
  const isPremium = useAppStore((s) => s.isPremium);
  const homeContent = useAppStore((s) => s.homeWidgetContent);
  const lockContent = useAppStore((s) => s.lockWidgetContent);
  const followedTopics = useAppStore((s) => s.followedTopics);
  const savedVerseIds = useAppStore((s) => s.savedVerseIds);
  const widgetThemeId = useAppStore((s) => s.widgetThemeId);
  const setHomeContent = useAppStore((s) => s.setHomeWidgetContent);
  const setLockContent = useAppStore((s) => s.setLockWidgetContent);
  const setWidgetThemeId = useAppStore((s) => s.setWidgetThemeId);
  const themeImageURL = resolveWidgetBgURL(widgetThemeId, selectedTheme);

  const [tab, setTab] = React.useState<'home' | 'lock'>('home');
  const [syncing, setSyncing] = React.useState(false);
  const [synced, setSynced] = React.useState(false);

  const onRefresh = async () => {
    haptic.medium();
    setSyncing(true);
    setSynced(false);
    await syncWidget({ language, streakDays, force: true, followedTopics, isPremium, savedVerseIds, themeImageURL, homeContent, lockContent });
    setSyncing(false);
    setSynced(true);
    haptic.success();
    setTimeout(() => setSynced(false), 2500);
  };

  return (
    <ScreenContainer padded={false}>
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
        <Text style={[styles.title, { color: tc.heading }]}>Widgets</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tab bar */}
      <View style={[styles.tabBar, { backgroundColor: tc.cardBg, borderColor: tc.border }]}>
        {(['home', 'lock'] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => { haptic.select(); setTab(t); }}
            style={[
              styles.tabBtn,
              tab === t && [styles.tabBtnActive, { backgroundColor: tc.gold }],
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t }}
          >
            <Ionicons
              name={t === 'home' ? 'home-outline' : 'phone-portrait-outline'}
              size={15}
              color={tab === t ? '#fff' : tc.muted}
            />
            <Text style={[styles.tabText, { color: tab === t ? '#fff' : tc.muted }]}>
              {t === 'home' ? 'Home Screen' : 'Lock Screen'}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {Platform.OS !== 'ios' && (
          <Animated.View
            entering={FadeInDown.duration(300)}
            style={[styles.notice, { backgroundColor: tc.cardBg, borderColor: tc.border }]}
          >
            <Ionicons name="information-circle-outline" size={18} color={tc.gold} />
            <Text style={[styles.noticeText, { color: tc.body }]}>
              Widgets are available on iOS only.
            </Text>
          </Animated.View>
        )}

        {tab === 'home' ? (
          <>
            <Animated.Text entering={FadeInDown.delay(40)} style={[styles.sectionTitle, { color: tc.heading }]}>
              What your Home widget shows
            </Animated.Text>
            <Animated.Text entering={FadeInDown.delay(80)} style={[styles.sectionSub, { color: tc.muted }]}>
              Choose the content that appears on your Home Screen widget. You can also change it by long-pressing the widget.
            </Animated.Text>
            <Animated.View entering={FadeInDown.delay(120)}>
              <ContentSelector value={homeContent} onChange={setHomeContent} isPremium={isPremium} onLockedPress={() => router.push('/(onboarding)/paywall?source=widget')} />
            </Animated.View>
            <Animated.Text entering={FadeInDown.delay(180)} style={[styles.sectionTitle, { color: tc.heading, marginTop: spacing.lg }]}>
              How to add
            </Animated.Text>
            <Animated.View entering={FadeInDown.delay(220)}>
              <StepsList steps={HOME_STEPS} />
            </Animated.View>
          </>
        ) : (
          <>
            <Animated.Text entering={FadeInDown.delay(40)} style={[styles.sectionTitle, { color: tc.heading }]}>
              What your Lock Screen widget shows
            </Animated.Text>
            <Animated.Text entering={FadeInDown.delay(80)} style={[styles.sectionSub, { color: tc.muted }]}>
              Pick the content for your wallpaper / lock screen widget — visible without unlocking your phone.
            </Animated.Text>
            <Animated.View entering={FadeInDown.delay(120)}>
              <ContentSelector value={lockContent} onChange={setLockContent} isPremium={isPremium} onLockedPress={() => router.push('/(onboarding)/paywall?source=widget')} />
            </Animated.View>
            <Animated.Text entering={FadeInDown.delay(180)} style={[styles.sectionTitle, { color: tc.heading, marginTop: spacing.lg }]}>
              How to add
            </Animated.Text>
            <Animated.View entering={FadeInDown.delay(220)}>
              <StepsList steps={LOCK_STEPS} />
            </Animated.View>
          </>
        )}

        {/* Widget arka planı — uygulama temasından bağımsız, tüm widget'lar için */}
        <Animated.Text entering={FadeInDown.delay(240)} style={[styles.sectionTitle, { color: tc.heading, marginTop: spacing.lg }]}>
          Widget background
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(260)} style={[styles.sectionSub, { color: tc.muted }]}>
          Set a separate background for your widgets — independent of the app theme. Applies to all widgets.
        </Animated.Text>
        <Animated.View entering={FadeInDown.delay(280)}>
          <BackgroundSelector
            value={widgetThemeId}
            appThemeId={selectedTheme}
            isPremium={isPremium}
            onChange={setWidgetThemeId}
            onLockedPress={() => router.push('/(onboarding)/paywall?source=widget')}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300)} style={{ marginTop: spacing.xl }}>
          <GoldButton
            label={synced ? 'Widget refreshed ✓' : syncing ? 'Refreshing…' : 'Apply & refresh widget'}
            onPress={onRefresh}
            disabled={syncing || Platform.OS !== 'ios'}
          />
          <Text style={[styles.hint, { color: tc.muted }]}>
            Pushes your latest content, prayer times and preference to the widget immediately.
          </Text>
        </Animated.View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.serifBold, fontSize: 22, lineHeight: 36 },

  tabBar: {
    flexDirection: 'row', marginHorizontal: spacing.lg, marginBottom: spacing.md,
    borderRadius: radii.xl, borderWidth: 1, padding: 4, gap: 4,
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 9, borderRadius: radii.lg,
  },
  tabBtnActive: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 4, elevation: 2 },
  tabText: { fontFamily: fonts.sansSemibold, fontSize: 13 },

  content: { paddingHorizontal: spacing.lg, paddingBottom: 120 },
  notice: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderRadius: radii.md, borderWidth: 1, padding: spacing.md, marginBottom: spacing.md,
  },
  noticeText: { fontFamily: fonts.sansMedium, fontSize: 13, flex: 1 },

  sectionTitle: { fontFamily: fonts.sansBold, fontSize: 16, marginBottom: 4 },
  sectionSub: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, marginBottom: spacing.md },

  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  optionTile: {
    width: '47%', borderRadius: radii.lg, borderWidth: 1.5,
    padding: spacing.sm, gap: 4, position: 'relative',
  },
  optionIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  optionLabel: { fontFamily: fonts.sansSemibold, fontSize: 13 },
  optionDesc: { fontFamily: fonts.sans, fontSize: 11 },
  activeCheck: {
    position: 'absolute', top: 8, right: 8,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },

  bgRow: { paddingVertical: 4, paddingRight: spacing.md, gap: spacing.sm, flexDirection: 'row' },
  bgTileWrap: { alignItems: 'center', width: 72 },
  bgTile: {
    width: 64, height: 64, borderRadius: radii.md, borderWidth: 2,
    overflow: 'hidden', position: 'relative',
  },
  bgImg: { width: '100%', height: '100%' },
  bgCheck: {
    position: 'absolute', top: 4, right: 4,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  bgLock: {
    position: 'absolute', top: 4, right: 4,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  bgLabel: { fontFamily: fonts.sans, fontSize: 10, marginTop: 4, textAlign: 'center' },

  stepsCard: { borderRadius: radii.md, borderWidth: 1, padding: spacing.md, gap: spacing.md },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  stepNum: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  stepNumText: { fontFamily: fonts.sansBold, fontSize: 12, color: '#FFFFFF' },
  stepText: { fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 19, flex: 1 },

  hint: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: spacing.sm },
});
