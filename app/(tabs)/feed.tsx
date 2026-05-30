import React from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
  ViewToken,
  FlatList,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArabicText } from '../../components/arabic/ArabicText';
import { StreakWidget } from '../../components/ui/StreakWidget';
import { colors, fonts, radii, spacing } from '../../constants/theme';
import { getTheme } from '../../data/themes';
import { useOnboardingStore } from '../../stores/useOnboardingStore';
import { useAppStore } from '../../stores/useAppStore';
import { haptic } from '../../lib/haptics';
import { fetchFeedItems, FeedItem, resolveLang } from '../../lib/contentDb';

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');

export default function Feed() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const themeId       = useOnboardingStore((s) => s.selectedTheme);
  const rawLang       = useOnboardingStore((s) => s.language);
  const lang          = resolveLang(rawLang);
  // Sadece "Arabic" seçiliyse Arapça göster, diğer tüm dillerde sadece çeviri
  const showArabic    = rawLang === 'Arabic';
  const theme         = getTheme(themeId);

  const followedTopics = useAppStore((s) => s.followedTopics);
  const savedIds       = useAppStore((s) => s.savedVerseIds);
  const isPremium      = useAppStore((s) => s.isPremium);
  const toggleSave     = useAppStore((s) => s.toggleSave);
  const registerOpen   = useAppStore((s) => s.registerOpen);
  const streakDays     = useAppStore((s) => s.streakDays);

  const [items,       setItems]       = React.useState<FeedItem[]>([]);
  const [loading,     setLoading]     = React.useState(true);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [showBanner,  setShowBanner]  = React.useState(true);

  // Önceki dili takip et — değiştiyse cache'i atlayıp taze çek
  const prevLangRef = React.useRef(lang);

  // Veri yükle — lang veya topic değişince cache'i atla, taze çek
  React.useEffect(() => {
    const langChanged = prevLangRef.current !== lang;
    prevLangRef.current = lang;

    setItems([]);
    setLoading(true);
    registerOpen();
    const t = setTimeout(() => setShowBanner(false), 3200);

    fetchFeedItems(lang, 100, followedTopics, isPremium, savedIds, langChanged).then(data => {
      setItems(data);
      setLoading(false);
    });

    return () => clearTimeout(t);
  }, [lang, followedTopics.join(',')]);

  const activeItem = items[activeIndex] ?? items[0];
  const isSaved    = activeItem ? savedIds.includes(activeItem.id) : false;
  const likedToday = Math.min(savedIds.length, 5);

  const onViewable = React.useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0];
    if (first?.index != null) {
      setActiveIndex(first.index);
      haptic.light();
    }
  }).current;

  const renderItem = React.useCallback(
    ({ item, index }: { item: FeedItem; index: number }) => (
      <FeedSlide
        item={item}
        active={index === activeIndex}
        image={theme.image}
        gradient={theme.gradient}
        showArabic={showArabic}
      />
    ),
    [activeIndex, theme.image, theme.gradient, showArabic],
  );

  const onShare = () => {
    if (!activeItem) return;
    haptic.medium();
    Share.share({
      message: `"${activeItem.translation}"\n\n— ${activeItem.reference}`,
    }).catch(() => {});
  };

  const onLike = () => {
    if (!activeItem) return;
    haptic.medium();
    // FeedItem'ı Verse formatına çevirerek store'a kaydet
    toggleSave({
      id: activeItem.id,
      arabic: activeItem.arabic,
      translation: activeItem.translation,
      surah: activeItem.reference.split(' · ')[0],
      ayah: parseInt(activeItem.reference.split(' ')[activeItem.reference.split(' ').length - 1]) || 0,
      juz: 0,
      origin: 'Makkah',
      category: 'peace',
      tags: activeItem.topics,
    });
  };

  if (loading) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.gold.primary} />
      </View>
    );
  }

  // Boş durum — özellikle "Favorites" seçili ama hiç kayıt yoksa
  if (items.length === 0) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center', padding: spacing.xl }]}>
        <StatusBar style="light" />
        <Ionicons name="heart-outline" size={56} color={colors.gold.primary} />
        <Text style={styles.emptyTitle}>No saved verses yet</Text>
        <Text style={styles.emptyBody}>
          Tap the heart on any verse to save it here. Or browse other topics to fill your feed.
        </Text>
        <Pressable
          style={styles.emptyBtn}
          onPress={() => { haptic.light(); router.push('/explore-topics'); }}
          accessibilityRole="button"
          accessibilityLabel="Browse topics"
        >
          <Ionicons name="grid-outline" size={18} color={colors.bg.midnight} />
          <Text style={styles.emptyBtnText}>Browse topics</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <FlatList
        data={items}
        keyExtractor={(v) => v.id}
        renderItem={renderItem}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        onViewableItemsChanged={onViewable}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        getItemLayout={(_, index) => ({ length: SCREEN_H, offset: SCREEN_H * index, index })}
      />

      {/* ── TOP BAR ── */}
      <View style={[styles.topBar, { top: insets.top + 6 }]} pointerEvents="box-none">
        <CircleButton icon="home" onPress={() => { haptic.light(); router.push('/(tabs)/home-card'); }} label="Home" />
        <View style={styles.likePill}>
          <Ionicons name="heart" size={15} color={colors.gold.bright} />
          <Text style={styles.likePillText}>{likedToday}/5</Text>
        </View>
        <CircleButton icon="crown-outline" onPress={() => { haptic.medium(); router.push('/(onboarding)/paywall'); }} label="Premium" gold />
      </View>

      {/* ── ACTION ROW ── */}
      <View style={[styles.actionsWrap, { bottom: insets.bottom + 96 }]} pointerEvents="box-none">
        <View style={styles.swipeHint}>
          <Ionicons name="chevron-up" size={20} color="rgba(245,240,225,0.85)" />
          <Text style={styles.swipeText}>Swipe up for next</Text>
        </View>
        <View style={styles.actions}>
          <ActionButton icon="arrow-redo-outline" label="Share" onPress={onShare} />
          <ActionButton
            icon={isSaved ? 'heart' : 'heart-outline'}
            label="Like"
            active={isSaved}
            onPress={onLike}
          />
          <ActionButton
            icon="color-palette-outline"
            label="Themes"
            onPress={() => { haptic.light(); router.push('/(tabs)/themes'); }}
          />
        </View>
      </View>

      {/* ── KÖŞE BUTONLARI ── */}
      <View style={[styles.cornerLeft, { bottom: insets.bottom + 20 }]} pointerEvents="box-none">
        <CircleButton icon="grid" gold onPress={() => { haptic.light(); router.push('/explore-topics'); }} label="Explore topics" />
      </View>
      <View style={[styles.cornerRight, { bottom: insets.bottom + 20 }]} pointerEvents="box-none">
        <CircleButton icon="person" gold onPress={() => { haptic.light(); router.push('/(tabs)/profile'); }} label="Profile" />
      </View>

      {/* ── STREAK BANNER ── */}
      {showBanner && (
        <Animated.View
          entering={SlideInUp.springify().damping(15)}
          exiting={SlideOutUp.duration(400)}
          style={[styles.banner, { top: insets.top + 54 }]}
        >
          <StreakWidget streakDays={streakDays} banner title="New streak started" />
        </Animated.View>
      )}
    </View>
  );
}

/* ── Arapça metnin uzunluğuna göre font boyutu ── */
function arabicFontSize(text: string): number {
  const len = text.length;
  if (len < 60)  return 36;
  if (len < 120) return 30;
  if (len < 200) return 24;
  if (len < 300) return 20;
  return 17;
}

/* ── Feed slide ─────────────────────────────────────────────── */
function FeedSlide({
  item, active, image, gradient, showArabic,
}: {
  item: FeedItem;
  active: boolean;
  image: { uri: string };
  gradient: readonly [string, string, ...string[]];
  showArabic: boolean;
}) {
  const arSize = arabicFontSize(item.arabic);
  // Arapça modu: SADECE Arapça göster (quote'larda Arapça yoksa çeviriye düş)
  const renderArabic = showArabic && item.arabic.trim().length > 0;

  return (
    <View style={styles.slide}>
      <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} />
      <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
      <LinearGradient
        colors={['rgba(7,10,20,0.5)', 'rgba(7,10,20,0.15)', 'rgba(7,10,20,0.55)', 'rgba(7,10,20,0.92)']}
        locations={[0, 0.35, 0.62, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.slideContent}>

        {/* Arapça modu → sadece Arapça */}
        {renderArabic ? (
          active ? (
            <Animated.View key={`${item.id}-ar`} entering={FadeInDown.duration(700)} style={styles.arabicWrap}>
              <ArabicText size={arSize} numberOfLines={9} adjustsFontSizeToFit minimumFontScale={0.5}>
                {item.arabic}
              </ArabicText>
            </Animated.View>
          ) : (
            <View style={styles.arabicWrap}>
              <ArabicText size={arSize} numberOfLines={9} adjustsFontSizeToFit minimumFontScale={0.5}>
                {item.arabic}
              </ArabicText>
            </View>
          )
        ) : (
          /* Diğer diller → sadece çeviri */
          active ? (
            <Animated.Text
              entering={FadeIn.duration(700)}
              style={[styles.translation, styles.translationLarge]}
              numberOfLines={10}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              "{item.translation}"
            </Animated.Text>
          ) : (
            <Text
              style={[styles.translation, styles.translationLarge]}
              numberOfLines={10}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              "{item.translation}"
            </Text>
          )
        )}

        {/* Referans */}
        <View style={styles.refRow}>
          <View style={styles.refLine} />
          <Text style={styles.reference}>{item.reference}</Text>
          <View style={styles.refLine} />
        </View>
      </View>
    </View>
  );
}

/* ── Aksiyon butonu ─────────────────────────────────────────── */
function ActionButton({
  icon, label, onPress, active,
}: {
  icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; active?: boolean;
}) {
  return (
    <Pressable style={styles.actionBtn} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <BlurView intensity={30} tint="light" style={styles.actionBlur}>
        <Ionicons name={icon} size={22} color={active ? colors.gold.bright : colors.white} />
      </BlurView>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

/* ── Köşe yuvarlak buton ────────────────────────────────────── */
function CircleButton({
  icon, onPress, label, gold,
}: {
  icon: keyof typeof Ionicons.glyphMap | 'crown-outline';
  onPress: () => void; label: string; gold?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.circleBtn, gold ? styles.circleGold : styles.circleDark]}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
    >
      {icon === 'crown-outline' ? (
        <Ionicons name="ribbon" size={20} color={colors.white} />
      ) : (
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={gold ? colors.white : colors.text.heading} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.midnight },
  slide: { height: SCREEN_H, width: SCREEN_W, justifyContent: 'center', overflow: 'hidden' },
  slideContent: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  arabicWrap: {
    width: '100%',
    marginBottom: spacing.md,
  },
  translation: {
    fontFamily: fonts.serif, fontSize: 18, color: 'rgba(245,240,225,0.92)',
    textAlign: 'center', marginTop: spacing.sm, lineHeight: 28,
  },
  translationLarge: {
    fontSize: 22,
    lineHeight: 34,
    marginTop: 0,
  },
  reference: {
    fontFamily: fonts.sansMedium, fontSize: 13,
    color: colors.gold.bright, letterSpacing: 0.5, textAlign: 'center',
  },
  refRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, marginTop: spacing.xl,
  },
  refLine: { width: 28, height: 1, backgroundColor: 'rgba(212,175,55,0.5)' },

  emptyTitle: {
    fontFamily: fonts.serifBold, fontSize: 22, color: colors.text.heading,
    textAlign: 'center', marginTop: spacing.lg,
  },
  emptyBody: {
    fontFamily: fonts.sans, fontSize: 15, color: colors.text.muted,
    textAlign: 'center', marginTop: spacing.sm, lineHeight: 22, maxWidth: 300,
  },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.gold.primary,
    paddingHorizontal: spacing.lg, paddingVertical: 12,
    borderRadius: radii.lg, marginTop: spacing.xl,
  },
  emptyBtnText: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.bg.midnight },

  topBar: {
    position: 'absolute', left: spacing.lg, right: spacing.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  likePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radii.pill, paddingHorizontal: 14, paddingVertical: 7,
  },
  likePillText: { fontFamily: fonts.sansSemibold, fontSize: 13, color: colors.white },

  actionsWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', gap: spacing.md },
  swipeHint:   { alignItems: 'center' },
  swipeText:   { fontFamily: fonts.sans, fontSize: 12, color: 'rgba(245,240,225,0.85)', marginTop: -2 },
  actions:     { flexDirection: 'row', gap: spacing.lg },
  actionBtn:   { alignItems: 'center', gap: 6 },
  actionBlur:  {
    width: 50, height: 50, borderRadius: 25, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)',
  },
  actionLabel: { fontFamily: fonts.sans, fontSize: 11, color: 'rgba(245,240,225,0.8)' },

  cornerLeft:  { position: 'absolute', left: spacing.lg },
  cornerRight: { position: 'absolute', right: spacing.lg },
  circleBtn:   { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  circleGold:  { backgroundColor: colors.gold.primary },
  circleDark:  { backgroundColor: 'rgba(255,255,255,0.16)' },
  banner:      { position: 'absolute', left: spacing.lg, right: spacing.lg },
});
