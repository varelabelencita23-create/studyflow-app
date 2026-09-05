import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/theme';
import { formatShortDate } from '@/utils';

export interface HeatmapDay {
  date: string; // ISO date, yyyy-mm-dd
  minutes: number;
}

interface ActivityHeatmapProps {
  days: HeatmapDay[]; // oldest → newest, must be a multiple of 7 (weeks)
}

const CELL_SIZE = 13;
const CELL_GAP = 3;

/**
 * Sequential single-hue heatmap (GitHub/Apple-Fitness style): opacity alone
 * encodes magnitude, so it never competes with the app's single accent color.
 * Tap a cell to see its date + minutes — the mobile stand-in for hover.
 */
export function ActivityHeatmap({ days }: ActivityHeatmapProps) {
  const [selected, setSelected] = useState<HeatmapDay | null>(null);
  const maxMinutes = Math.max(...days.map((day) => day.minutes), 1);

  const weeks: HeatmapDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const opacityFor = (minutes: number) => {
    if (minutes <= 0) return 0.08;
    return 0.25 + (minutes / maxMinutes) * 0.75;
  };

  return (
    <View>
      <View style={styles.grid}>
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.weekColumn}>
            {week.map((day) => (
              <Pressable key={day.date} onPress={() => setSelected(day)} hitSlop={2}>
                <View
                  style={[
                    styles.cell,
                    { backgroundColor: `rgba(124,107,255,${opacityFor(day.minutes)})` },
                    selected?.date === day.date && styles.cellSelected,
                  ]}
                />
              </Pressable>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerHint}>
          {selected
            ? `${formatShortDate(selected.date)} · ${selected.minutes > 0 ? `${selected.minutes} min` : 'sin estudio'}`
            : 'Tocá un día para ver el detalle'}
        </Text>
        <View style={styles.legend}>
          <Text style={styles.legendLabel}>Menos</Text>
          {[0.08, 0.35, 0.6, 0.85, 1].map((opacity, index) => (
            <View key={index} style={[styles.legendCell, { backgroundColor: `rgba(124,107,255,${opacity})` }]} />
          ))}
          <Text style={styles.legendLabel}>Más</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: CELL_GAP,
  },
  weekColumn: {
    gap: CELL_GAP,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 3,
  },
  cellSelected: {
    borderWidth: 1.5,
    borderColor: colors.textPrimary,
  },
  footer: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  footerHint: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    alignSelf: 'flex-end',
  },
  legendLabel: {
    ...typography.caption2,
    color: colors.textTertiary,
    marginHorizontal: spacing.xxs,
  },
  legendCell: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});
