import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedRef, useSharedValue } from 'react-native-reanimated';
import { Button, Card, ProgressBar } from '@/components/ui';
import { Screen } from '@/components/ui/Screen';
import { DraggableSubjectChip, WeekDayRow, WeekSubjectPicker } from '@/components/planner';
import { useAppState } from '@/store';
import { colors, spacing, typography } from '@/theme';
import { WEEK_DAYS, formatWeekRangeLabel, getTodayWeekDayIndex } from '@/utils';

export default function HomeScreen() {
  const router = useRouter();
  const { user, subjects, studyModeConfig, weekStartDate, weeklyPlan, setWeekSelectedSubjects, assignSubjectToDay, clearDayAssignment } =
    useAppState();

  const [pickerVisible, setPickerVisible] = useState(false);

  const mondayRef = useAnimatedRef<Animated.View>();
  const tuesdayRef = useAnimatedRef<Animated.View>();
  const wednesdayRef = useAnimatedRef<Animated.View>();
  const thursdayRef = useAnimatedRef<Animated.View>();
  const fridayRef = useAnimatedRef<Animated.View>();
  const saturdayRef = useAnimatedRef<Animated.View>();
  const sundayRef = useAnimatedRef<Animated.View>();
  const dayRefs = [mondayRef, tuesdayRef, wednesdayRef, thursdayRef, fridayRef, saturdayRef, sundayRef];
  const hoveredDayIndex = useSharedValue(-1);

  const firstName = user?.fullName?.trim().split(' ')[0] || 'ahí';
  const todayIndex = getTodayWeekDayIndex();

  const selectedSubjects = useMemo(() => {
    if (!weeklyPlan) return [];
    const byId = new Map(subjects.map((subject) => [subject.id, subject]));
    return weeklyPlan.selectedSubjectIds
      .map((id) => byId.get(id))
      .filter((subject): subject is NonNullable<typeof subject> => !!subject);
  }, [weeklyPlan, subjects]);

  const assignedCountBySubject = useMemo(() => {
    const counts: Record<string, number> = {};
    weeklyPlan?.assignments.forEach((assignment) => {
      counts[assignment.subjectId] = (counts[assignment.subjectId] ?? 0) + 1;
    });
    return counts;
  }, [weeklyPlan]);

  const subjectByDayIndex = useMemo(() => {
    const byId = new Map(subjects.map((subject) => [subject.id, subject]));
    return WEEK_DAYS.map((day) => {
      const assignment = weeklyPlan?.assignments.find((item) => item.day === day.key);
      return assignment ? byId.get(assignment.subjectId) : undefined;
    });
  }, [weeklyPlan, subjects]);

  const daysPlanned = weeklyPlan?.assignments.length ?? 0;
  const canEditSelection = subjects.length > studyModeConfig.maxSubjectsPerWeek;

  const handleDrop = (dayIndex: number, subjectId: string) => {
    assignSubjectToDay(WEEK_DAYS[dayIndex].key, subjectId);
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hola, {firstName} 👋</Text>
        <Text style={styles.subtitle}>{formatWeekRangeLabel(weekStartDate)}</Text>
      </View>

      <Card variant="elevated" style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Progreso de la semana</Text>
        <Text style={styles.summaryValue}>{daysPlanned} de 7 días planificados</Text>
        <ProgressBar progress={daysPlanned / 7} style={styles.summaryProgress} />
      </Card>

      <View style={styles.plannerSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tu semana</Text>
          {canEditSelection && (
            <Button label="Editar" variant="ghost" size="sm" onPress={() => setPickerVisible(true)} />
          )}
        </View>

        {selectedSubjects.length > 0 && (
          <View style={styles.chipsRow}>
            {selectedSubjects.map((subject) => (
              <DraggableSubjectChip
                key={subject.id}
                subject={subject}
                assignedCount={assignedCountBySubject[subject.id] ?? 0}
                dayRefs={dayRefs}
                hoveredDayIndex={hoveredDayIndex}
                onDrop={handleDrop}
              />
            ))}
          </View>
        )}

        <Text style={styles.hint}>Arrastrá una materia hacia el día que quieras estudiarla.</Text>

        <View style={styles.daysList}>
          {WEEK_DAYS.map((day, index) => (
            <WeekDayRow
              key={day.key}
              animatedRef={dayRefs[index]}
              dayIndex={index}
              dayLabel={day.label}
              isToday={index === todayIndex}
              assignedSubject={subjectByDayIndex[index]}
              hoveredDayIndex={hoveredDayIndex}
              onPressAssigned={() => {
                const subject = subjectByDayIndex[index];
                if (subject) router.push(`/materia/${subject.id}`);
              }}
              onClear={() => clearDayAssignment(day.key)}
            />
          ))}
        </View>
      </View>

      <WeekSubjectPicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        subjects={subjects}
        selectedIds={weeklyPlan?.selectedSubjectIds ?? []}
        maxSelectable={studyModeConfig.maxSubjectsPerWeek}
        onSave={setWeekSelectedSubjects}
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...typography.title3,
    color: colors.textPrimary,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  hint: {
    ...typography.footnote,
    color: colors.textTertiary,
  },
  daysList: {
    gap: spacing.md,
  },
});
