import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Card, EmptyState, ProgressBar } from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { useAppState } from '@/store';
import { colors, radius, spacing, typography } from '@/theme';
import { Screen } from '@/components/ui/Screen';

export default function MateriasScreen() {
  const router = useRouter();
  const { subjects } = useAppState();
  const { show } = useToast();

  const sortedSubjects = [...subjects].sort((a, b) => a.order - b.order);

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.title}>Materias</Text>
        <Text style={styles.subtitle}>Organizá todo tu cuatrimestre</Text>
      </View>

      {sortedSubjects.length === 0 ? (
        <EmptyState
          icon="book-outline"
          title="Todavía no agregaste materias"
          description="En la próxima etapa vas a poder crear, editar y ordenar tus materias desde acá."
          actionLabel="Agregar materia"
          onAction={() => show('Disponible en la próxima etapa', 'default')}
        />
      ) : (
        <View style={styles.list}>
          {sortedSubjects.map((subject) => (
            <Card key={subject.id} variant="surface" onPress={() => router.push(`/materia/${subject.id}`)}>
              <View style={styles.subjectRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{subject.shortName.slice(0, 2)}</Text>
                </View>
                <View style={styles.subjectInfo}>
                  <Text style={styles.subjectName} numberOfLines={1}>{subject.name}</Text>
                  {!!subject.professor && (
                    <Text style={styles.subjectProfessor} numberOfLines={1}>{subject.professor}</Text>
                  )}
                </View>
              </View>
              <ProgressBar progress={subject.progress} style={styles.progress} />
            </Card>
          ))}
        </View>
      )}
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
  list: {
    gap: spacing.md,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...typography.caption1,
    color: colors.accent,
  },
  subjectInfo: {
    flex: 1,
    gap: spacing.xxs,
  },
  subjectName: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  subjectProfessor: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
  progress: {
    marginTop: spacing.md,
  },
});
