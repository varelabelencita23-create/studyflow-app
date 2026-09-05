import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge, BadgeVariant, BottomSheet, Button, EmptyState, Icon, Input, SkeletonCard } from '@/components/ui';
import { ContentMetaSheet, ContentMetaValues } from '@/components/content';
import { Screen } from '@/components/ui/Screen';
import { useToast } from '@/hooks/useToast';
import { contentService } from '@/services';
import { useAppState } from '@/store';
import { colors, radius, spacing, typography } from '@/theme';
import { Difficulty, ID, Priority, Subtopic, Topic, Unit } from '@/types';
import { formatShortDate } from '@/utils';

type MetaTarget =
  | { kind: 'topic'; mode: 'create'; unitId: ID }
  | { kind: 'topic'; mode: 'edit'; topic: Topic }
  | { kind: 'subtopic'; mode: 'create'; topicId: ID; unitId: ID }
  | { kind: 'subtopic'; mode: 'edit'; subtopic: Subtopic; unitId: ID };

function getNotableBadges(item: {
  priority: Priority;
  difficulty: Difficulty;
  importantForExam: boolean;
  targetDate?: string;
}): { label: string; variant: BadgeVariant }[] {
  const badges: { label: string; variant: BadgeVariant }[] = [];
  if (item.importantForExam) badges.push({ label: '★ Parcial', variant: 'accent' });
  if (item.priority === 'high') badges.push({ label: 'Prioridad alta', variant: 'danger' });
  if (item.difficulty === 'hard') badges.push({ label: 'Difícil', variant: 'warning' });
  if (item.targetDate) badges.push({ label: formatShortDate(item.targetDate), variant: 'neutral' });
  return badges;
}

export default function ContenidosScreen() {
  const router = useRouter();
  const { id: subjectId } = useLocalSearchParams<{ id: string }>();
  const { subjects, refreshSubjects } = useAppState();
  const { show } = useToast();

  const subject = subjects.find((item) => item.id === subjectId);

  const [units, setUnits] = useState<Unit[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [expandedUnitIds, setExpandedUnitIds] = useState<ID[]>([]);
  const [expandedTopicIds, setExpandedTopicIds] = useState<ID[]>([]);

  const [unitSheetVisible, setUnitSheetVisible] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [unitTitle, setUnitTitle] = useState('');
  const [savingUnit, setSavingUnit] = useState(false);

  const [metaTarget, setMetaTarget] = useState<MetaTarget | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!subjectId) return;
    const [unitList, topicList, subtopicList] = await Promise.all([
      contentService.listUnits(subjectId),
      contentService.listBySubject(subjectId),
      contentService.listAllSubtopicsForSubject(subjectId),
    ]);
    setUnits(unitList);
    setTopics(topicList);
    setSubtopics(subtopicList);
    setIsLoading(false);
  }, [subjectId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const toggleUnitExpanded = (id: ID) => {
    Haptics.selectionAsync();
    setExpandedUnitIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const toggleTopicExpanded = (id: ID) => {
    Haptics.selectionAsync();
    setExpandedTopicIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const handleToggleTopic = async (topic: Topic) => {
    if (!subjectId) return;
    Haptics.selectionAsync();
    await contentService.toggleTopicComplete(topic.id, topic.unitId, subjectId);
    await refreshSubjects();
    await load();
  };

  const handleToggleSubtopic = async (subtopic: Subtopic, unitId: ID) => {
    if (!subjectId) return;
    Haptics.selectionAsync();
    await contentService.toggleSubtopicComplete(subtopic.id, subtopic.topicId, unitId, subjectId);
    await refreshSubjects();
    await load();
  };

  const openCreateUnit = () => {
    setEditingUnit(null);
    setUnitTitle('');
    setUnitSheetVisible(true);
  };

  const openEditUnit = (unit: Unit) => {
    setEditingUnit(unit);
    setUnitTitle(unit.title);
    setUnitSheetVisible(true);
  };

  const handleSaveUnit = async () => {
    if (!subjectId || unitTitle.trim().length < 2) {
      show('Ingresá un título', 'error');
      return;
    }
    setSavingUnit(true);
    try {
      if (editingUnit) {
        await contentService.updateUnit(editingUnit.id, subjectId, { title: unitTitle });
      } else {
        await contentService.addUnit(subjectId, unitTitle);
      }
      setUnitSheetVisible(false);
      await load();
    } finally {
      setSavingUnit(false);
    }
  };

  const handleDeleteUnit = async () => {
    if (!editingUnit || !subjectId) return;
    await contentService.removeUnit(editingUnit.id, subjectId);
    await refreshSubjects();
    show('Unidad eliminada', 'default');
    setUnitSheetVisible(false);
    await load();
  };

  const handleSaveMeta = async (values: ContentMetaValues) => {
    if (!subjectId || !metaTarget) return;
    const patch = {
      title: values.title,
      priority: values.priority,
      difficulty: values.difficulty,
      targetDate: values.targetDate ?? null,
      importantForExam: values.importantForExam,
    };
    if (metaTarget.kind === 'topic') {
      if (metaTarget.mode === 'create') {
        const topic = await contentService.addTopic(metaTarget.unitId, subjectId, values.title);
        await contentService.updateTopic(topic.id, metaTarget.unitId, patch);
      } else {
        await contentService.updateTopic(metaTarget.topic.id, metaTarget.topic.unitId, patch);
      }
    } else {
      if (metaTarget.mode === 'create') {
        const subtopic = await contentService.addSubtopic(metaTarget.topicId, subjectId, values.title);
        await contentService.updateSubtopic(subtopic.id, metaTarget.topicId, patch);
      } else {
        await contentService.updateSubtopic(metaTarget.subtopic.id, metaTarget.subtopic.topicId, patch);
      }
    }
    await refreshSubjects();
    await load();
  };

  const handleDeleteMeta = async () => {
    if (!subjectId || !metaTarget || metaTarget.mode !== 'edit') return;
    if (metaTarget.kind === 'topic') {
      await contentService.removeTopic(metaTarget.topic.id, metaTarget.topic.unitId, subjectId);
    } else {
      await contentService.removeSubtopic(metaTarget.subtopic.id, metaTarget.subtopic.topicId, metaTarget.unitId, subjectId);
    }
    await refreshSubjects();
    await load();
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

      {isLoading ? (
        <View style={styles.unitList}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : units.length === 0 ? (
        <EmptyState
          icon="list-outline"
          title="Todavía no agregaste contenidos"
          description="Creá tu primera unidad para empezar a organizar los temas de esta materia."
          actionLabel="Agregar unidad"
          onAction={openCreateUnit}
        />
      ) : (
        <View style={styles.unitList}>
          {units.map((unit) => {
            const unitTopics = topics.filter((topic) => topic.unitId === unit.id);
            const unitExpanded = expandedUnitIds.includes(unit.id);
            return (
              <View key={unit.id} style={styles.unitBlock}>
                <Pressable onPress={() => toggleUnitExpanded(unit.id)} style={styles.unitHeader}>
                  <Icon name={unitExpanded ? 'chevron-down' : 'chevron-forward'} size={16} color={colors.textSecondary} />
                  <Text style={styles.unitTitle} numberOfLines={1}>{unit.title}</Text>
                  <Text style={styles.unitProgress}>{Math.round(unit.progress * 100)}%</Text>
                  <Pressable hitSlop={8} onPress={() => openEditUnit(unit)} style={styles.editButton}>
                    <Icon name="pencil-outline" size={14} color={colors.textSecondary} />
                  </Pressable>
                </Pressable>

                {unitExpanded && (
                  <View style={styles.topicList}>
                    {unitTopics.length === 0 && (
                      <Text style={styles.emptyHint}>Todavía no hay temas en esta unidad.</Text>
                    )}
                    {unitTopics.map((topic) => {
                      const topicSubtopics = subtopics.filter((subtopic) => subtopic.topicId === topic.id);
                      const hasSubtopics = topicSubtopics.length > 0;
                      const topicExpanded = expandedTopicIds.includes(topic.id);
                      const isCompleted = topic.status === 'completed';
                      const badges = getNotableBadges(topic);
                      return (
                        <View key={topic.id}>
                          <View style={styles.row}>
                            <Pressable
                              onPress={() => (hasSubtopics ? toggleTopicExpanded(topic.id) : handleToggleTopic(topic))}
                              style={styles.rowMain}
                            >
                              <Icon
                                name={hasSubtopics ? (topicExpanded ? 'chevron-down' : 'chevron-forward') : isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                                size={19}
                                color={isCompleted ? colors.success : colors.textTertiary}
                              />
                              <View style={styles.rowTextColumn}>
                                <Text style={[styles.rowLabel, isCompleted && styles.rowLabelCompleted]} numberOfLines={1}>
                                  {topic.title}
                                </Text>
                                {badges.length > 0 && (
                                  <View style={styles.badgeRow}>
                                    {badges.map((badge) => (
                                      <Badge key={badge.label} label={badge.label} variant={badge.variant} />
                                    ))}
                                  </View>
                                )}
                              </View>
                            </Pressable>
                            <Pressable
                              hitSlop={8}
                              onPress={() => setMetaTarget({ kind: 'topic', mode: 'edit', topic })}
                              style={styles.editButton}
                            >
                              <Icon name="pencil-outline" size={14} color={colors.textSecondary} />
                            </Pressable>
                          </View>

                          {topicExpanded && (
                            <View style={styles.subtopicList}>
                              {topicSubtopics.map((subtopic) => {
                                const subtopicCompleted = subtopic.status === 'completed';
                                const subtopicBadges = getNotableBadges(subtopic);
                                return (
                                  <View key={subtopic.id} style={styles.row}>
                                    <Pressable
                                      onPress={() => handleToggleSubtopic(subtopic, topic.unitId)}
                                      style={styles.rowMain}
                                    >
                                      <Icon
                                        name={subtopicCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                                        size={17}
                                        color={subtopicCompleted ? colors.success : colors.textTertiary}
                                      />
                                      <View style={styles.rowTextColumn}>
                                        <Text
                                          style={[styles.rowLabel, styles.subtopicLabel, subtopicCompleted && styles.rowLabelCompleted]}
                                          numberOfLines={1}
                                        >
                                          {subtopic.title}
                                        </Text>
                                        {subtopicBadges.length > 0 && (
                                          <View style={styles.badgeRow}>
                                            {subtopicBadges.map((badge) => (
                                              <Badge key={badge.label} label={badge.label} variant={badge.variant} />
                                            ))}
                                          </View>
                                        )}
                                      </View>
                                    </Pressable>
                                    <Pressable
                                      hitSlop={8}
                                      onPress={() => setMetaTarget({ kind: 'subtopic', mode: 'edit', subtopic, unitId: topic.unitId })}
                                      style={styles.editButton}
                                    >
                                      <Icon name="pencil-outline" size={14} color={colors.textSecondary} />
                                    </Pressable>
                                  </View>
                                );
                              })}
                              <Pressable
                                onPress={() => setMetaTarget({ kind: 'subtopic', mode: 'create', topicId: topic.id, unitId: topic.unitId })}
                                style={styles.addRow}
                              >
                                <Icon name="add" size={14} color={colors.accent} />
                                <Text style={styles.addRowText}>Agregar subtema</Text>
                              </Pressable>
                            </View>
                          )}
                        </View>
                      );
                    })}
                    <Pressable onPress={() => setMetaTarget({ kind: 'topic', mode: 'create', unitId: unit.id })} style={styles.addRow}>
                      <Icon name="add" size={15} color={colors.accent} />
                      <Text style={styles.addRowText}>Agregar tema</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })}

          <Button label="Agregar unidad" variant="secondary" icon="add" fullWidth onPress={openCreateUnit} />
        </View>
      )}

      <BottomSheet visible={unitSheetVisible} onClose={() => setUnitSheetVisible(false)}>
        <Text style={styles.sheetTitle}>{editingUnit ? 'Editar unidad' : 'Nueva unidad'}</Text>
        <View style={styles.sheetForm}>
          <Input label="Título" placeholder="Ej. Programación orientada a objetos" value={unitTitle} onChangeText={setUnitTitle} leftIcon="folder-outline" />
          <Button label={editingUnit ? 'Guardar cambios' : 'Agregar unidad'} fullWidth loading={savingUnit} onPress={handleSaveUnit} />
          {editingUnit && <Button label="Eliminar unidad" variant="destructive" fullWidth onPress={handleDeleteUnit} />}
        </View>
      </BottomSheet>

      {metaTarget && (
        <ContentMetaSheet
          visible
          onClose={() => setMetaTarget(null)}
          sheetTitle={
            metaTarget.kind === 'topic'
              ? metaTarget.mode === 'create' ? 'Nuevo tema' : 'Editar tema'
              : metaTarget.mode === 'create' ? 'Nuevo subtema' : 'Editar subtema'
          }
          saveLabel={metaTarget.mode === 'create' ? 'Agregar' : 'Guardar cambios'}
          deleteLabel={metaTarget.kind === 'topic' ? 'Eliminar tema' : 'Eliminar subtema'}
          initial={
            metaTarget.mode === 'edit'
              ? metaTarget.kind === 'topic'
                ? metaTarget.topic
                : metaTarget.subtopic
              : { title: '', priority: 'medium', difficulty: 'medium', importantForExam: false }
          }
          onSave={handleSaveMeta}
          onDelete={metaTarget.mode === 'edit' ? handleDeleteMeta : undefined}
        />
      )}
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
  unitList: {
    gap: spacing.md,
  },
  unitBlock: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  unitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  unitTitle: {
    ...typography.headline,
    color: colors.textPrimary,
    flex: 1,
  },
  unitProgress: {
    ...typography.footnote,
    color: colors.accent,
  },
  editButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicList: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.xxs,
  },
  emptyHint: {
    ...typography.footnote,
    color: colors.textTertiary,
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  rowTextColumn: {
    flex: 1,
    gap: spacing.xxs,
  },
  rowLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  subtopicLabel: {
    ...typography.subheadline,
  },
  rowLabelCompleted: {
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  subtopicList: {
    marginLeft: spacing.xl,
    gap: spacing.xxs,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  addRowText: {
    ...typography.subheadline,
    color: colors.accent,
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
