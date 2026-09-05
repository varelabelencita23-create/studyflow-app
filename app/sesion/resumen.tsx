import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Icon, ProgressBar } from '@/components/ui';
import { Screen } from '@/components/ui/Screen';
import { contentService } from '@/services';
import { SessionSummary, useActiveSession } from '@/store';
import { colors, radius, spacing, typography } from '@/theme';
import { ID } from '@/types';
import { formatDuration } from '@/utils';

export default function SessionSummaryScreen() {
  const router = useRouter();
  const { activeSession, finalize } = useActiveSession();

  const [items, setItems] = useState<{ id: ID; title: string }[]>([]);
  const [confirmedIds, setConfirmedIds] = useState<ID[]>(activeSession?.contentIds ?? []);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState<SessionSummary | null>(null);

  useEffect(() => {
    if (!activeSession) return;
    setConfirmedIds(activeSession.contentIds);
    (async () => {
      const topics = await contentService.listBySubject(activeSession.subjectId);
      setItems(
        topics
          .filter((topic) => activeSession.contentIds.includes(topic.id))
          .map((topic) => ({ id: topic.id, title: topic.title })),
      );
    })();
  }, [activeSession?.subjectId]);

  if (!activeSession && !summary) {
    return (
      <Screen edges={['top', 'bottom']}>
        <Text style={styles.notFound}>No hay ninguna sesión para resumir.</Text>
        <Button label="Volver" onPress={() => router.replace('/(tabs)')} style={{ marginTop: spacing.lg }} />
      </Screen>
    );
  }

  const toggle = (id: ID) => {
    setConfirmedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await finalize(confirmedIds);
      setSummary(result);
    } finally {
      setSaving(false);
    }
  };

  if (summary) {
    return (
      <Screen edges={['top', 'bottom']} contentContainerStyle={styles.summaryContainer}>
        <View style={styles.summaryContent}>
          <View style={styles.successIcon}>
            <Icon name="checkmark-circle" size={44} color={colors.success} />
          </View>
          <Text style={styles.summaryTitle}>Sesión guardada</Text>
          <Text style={styles.summarySubtitle}>{summary.subjectName}</Text>

          <Card variant="surface" style={styles.summaryCard}>
            <SummaryRow label="Tiempo estudiado" value={formatDuration(summary.durationSeconds)} />
            <SummaryRow
              label="Contenidos completados"
              value={`${summary.contentsCompletedCount}/${summary.contentsSelectedCount}`}
            />
            {summary.goalMinutes && (
              <SummaryRow
                label="Objetivo"
                value={summary.goalMet ? 'Cumplido ✅' : 'No alcanzado'}
              />
            )}
          </Card>

          <Card variant="surface" style={styles.progressCard}>
            <Text style={styles.progressLabel}>Progreso de la materia</Text>
            <View style={styles.progressRow}>
              <Text style={styles.progressValue}>{Math.round(summary.progressBefore * 100)}%</Text>
              <Icon name="arrow-forward" size={16} color={colors.textSecondary} />
              <Text style={[styles.progressValue, styles.progressValueAfter]}>
                {Math.round(summary.progressAfter * 100)}%
              </Text>
            </View>
            <ProgressBar progress={summary.progressAfter} style={styles.progressBar} />
          </Card>
        </View>

        <Button
          label="Volver a la materia"
          size="lg"
          fullWidth
          onPress={() => router.replace(`/materia/${summary.subjectId}`)}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <Text style={styles.title}>Resumen de sesión</Text>
      <Text style={styles.subtitle}>Confirmá qué contenidos completaste.</Text>

      {items.length === 0 ? (
        <Text style={styles.emptyHint}>No seleccionaste contenidos para esta sesión.</Text>
      ) : (
        <View style={styles.list}>
          {items.map((item) => {
            const isChecked = confirmedIds.includes(item.id);
            return (
              <Pressable key={item.id} onPress={() => toggle(item.id)} style={styles.row}>
                <Text style={styles.rowLabel} numberOfLines={1}>{item.title}</Text>
                <View style={[styles.checkbox, isChecked && styles.checkboxSelected]}>
                  {isChecked && <Icon name="checkmark" size={14} color={colors.textPrimary} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      <Button label="Guardar sesión" size="lg" fullWidth loading={saving} onPress={handleSave} style={styles.saveButton} />
    </Screen>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRowItem}>
      <Text style={styles.summaryRowLabel}>{label}</Text>
      <Text style={styles.summaryRowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notFound: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.massive,
    textAlign: 'center',
  },
  title: {
    ...typography.largeTitle,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  subtitle: {
    ...typography.subheadline,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
    marginBottom: spacing.xxl,
  },
  emptyHint: {
    ...typography.subheadline,
    color: colors.textTertiary,
    marginBottom: spacing.xxl,
  },
  list: {
    gap: spacing.xs,
    marginBottom: spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  rowLabel: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  saveButton: {
    marginBottom: spacing.xl,
  },
  summaryContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: spacing.massive,
    paddingBottom: spacing.xl,
  },
  summaryContent: {
    alignItems: 'center',
    gap: spacing.md,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: radius.xxl,
    backgroundColor: colors.successSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  summaryTitle: {
    ...typography.title1,
    color: colors.textPrimary,
  },
  summarySubtitle: {
    ...typography.subheadline,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    width: '100%',
    gap: spacing.md,
  },
  summaryRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryRowLabel: {
    ...typography.subheadline,
    color: colors.textSecondary,
  },
  summaryRowValue: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  progressCard: {
    width: '100%',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  progressLabel: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressValue: {
    ...typography.title3,
    color: colors.textSecondary,
  },
  progressValueAfter: {
    color: colors.accent,
  },
  progressBar: {
    marginTop: spacing.xs,
  },
});
