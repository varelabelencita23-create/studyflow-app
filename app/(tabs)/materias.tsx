import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card, EmptyState, Icon, ProgressBar } from '@/components/ui';
import { SubjectFormSheet } from '@/components/subjects';
import { useAppState } from '@/store';
import { colors, radius, spacing, typography } from '@/theme';
import { Screen } from '@/components/ui/Screen';
import { Subject } from '@/types';

export default function MateriasScreen() {
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
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.title}>Materias</Text>
        <Text style={styles.subtitle}>Organizá todo tu cuatrimestre</Text>
      </View>

      {sortedSubjects.length === 0 ? (
        <EmptyState
          icon="book-outline"
          title="Todavía no agregaste materias"
          description="Sumá tu primera materia para empezar a organizar el cuatrimestre."
          actionLabel="Agregar materia"
          onAction={openCreateSheet}
        />
      ) : (
        <View style={styles.list}>
          {sortedSubjects.map((subject, index) => (
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
                <Pressable
                  hitSlop={8}
                  onPress={() => openEditSheet(subject)}
                  style={styles.editButton}
                >
                  <Icon name="pencil-outline" size={16} color={colors.textSecondary} />
                </Pressable>
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
              <ProgressBar progress={subject.progress} style={styles.progress} />
            </Card>
          ))}

          <Button label="Agregar materia" variant="secondary" icon="add" fullWidth onPress={openCreateSheet} />
        </View>
      )}

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
    gap: spacing.sm,
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
  editButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reorderControls: {
    gap: spacing.xxs,
  },
  reorderButton: {
    width: 24,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progress: {
    marginTop: spacing.md,
  },
});
