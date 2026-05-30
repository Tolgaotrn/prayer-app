import React from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, radii, spacing } from '../../constants/theme';

const { height: SCREEN_H } = Dimensions.get('window');

interface BottomSheetProps {
  children: React.ReactNode;
  onClose: () => void;
  /** fraction of screen height (0..1) */
  height?: number;
}

/**
 * Spring-driven bottom sheet with a drag handle and drag-to-dismiss.
 * Renders its own dark overlay; mount it conditionally from the parent.
 */
export function BottomSheet({ children, onClose, height = 0.62 }: BottomSheetProps) {
  const sheetH = SCREEN_H * height;
  const translateY = useSharedValue(sheetH);
  const overlay = useSharedValue(0);

  React.useEffect(() => {
    translateY.value = withSpring(0, { damping: 18, stiffness: 150 });
    overlay.value = withTiming(1, { duration: 220 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => {
    overlay.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(sheetH, { duration: 220 }, (done) => {
      if (done) runOnJS(onClose)();
    });
  };

  const pan = Gesture.Pan()
    .onChange((e) => {
      translateY.value = Math.max(0, translateY.value + e.changeY);
    })
    .onEnd((e) => {
      if (translateY.value > sheetH * 0.28 || e.velocityY > 800) {
        runOnJS(close)();
      } else {
        translateY.value = withSpring(0, { damping: 18, stiffness: 150 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlay.value }));

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Close" />
      </Animated.View>

      <Animated.View style={[styles.sheet, { height: sheetH }, sheetStyle]}>
        <GestureDetector gesture={pan}>
          <View style={styles.handleArea}>
            <View style={styles.handle} />
          </View>
        </GestureDetector>
        <View style={styles.content}>{children}</View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { backgroundColor: colors.overlay },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg.deep,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderTopWidth: 1,
    borderColor: colors.hairline,
  },
  handleArea: { alignItems: 'center', paddingVertical: spacing.sm },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  content: { flex: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
});

export default BottomSheet;
