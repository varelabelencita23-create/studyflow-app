import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { SubjectFormSheet } from '@/components/subjects';
import { useAppState } from '@/store';
import { Subject } from '@/types';
import { colors, radius, spacing, typography } from '@/theme';

export default function SubjectsScreen() {
  const router = useRouter();
  const { subjects, addSubject, updateSubject, removeSubject, reorderSubjects } = useAppState();

  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const sortedSubjects = [...subjects].sort((a, b) => a.order - b.order);

  const openCreateSheet = () => {
    setEditingSubject(null);
    setSheetVisible(true);
  };

  const openEditSheet = (subject: Subject) => {
    setEditingSubject(subject);
    setSheetVisible(true);
  };

  const moveSubject = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sortedSubjects.length) return;
    const reordered = [...sortedSubjects];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    reorderSubjects(reordered.map((subject) => subject.id));
  };

  return (
    <Screen scroll edges={['top', 'bottom']} contentContainerStyle={styles.screenContent}>
      <View style={styles.header}>
        <Text style={styles.title}>Tus materias</Text>
        <Text style={styles.subtitle}>
          Agregá las materias que estás cursando este cuatrimestre. Vas a poder ordenarlas
          y editarlas cuando quieras.
        </Text>
      </View>

      {sortedSubjects.length === 0 ? (
        <EmptyState
          icon="book-outline"
          title="Todavía no agregaste materias"
          description="Sumá al menos una para continuar."
          actionLabel="Agregar materia"
          onAction={openCreateSheet}
        />
      ) : (
        <View style={styles.list}>
          {sortedSubjects.map((subject, index) => (
            <Card key={subject.id} variant="surface" onPress={() => openEditSheet(subject)} style={styles.subjectCard}>
              <View style={styles.subjectRow}>
                <View style={styles.subjectBadge}>
                  <Text style={styles.subjectBadgeText}>{subject.shortName.slice(0, 2)}</Text>
                </View>
                <View style={styles.subjectInfo}>
                  <Text style={styles.subjectName} numberOfLines={1}>{subject.name}</Text>
                  {!!subject.professor && (
                    <Text style={styles.subjectProfessor} numberOfLines={1}>{subject.professor}</Text>
                  )}
                </View>
                <View style={styles.reorderControls}>
                  <Pressable
                    hitSlop={8}
                    disabled={index === 0}
                    onPress={() => moveSubject(index, -1)}
                    style={styles.reorderButton}
                  >
                    <Icon name="chevron-up" size={16} color={index === 0 ? colors.textTertiary : colors.textSecondary} />
                  </Pressable>
                  <Pressable
                    hitSlop={8}
                    disabled={index === sortedSubjects.length - 1}
                    onPress={() => moveSubject(index, 1)}
                    style={styles.reorderButton}
                  >
                    <Icon
                      name="chevron-down"
                      size={16}
                      color={index === sortedSubjects.length - 1 ? colors.textTertiary : colors.textSecondary}
                    />
                  </Pressable>
                </View>
              </View>
            </Card>
          ))}

          <Button label="Agregar materia" variant="secondary" icon="add" fullWidth onPress={openCreateSheet} />
        </View>
      )}

      <Button
        label="Continuar"
        size="lg"
        fullWidth
        disabled={sortedSubjects.length === 0}
        onPress={() => router.push('/study-mode')}
        style={styles.continueButton}
      />

      <SubjectFormSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        editingSubject={editingSubject}
        onSave={async (input) => {
          if (editingSubject) await updateSubject(editingSubject.id, input);
          else await addSubject(input);
        }}
        onDelete={(subject) => removeSubject(subject.id)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flexGrow: 1,
  },
  header: {
    marginTop: spacing.sm,
    marginBottom: spacing.xxl,
    gap: spacing.xs,
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
  subjectCard: {
    paddingVertical: spacing.md,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  subjectBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectBadgeText: {
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
  reorderControls: {
    gap: spacing.xxs,
  },
  reorderButton: {
    width: 28,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButton: {
    marginTop: spacing.xxxl,
  },
});
