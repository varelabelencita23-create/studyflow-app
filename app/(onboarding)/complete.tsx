import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { useAppState } from '@/store';
import { StudyMode } from '@/types';
import { colors, radius, spacing, typography } from '@/theme';

const MODE_LABEL: Record<StudyMode, string> = {
  standard: 'Estándar',
  deep: 'Profundo',
  free: 'Libre',
};

export default function CompleteScreen() {
  const router = useRouter();
  const { subjects, studyModeConfig, completeOnboarding } = useAppState();

  const handleStart = async () => {
    await completeOnboarding();
    router.replace('/');
  };

  return (
    <Screen edges={['top', 'bottom']} contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <Icon name="checkmark-circle" size={48} color={colors.success} />
        </View>
        <Text style={styles.title}>Todo listo</Text>
        <Text style={styles.subtitle}>
          Configuramos tu espacio de estudio. Podés ajustar esto más adelante desde tu perfil.
        </Text>

        <Card variant="surface" style={styles.summaryCard}>
          <SummaryRow icon="book-outline" label="Materias" value={`${subjects.length}`} />
          <SummaryRow icon="options-outline" label="Modalidad" value={MODE_LABEL[studyModeConfig.studyMode]} />
          <SummaryRow
            icon="calendar-outline"
            label="Por semana"
            value={`${studyModeConfig.maxSubjectsPerWeek} ${studyModeConfig.maxSubjectsPerWeek === 1 ? 'materia' : 'materias'}`}
          />
        </Card>
      </View>

      <Button label="Empezar a estudiar" size="lg" fullWidth onPress={handleStart} />
    </Screen>
  );
}

function SummaryRow({ icon, label, value }: { icon: 'book-outline' | 'options-outline' | 'calendar-outline'; label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <View style={styles.summaryIcon}>
        <Icon name={icon} size={16} color={colors.accent} />
      </View>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: spacing.massive,
    paddingBottom: spacing.xxl,
  },
  content: {
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrapper: {
    width: 88,
    height: 88,
    borderRadius: radius.xxl,
    backgroundColor: colors.successSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.largeTitle,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  summaryCard: {
    width: '100%',
    gap: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  summaryIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    ...typography.subheadline,
    color: colors.textSecondary,
    flex: 1,
  },
  summaryValue: {
    ...typography.headline,
    color: colors.textPrimary,
  },
});
