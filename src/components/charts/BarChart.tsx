import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

export interface BarChartPoint {
  label: string;
  value: number;
  emphasized?: boolean;
}

interface BarChartProps {
  data: BarChartPoint[];
  height?: number;
  valueFormatter?: (value: number) => string;
}

const BAR_MAX_WIDTH = 24;

/**
 * "Emphasis" bar chart — one bar (today) carries the accent hue, the rest
 * stay a recessive gray so the story ("today vs. the rest") reads at a
 * glance, mirroring the D/W/M chart in Apple Health/Fitness.
 */
export function BarChart({ data, height = 140, valueFormatter }: BarChartProps) {
  const maxValue = Math.max(...data.map((point) => point.value), 1);
  const emphasizedPoint = data.find((point) => point.emphasized);

  return (
    <View>
      {emphasizedPoint && (
        <Text style={styles.emphasizedValue}>
          {valueFormatter ? valueFormatter(emphasizedPoint.value) : emphasizedPoint.value}
        </Text>
      )}
      <View style={[styles.row, { height }]}>
        {data.map((point, index) => {
          const barHeight = Math.max((point.value / maxValue) * height, point.value > 0 ? 4 : 2);
          return (
            <View key={index} style={styles.column}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    { height: barHeight },
                    point.emphasized ? styles.barEmphasized : styles.barDefault,
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>
      <View style={styles.gridline} />
      <View style={[styles.row, styles.labelRow]}>
        {data.map((point, index) => (
          <View key={index} style={styles.column}>
            <Text style={[styles.label, point.emphasized && styles.labelEmphasized]} numberOfLines={1}>
              {point.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  emphasizedValue: {
    ...typography.title2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  labelRow: {
    marginTop: spacing.xs,
  },
  barTrack: {
    flex: 1,
    width: '100%',
    maxWidth: BAR_MAX_WIDTH,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    maxWidth: BAR_MAX_WIDTH,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barDefault: {
    backgroundColor: colors.surfaceHighlight,
  },
  barEmphasized: {
    backgroundColor: colors.accent,
  },
  label: {
    ...typography.caption1,
    color: colors.textTertiary,
  },
  labelEmphasized: {
    color: colors.textPrimary,
  },
  gridline: {
    height: 1,
    backgroundColor: colors.separator,
    marginTop: spacing.xs,
  },
});
