import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { colors } from '@/theme/tokens';

interface ProgressBarProps {
  /** 0..1 */
  ratio: number;
  /** Animate from this ratio on mount (defaults to 0). */
  from?: number;
  /** Optional preview segment shown after the filled part (e.g. a pending transfer). */
  previewRatio?: number;
  height?: number;
  delay?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function ProgressBar({
  ratio,
  from = 0,
  previewRatio,
  height = 10,
  delay = 150,
  style,
  accessibilityLabel,
}: ProgressBarProps) {
  const progress = useSharedValue(from);

  useEffect(() => {
    progress.set(withDelay(delay, withTiming(ratio, { duration: 900, easing: Easing.out(Easing.cubic) })));
  }, [ratio, delay, progress]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <View
      style={[styles.track, { height, borderRadius: height / 2 }, style]}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(ratio * 100) }}>
      {previewRatio !== undefined && previewRatio > ratio ? (
        <View
          style={[
            styles.preview,
            { width: `${previewRatio * 100}%`, borderRadius: height / 2 },
          ]}
        />
      ) : null}
      <Animated.View style={[styles.fill, { borderRadius: height / 2 }, fillStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', backgroundColor: '#E8E8E8', overflow: 'hidden' },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: colors.red },
  preview: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#F2A7B5',
  },
});
