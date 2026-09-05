import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Icon, IconName, ProgressBar } from '@/components/ui';
import { Screen } from '@/components/ui/Screen';
import { useToast } from '@/hooks/useToast';
import { contentService, sessionService } from '@/services';
import { useActiveSession, useAppState } from '@/store';
import { colors, radius, spacing, typography } from '@/theme';
import { StudySession, Topic } from '@/types';
import { formatDuration, formatShortDate, WEEK_DAYS } from '@/utils';

const ACCESS_ITEMS: { label: string; icon: IconName; key: string }[] = [
  { key: 'contenidos', label: 'Contenidos', icon: 'list-outline' },
  { key: 'plan', label: 'Plan de estudio', icon: 'calendar-outline' },
  { key: 'archivos', label: 'Archivos', icon: 'folder-outline' },
  { key: 'parciales', label: 'Parciales', icon: 'document-text-outline' },
  { key: 'flashcards', label: 'Flashcards', icon: 'albums-outline' },
  { key: 'tests', label: 'Tests', icon: 'checkmark-done-outline' },
];

export default function SubjectDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { subjects, weeklyPlan } = useAppState();
  const { activeSession, startSession } = useActiveSession();
  const { show } = useToast();

  const subject = subjects.find((item) => item.id === id);

  const [contents, setContents] = useState<Topic[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);

  const load = useCallback(async () => {
    if (!id) return;
    const [contentList, sessionList] = await Promise.all([
      contentService.listBySubject(id),
      sessionService.listBySubject(id),
    ]);
    setContents(contentList);
    setSessions(sessionList);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const assignedDays = weeklyPlan?.assignments.filter((assignment) => assignment.subjectId === id) ?? [];
  const assignedDayLabels = assignedDays
    .map((assignment) => WEEK_DAYS.find((day) => day.key === assignment.day)?.shortLabel)
    .filter(Boolean)
    .join(' · ');

  const stats = useMemo(() => {
    const totalSeconds = sessions.reduce((sum, session) => sum + session.durationSeconds, 0);
    const completedContents = contents.filter((topic) => topic.status === 'completed').length;
    const distinctDays = new Set(sessions.map((session) => session.date.slice(0, 10))).size;
    const averageMinutes = distinctDays > 0 ? Math.round(totalSeconds / 60 / distinctDays) : 0;
    return {
      hoursStudiedLabel: totalSeconds > 0 ? formatDuration(totalSeconds) : '—',
      contentsLabel: contents.length > 0 ? `${completedContents}/${contents.length}` : '—',
      sessionsCount: sessions.length,
      averageDailyLabel: averageMinutes > 0 ? `${averageMinutes} min` : '—',
    };
  }, [sessions, contents]);

  if (!subject) {
    return (
      <Screen edges={['top', 'bottom']}>
        <HeaderBar onBack={() => router.back()} />
        <Text style={styles.notFound}>No encontramos esta materia.</Text>
      </Screen>
    );
  }

  const handleStartSession = () => {
    if (activeSession) {
      if (activeSession.subjectId !== subject.id) {
        show(`Tenés una sesión en curso en ${activeSession.subjectName}`, 'default');
      }
      router.push('/sesion/timer');
      return;
    }
    router.push(`/sesion/nueva?subjectId=${subject.id}`);
  };

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <HeaderBar onBack={() => router.back()} />

      <View style={styles.titleBlock}>
        <Text style={styles.title}>{subject.name}</Text>
        {!!subject.professor && <Text style={styles.professor}>{subject.professor}</Text>}
      </View>

      <ProgressBar progress={subject.progress} showLabel label="Progreso general" style={styles.progress} />

      <View style={styles.statsGrid}>
        <StatTile label="Próximo parcial" value="—" hint="Agregá uno en Parciales" />
        <StatTile label="Días esta semana" value={`${assignedDays.length}`} hint={assignedDayLabels || undefined} />
        <StatTile label="Horas estudiadas" value={stats.hoursStudiedLabel} />
        <StatTile label="Temas completados" value={stats.contentsLabel} />
        <StatTile label="Sesiones" value={`${stats.sessionsCount}`} />
        <StatTile label="Promedio diario" value={stats.averageDailyLabel} />
      </View>

      <Button
        label={activeSession && activeSession.subjectId === subject.id ? 'Reanudar sesión' : 'Iniciar sesión'}
        size="lg"
        fullWidth
        icon="play"
        onPress={handleStartSession}
        style={styles.startButton}
      />

      {sessions.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Sesiones recientes</Text>
          <View style={styles.recentList}>
            {sessions.slice(0, 3).map((session) => (
              <Pressable
                key={session.id}
                onPress={() => router.push(`/sesion/${session.id}`)}
                style={styles.recentRow}
              >
                <View style={styles.recentIcon}>
                  <Icon name="time-outline" size={16} color={colors.accent} />
                </View>
                <View style={styles.recentInfo}>
                  <Text style={styles.recentDate}>{formatShortDate(session.date)}</Text>
                  <Text style={styles.recentDuration}>{formatDuration(session.durationSeconds)}</Text>
                </View>
                <Icon name="chevron-forward" size={16} color={colors.textTertiary} />
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Explorar</Text>
      <View style={styles.grid}>
        {ACCESS_ITEMS.map((item) => (
          <Card
            key={item.key}
            variant="surface"
            style={styles.accessCard}
            onPress={() => {
              if (item.key === 'contenidos') router.push(`/materia/${subject.id}/contenidos`);
              else if (item.key === 'plan') router.push(`/materia/${subject.id}/plan`);
              else if (item.key === 'archivos') router.push(`/materia/${subject.id}/archivos`);
              else show('Disponible en una próxima etapa', 'default');
            }}
          >
            <View style={styles.accessIcon}>
              <Icon name={item.icon} size={20} color={colors.accent} />
            </View>
            <Text style={styles.accessLabel}>{item.label}</Text>
            {item.key === 'contenidos' && contents.length > 0 && (
              <Text style={styles.accessBadge}>{stats.contentsLabel}</Text>
            )}
          </Card>
        ))}
      </View>
    </Screen>
  );
}

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card variant="surface" style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {!!hint && <Text style={styles.statHint}>{hint}</Text>}
    </Card>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    width: '47%',
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
  statHint: {
    ...typography.caption2,
    color: colors.textTertiary,
    marginTop: spacing.xxs,
  },
  startButton: {
    marginBottom: spacing.xxxl,
  },
  recentSection: {
    marginBottom: spacing.xxxl,
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.title3,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  recentList: {
    gap: spacing.xs,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  recentIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentInfo: {
    flex: 1,
    gap: spacing.xxs,
  },
  recentDate: {
    ...typography.subheadline,
    color: colors.textPrimary,
  },
  recentDuration: {
    ...typography.footnote,
    color: colors.textSecondary,
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
  accessBadge: {
    ...typography.caption2,
    color: colors.accent,
  },
});
