import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge, BottomSheet, EmptyState, Icon } from '@/components/ui';
import { ExamFormSheet } from '@/components/exams';
import { Screen } from '@/components/ui/Screen';
import { examService } from '@/services';
import { useAppState } from '@/store';
import { colors, radius, spacing, typography } from '@/theme';
import { Exam, ExamType, Subject } from '@/types';

const TYPE_LABEL: Record<ExamType, string> = {
  parcial: 'Parcial',
  recuperatorio: 'Recuperatorio',
  final: 'Final',
  'trabajo-practico': 'Trabajo práctico',
};

function countdownLabel(daysRemaining: number): string {
  if (daysRemaining > 0) return `En ${daysRemaining} ${daysRemaining === 1 ? 'día' : 'días'}`;
  if (daysRemaining === 0) return 'Hoy';
  return `Hace ${Math.abs(daysRemaining)} ${Math.abs(daysRemaining) === 1 ? 'día' : 'días'}`;
}

function daysRemainingFor(exam: Exam): number {
  const DAY_MS = 1000 * 60 * 60 * 24;
  return Math.ceil((new Date(exam.date).getTime() - Date.now()) / DAY_MS);
}

export default function ParcialesScreen() {
  const router = useRouter();
  const { subjects } = useAppState();

  const [exams, setExams] = useState<Exam[]>([]);
  const [subjectPickerVisible, setSubjectPickerVisible] = useState(false);
  const [creatingForSubject, setCreatingForSubject] = useState<Subject | null>(null);

  const load = useCallback(() => {
    examService.listAll().then(setExams);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const { upcoming, past } = useMemo(() => {
    const withDays = exams.map((exam) => ({ exam, daysRemaining: daysRemainingFor(exam) }));
    return {
      upcoming: withDays.filter((item) => item.daysRemaining >= 0).sort((a, b) => a.daysRemaining - b.daysRemaining),
      past: withDays.filter((item) => item.daysRemaining < 0).sort((a, b) => b.daysRemaining - a.daysRemaining),
    };
  }, [exams]);

  const subjectName = (subjectId: string) => subjects.find((item) => item.id === subjectId)?.name ?? 'Materia';

  const handlePickSubject = (subject: Subject) => {
    setSubjectPickerVisible(false);
    setCreatingForSubject(subject);
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Parciales</Text>
          <Text style={styles.subtitle}>Countdown y preparación por parcial</Text>
        </View>
        <Pressable
          hitSlop={8}
          onPress={() => setSubjectPickerVisible(true)}
          style={styles.addButton}
          disabled={subjects.length === 0}
        >
          <Icon name="add" size={20} color={subjects.length === 0 ? colors.textTertiary : colors.accent} />
        </Pressable>
      </View>

      {exams.length === 0 ? (
        <EmptyState
          icon="document-text-outline"
          title="Sin parciales cargados"
          description="Acá vas a ver el calendario de parciales de todas tus materias y cuán preparada estás para cada uno."
          actionLabel={subjects.length > 0 ? 'Agregar parcial' : undefined}
          onAction={subjects.length > 0 ? () => setSubjectPickerVisible(true) : undefined}
        />
      ) : (
        <>
          {upcoming.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Próximos</Text>
              <View style={styles.list}>
                {upcoming.map(({ exam, daysRemaining }) => (
                  <ExamRow key={exam.id} exam={exam} daysRemaining={daysRemaining} subjectName={subjectName(exam.subjectId)} onPress={() => router.push(`/parcial/${exam.id}`)} />
                ))}
              </View>
            </View>
          )}

          {past.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pasados</Text>
              <View style={styles.list}>
                {past.map(({ exam, daysRemaining }) => (
                  <ExamRow key={exam.id} exam={exam} daysRemaining={daysRemaining} subjectName={subjectName(exam.subjectId)} onPress={() => router.push(`/parcial/${exam.id}`)} muted />
                ))}
              </View>
            </View>
          )}
        </>
      )}

      <BottomSheet visible={subjectPickerVisible} onClose={() => setSubjectPickerVisible(false)}>
        <Text style={styles.sheetTitle}>¿Para qué materia?</Text>
        <View style={styles.subjectList}>
          {subjects.map((subject) => (
            <Pressable key={subject.id} onPress={() => handlePickSubject(subject)} style={styles.subjectRow}>
              <Text style={styles.subjectLabel}>{subject.name}</Text>
              <Icon name="chevron-forward" size={16} color={colors.textTertiary} />
            </Pressable>
          ))}
        </View>
      </BottomSheet>

      <ExamFormSheet
        visible={!!creatingForSubject}
        onClose={() => setCreatingForSubject(null)}
        sheetTitle="Nuevo parcial"
        saveLabel="Agregar parcial"
        onSave={async (values) => {
          if (!creatingForSubject) return;
          await examService.add(creatingForSubject.id, values);
          load();
        }}
      />
    </Screen>
  );
}

function ExamRow({
  exam,
  daysRemaining,
  subjectName,
  onPress,
  muted,
}: {
  exam: Exam;
  daysRemaining: number;
  subjectName: string;
  onPress: () => void;
  muted?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.examRow, muted && styles.examRowMuted]}>
      <View style={styles.examIcon}>
        <Icon name="document-text-outline" size={18} color={muted ? colors.textTertiary : colors.accent} />
      </View>
      <View style={styles.examInfo}>
        <Text style={styles.examSubject}>{subjectName}</Text>
        <Text style={styles.examTitle} numberOfLines={1}>{exam.title}</Text>
      </View>
      <View style={styles.examMeta}>
        <Badge label={TYPE_LABEL[exam.type]} variant="neutral" />
        <Text style={[styles.countdown, muted && styles.countdownMuted]}>{countdownLabel(daysRemaining)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: spacing.md,
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
  section: {
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    ...typography.title3,
    color: colors.textPrimary,
  },
  list: {
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
  examRowMuted: {
    opacity: 0.6,
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
    gap: spacing.xxs,
  },
  examSubject: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
  examTitle: {
    ...typography.body,
    color: colors.textPrimary,
  },
  examMeta: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  countdown: {
    ...typography.caption1,
    color: colors.accent,
  },
  countdownMuted: {
    color: colors.textTertiary,
  },
  sheetTitle: {
    ...typography.title3,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  subjectList: {
    gap: spacing.xs,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  subjectLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
});
