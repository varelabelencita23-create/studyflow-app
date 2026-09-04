import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';
import { Screen } from '@/components/ui/Screen';

const STAT_CARDS = [
  { label: 'Hoy', value: '0 min' },
  { label: 'Esta semana', value: '0 min' },
  { label: 'Este mes', value: '0 min' },
];

export default function EstadisticasScreen() {
  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.title}>Estadísticas</Text>
        <Text style={styles.subtitle}>Tu ritmo de estudio real</Text>
      </View>
      <View style={styles.grid}>
        {STAT_CARDS.map((stat) => (
          <Card key={stat.label} variant="surface" style={styles.statCard}>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.md,
    marginBottom: spacing.xxl,
    gap: spacing.xxs,
  },
  title: {
    ...typography.largeTitle,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.subheadline,
    color: colors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    gap: spacing.xs,
  },
  statLabel: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
  statValue: {
    ...typography.title3,
    color: colors.textPrimary,
  },
});
