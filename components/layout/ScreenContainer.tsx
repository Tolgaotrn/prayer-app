import React from 'react';
import { ImageSourcePropType, StyleSheet, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { colors } from '../../constants/theme';
import { useAppStore } from '../../stores/useAppStore';

interface ScreenContainerProps {
  children: React.ReactNode;
  gradient?: readonly [string, string, ...string[]];
  backgroundImage?: ImageSourcePropType;
  imageOpacity?: number;
  edges?: Edge[];
  style?: ViewStyle;
  padded?: boolean;
  /** Force dark/light regardless of global setting */
  forceDark?: boolean;
  forceLight?: boolean;
}

export function ScreenContainer({
  children,
  gradient,
  backgroundImage,
  imageOpacity = 0.28,
  edges = ['top', 'bottom'],
  style,
  padded = true,
  forceDark,
  forceLight,
}: ScreenContainerProps) {
  const darkMode = useAppStore((s) => s.darkMode);
  const isLight = forceLight || (!forceDark && !darkMode);

  const darkGradient: readonly [string, string, ...string[]] =
    gradient ?? [colors.bg.midnight, colors.bg.deep, colors.bg.midnight];
  const lightGradient: readonly [string, string, ...string[]] =
    gradient ?? [colors.warm.bg, colors.warm.surface, colors.warm.bg];

  const resolvedGradient = isLight ? lightGradient : darkGradient;
  const rootBg = isLight ? colors.warm.bg : colors.bg.midnight;
  const statusStyle = isLight ? 'dark' : 'light';

  const rootStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(rootBg, { duration: 300 }),
  }));

  return (
    <Animated.View style={[styles.root, rootStyle]}>
      <LinearGradient colors={resolvedGradient} style={StyleSheet.absoluteFill} />
      {backgroundImage && !isLight ? (
        <>
          <Image
            source={backgroundImage}
            style={[StyleSheet.absoluteFill, { opacity: imageOpacity }]}
            contentFit="cover"
            transition={400}
          />
          <LinearGradient
            colors={['rgba(10,18,48,0.55)', 'rgba(10,18,48,0.35)', 'rgba(7,12,24,0.92)']}
            style={StyleSheet.absoluteFill}
          />
        </>
      ) : null}
      <StatusBar style={statusStyle} />
      <SafeAreaView style={styles.safe} edges={edges}>
        <View style={[styles.content, padded && styles.padded, style]}>
          {children}
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  content: { flex: 1 },
  padded: { paddingHorizontal: 24 },
});

export default ScreenContainer;
