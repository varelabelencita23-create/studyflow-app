import { getCurrentUserId, supabase } from '@/lib/supabase';
import { Difficulty, Flashcard, FlashcardDeck, FlashcardMastery, ID } from '@/types';

interface DeckRow {
  id: string;
  subject_id: string;
  name: string;
  difficulty: Difficulty;
  generated: boolean;
  created_at: string;
  updated_at: string;
}

interface CardRow {
  id: string;
  deck_id: string;
  content_id: string | null;
  question: string;
  answer: string;
  mastery: FlashcardMastery;
  times_reviewed: number;
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapDeck(row: DeckRow, cardIds: ID[]): FlashcardDeck {
  return {
    id: row.id,
    subjectId: row.subject_id,
    name: row.name,
    difficulty: row.difficulty,
    cardIds,
    generated: row.generated,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCard(row: CardRow): Flashcard {
  return {
    id: row.id,
    deckId: row.deck_id,
    contentId: row.content_id ?? undefined,
    question: row.question,
    answer: row.answer,
    mastery: row.mastery,
    timesReviewed: row.times_reviewed,
    lastReviewedAt: row.last_reviewed_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listCardsByDeck(deckId: ID): Promise<Flashcard[]> {
  const { data, error } = await supabase.from('flashcards').select('*').eq('deck_id', deckId);
  if (error) throw error;
  return (data as CardRow[]).map(mapCard);
}

async function listDecksBySubject(subjectId: ID): Promise<FlashcardDeck[]> {
  const { data, error } = await supabase
    .from('flashcard_decks')
    .select('*, flashcards(id)')
    .eq('subject_id', subjectId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as (DeckRow & { flashcards: { id: string }[] })[]).map((row) =>
    mapDeck(row, row.flashcards.map((card) => card.id)),
  );
}

interface DeckInput {
  name: string;
  difficulty: Difficulty;
  generated: boolean;
}

async function addDeck(subjectId: ID, input: DeckInput): Promise<FlashcardDeck> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('flashcard_decks')
    .insert({
      user_id: userId,
      subject_id: subjectId,
      name: input.name.trim(),
      difficulty: input.difficulty,
      generated: input.generated,
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapDeck(data as DeckRow, []);
}

async function removeDeck(deckId: ID): Promise<void> {
  const { error } = await supabase.from('flashcard_decks').delete().eq('id', deckId);
  if (error) throw error;
}

interface CardInput {
  question: string;
  answer: string;
  contentId?: ID;
}

async function addCard(deckId: ID, input: CardInput): Promise<Flashcard> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('flashcards')
    .insert({
      user_id: userId,
      deck_id: deckId,
      content_id: input.contentId ?? null,
      question: input.question.trim(),
      answer: input.answer.trim(),
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapCard(data as CardRow);
}

async function addCardsBulk(deckId: ID, inputs: CardInput[]): Promise<Flashcard[]> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('flashcards')
    .insert(
      inputs.map((input) => ({
        user_id: userId,
        deck_id: deckId,
        content_id: input.contentId ?? null,
        question: input.question.trim(),
        answer: input.answer.trim(),
      })),
    )
    .select('*');
  if (error) throw error;
  return (data as CardRow[]).map(mapCard);
}

type ReviewOutcome = 'unknown' | 'known' | 'mastered';

const OUTCOME_TO_MASTERY: Record<ReviewOutcome, FlashcardMastery> = {
  unknown: 'new',
  known: 'learning',
  mastered: 'mastered',
};

async function reviewCard(cardId: ID, outcome: ReviewOutcome): Promise<Flashcard[]> {
  const { data: current, error: readError } = await supabase
    .from('flashcards')
    .select('deck_id, times_reviewed')
    .eq('id', cardId)
    .single();
  if (readError) throw readError;

  // Supabase JS has no atomic "increment" helper without a database RPC
  // function, so this reads-then-writes `times_reviewed` — safe here since a
  // learner reviews their own card serially, never concurrently with themselves.
  const { error } = await supabase
    .from('flashcards')
    .update({
      mastery: OUTCOME_TO_MASTERY[outcome],
      times_reviewed: current.times_reviewed + 1,
      last_reviewed_at: new Date().toISOString(),
    })
    .eq('id', cardId);
  if (error) throw error;

  return listCardsByDeck(current.deck_id);
}

interface SubjectFlashcardStats {
  total: number;
  mastered: number;
  learning: number;
  pending: number;
}

async function getSubjectStats(subjectId: ID): Promise<SubjectFlashcardStats> {
  const decks = await listDecksBySubject(subjectId);
  const deckIds = decks.map((deck) => deck.id);
  if (deckIds.length === 0) {
    return { total: 0, mastered: 0, learning: 0, pending: 0 };
  }
  const { data, error } = await supabase.from('flashcards').select('mastery').in('deck_id', deckIds);
  if (error) throw error;
  const cards = data as { mastery: FlashcardMastery }[];
  return {
    total: cards.length,
    mastered: cards.filter((card) => card.mastery === 'mastered').length,
    learning: cards.filter((card) => card.mastery === 'learning').length,
    pending: cards.filter((card) => card.mastery === 'new').length,
  };
}

/**
 * Mock "generation": produces plausible question/answer pairs from content
 * titles so the deck feels real without a live model. Swap this function's
 * body for a real call (e.g. the Claude API) later — callers already treat
 * its output as a plain `{question, answer, contentId}[]`, so no other code
 * needs to change.
 */
function generateMockCards(
  topics: { id: ID; title: string }[],
  count: number,
): { question: string; answer: string; contentId: ID }[] {
  if (topics.length === 0) return [];
  const cards: { question: string; answer: string; contentId: ID }[] = [];
  for (let i = 0; i < count; i++) {
    const topic = topics[i % topics.length];
    cards.push({
      question: `¿Qué podés explicar sobre "${topic.title}"?`,
      answer: `Repasá tus apuntes y contenidos de "${topic.title}" para completar esta respuesta.`,
      contentId: topic.id,
    });
  }
  return cards;
}

export const flashcardService = {
  listDecksBySubject,
  listCardsByDeck,
  addDeck,
  removeDeck,
  addCard,
  addCardsBulk,
  reviewCard,
  getSubjectStats,
  generateMockCards,
};
