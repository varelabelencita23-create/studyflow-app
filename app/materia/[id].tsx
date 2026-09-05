import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Icon, IconName, ProgressBar } from '@/components/ui';
import { Screen } from '@/components/ui/Screen';
import { useToast } from '@/hooks/useToast';
import { useAppState } from '@/store';
import { colors, radius, spacing, typography } from '@/theme';
import { WEEK_DAYS } from '@/utils';

const ACCESS_ITEMS: { label: string; icon: IconName }[] = [
  { label: 'Contenidos', icon: 'list-outline' },
  { label: 'Plan de estudio', icon: 'calendar-outline' },
  { label: 'Archivos', icon: 'folder-outline' },
  { label: 'Parciales', icon: 'document-text-outline' },
  { label: 'Flashcards', icon: 'albums-outline' },
  { label: 'Tests', icon: 'checkmark-done-outline' },
];

export default function SubjectDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { subjects, weeklyPlan } = useAppState();
  const { show } = useToast();

  const subject = subjects.find((item) => item.id === id);
  const assignedDays = weeklyPlan?.assignments.filter((assignment) => assignment.subjectId === id) ?? [];
  const assignedDayLabels = assignedDays
    .map((assignment) => WEEK_DAYS.find((day) => day.key === assignment.day)?.shortLabel)
    .filter(Boolean)
    .join(' · ');

  if (!subject) {
    return (
      <Screen edges={['top', 'bottom']}>
        <HeaderBar onBack={() => router.back()} />
        <Text style={styles.notFound}>No encontramos esta materia.</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <HeaderBar onBack={() => router.back()} />

      <View style={styles.titleBlock}>
        <Text style={styles.title}>{subject.name}</Text>
        {!!subject.professor && <Text style={styles.professor}>{subject.professor}</Text>}
      </View>

      <ProgressBar progress={subject.progress} showLabel label="Progreso general" style={styles.progress} />

      <View style={styles.statsRow}>
        <Card variant="surface" style={styles.statCard}>
          <Text style={styles.statValue}>{assignedDays.length}</Text>
          <Text style={styles.statLabel}>Días esta semana</Text>
          {!!assignedDayLabels && <Text style={styles.statSublabel}>{assignedDayLabels}</Text>}
        </Card>
        <Card variant="surface" style={styles.statCard}>
          <Text style={styles.statValue}>{Math.round(subject.progress * 100)}%</Text>
          <Text style={styles.statLabel}>Preparación</Text>
        </Card>
      </View>

      <Text style={styles.sectionTitle}>Explorar</Text>
      <View style={styles.grid}>
        {ACCESS_ITEMS.map((item) => (
          <Card
            key={item.label}
            variant="surface"
            style={styles.accessCard}
            onPress={() => show('Disponible en una próxima etapa', 'default')}
          >
            <View style={styles.accessIcon}>
              <Icon name={item.icon} size={20} color={colors.accent} />
            </View>
            <Text style={styles.accessLabel}>{item.label}</Text>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

function HeaderBar({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable hitSlop={12} onPress={onBack} style={styles.backButton}>
        <Icon name="chevron-back" size={22} color={colors.textPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFound: {
    ...typography.body,
    color: colors.textSecondary,
  },
  titleBlock: {
    marginBottom: spacing.xl,
    gap: spacing.xxs,
  },
  title: {
    ...typography.largeTitle,
    color: colors.textPrimary,
  },
  professor: {
    ...typography.subheadline,
    color: colors.textSecondary,
  },
  progress: {
    marginBottom: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xxxl,
  },
  statCard: {
    flex: 1,
    gap: spacing.xxs,
  },
  statValue: {
    ...typography.title2,
    color: colors.textPrimary,
  },
  statLabel: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
  statSublabel: {
    ...typography.caption2,
    color: colors.textTertiary,
    marginTop: spacing.xxs,
  },
  sectionTitle: {
    ...typography.title3,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  accessCard: {
    width: '47%',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  accessIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accessLabel: {
    ...typography.subheadline,
    fontFamily: typography.bodyMedium.fontFamily,
    color: colors.textPrimary,
  },
});
