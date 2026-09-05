import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, typography } from '@/theme';

interface ProgressRingProps {
  progress: number; // 0-1
  size?: number;
  strokeWidth?: number;
  label?: string;
}

/**
 * Circular "hero" progress ring — the fill (accent) carries the value, the
 * unfilled track is a lighter step of the same hue (meter contract), so state
 * reads across the whole ring rather than needing a legend.
 */
export function ProgressRing({ progress, size = 172, strokeWidth = 16, label }: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(1, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.accentSubtle}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.accent}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference}, ${circumference}`}
          strokeDashoffset={circumference * (1 - clamped)}
          rotation="-90"
          origin={`${center}, ${center}`}
          fill="none"
        />
      </Svg>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.center}>
          <Text style={styles.value}>{Math.round(clamped * 100)}%</Text>
          {label && <Text style={styles.label}>{label}</Text>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    ...typography.largeTitle,
    color: colors.textPrimary,
  },
  label: {
    ...typography.footnote,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
