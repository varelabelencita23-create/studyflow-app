import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Icon } from '@/components/ui';
import { Screen } from '@/components/ui/Screen';
import { quizService } from '@/services';
import { colors, radius, spacing, typography } from '@/theme';
import { ID, QuizQuestion } from '@/types';

export default function RealizarTestScreen() {
  const router = useRouter();
  const { quizId } = useLocalSearchParams<{ id: string; quizId: string }>();

  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<ID, number>>({});
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!quizId) return;
    quizService.listQuestionsByQuiz(quizId).then(setQuestions);
  }, [quizId]);

  if (!questions) return null;

  if (questions.length === 0) {
    return (
      <Screen edges={['top', 'bottom']}>
        <HeaderBar onClose={() => router.back()} />
        <Text style={styles.emptyHint}>Este test no tiene preguntas.</Text>
      </Screen>
    );
  }

  const correctCount = questions.reduce((total, question) => (answers[question.id] === question.correctOptionIndex ? total + 1 : total), 0);

  if (finished) {
    const wrongQuestions = questions.filter((question) => answers[question.id] !== question.correctOptionIndex);
    const percentage = Math.round((correctCount / questions.length) * 100);

    return (
      <Screen scroll edges={['top', 'bottom']} contentContainerStyle={styles.finishedContainer}>
        <View style={styles.finishedContent}>
          <View style={[styles.finishedIcon, percentage < 60 && styles.finishedIconWarning]}>
            <Icon
              name={percentage >= 60 ? 'checkmark-circle' : 'alert-circle'}
              size={44}
              color={percentage >= 60 ? colors.success : colors.warning}
            />
          </View>
          <Text style={styles.finishedTitle}>¡Test completado!</Text>
          <Text style={styles.finishedScore}>{correctCount}/{questions.length}</Text>
          <Text style={styles.finishedSubtitle}>{percentage}% de respuestas correctas</Text>

          {wrongQuestions.length > 0 && (
            <View style={styles.reviewSection}>
              <Text style={styles.reviewTitle}>Repasar errores</Text>
              <View style={styles.reviewList}>
                {wrongQuestions.map((question) => (
                  <Card key={question.id} variant="surface" style={styles.reviewCard}>
                    <Text style={styles.reviewPrompt}>{question.prompt}</Text>
                    <View style={styles.reviewAnswerRow}>
                      <Icon name="close-circle" size={14} color={colors.danger} />
                      <Text style={styles.reviewAnswerWrong}>
                        {answers[question.id] !== undefined ? question.options[answers[question.id]] : 'Sin responder'}
                      </Text>
                    </View>
                    <View style={styles.reviewAnswerRow}>
                      <Icon name="checkmark-circle" size={14} color={colors.success} />
                      <Text style={styles.reviewAnswerCorrect}>{question.options[question.correctOptionIndex]}</Text>
                    </View>
                  </Card>
                ))}
              </View>
            </View>
          )}
        </View>
        <Button label="Volver" size="lg" fullWidth loading={saving} onPress={() => router.back()} style={styles.doneButton} />
      </Screen>
    );
  }

  const question = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  const handleSelectOption = (optionIndex: number) => {
    if (selectedIndex !== null) return;
    setSelectedIndex(optionIndex);
    setAnswers((current) => ({ ...current, [question.id]: optionIndex }));
  };

  const handleNext = async () => {
    if (selectedIndex === null) return;
    if (!isLast) {
      setSelectedIndex(null);
      setCurrentIndex((current) => current + 1);
      return;
    }
    setSaving(true);
    try {
      const finalCorrectCount = questions.reduce(
        (total, item) => (answers[item.id] === item.correctOptionIndex ? total + 1 : total),
        0,
      );
      await quizService.recordAttempt(quizId, {
        correctCount: finalCorrectCount,
        totalCount: questions.length,
        answerIndexByQuestionId: answers,
      });
      setFinished(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']} contentContainerStyle={styles.container}>
      <HeaderBar onClose={() => router.back()} />
      <Text style={styles.progressLabel}>Pregunta {currentIndex + 1}/{questions.length}</Text>

      <View style={styles.questionWrapper}>
        <Card variant="elevated" style={styles.questionCard}>
          <Text style={styles.questionText}>{question.prompt}</Text>
        </Card>

        <View style={styles.optionsList}>
          {question.options.map((option, index) => {
            const isSelected = selectedIndex === index;
            const isCorrectOption = index === question.correctOptionIndex;
            const showFeedback = selectedIndex !== null;

            return (
              <Pressable
                key={index}
                onPress={() => handleSelectOption(index)}
                style={[
                  styles.optionRow,
                  showFeedback && isCorrectOption && styles.optionRowCorrect,
                  showFeedback && isSelected && !isCorrectOption && styles.optionRowWrong,
                ]}
                disabled={selectedIndex !== null}
              >
                <Text style={styles.optionText}>{option}</Text>
                {showFeedback && isCorrectOption && <Icon name="checkmark-circle" size={18} color={colors.success} />}
                {showFeedback && isSelected && !isCorrectOption && <Icon name="close-circle" size={18} color={colors.danger} />}
              </Pressable>
            );
          })}
        </View>
      </View>

      <Button
        label={isLast ? 'Terminar test' : 'Siguiente'}
        size="lg"
        fullWidth
        disabled={selectedIndex === null}
        loading={saving}
        onPress={handleNext}
      />
    </Screen>
  );
}

function HeaderBar({ onClose }: { onClose: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable hitSlop={12} onPress={onClose} style={styles.closeButton}>
        <Icon name="close" size={20} color={colors.textPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.surface,
  },
  emptyHint: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xl,
  },
  progressLabel: {
    ...typography.footnote,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  questionWrapper: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xl,
  },
  questionCard: {
    minHeight: 140,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  questionText: {
    ...typography.title3,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  optionsList: {
    gap: spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionRowCorrect: {
    backgroundColor: colors.successSubtle,
    borderColor: colors.success,
  },
  optionRowWrong: {
    backgroundColor: colors.dangerSubtle,
    borderColor: colors.danger,
  },
  optionText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.md,
  },
  finishedContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingTop: spacing.massive,
    paddingBottom: spacing.xl,
  },
  finishedContent: {
    alignItems: 'center',
    gap: spacing.xxs,
  },
  finishedIcon: {
    width: 80,
    height: 80,
    borderRadius: radius.xxl,
    backgroundColor: colors.successSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  finishedIconWarning: {
    backgroundColor: colors.warningSubtle,
  },
  finishedTitle: {
    ...typography.title1,
    color: colors.textPrimary,
  },
  finishedScore: {
    ...typography.largeTitle,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  finishedSubtitle: {
    ...typography.subheadline,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  reviewSection: {
    width: '100%',
    gap: spacing.md,
  },
  reviewTitle: {
    ...typography.title3,
    color: colors.textPrimary,
    alignSelf: 'flex-start',
  },
  reviewList: {
    gap: spacing.sm,
    width: '100%',
  },
  reviewCard: {
    gap: spacing.xs,
  },
  reviewPrompt: {
    ...typography.subheadline,
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  reviewAnswerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  reviewAnswerWrong: {
    ...typography.footnote,
    color: colors.textSecondary,
    flex: 1,
  },
  reviewAnswerCorrect: {
    ...typography.footnote,
    color: colors.textSecondary,
    flex: 1,
  },
  doneButton: {
    marginTop: spacing.xl,
  },
});
