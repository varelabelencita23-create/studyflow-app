import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Icon } from '@/components/ui';
import { Screen } from '@/components/ui/Screen';
import { flashcardService } from '@/services';
import { colors, radius, spacing, typography } from '@/theme';
import { Flashcard } from '@/types';

export default function EstudiarMazoScreen() {
  const router = useRouter();
  const { deckId } = useLocalSearchParams<{ id: string; deckId: string }>();

  const [cards, setCards] = useState<Flashcard[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [tally, setTally] = useState({ unknown: 0, known: 0, mastered: 0 });

  useEffect(() => {
    if (!deckId) return;
    flashcardService.listCardsByDeck(deckId).then(setCards);
  }, [deckId]);

  if (!cards) return null;

  if (cards.length === 0) {
    return (
      <Screen edges={['top', 'bottom']}>
        <HeaderBar onClose={() => router.back()} />
        <Text style={styles.emptyHint}>Este mazo no tiene tarjetas.</Text>
      </Screen>
    );
  }

  const isFinished = currentIndex >= cards.length;

  const handleAnswer = async (outcome: 'unknown' | 'known' | 'mastered') => {
    const card = cards[currentIndex];
    await flashcardService.reviewCard(card.id, outcome);
    setTally((current) => ({ ...current, [outcome]: current[outcome] + 1 }));
    setShowAnswer(false);
    setCurrentIndex((current) => current + 1);
  };

  if (isFinished) {
    return (
      <Screen edges={['top', 'bottom']} contentContainerStyle={styles.finishedContainer}>
        <View style={styles.finishedContent}>
          <View style={styles.finishedIcon}>
            <Icon name="checkmark-circle" size={44} color={colors.success} />
          </View>
          <Text style={styles.finishedTitle}>¡Repaso completado!</Text>
          <Text style={styles.finishedSubtitle}>Revisaste {cards.length} tarjetas.</Text>

          <View style={styles.tallyRow}>
            <TallyTile label="Dominadas" value={tally.mastered} />
            <TallyTile label="Las sabía" value={tally.known} />
            <TallyTile label="No las sabía" value={tally.unknown} />
          </View>
        </View>
        <Button label="Volver" size="lg" fullWidth onPress={() => router.back()} />
      </Screen>
    );
  }

  const card = cards[currentIndex];

  return (
    <Screen edges={['top', 'bottom']} contentContainerStyle={styles.container}>
      <HeaderBar onClose={() => router.back()} />
      <Text style={styles.progressLabel}>Carta {currentIndex + 1}/{cards.length}</Text>

      <View style={styles.cardWrapper}>
        <Card variant="elevated" style={styles.card}>
          <Text style={styles.cardEyebrow}>{showAnswer ? 'Respuesta' : 'Pregunta'}</Text>
          <Text style={styles.cardText}>{showAnswer ? card.answer : card.question}</Text>
        </Card>
      </View>

      {!showAnswer ? (
        <Button label="Mostrar respuesta" size="lg" fullWidth onPress={() => setShowAnswer(true)} />
      ) : (
        <View style={styles.answerActions}>
          <Button label="No la sabía" variant="destructive" fullWidth onPress={() => handleAnswer('unknown')} />
          <Button label="La sabía" variant="secondary" fullWidth onPress={() => handleAnswer('known')} />
          <Button label="La dominé" fullWidth onPress={() => handleAnswer('mastered')} />
        </View>
      )}
    </Screen>
  );
}

function TallyTile({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.tallyTile}>
      <Text style={styles.tallyValue}>{value}</Text>
      <Text style={styles.tallyLabel}>{label}</Text>
    </View>
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
  cardWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    minHeight: 240,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xxl,
  },
  cardEyebrow: {
    ...typography.caption1,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  cardText: {
    ...typography.title2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  answerActions: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  finishedContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: spacing.massive,
    paddingBottom: spacing.xl,
  },
  finishedContent: {
    alignItems: 'center',
    gap: spacing.sm,
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
  finishedTitle: {
    ...typography.title1,
    color: colors.textPrimary,
  },
  finishedSubtitle: {
    ...typography.subheadline,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  tallyRow: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  tallyTile: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xxs,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  tallyValue: {
    ...typography.title2,
    color: colors.textPrimary,
  },
  tallyLabel: {
    ...typography.caption1,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
