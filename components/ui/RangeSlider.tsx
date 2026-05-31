import React from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { colors, fonts, spacing } from '../../constants/theme';
import { useThemeColors } from '../../lib/useThemeColors';
import { haptic } from '../../lib/haptics';

interface RangeSliderProps {
  /** start/end in minutes from 0..1440 */
  startMin: number;
  endMin: number;
  onChange: (startMin: number, endMin: number) => void;
}

const HANDLE = 28;
const STEP = 30; // snap to half hours

function fmt(min: number): string {
  const h24 = Math.floor(min / 60) % 24;
  const m = min % 60;
  const ampm = h24 < 12 ? 'AM' : 'PM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

/** Dual-handle time-range slider with spring handles and snapping. */
export function RangeSlider({ startMin, endMin, onChange }: RangeSliderProps) {
  const tc = useThemeColors();
  const [width, setWidth] = React.useState(0);
  const track = Math.max(0, width - HANDLE);

  const startX = useSharedValue((startMin / 1440) * track);
  const endX = useSharedValue((endMin / 1440) * track);

  React.useEffect(() => {
    if (track > 0) {
      startX.value = (startMin / 1440) * track;
      endX.value = (endMin / 1440) * track;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track]);

  const emit = (sx: number, ex: number) => {
    'worklet';
    const sMin = Math.round(((sx / track) * 1440) / STEP) * STEP;
    const eMin = Math.round(((ex / track) * 1440) / STEP) * STEP;
    runOnJS(onChange)(sMin, eMin);
  };

  const startGesture = Gesture.Pan()
    .onChange((e) => {
      startX.value = Math.min(Math.max(0, startX.value + e.changeX), endX.value - HANDLE);
    })
    .onEnd(() => {
      emit(startX.value, endX.value);
      runOnJS(haptic.light)();
    });

  const endGesture = Gesture.Pan()
    .onChange((e) => {
      endX.value = Math.max(Math.min(track, endX.value + e.changeX), startX.value + HANDLE);
    })
    .onEnd(() => {
      emit(startX.value, endX.value);
      runOnJS(haptic.light)();
    });

  const startStyle = useAnimatedStyle(() => ({ transform: [{ translateX: startX.value }] }));
  const endStyle = useAnimatedStyle(() => ({ transform: [{ translateX: endX.value }] }));
  const fillStyle = useAnimatedStyle(() => ({
    left: startX.value + HANDLE / 2,
    width: Math.max(0, endX.value - startX.value),
  }));

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  return (
    <View>
      <View style={styles.labels}>
        <View>
          <Text style={[styles.cap, { color: tc.muted }]}>Start at</Text>
          <Text style={[styles.time, { color: tc.heading }]}>{fmt(startMin)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.cap, { color: tc.muted }]}>End at</Text>
          <Text style={[styles.time, { color: tc.heading }]}>{fmt(endMin)}</Text>
        </View>
      </View>

      <View style={styles.trackWrap} onLayout={onLayout}>
        <View style={[styles.trackBg, { backgroundColor: tc.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(120,100,70,0.18)' }]} />
        <Animated.View style={[styles.fill, { backgroundColor: tc.gold }, fillStyle]} />
        <GestureDetector gesture={startGesture}>
          <Animated.View style={[styles.handle, { backgroundColor: tc.gold, borderColor: tc.screenBg }, startStyle]} />
        </GestureDetector>
        <GestureDetector gesture={endGesture}>
          <Animated.View style={[styles.handle, { backgroundColor: tc.gold, borderColor: tc.screenBg }, endStyle]} />
        </GestureDetector>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cap: { fontFamily: fonts.sans, fontSize: 12 },
  time: { fontFamily: fonts.sansSemibold, fontSize: 16, marginTop: 2 },
  trackWrap: { height: HANDLE, justifyContent: 'center' },
  trackBg: {
    height: 6,
    borderRadius: 3,
  },
  fill: {
    position: 'absolute',
    height: 6,
    borderRadius: 3,
  },
  handle: {
    position: 'absolute',
    width: HANDLE,
    height: HANDLE,
    borderRadius: HANDLE / 2,
    borderWidth: 3,
  },
});

export default RangeSlider;
