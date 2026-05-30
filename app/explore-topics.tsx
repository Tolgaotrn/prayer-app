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
import { useAppStore } from '../stores/useAppStore';
import { haptic } from '../lib/haptics';

type Topic = { label: string; icon: string; free?: boolean };
type Section = { title: string; topics: Topic[] };

/* Ücretsiz konular — en üstte, başlıksız, Free rozeti satır içinde */
const FREE_TOPICS: Topic[] = [
  { label: 'General',      icon: 'grid-outline',        free: true },
  { label: 'Quran Verses', icon: 'book-outline',         free: true },
  { label: 'Favorites',    icon: 'heart-outline',        free: true },
];

const POPULAR_TOPICS: Topic[] = [
  { label: 'Hadiths',           icon: 'library-outline' },
  { label: 'Duas & Prayers',    icon: 'hand-left-outline' },
  { label: 'Islamic Quotes',    icon: 'chatbubble-ellipses-outline' },
  { label: '99 Names of Allah', icon: 'sparkles-outline' },
  { label: 'Dhikr',             icon: 'infinite-outline' },
  { label: 'Patience',          icon: 'hourglass-outline' },
  { label: 'Gratitude',         icon: 'heart-outline' },
];

const CATALOG: Section[] = [
  {
    title: 'Faith & Belief',
    topics: [
      { label: 'Tawakkul',         icon: 'heart-circle-outline' },
      { label: 'Seeking Guidance', icon: 'compass-outline' },
      { label: 'Repentance',       icon: 'refresh-circle-outline' },
    ],
  },
  {
    title: 'Character & Morality',
    topics: [
      { label: 'Honesty',     icon: 'checkmark-circle-outline' },
      { label: 'Kindness',    icon: 'hand-right-outline' },
      { label: 'Forgiveness', icon: 'shield-checkmark-outline' },
    ],
  },
  {
    title: 'Heart & Spirituality',
    topics: [
      { label: 'Inner Peace',         icon: 'leaf-outline' },
      { label: 'Love of God',         icon: 'rose-outline' },
      { label: 'Dhikr & Remembrance', icon: 'moon-outline' },
      { label: 'Hope',                icon: 'sunny-outline' },
    ],
  },
];

const ALL_TOPICS = [
  ...FREE_TOPICS.map(t => ({ ...t, section: 'Free' })),
  ...POPULAR_TOPICS.map(t => ({ ...t, section: 'Most Popular' })),
  ...CATALOG.flatMap(s => s.topics.map(t => ({ ...t, section: s.title }))),
];

export default function ExploreTopics() {
  const router            = useRouter();
  const tc                = useThemeColors();
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

  const searchResults = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    return ALL_TOPICS.filter(t => t.label.toLowerCase().includes(q));
  }, [query]);

  const inputBg = tc.isDark ? 'rgba(30,42,82,0.9)' : tc.raisedBg;

  return (
    <ScreenContainer padded={false}>
      {/* ── HEADER (Edit butonu yok) ── */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.iconBtn, { backgroundColor: tc.cardBg }]}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={22} color={tc.heading} />
        </Pressable>
        <Text style={[styles.title, { color: tc.heading }]}>Browse topics</Text>
        {/* sağ taraf boş — simetri için aynı boyutta görünmez view */}
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 80 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── PREMIUM BANNER ── */}
        {!isPremium && (
          <Animated.View entering={FadeInDown.duration(380)}>
            <Pressable
              style={[styles.banner, { backgroundColor: tc.gold }]}
              onPress={() => { haptic.medium(); router.push('/(onboarding)/paywall'); }}
              accessibilityRole="button"
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>Access all topics</Text>
                <Text style={styles.bannerSub}>Follow topics to personalise your daily verses</Text>
              </View>
              <View style={styles.bannerIcon}>
                <Ionicons name="book" size={30} color="rgba(255,255,255,0.85)" />
              </View>
            </Pressable>
          </Animated.View>
        )}

        {/* ── STREAK ── */}
        <Animated.View entering={FadeInDown.delay(60).duration(380)}>
          <StreakWidget streakDays={streakDays} style={{ marginBottom: spacing.sm }} />
        </Animated.View>

        {/* ── SEARCH — streak'in altında ── */}
        <Animated.View entering={FadeInDown.delay(100).duration(380)} style={{ marginBottom: spacing.xs }}>
          <View style={[styles.searchWrap, { backgroundColor: inputBg, borderColor: tc.border }]}>
            <Ionicons name="search-outline" size={18} color={tc.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search topics..."
              placeholderTextColor={tc.muted}
              style={[styles.searchInput, { color: tc.heading }]}
              returnKeyType="search"
              accessibilityLabel="Search topics"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={17} color={tc.muted} />
              </Pressable>
            )}
          </View>
        </Animated.View>

        {searchResults !== null ? (
          /* ── ARAMA SONUÇLARI ── */
          <Animated.View entering={FadeInDown.duration(240)}>
            {searchResults.length === 0 ? (
              <Text style={[styles.emptyText, { color: tc.muted }]}>No topics found</Text>
            ) : (
              <>
                <Text style={[styles.sectionTitle, { color: tc.heading }]}>
                  Results ({searchResults.length})
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
            {/* ── MY TOPICS chips ── */}
            {followedTopics.length > 0 && (
              <Animated.View entering={FadeInDown.delay(130)} style={{ marginBottom: spacing.md }}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: tc.heading, marginTop: 0, marginBottom: 0 }]}>My Topics</Text>
                  <Text style={[styles.sectionCount, { color: tc.muted }]}>
                    {followedTopics.length} followed
                  </Text>
                </View>
                <View style={[styles.chipRow, { marginTop: spacing.sm }]}>
                  {followedTopics.map((t) => (
                    <Pressable
                      key={t}
                      style={[styles.chip, { backgroundColor: tc.gold + '22', borderColor: tc.gold }]}
                      onPress={() => { haptic.select(); toggleFollowTopic(t); }}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.chipText, { color: tc.gold }]}>{t}</Text>
                    </Pressable>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* ── FREE TOPICS — başlık YOK, satır içi Free rozeti var ── */}
            <Animated.View entering={FadeInDown.delay(160).duration(380)}>
              <View style={styles.topicList}>
                {FREE_TOPICS.map((topic) => {
                  const followed = followedTopics.includes(topic.label);
                  return (
                    <TopicRow
                      key={topic.label}
                      topic={topic}
                      locked={false}
                      followed={followed}
                      tc={tc}
                      onPress={() => onTopic(topic.label, false)}
                      showFreeBadge
                    />
                  );
                })}
              </View>
            </Animated.View>

            {/* ── MOST POPULAR ── */}
            <Animated.View entering={FadeInDown.delay(200).duration(380)}>
              <Text style={[styles.sectionTitle, { color: tc.heading }]}>Most Popular</Text>
              <View style={styles.topicList}>
                {POPULAR_TOPICS.map((topic) => {
                  const locked   = !isPremium;
                  const followed = followedTopics.includes(topic.label);
                  return (
                    <TopicRow
                      key={topic.label}
                      topic={topic}
                      locked={locked}
                      followed={followed}
                      tc={tc}
                      onPress={() => onTopic(topic.label, locked)}
                    />
                  );
                })}
              </View>
            </Animated.View>

            {/* ── DİĞER BÖLÜMLER ── */}
            {CATALOG.map((section, si) => (
              <Animated.View
                key={section.title}
                entering={FadeInDown.delay(240 + si * 60).duration(380)}
              >
                <Text style={[styles.sectionTitle, { color: tc.heading }]}>{section.title}</Text>
                <View style={styles.topicList}>
                  {section.topics.map((topic) => {
                    const locked   = !isPremium && !topic.free;
                    const followed = followedTopics.includes(topic.label);
                    return (
                      <TopicRow
                        key={topic.label}
                        topic={topic}
                        locked={locked}
                        followed={followed}
                        tc={tc}
                        onPress={() => onTopic(topic.label, locked)}
                      />
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
  topic, locked, followed, tc, onPress, showFreeBadge,
}: {
  topic: { label: string; icon: string };
  locked: boolean;
  followed: boolean;
  tc: ReturnType<typeof import('../lib/useThemeColors').useThemeColors>;
  onPress: () => void;
  showFreeBadge?: boolean;
}) {
  return (
    <Pressable
      style={[
        styles.topicRow,
        {
          backgroundColor: followed
            ? (tc.isDark ? 'rgba(212,175,55,0.12)' : 'rgba(201,150,58,0.1)')
            : tc.cardBg,
          borderColor: followed ? tc.gold : tc.border,
        },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${topic.label}${locked ? ', premium' : followed ? ', followed' : ''}`}
    >
      <View style={[styles.topicIcon, { backgroundColor: tc.raisedBg }]}>
        <Ionicons name={topic.icon as any} size={20} color={followed ? tc.gold : tc.muted} />
      </View>
      <Text style={[styles.topicLabel, { color: tc.heading }]}>{topic.label}</Text>
      {showFreeBadge && (
        <View style={[styles.freeBadge, { backgroundColor: tc.gold + '20', borderColor: tc.gold + '55' }]}>
          <Text style={[styles.freeBadgeText, { color: tc.gold }]}>Free</Text>
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
  title: { fontFamily: fonts.serifBold, fontSize: 22 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    borderRadius: radii.lg, borderWidth: 1,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    marginBottom: spacing.sm,
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
    minHeight: 58, paddingHorizontal: spacing.md,
    borderRadius: radii.lg, borderWidth: 1, gap: spacing.md,
  },
  topicIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  topicLabel: { fontFamily: fonts.sansMedium, fontSize: 15, flex: 1 },
  freeBadge: { borderRadius: radii.pill, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  freeBadgeText: { fontFamily: fonts.sansSemibold, fontSize: 10 },
});
