import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { VideoView, useVideoPlayer } from 'expo-video';
import { colors, fonts, radii } from '../../constants/theme';
import { haptic } from '../../lib/haptics';
import type { BackgroundTheme } from '../../data/themes';
import { localThemeThumb } from '../../data/themeAssets';

interface ThemeTileProps {
  theme: BackgroundTheme;
  selected: boolean;
  onPress: () => void;
  onLockedPress?: () => void;
  style?: ViewStyle;
  showEdit?: boolean;
  aspectRatio?: number;
  isPremium?: boolean;
}

/** Photo tile (real mosque image) with badge + selection checkmark. */
export function ThemeTile({
  theme,
  selected,
  onPress,
  onLockedPress,
  style,
  showEdit,
  aspectRatio = 0.62,
  isPremium = false,
}: ThemeTileProps) {
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(selected ? 1.0 : 1, { damping: 16 }) }],
  }));

  const isLive = theme.badge === 'Live';
  // Premium kilidi: free değil ve kullanıcı premium değilse
  const isLocked = !theme.isFree && !isPremium;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${theme.name} theme`}
      accessibilityState={{ selected }}
      onPress={() => {
        if (isLocked) {
          haptic.medium();
          onLockedPress?.();
          return;
        }
        haptic.select();
        onPress();
      }}
      style={[{ flex: 1 }, style]}
    >
      <Animated.View style={[styles.tile, { aspectRatio }, selected && styles.selected, anim]}>
        {/* Gömülü görsel HER ZAMAN altta — video yüklenemezse (ör. Supabase egress
            402) tile siyah kalmaz, fallback görsel görünür. */}
        <Image
          source={localThemeThumb(theme.image)}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
          recyclingKey={String(theme.id)}
          placeholder={{ blurhash: 'L37nIw00~q9F4n%MD%xu00~q-;%M' }}
        />
        {/* Video temalar için üstte mini player (oynayınca görseli kapatır) */}
        {isLive && theme.video ? <LiveVideoThumb uri={theme.video.uri} /> : null}
        <LinearGradient
          colors={isLive
            ? ['rgba(0,0,0,0.1)', 'transparent', 'rgba(0,0,0,0.6)']
            : ['transparent', 'rgba(7,10,20,0.1)', 'rgba(7,10,20,0.85)']
          }
          style={StyleSheet.absoluteFill}
        />

        {theme.badge ? (
          <View style={[
            styles.badge,
            theme.badge === 'New' && styles.badgeNew,
            isLive && styles.badgeLive,
          ]}>
            {isLive
              ? <Ionicons name="play-circle" size={11} color={colors.white} />
              : null}
            <Text style={styles.badgeText}>{isLive ? 'LIVE' : theme.badge}</Text>
          </View>
        ) : null}

        {/* Premium kilit ikonu — sağ üstte küçük */}
        {isLocked && !selected ? (
          <View style={styles.lockBadge}>
            <Ionicons name="lock-closed" size={10} color={colors.white} />
          </View>
        ) : null}

        {selected ? (
          <View style={styles.check}>
            <Ionicons name="checkmark" size={14} color={colors.white} />
          </View>
        ) : null}

        {selected && showEdit ? (
          <View style={styles.editOverlay}>
            <Ionicons name="brush" size={13} color={colors.white} />
            <Text style={styles.editText}>Edit</Text>
          </View>
        ) : null}

        <Text style={styles.name} numberOfLines={1}>
          {theme.name}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'flex-end',
    padding: 8,
    backgroundColor: colors.bg.card,
  },
  selected: { borderColor: colors.gold.primary },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeNew: { backgroundColor: colors.gold.deep },
  badgeLive: { backgroundColor: 'rgba(212,175,55,0.85)' },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  badgeText: { fontFamily: fonts.sansSemibold, fontSize: 10, color: colors.white },
  lockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  check: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2F6BFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editText: { fontFamily: fonts.sansSemibold, fontSize: 11, color: colors.white },
  name: { fontFamily: fonts.sansSemibold, fontSize: 11, color: colors.white },
});

/** Küçük video thumbnail — sadece ThemeTile içinde kullanılır */
function LiveVideoThumb({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFill}
      contentFit="cover"
      nativeControls={false}
      allowsFullscreen={false}
      allowsPictureInPicture={false}
    />
  );
}

export default ThemeTile;
