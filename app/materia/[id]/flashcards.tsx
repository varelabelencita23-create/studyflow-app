import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge, BottomSheet, Button, Card, EmptyState, Icon, SkeletonCard } from '@/components/ui';
import { Screen } from '@/components/ui/Screen';
import { useToast } from '@/hooks/useToast';
import { flashcardService } from '@/services';
import { useAppState } from '@/store';
import { colors, radius, spacing, typography } from '@/theme';
import { Difficulty, FlashcardDeck } from '@/types';

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'Fácil',
  medium: 'Media',
  hard: 'Difícil',
};

interface Stats {
  total: number;
  mastered: number;
  learning: number;
  pending: number;
}

export default function FlashcardsDashboardScreen() {
  const router = useRouter();
  const { id: subjectId } = useLocalSearchParams<{ id: string }>();
  const { subjects } = useAppState();
  const { show } = useToast();

  const subject = subjects.find((item) => item.id === subjectId);
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, mastered: 0, learning: 0, pending: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [deckToDelete, setDeckToDelete] = useState<FlashcardDeck | null>(null);

  const load = useCallback(async () => {
    if (!subjectId) return;
    const [deckList, statsResult] = await Promise.all([
      flashcardService.listDecksBySubject(subjectId),
      flashcardService.getSubjectStats(subjectId),
    ]);
    setDecks(deckList);
    setStats(statsResult);
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

  const handleOpenDeck = (deck: FlashcardDeck) => {
    if (deck.cardIds.length === 0) {
      show('Este mazo todavía no tiene tarjetas', 'default');
      return;
    }
    router.push(`/materia/${subjectId}/flashcards/${deck.id}/estudiar`);
  };

  const handleDeleteDeck = async () => {
    if (!deckToDelete) return;
    await flashcardService.removeDeck(deckToDelete.id);
    setDeckToDelete(null);
    show('Mazo eliminado', 'default');
    load();
  };

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <HeaderBar onBack={() => router.back()} />

      <Text style={styles.title}>Flashcards</Text>
      <Text style={styles.subtitle}>{subject.name}</Text>

      <View style={styles.statsGrid}>
        <StatTile label="Total" value={stats.total} />
        <StatTile label="Dominadas" value={stats.mastered} />
        <StatTile label="En progreso" value={stats.learning} />
        <StatTile label="Pendientes" value={stats.pending} />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Mazos</Text>
        <Button label="Crear mazo" variant="ghost" size="sm" icon="add" onPress={() => router.push(`/materia/${subjectId}/flashcards/crear`)} />
      </View>

      {isLoading ? (
        <View style={styles.deckList}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : decks.length === 0 ? (
        <EmptyState
          icon="albums-outline"
          title="Todavía no creaste ningún mazo"
          description="Generá tarjetas a partir de tus contenidos o creálas manualmente."
          actionLabel="Crear mazo"
          onAction={() => router.push(`/materia/${subjectId}/flashcards/crear`)}
        />
      ) : (
        <View style={styles.deckList}>
          {decks.map((deck) => (
            <Card key={deck.id} variant="surface" onPress={() => handleOpenDeck(deck)}>
              <View style={styles.deckRow}>
                <View style={styles.deckIcon}>
                  <Icon name="albums-outline" size={18} color={colors.accent} />
                </View>
                <View style={styles.deckInfo}>
                  <Text style={styles.deckName} numberOfLines={1}>{deck.name}</Text>
                  <View style={styles.deckMeta}>
                    <Badge label={DIFFICULTY_LABEL[deck.difficulty]} variant="neutral" />
                    <Text style={styles.deckCount}>{deck.cardIds.length} tarjetas</Text>
                  </View>
                </View>
                <Pressable hitSlop={8} onPress={() => setDeckToDelete(deck)} style={styles.deckDelete}>
                  <Icon name="trash-outline" size={16} color={colors.textTertiary} />
                </Pressable>
              </View>
            </Card>
          ))}
        </View>
      )}

      <BottomSheet visible={!!deckToDelete} onClose={() => setDeckToDelete(null)}>
        <Text style={styles.sheetTitle}>¿Eliminar "{deckToDelete?.name}"?</Text>
        <Text style={styles.sheetSubtitle}>Se van a borrar todas sus tarjetas.</Text>
        <Button label="Eliminar mazo" variant="destructive" fullWidth onPress={handleDeleteDeck} style={styles.deleteButton} />
      </BottomSheet>
    </Screen>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <Card variant="surface" style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
  title: {
    ...typography.largeTitle,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.subheadline,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xxl,
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
  deckList: {
    gap: spacing.md,
  },
  deckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  deckIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deckInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  deckName: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  deckMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  deckCount: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
  deckDelete: {
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
