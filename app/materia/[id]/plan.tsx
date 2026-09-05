import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { BottomSheet, Card, Chip, EmptyState, Icon, ProgressBar, SkeletonCard } from '@/components/ui';
import { Screen } from '@/components/ui/Screen';
import { contentPlanService, contentService, examService } from '@/services';
import { useAppState } from '@/store';
import { colors, radius, spacing, typography } from '@/theme';
import { ContentPlanAssignment, Exam, Topic, WeekDay } from '@/types';
import { WEEK_DAYS } from '@/utils';

export default function PlanScreen() {
  const router = useRouter();
  const { id: subjectId } = useLocalSearchParams<{ id: string }>();
  const { subjects, weeklyPlan } = useAppState();

  const subject = subjects.find((item) => item.id === subjectId);

  const [topics, setTopics] = useState<Topic[]>([]);
  const [assignments, setAssignments] = useState<ContentPlanAssignment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pickerTopic, setPickerTopic] = useState<Topic | null>(null);

  const load = useCallback(async () => {
    if (!subjectId) return;
    const [topicList, assignmentList, examList] = await Promise.all([
      contentService.listBySubject(subjectId),
      contentPlanService.listBySubject(subjectId),
      examService.listBySubject(subjectId),
    ]);
    setTopics(topicList);
    setAssignments(assignmentList);
    setExams(examList);
    setIsLoading(false);
  }, [subjectId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const availableDays = useMemo(() => {
    const assignedKeys = weeklyPlan?.assignments.filter((a) => a.subjectId === subjectId).map((a) => a.day) ?? [];
    return assignedKeys.length > 0 ? WEEK_DAYS.filter((day) => assignedKeys.includes(day.key)) : WEEK_DAYS;
  }, [weeklyPlan, subjectId]);

  const hasWeeklyDays = (weeklyPlan?.assignments.filter((a) => a.subjectId === subjectId).length ?? 0) > 0;

  const assignmentByContentId = useMemo(
    () => new Map(assignments.map((assignment) => [assignment.contentId, assignment.day])),
    [assignments],
  );

  const nextExamLabel = useMemo(() => {
    const DAY_MS = 1000 * 60 * 60 * 24;
    const next = exams
      .map((exam) => Math.ceil((new Date(exam.date).getTime() - Date.now()) / DAY_MS))
      .filter((daysRemaining) => daysRemaining >= 0)
      .sort((a, b) => a - b)[0];
    return next !== undefined ? `${next} días` : '—';
  }, [exams]);

  const pendingTopics = useMemo(() => topics.filter((topic) => topic.status !== 'completed'), [topics]);
  const plannedTopics = pendingTopics.filter((topic) => assignmentByContentId.has(topic.id));
  const unplannedTopics = pendingTopics.filter((topic) => !assignmentByContentId.has(topic.id));

  const topicsByDay = (day: WeekDay) =>
    plannedTopics.filter((topic) => assignmentByContentId.get(topic.id) === day);

  const handleAssign = async (day: WeekDay) => {
    if (!subjectId || !pickerTopic) return;
    Haptics.selectionAsync();
    const next = await contentPlanService.assign(subjectId, pickerTopic.id, day);
    setAssignments(next);
    setPickerTopic(null);
  };

  const handleClear = async (topicId: string) => {
    if (!subjectId) return;
    const next = await contentPlanService.unassign(subjectId, topicId);
    setAssignments(next);
  };

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

      <Text style={styles.title}>Plan de estudio</Text>
      <Text style={styles.subtitle}>{subject.name}</Text>

      <ProgressBar progress={subject.progress} showLabel label="Progreso general" style={styles.progress} />

      <View style={styles.metaRow}>
        <Card variant="surface" style={styles.metaCard}>
          <Text style={styles.metaValue}>{nextExamLabel}</Text>
          <Text style={styles.metaLabel}>Próximo parcial</Text>
        </Card>
        <Card variant="surface" style={styles.metaCard}>
          <Text style={styles.metaValue}>{unplannedTopics.length}</Text>
          <Text style={styles.metaLabel}>Sin planificar</Text>
        </Card>
      </View>
      <Text style={styles.goalHint}>
        Distribuí lo que te falta estudiar entre tus días asignados para llegar preparada a tu próximo parcial.
      </Text>

      {!hasWeeklyDays && (
        <View style={styles.infoBanner}>
          <Icon name="information-circle-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.infoBannerText}>
            Esta materia no tiene días asignados esta semana. Andá a Inicio para asignarle días, o elegí igual
            entre los 7 días.
          </Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Plan de la semana</Text>
      <View style={styles.dayList}>
        {availableDays.map((day) => {
          const dayTopics = topicsByDay(day.key);
          return (
            <View key={day.key} style={styles.dayRow}>
              <Text style={styles.dayLabel}>{day.label}</Text>
              <View style={styles.dayContent}>
                {dayTopics.length === 0 ? (
                  <Text style={styles.dayEmpty}>Sin contenido asignado</Text>
                ) : (
                  dayTopics.map((topic) => (
                    <View key={topic.id} style={styles.assignedPill}>
                      <Text style={styles.assignedPillText} numberOfLines={1}>{topic.title}</Text>
                      <Pressable hitSlop={8} onPress={() => handleClear(topic.id)}>
                        <Icon name="close" size={13} color={colors.onLightTextSecondary} />
                      </Pressable>
                    </View>
                  ))
                )}
              </View>
            </View>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>Contenido pendiente</Text>
      {isLoading ? (
        <View style={styles.pendingList}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : pendingTopics.length === 0 ? (
        <EmptyState
          icon="checkmark-done-outline"
          title="No tenés contenido pendiente"
          description="Agregá temas desde Contenidos para poder planificarlos acá."
        />
      ) : unplannedTopics.length === 0 ? (
        <Text style={styles.allPlannedHint}>Ya planificaste todo tu contenido pendiente 🎉</Text>
      ) : (
        <View style={styles.pendingList}>
          {unplannedTopics.map((topic) => (
            <Pressable key={topic.id} onPress={() => setPickerTopic(topic)} style={styles.pendingRow}>
              <Icon name="ellipse-outline" size={18} color={colors.textTertiary} />
              <Text style={styles.pendingLabel} numberOfLines={1}>{topic.title}</Text>
              <Icon name="chevron-forward" size={16} color={colors.textTertiary} />
            </Pressable>
          ))}
        </View>
      )}

      <BottomSheet visible={!!pickerTopic} onClose={() => setPickerTopic(null)}>
        <Text style={styles.sheetTitle}>{pickerTopic?.title}</Text>
        <Text style={styles.sheetSubtitle}>Elegí en qué día vas a estudiar este contenido.</Text>
        <View style={styles.sheetChips}>
          {availableDays.map((day) => (
            <Chip key={day.key} label={day.label} onPress={() => handleAssign(day.key)} />
          ))}
        </View>
      </BottomSheet>
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
  title: {
    ...typography.largeTitle,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.subheadline,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  progress: {
    marginBottom: spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  metaCard: {
    flex: 1,
    gap: spacing.xxs,
  },
  metaValue: {
    ...typography.title2,
    color: colors.textPrimary,
  },
  metaLabel: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
  goalHint: {
    ...typography.footnote,
    color: colors.textTertiary,
    marginBottom: spacing.xl,
  },
  infoBanner: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    marginBottom: spacing.xl,
  },
  infoBannerText: {
    ...typography.footnote,
    color: colors.textSecondary,
    flex: 1,
  },
  sectionTitle: {
    ...typography.title3,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  dayList: {
    gap: spacing.md,
    marginBottom: spacing.xxxl,
  },
  dayRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dayLabel: {
    ...typography.subheadline,
    color: colors.textPrimary,
    width: 84,
    paddingTop: spacing.sm,
  },
  dayContent: {
    flex: 1,
    gap: spacing.xs,
  },
  dayEmpty: {
    ...typography.footnote,
    color: colors.textTertiary,
    paddingTop: spacing.sm,
  },
  assignedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.onLightSurface,
  },
  assignedPillText: {
    ...typography.subheadline,
    fontFamily: typography.bodyMedium.fontFamily,
    color: colors.onLightText,
    flex: 1,
    marginRight: spacing.sm,
  },
  allPlannedHint: {
    ...typography.subheadline,
    color: colors.textSecondary,
  },
  pendingList: {
    gap: spacing.xs,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  pendingLabel: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  sheetTitle: {
    ...typography.title3,
    color: colors.textPrimary,
  },
  sheetSubtitle: {
    ...typography.subheadline,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
    marginBottom: spacing.lg,
  },
  sheetChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
