import { StyleSheet, Text, View } from 'react-native';
import { Card, EmptyState, ProgressBar } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';
import { Screen } from '@/components/ui/Screen';

export default function HomeScreen() {
  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hola, Vare 👋</Text>
        <Text style={styles.subtitle}>Semana del 1 al 7 de septiembre</Text>
      </View>

      <Card variant="elevated" style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Progreso de la semana</Text>
        <Text style={styles.summaryValue}>3 de 5 días con estudio activo</Text>
        <ProgressBar progress={0.6} style={styles.summaryProgress} />
      </Card>

      <View style={styles.plannerSection}>
        <Text style={styles.sectionTitle}>Tu semana</Text>
        <EmptyState
          icon="calendar-outline"
          title="El planificador semanal llega en la próxima etapa"
          description="Acá vas a poder distribuir tus materias entre los días de la semana arrastrando cada una a su lugar."
        />
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
  greeting: {
    ...typography.largeTitle,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.subheadline,
    color: colors.textSecondary,
  },
  summaryCard: {
    gap: spacing.sm,
  },
  summaryLabel: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  summaryProgress: {
    marginTop: spacing.xs,
  },
  plannerSection: {
    marginTop: spacing.xxl,
    gap: spacing.lg,
  },
  sectionTitle: {
    ...typography.title3,
    color: colors.textPrimary,
  },
});
