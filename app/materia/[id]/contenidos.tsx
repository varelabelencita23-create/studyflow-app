import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { BottomSheet, Button, EmptyState, Icon, Input } from '@/components/ui';
import { Screen } from '@/components/ui/Screen';
import { useToast } from '@/hooks/useToast';
import { contentService } from '@/services';
import { useAppState } from '@/store';
import { colors, radius, spacing, typography } from '@/theme';
import { Topic } from '@/types';

export default function ContenidosScreen() {
  const router = useRouter();
  const { id: subjectId } = useLocalSearchParams<{ id: string }>();
  const { subjects, refreshSubjects } = useAppState();
  const { show } = useToast();

  const subject = subjects.find((item) => item.id === subjectId);

  const [contents, setContents] = useState<Topic[]>([]);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!subjectId) return;
    const list = await contentService.listBySubject(subjectId);
    setContents(list);
  }, [subjectId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const toggleComplete = async (topicId: string) => {
    if (!subjectId) return;
    Haptics.selectionAsync();
    const next = await contentService.toggleComplete(topicId, subjectId);
    setContents(next);
    await contentService.recomputeSubjectProgress(subjectId);
    await refreshSubjects();
  };

  const openCreateSheet = () => {
    setEditingTopic(null);
    setTitle('');
    setSheetVisible(true);
  };

  const openEditSheet = (topic: Topic) => {
    setEditingTopic(topic);
    setTitle(topic.title);
    setSheetVisible(true);
  };

  const handleSave = async () => {
    if (!subjectId || title.trim().length < 2) {
      show('Ingresá un título', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editingTopic) {
        const next = await contentService.update(editingTopic.id, subjectId, { title });
        setContents(next);
      } else {
        const topic = await contentService.add(subjectId, title);
        setContents((current) => [...current, topic]);
      }
      setSheetVisible(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingTopic || !subjectId) return;
    const next = await contentService.remove(editingTopic.id, subjectId);
    setContents(next);
    await contentService.recomputeSubjectProgress(subjectId);
    await refreshSubjects();
    show('Contenido eliminado', 'default');
    setSheetVisible(false);
  };

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable hitSlop={12} onPress={() => router.back()} style={styles.backButton}>
          <Icon name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      <Text style={styles.title}>Contenidos</Text>
      <Text style={styles.subtitle}>{subject?.name ?? 'Materia'}</Text>

      {contents.length === 0 ? (
        <EmptyState
          icon="list-outline"
          title="Todavía no agregaste contenidos"
          description="Sumá los temas que necesitás estudiar para esta materia."
          actionLabel="Agregar contenido"
          onAction={openCreateSheet}
        />
      ) : (
        <View style={styles.list}>
          {contents.map((topic) => {
            const isCompleted = topic.status === 'completed';
            return (
              <View key={topic.id} style={styles.row}>
                <Pressable onPress={() => toggleComplete(topic.id)} style={styles.rowMain}>
                  <Icon
                    name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={isCompleted ? colors.success : colors.textTertiary}
                  />
                  <Text style={[styles.rowLabel, isCompleted && styles.rowLabelCompleted]} numberOfLines={1}>
                    {topic.title}
                  </Text>
                </Pressable>
                <Pressable hitSlop={8} onPress={() => openEditSheet(topic)} style={styles.editButton}>
                  <Icon name="pencil-outline" size={15} color={colors.textSecondary} />
                </Pressable>
              </View>
            );
          })}

          <Button label="Agregar contenido" variant="secondary" icon="add" fullWidth onPress={openCreateSheet} />
        </View>
      )}

      <BottomSheet visible={sheetVisible} onClose={() => setSheetVisible(false)}>
        <Text style={styles.sheetTitle}>{editingTopic ? 'Editar contenido' : 'Nuevo contenido'}</Text>
        <View style={styles.sheetForm}>
          <Input
            label="Título"
            placeholder="Ej. Subnetting"
            value={title}
            onChangeText={setTitle}
            leftIcon="list-outline"
          />
          <Button
            label={editingTopic ? 'Guardar cambios' : 'Agregar contenido'}
            fullWidth
            loading={saving}
            onPress={handleSave}
          />
          {editingTopic && (
            <Button label="Eliminar contenido" variant="destructive" fullWidth onPress={handleDelete} />
          )}
        </View>
      </BottomSheet>
    </Screen>
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
  title: {
    ...typography.largeTitle,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.subheadline,
    color: colors.textSecondary,
    marginBottom: spacing.xxl,
  },
  list: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingLeft: spacing.md,
  },
  rowLabel: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  rowLabelCompleted: {
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  editButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
