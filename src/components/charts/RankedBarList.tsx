import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

export interface RankedBarItem {
  id: string;
  label: string;
  value: number; // 0-1
  caption?: string;
}

interface RankedBarListProps {
  items: RankedBarItem[];
}

/**
 * Ranked horizontal bar list — magnitude via bar length in the single accent
 * hue, identity via the direct name label (never per-item hue), per the
 * brand's single-accent rule. Used instead of a donut/pie for part-to-whole
 * or per-entity magnitude reads.
 */
export function RankedBarList({ items }: RankedBarListProps) {
  return (
    <View style={styles.list}>
      {items.map((item) => {
        const clamped = Math.max(0, Math.min(1, item.value));
        return (
          <View key={item.id} style={styles.row}>
            <View style={styles.rowHeader}>
              <Text style={styles.label} numberOfLines={1}>{item.label}</Text>
              <Text style={styles.value}>{Math.round(clamped * 100)}%</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${clamped * 100}%` }]} />
            </View>
            {item.caption && <Text style={styles.caption}>{item.caption}</Text>}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.lg,
  },
  row: {
    gap: spacing.xs,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    ...typography.subheadline,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.md,
  },
  value: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
  track: {
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceHighlight,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.accent,
  },
  caption: {
    ...typography.caption1,
    color: colors.textTertiary,
  },
});
