import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ActivityHeatmap, BarChart, ProgressRing, RankedBarList } from '@/components/charts';
import { Card, EmptyState, Icon } from '@/components/ui';
import { Screen } from '@/components/ui/Screen';
import { statsService, StatsOverview, SubjectTimeBreakdown } from '@/services';
import { useAppState } from '@/store';
import { colors, spacing, typography } from '@/theme';
import { formatDuration, WEEK_DAYS, getTodayWeekDayIndex } from '@/utils';

const EMPTY_OVERVIEW: StatsOverview = {
  todayMinutes: 0,
  weekMinutes: 0,
  monthMinutes: 0,
  totalMinutes: 0,
  totalSessions: 0,
  streakDays: 0,
};

export default function EstadisticasScreen() {
  const { subjects } = useAppState();
  const [overview, setOverview] = useState<StatsOverview>(EMPTY_OVERVIEW);
  const [dailyActivity, setDailyActivity] = useState<{ date: string; minutes: number }[]>([]);
  const [timeBreakdown, setTimeBreakdown] = useState<SubjectTimeBreakdown[]>([]);
  const [weekPoints, setWeekPoints] = useState<{ date: string; minutes: number }[]>([]);

  const load = useCallback(async () => {
    const [overviewResult, weekActivity, heatmapActivity, breakdown] = await Promise.all([
      statsService.getOverview(),
      statsService.getDailyActivity(7),
      statsService.getDailyActivity(70),
      statsService.getSubjectTimeBreakdown(),
    ]);
    setOverview(overviewResult);
    setTimeBreakdown(breakdown);
    setDailyActivity(heatmapActivity);
    setWeekPoints(weekActivity);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const activeSubjects = useMemo(() => subjects.filter((subject) => !subject.archived), [subjects]);

  const overallProgress = useMemo(() => {
    if (activeSubjects.length === 0) return 0;
    return activeSubjects.reduce((sum, subject) => sum + subject.progress, 0) / activeSubjects.length;
  }, [activeSubjects]);

  const subjectRows = useMemo(() => {
    const timeBySubject = new Map(timeBreakdown.map((item) => [item.subjectId, item]));
    return activeSubjects
      .map((subject) => {
        const time = timeBySubject.get(subject.id);
        return {
          id: subject.id,
          label: subject.shortName || subject.name,
          value: subject.progress,
          caption:
            time && time.minutes > 0
              ? `${formatDuration(time.minutes * 60)} · ${time.sessionsCount} ${time.sessionsCount === 1 ? 'sesión' : 'sesiones'}`
              : 'Sin sesiones todavía',
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [activeSubjects, timeBreakdown]);

  const barChartData = useMemo(() => {
    const todayIndex = getTodayWeekDayIndex();
    return weekPoints.map((point, index) => {
      const isToday = index === weekPoints.length - 1;
      const dayOfWeekIndex = (todayIndex - (weekPoints.length - 1 - index) + 7 * 10) % 7;
      return {
        label: WEEK_DAYS[dayOfWeekIndex].shortLabel,
        value: point.minutes,
        emphasized: isToday,
      };
    });
  }, [weekPoints]);

  const hasAnyData = overview.totalSessions > 0;

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.title}>Estadísticas</Text>
        <Text style={styles.subtitle}>Tu avance real, materia por materia</Text>
      </View>

      {!hasAnyData && activeSubjects.length === 0 ? (
        <EmptyState
          icon="bar-chart-outline"
          title="Todavía no hay datos"
          description="Agregá materias y registrá sesiones de estudio para ver tus estadísticas acá."
        />
      ) : (
        <>
          <Card variant="elevated" style={styles.heroCard}>
            <View style={styles.heroRow}>
              <ProgressRing progress={overallProgress} label="Avance general" />
              <View style={styles.heroSide}>
                <View style={styles.streakRow}>
                  <Icon name="flame" size={18} color={overview.streakDays > 0 ? colors.warning : colors.textTertiary} />
                  <Text style={styles.streakValue}>{overview.streakDays}</Text>
                  <Text style={styles.streakLabel}>{overview.streakDays === 1 ? 'día seguido' : 'días seguidos'}</Text>
                </View>
                <Text style={styles.heroHint}>
                  {activeSubjects.length} {activeSubjects.length === 1 ? 'materia activa' : 'materias activas'}
                </Text>
                <Text style={styles.heroTotal}>{formatDuration(overview.totalMinutes * 60)} en total</Text>
              </View>
            </View>
          </Card>

          <View style={styles.kpiRow}>
            <StatTile label="Hoy" value={formatDuration(overview.todayMinutes * 60)} />
            <StatTile label="Esta semana" value={formatDuration(overview.weekMinutes * 60)} />
            <StatTile label="Este mes" value={formatDuration(overview.monthMinutes * 60)} />
          </View>

          <Card variant="surface" style={styles.section}>
            <Text style={styles.sectionTitle}>Últimos 7 días</Text>
            {barChartData.length > 0 && (
              <BarChart data={barChartData} valueFormatter={(value) => formatDuration(value * 60)} />
            )}
          </Card>

          <Card variant="surface" style={styles.section}>
            <Text style={styles.sectionTitle}>Constancia</Text>
            <Text style={styles.sectionSubtitle}>Últimas 10 semanas</Text>
            {dailyActivity.length > 0 && <ActivityHeatmap days={dailyActivity} />}
          </Card>

          <Card variant="surface" style={styles.section}>
            <Text style={styles.sectionTitle}>Avance por materia</Text>
            {subjectRows.length === 0 ? (
              <Text style={styles.emptyHint}>Agregá materias para ver su avance acá.</Text>
            ) : (
              <RankedBarList items={subjectRows} />
            )}
          </Card>
        </>
      )}
    </Screen>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Card variant="surface" style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </Card>
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
  heroCard: {
    marginBottom: spacing.lg,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  heroSide: {
    flex: 1,
    gap: spacing.xs,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  streakValue: {
    ...typography.title2,
    color: colors.textPrimary,
  },
  streakLabel: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
  heroHint: {
    ...typography.footnote,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  heroTotal: {
    ...typography.footnote,
    color: colors.textTertiary,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    gap: spacing.xs,
  },
  statLabel: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
  statValue: {
    ...typography.title3,
    color: colors.textPrimary,
  },
  section: {
    marginBottom: spacing.lg,
    gap: spacing.lg,
  },
  sectionTitle: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    ...typography.footnote,
    color: colors.textSecondary,
    marginTop: -spacing.md,
  },
  emptyHint: {
    ...typography.subheadline,
    color: colors.textTertiary,
  },
});
