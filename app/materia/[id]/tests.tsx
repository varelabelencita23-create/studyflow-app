import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge, BottomSheet, Button, Card, EmptyState, Icon, SkeletonCard } from '@/components/ui';
import { Screen } from '@/components/ui/Screen';
import { useToast } from '@/hooks/useToast';
import { quizService } from '@/services';
import { useAppState } from '@/store';
import { colors, radius, spacing, typography } from '@/theme';
import { Difficulty, Quiz, QuizAttempt } from '@/types';

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'Fácil',
  medium: 'Media',
  hard: 'Difícil',
};

interface QuizRow {
  quiz: Quiz;
  lastAttempt: QuizAttempt | null;
}

export default function TestsDashboardScreen() {
  const router = useRouter();
  const { id: subjectId } = useLocalSearchParams<{ id: string }>();
  const { subjects } = useAppState();
  const { show } = useToast();

  const subject = subjects.find((item) => item.id === subjectId);
  const [rows, setRows] = useState<QuizRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);

  const load = useCallback(async () => {
    if (!subjectId) return;
    const quizzes = await quizService.listQuizzesBySubject(subjectId);
    const withAttempts = await Promise.all(
      quizzes.map(async (quiz) => {
        const attempts = await quizService.listAttemptsByQuiz(quiz.id);
        return { quiz, lastAttempt: attempts[0] ?? null };
      }),
    );
    setRows(withAttempts);
    setIsLoading(false);
  }, [subjectId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!subject) {
    return (
      <Screen edges={['top', 'bottom']}>
        <HeaderBar onBack={() => router.back()} />
        <Text style={styles.notFound}>No encontramos esta materia.</Text>
      </Screen>
    );
  }

  const handleOpenQuiz = (quiz: Quiz) => {
    if (quiz.questionIds.length === 0) {
      show('Este test todavía no tiene preguntas', 'default');
      return;
    }
    router.push(`/materia/${subjectId}/tests/${quiz.id}/realizar`);
  };

  const handleDeleteQuiz = async () => {
    if (!quizToDelete) return;
    await quizService.removeQuiz(quizToDelete.id);
    setQuizToDelete(null);
    show('Test eliminado', 'default');
    load();
  };

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <HeaderBar onBack={() => router.back()} />

      <Text style={styles.title}>Tests</Text>
      <Text style={styles.subtitle}>{subject.name}</Text>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Mis tests</Text>
        <Button label="Crear test" variant="ghost" size="sm" icon="add" onPress={() => router.push(`/materia/${subjectId}/tests/crear`)} />
      </View>

      {isLoading ? (
        <View style={styles.quizList}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : rows.length === 0 ? (
        <EmptyState
          icon="checkbox-outline"
          title="Todavía no creaste ningún test"
          description="Generá preguntas a partir de tus contenidos o creálas manualmente."
          actionLabel="Crear test"
          onAction={() => router.push(`/materia/${subjectId}/tests/crear`)}
        />
      ) : (
        <View style={styles.quizList}>
          {rows.map(({ quiz, lastAttempt }) => (
            <Card key={quiz.id} variant="surface" onPress={() => handleOpenQuiz(quiz)}>
              <View style={styles.quizRow}>
                <View style={styles.quizIcon}>
                  <Icon name="checkbox-outline" size={18} color={colors.accent} />
                </View>
                <View style={styles.quizInfo}>
                  <Text style={styles.quizName} numberOfLines={1}>{quiz.name}</Text>
                  <View style={styles.quizMeta}>
                    <Badge label={DIFFICULTY_LABEL[quiz.difficulty]} variant="neutral" />
                    <Text style={styles.quizCount}>{quiz.questionIds.length} preguntas</Text>
                    {lastAttempt && (
                      <Text style={styles.quizScore}>
                        · último: {lastAttempt.correctCount}/{lastAttempt.totalCount}
                      </Text>
                    )}
                  </View>
                </View>
                <Pressable hitSlop={8} onPress={() => setQuizToDelete(quiz)} style={styles.quizDelete}>
                  <Icon name="trash-outline" size={16} color={colors.textTertiary} />
                </Pressable>
              </View>
            </Card>
          ))}
        </View>
      )}

      <BottomSheet visible={!!quizToDelete} onClose={() => setQuizToDelete(null)}>
        <Text style={styles.sheetTitle}>¿Eliminar "{quizToDelete?.name}"?</Text>
        <Text style={styles.sheetSubtitle}>Se van a borrar todas sus preguntas e intentos.</Text>
        <Button label="Eliminar test" variant="destructive" fullWidth onPress={handleDeleteQuiz} style={styles.deleteButton} />
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
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.title3,
    color: colors.textPrimary,
  },
  quizList: {
    gap: spacing.md,
  },
  quizRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  quizIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quizInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  quizName: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  quizMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  quizCount: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
  quizScore: {
    ...typography.footnote,
    color: colors.textTertiary,
  },
  quizDelete: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    ...typography.title3,
    color: colors.textPrimary,
  },
  sheetSubtitle: {
    ...typography.subheadline,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
  deleteButton: {
    marginTop: spacing.xl,
  },
});
