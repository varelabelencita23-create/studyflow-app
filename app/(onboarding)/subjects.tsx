import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { useToast } from '@/hooks/useToast';
import { useAppState } from '@/store';
import { Subject } from '@/types';
import { colors, radius, spacing, typography } from '@/theme';

export default function SubjectsScreen() {
  const router = useRouter();
  const { subjects, addSubject, updateSubject, removeSubject, reorderSubjects } = useAppState();
  const { show } = useToast();

  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [name, setName] = useState('');
  const [professor, setProfessor] = useState('');
  const [saving, setSaving] = useState(false);

  const sortedSubjects = [...subjects].sort((a, b) => a.order - b.order);

  const openCreateSheet = () => {
    setEditingSubject(null);
    setName('');
    setProfessor('');
    setSheetVisible(true);
  };

  const openEditSheet = (subject: Subject) => {
    setEditingSubject(subject);
    setName(subject.name);
    setProfessor(subject.professor ?? '');
    setSheetVisible(true);
  };

  const handleSave = async () => {
    if (name.trim().length < 2) {
      show('Ingresá el nombre de la materia', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editingSubject) {
        await updateSubject(editingSubject.id, { name, professor });
        show('Materia actualizada', 'success');
      } else {
        await addSubject({ name, professor });
        show('Materia agregada', 'success');
      }
      setSheetVisible(false);
    } catch (error) {
      show(error instanceof Error ? error.message : 'Algo salió mal', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingSubject) return;
    await removeSubject(editingSubject.id);
    show('Materia eliminada', 'default');
    setSheetVisible(false);
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

      <BottomSheet visible={sheetVisible} onClose={() => setSheetVisible(false)}>
        <Text style={styles.sheetTitle}>{editingSubject ? 'Editar materia' : 'Nueva materia'}</Text>
        <View style={styles.sheetForm}>
          <Input
            label="Nombre"
            placeholder="Ej. Sistemas Operativos"
            value={name}
            onChangeText={setName}
            leftIcon="book-outline"
          />
          <Input
            label="Profesor (opcional)"
            placeholder="Ej. Ana Gómez"
            value={professor}
            onChangeText={setProfessor}
            leftIcon="person-outline"
          />
          <Button
            label={editingSubject ? 'Guardar cambios' : 'Agregar materia'}
            fullWidth
            loading={saving}
            onPress={handleSave}
          />
          {editingSubject && (
            <Button label="Eliminar materia" variant="destructive" fullWidth onPress={handleDelete} />
          )}
        </View>
      </BottomSheet>
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
  sheetTitle: {
    ...typography.title3,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  sheetForm: {
    gap: spacing.lg,
  },
});
