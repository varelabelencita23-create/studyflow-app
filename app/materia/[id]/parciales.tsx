import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge, EmptyState, Icon, SkeletonCard } from '@/components/ui';
import { ExamFormSheet } from '@/components/exams';
import { Screen } from '@/components/ui/Screen';
import { examService } from '@/services';
import { useAppState } from '@/store';
import { colors, radius, spacing, typography } from '@/theme';
import { Exam, ExamType } from '@/types';

const TYPE_LABEL: Record<ExamType, string> = {
  parcial: 'Parcial',
  recuperatorio: 'Recuperatorio',
  final: 'Final',
  'trabajo-practico': 'Trabajo práctico',
};

export default function ParcialesBancoScreen() {
  const router = useRouter();
  const { id: subjectId } = useLocalSearchParams<{ id: string }>();
  const { subjects } = useAppState();

  const subject = subjects.find((item) => item.id === subjectId);
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createVisible, setCreateVisible] = useState(false);

  const load = useCallback(async () => {
    if (!subjectId) return;
    const examList = await examService.listBySubject(subjectId);
    setExams(examList);
    setIsLoading(false);
  }, [subjectId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const examsByYear = useMemo(() => {
    const groups = new Map<number, Exam[]>();
    exams.forEach((exam) => {
      const year = new Date(exam.date).getFullYear();
      groups.set(year, [...(groups.get(year) ?? []), exam]);
    });
    return [...groups.entries()].sort((a, b) => b[0] - a[0]);
  }, [exams]);

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

      <View style={styles.titleRow}>
        <View>
          <Text style={styles.title}>Parciales</Text>
          <Text style={styles.subtitle}>{subject.name}</Text>
        </View>
        <Pressable hitSlop={8} onPress={() => setCreateVisible(true)} style={styles.addButton}>
          <Icon name="add" size={20} color={colors.accent} />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.yearList}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : exams.length === 0 ? (
        <EmptyState
          icon="document-text-outline"
          title="Todavía no agregaste parciales"
          description="Creá tu banco de parciales para llevar un registro por año."
          actionLabel="Agregar parcial"
          onAction={() => setCreateVisible(true)}
        />
      ) : (
        <View style={styles.yearList}>
          {examsByYear.map(([year, yearExams]) => (
            <View key={year} style={styles.yearBlock}>
              <Text style={styles.yearLabel}>{year}</Text>
              <View style={styles.examList}>
                {yearExams.map((exam) => (
                  <Pressable key={exam.id} onPress={() => router.push(`/parcial/${exam.id}`)} style={styles.examRow}>
                    <View style={styles.examIcon}>
                      <Icon name="document-text-outline" size={18} color={colors.accent} />
                    </View>
                    <View style={styles.examInfo}>
                      <Text style={styles.examTitle} numberOfLines={1}>{exam.title}</Text>
                      <Badge label={TYPE_LABEL[exam.type]} variant="neutral" />
                    </View>
                    <Icon name="chevron-forward" size={16} color={colors.textTertiary} />
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

      <ExamFormSheet
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        sheetTitle="Nuevo parcial"
        saveLabel="Agregar parcial"
        onSave={async (values) => {
          await examService.add(subjectId, values);
          load();
        }}
      />
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.largeTitle,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.subheadline,
    color: colors.textSecondary,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xxs,
  },
  yearList: {
    gap: spacing.xxl,
  },
  yearBlock: {
    gap: spacing.md,
  },
  yearLabel: {
    ...typography.title3,
    color: colors.textPrimary,
  },
  examList: {
    gap: spacing.sm,
  },
  examRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  examIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  examInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  examTitle: {
    ...typography.body,
    color: colors.textPrimary,
  },
});
