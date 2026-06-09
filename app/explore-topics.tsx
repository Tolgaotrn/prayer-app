import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { StreakWidget } from '../components/ui/StreakWidget';
import { fonts, radii, spacing } from '../constants/theme';
import { useThemeColors } from '../lib/useThemeColors';
import { useT } from '../lib/i18n';
import { useAppStore } from '../stores/useAppStore';
import { haptic } from '../lib/haptics';

type Topic = { label: string; icon: string; labelKey: string; subKey: string; free?: boolean };
type Section = { titleKey: string; topics: Topic[] };

const FREE_TOPICS: Topic[] = [
  { label: 'General',   icon: 'apps-outline',  labelKey: 'topic.General',   subKey: 'topicsub.General',   free: true },
  { label: 'Favorites', icon: 'heart-outline', labelKey: 'topic.Favorites', subKey: 'topicsub.Favorites', free: true },
];

const POPULAR_TOPICS: Topic[] = [
  { label: '99 Names of Allah',   icon: 'sparkles-outline',            labelKey: 'topic.99 Names of Allah',   subKey: 'topicsub.99 Names of Allah' },
  { label: 'Quran Verses',        icon: 'book-outline',                labelKey: 'topic.Quran Verses',        subKey: 'topicsub.Quran Verses' },
  { label: 'Hadiths',             icon: 'library-outline',             labelKey: 'topic.Hadiths',             subKey: 'topicsub.Hadiths' },
  { label: 'Duas & Prayers',      icon: 'hand-left-outline',           labelKey: 'topic.Duas & Prayers',      subKey: 'topicsub.Duas & Prayers' },
  { label: 'Islamic Quotes',      icon: 'chatbubble-ellipses-outline', labelKey: 'topic.Islamic Quotes',      subKey: 'topicsub.Islamic Quotes' },
  { label: 'Dhikr & Remembrance', icon: 'infinite-outline',            labelKey: 'topic.Dhikr & Remembrance', subKey: 'topicsub.Dhikr & Remembrance' },
  { label: 'Patience',            icon: 'hourglass-outline',           labelKey: 'topic.Patience',            subKey: 'topicsub.Patience' },
  { label: 'Gratitude',           icon: 'gift-outline',                labelKey: 'topic.Gratitude',           subKey: 'topicsub.Gratitude' },
  { label: 'Hope',                icon: 'partly-sunny-outline',        labelKey: 'topic.Hope',                subKey: 'topicsub.Hope' },
];

const CATALOG: Section[] = [
  {
    titleKey: 'topicsec.Faith & Belief',
    topics: [
      { label: 'Tawakkul',         icon: 'shield-outline',         labelKey: 'topic.Tawakkul',         subKey: 'topicsub.Tawakkul' },
      { label: 'Repentance',       icon: 'return-up-back-outline', labelKey: 'topic.Repentance',       subKey: 'topicsub.Repentance' },
      { label: 'Seeking Guidance', icon: 'compass-outline',        labelKey: 'topic.Seeking Guidance', subKey: 'topicsub.Seeking Guidance' },
    ],
  },
  {
    titleKey: 'topicsec.Character & Morality',
    topics: [
      { label: 'Honesty',     icon: 'checkmark-circle-outline', labelKey: 'topic.Honesty',     subKey: 'topicsub.Honesty' },
      { label: 'Kindness',    icon: 'heart-half-outline',       labelKey: 'topic.Kindness',    subKey: 'topicsub.Kindness' },
      { label: 'Forgiveness', icon: 'water-outline',            labelKey: 'topic.Forgiveness', subKey: 'topicsub.Forgiveness' },
    ],
  },
  {
    titleKey: 'topicsec.Heart & Spirituality',
    topics: [
      { label: 'Inner Peace',   icon: 'leaf-outline', labelKey: 'topic.Inner Peace',   subKey: 'topicsub.Inner Peace' },
      { label: 'Love of Allah', icon: 'rose-outline', labelKey: 'topic.Love of Allah', subKey: 'topicsub.Love of Allah' },
    ],
  },
];

const ALL_TOPICS = [
  ...FREE_TOPICS.map(t => ({ ...t, section: 'Free' })),
  ...POPULAR_TOPICS.map(t => ({ ...t, section: 'Most Popular' })),
  ...CATALOG.flatMap(s => s.topics.map(t => ({ ...t, section: s.titleKey }))),
];

export default function ExploreTopics() {
  const router            = useRouter();
  const tc                = useThemeColors();
  const t                 = useT();
  const isPremium         = useAppStore((s) => s.isPremium);
  const followedTopics    = useAppStore((s) => s.followedTopics);
  const toggleFollowTopic = useAppStore((s) => s.toggleFollowTopic);
  const streakDays        = useAppStore((s) => s.streakDays);
  const [query, setQuery] = useState('');

  const onTopic = (label: string, locked: boolean) => {
    if (locked) { haptic.medium(); router.push('/(onboarding)/paywall'); return; }
    haptic.select();
    toggleFollowTopic(label);
  };

  // Arama: hem label (orijinal) hem lokalize isim üzerinde çalışır
  const searchResults = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    return ALL_TOPICS.filter(tp =>
      tp.label.toLowerCase().includes(q) ||
      t(tp.labelKey).toLowerCase().includes(q),
    );
  }, [query, t]);

  const inputBg = tc.isDark ? 'rgba(30,42,82,0.9)' : tc.raisedBg;

  return (
    <ScreenContainer padded={false}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.iconBtn, { backgroundColor: tc.cardBg }]}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Ionicons name="close" size={22} color={tc.heading} />
        </Pressable>
        <Text style={[styles.title, { color: tc.heading }]}>{t('topics.title')}</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 80 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Premium banner — sadece free kullanıcılara */}
        {!isPremium && (
          <Animated.View entering={FadeInDown.duration(380)}>
            <Pressable
              style={[styles.banner, { backgroundColor: tc.gold }]}
              onPress={() => { haptic.medium(); router.push('/(onboarding)/paywall'); }}
              accessibilityRole="button"
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>{t('topics.bannerTitle')}</Text>
                <Text style={styles.bannerSub}>{t('topics.bannerSub')}</Text>
              </View>
              <View style={styles.bannerIcon}>
                <Ionicons name="book" size={30} color="rgba(255,255,255,0.85)" />
              </View>
            </Pressable>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(60).duration(380)}>
          <StreakWidget streakDays={streakDays} style={{ marginBottom: spacing.sm }} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(380)} style={{ marginBottom: spacing.xs }}>
          <View style={[styles.searchWrap, { backgroundColor: inputBg, borderColor: tc.border }]}>
            <Ionicons name="search-outline" size={18} color={tc.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('topics.search')}
              placeholderTextColor={tc.muted}
              style={[styles.searchInput, { color: tc.heading }]}
              returnKeyType="search"
              accessibilityLabel={t('topics.search')}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={17} color={tc.muted} />
              </Pressable>
            )}
          </View>
        </Animated.View>

        {searchResults !== null ? (
          <Animated.View entering={FadeInDown.duration(240)}>
            {searchResults.length === 0 ? (
              <Text style={[styles.emptyText, { color: tc.muted }]}>{t('topics.noResults')}</Text>
            ) : (
              <>
                <Text style={[styles.sectionTitle, { color: tc.heading }]}>
                  {t('topics.results', { n: searchResults.length })}
                </Text>
                <View style={styles.topicList}>
                  {searchResults.map((topic) => {
                    const locked   = !isPremium && !topic.free;
                    const followed = followedTopics.includes(topic.label);
                    return (
                      <TopicRow
                        key={topic.label + topic.section}
                        topic={topic}
                        locked={locked}
                        followed={followed}
                        tc={tc}
                        t={t}
                        onPress={() => onTopic(topic.label, locked)}
                        showFreeBadge={!!topic.free}
                      />
                    );
                  })}
                </View>
              </>
            )}
          </Animated.View>
        ) : (
          <>
            {/* My Topics chips */}
            {followedTopics.length > 0 && (
              <Animated.View entering={FadeInDown.delay(130)} style={{ marginBottom: spacing.md }}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: tc.heading, marginTop: 0, marginBottom: 0 }]}>
                    {t('topics.myTopics')}
                  </Text>
                  <Text style={[styles.sectionCount, { color: tc.muted }]}>
                    {t('topics.followed', { n: followedTopics.length })}
                  </Text>
                </View>
                <View style={[styles.chipRow, { marginTop: spacing.sm }]}>
                  {followedTopics.map((tp) => (
                    <Pressable
                      key={tp}
                      style={[styles.chip, { backgroundColor: tc.gold + '22', borderColor: tc.gold }]}
                      onPress={() => { haptic.select(); toggleFollowTopic(tp); }}
                      accessibilityRole="button"
                    >
                      {/* chip'te lokalize isim göster */}
                      <Text style={[styles.chipText, { color: tc.gold }]}>
                        {t(`topic.${tp}`) !== `topic.${tp}` ? t(`topic.${tp}`) : tp}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* Free topics */}
            <Animated.View entering={FadeInDown.delay(160).duration(380)}>
              <View style={styles.topicList}>
                {FREE_TOPICS.map((topic) => {
                  const followed = followedTopics.includes(topic.label);
                  return (
                    <TopicRow key={topic.label} topic={topic} locked={false} followed={followed}
                      tc={tc} t={t} onPress={() => onTopic(topic.label, false)} showFreeBadge />
                  );
                })}
              </View>
            </Animated.View>

            {/* Most Popular */}
            <Animated.View entering={FadeInDown.delay(200).duration(380)}>
              <Text style={[styles.sectionTitle, { color: tc.heading }]}>{t('topics.mostPopular')}</Text>
              <View style={styles.topicList}>
                {POPULAR_TOPICS.map((topic) => {
                  const locked   = !isPremium;
                  const followed = followedTopics.includes(topic.label);
                  return (
                    <TopicRow key={topic.label} topic={topic} locked={locked} followed={followed}
                      tc={tc} t={t} onPress={() => onTopic(topic.label, locked)} />
                  );
                })}
              </View>
            </Animated.View>

            {/* Catalog sections */}
            {CATALOG.map((section, si) => (
              <Animated.View key={section.titleKey} entering={FadeInDown.delay(240 + si * 60).duration(380)}>
                <Text style={[styles.sectionTitle, { color: tc.heading }]}>{t(section.titleKey)}</Text>
                <View style={styles.topicList}>
                  {section.topics.map((topic) => {
                    const locked   = !isPremium && !topic.free;
                    const followed = followedTopics.includes(topic.label);
                    return (
                      <TopicRow key={topic.label} topic={topic} locked={locked} followed={followed}
                        tc={tc} t={t} onPress={() => onTopic(topic.label, locked)} />
                    );
                  })}
                </View>
              </Animated.View>
            ))}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

function TopicRow({
  topic, locked, followed, tc, t, onPress, showFreeBadge,
}: {
  topic: Topic;
  locked: boolean;
  followed: boolean;
  tc: ReturnType<typeof import('../lib/useThemeColors').useThemeColors>;
  t: ReturnType<typeof import('../lib/i18n').useT>;
  onPress: () => void;
  showFreeBadge?: boolean;
}) {
  const localLabel = t(topic.labelKey);
  const localSub   = t(topic.subKey);
  return (
    <Pressable
      style={[
        styles.topicRow,
        {
          backgroundColor: followed ? (tc.isDark ? 'rgba(212,175,55,0.12)' : 'rgba(201,150,58,0.1)') : tc.cardBg,
          borderColor: followed ? tc.gold : tc.border,
        },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${localLabel}${locked ? ', premium' : followed ? ', followed' : ''}`}
    >
      <View style={[styles.topicIcon, {
        backgroundColor: followed ? (tc.isDark ? 'rgba(212,175,55,0.18)' : 'rgba(201,150,58,0.14)') : tc.raisedBg,
      }]}>
        <Ionicons name={topic.icon as any} size={20} color={followed ? tc.gold : tc.muted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.topicLabel, { color: tc.heading }]}>{localLabel}</Text>
        {localSub ? <Text style={[styles.topicSubtitle, { color: tc.muted }]}>{localSub}</Text> : null}
      </View>
      {showFreeBadge && !locked && (
        <View style={[styles.freeBadge, { borderColor: tc.gold + '66', backgroundColor: tc.gold + '18' }]}>
          <Text style={[styles.freeBadgeText, { color: tc.gold }]}>{t('topics.free')}</Text>
        </View>
      )}
      {locked ? (
        <Ionicons name="lock-closed" size={17} color={tc.muted} />
      ) : followed ? (
        <Ionicons name="checkmark-circle" size={20} color={tc.gold} />
      ) : (
        <Ionicons name="add-circle-outline" size={20} color={tc.muted} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.serifBold, fontSize: 22, lineHeight: 36 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    borderRadius: radii.lg, borderWidth: 1,
    paddingHorizontal: spacing.md, paddingVertical: 10, marginBottom: spacing.sm,
  },
  searchInput: { flex: 1, fontFamily: fonts.sans, fontSize: 15, paddingVertical: 0 },
  emptyText: { fontFamily: fonts.sans, fontSize: 15, textAlign: 'center', marginTop: spacing.xl },
  banner: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: radii.xl, padding: spacing.md, marginBottom: spacing.md, gap: spacing.md,
  },
  bannerTitle: { fontFamily: fonts.sansBold, fontSize: 16, color: '#FFFFFF' },
  bannerSub: { fontFamily: fonts.sans, fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 3, lineHeight: 18 },
  bannerIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: fonts.sansBold, fontSize: 18, marginTop: spacing.md, marginBottom: spacing.sm },
  sectionCount: { fontFamily: fonts.sans, fontSize: 13 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 6,
  },
  chipText: { fontFamily: fonts.sansMedium, fontSize: 13 },
  topicList: { gap: spacing.sm, marginBottom: spacing.xs },
  topicRow: {
    flexDirection: 'row', alignItems: 'center',
    minHeight: 64, paddingHorizontal: spacing.md, paddingVertical: 10,
    borderRadius: radii.lg, borderWidth: 1, gap: spacing.md,
  },
  topicIcon: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  topicLabel: { fontFamily: fonts.sansMedium, fontSize: 15 },
  topicSubtitle: { fontFamily: fonts.sans, fontSize: 12, marginTop: 1, opacity: 0.85 },
  freeBadge: { borderRadius: radii.pill, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  freeBadgeText: { fontFamily: fonts.sansSemibold, fontSize: 10 },
});
