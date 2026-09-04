import { useEffect } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, radius, spacing, typography } from '@/theme';

interface ProgressBarProps {
  progress: number; // 0-1
  height?: number;
  showLabel?: boolean;
  label?: string;
  color?: string;
  trackColor?: string;
  style?: ViewStyle;
}

export function ProgressBar({
  progress,
  height = 8,
  showLabel = false,
  label,
  color = colors.accent,
  trackColor = colors.surfaceElevated,
  style,
}: ProgressBarProps) {
  const clamped = Math.min(1, Math.max(0, progress));
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(clamped * 100, { duration: 500 });
  }, [clamped]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View style={style}>
      {showLabel && (
        <View style={styles.labelRow}>
          <Text style={styles.labelText}>{label ?? 'Progreso'}</Text>
          <Text style={styles.percentText}>{Math.round(clamped * 100)}%</Text>
        </View>
      )}
      <View style={[styles.track, { height, borderRadius: height / 2, backgroundColor: trackColor }]}>
        <Animated.View
          style={[
            styles.fill,
            { height, borderRadius: height / 2, backgroundColor: color },
            animatedStyle,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  labelText: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
  percentText: {
    ...typography.caption1,
    color: colors.textPrimary,
  },
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderRadius: radius.full,
  },
});
