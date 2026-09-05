import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Icon } from '@/components/ui';
import { Screen } from '@/components/ui/Screen';
import { contentService, sessionService } from '@/services';
import { useAppState } from '@/store';
import { colors, spacing, typography } from '@/theme';
import { StudySession } from '@/types';
import { formatDuration, formatShortDate } from '@/utils';

export default function SessionDetailScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { subjects } = useAppState();

  const [session, setSession] = useState<StudySession | null | undefined>(undefined);
  const [contentTitles, setContentTitles] = useState<string[]>([]);

  useEffect(() => {
    if (!sessionId) return;
    (async () => {
      const found = await sessionService.get(sessionId);
      setSession(found);
      if (found && found.contentIds.length > 0) {
        const topics = await contentService.listBySubject(found.subjectId);
        setContentTitles(
          topics.filter((topic) => found.contentIds.includes(topic.id)).map((topic) => topic.title),
        );
      }
    })();
  }, [sessionId]);

  const subject = session ? subjects.find((item) => item.id === session.subjectId) : undefined;

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable hitSlop={12} onPress={() => router.back()} style={styles.backButton}>
          <Icon name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      {session === undefined && <Text style={styles.hint}>Cargando…</Text>}
      {session === null && <Text style={styles.hint}>No encontramos esta sesión.</Text>}

      {session && (
        <>
          <Text style={styles.title}>{subject?.name ?? 'Materia'}</Text>
          <Text style={styles.subtitle}>{formatShortDate(session.date)}</Text>

          <Card variant="surface" style={styles.card}>
            <Row label="Tiempo estudiado" value={formatDuration(session.durationSeconds)} />
            <Row
              label="Progreso"
              value={`${Math.round(session.progressBefore * 100)}% → ${Math.round(session.progressAfter * 100)}%`}
            />
            {session.goalMinutes && (
              <Row label="Objetivo" value={session.goalMet ? `${session.goalMinutes} min · cumplido` : `${session.goalMinutes} min · no alcanzado`} />
            )}
          </Card>

          <Text style={styles.sectionTitle}>Contenidos estudiados</Text>
          {contentTitles.length === 0 ? (
            <Text style={styles.hint}>No se seleccionaron contenidos en esta sesión.</Text>
          ) : (
            <View style={styles.contentList}>
              {contentTitles.map((title) => (
                <View key={title} style={styles.contentRow}>
                  <Icon name="checkmark-circle" size={16} color={colors.accent} />
                  <Text style={styles.contentLabel}>{title}</Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
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
  hint: {
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
  card: {
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowLabel: {
    ...typography.subheadline,
    color: colors.textSecondary,
  },
  rowValue: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  sectionTitle: {
    ...typography.title3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  contentList: {
    gap: spacing.sm,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  contentLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
});
