import { Difficulty, Flashcard, FlashcardDeck, FlashcardMastery, ID } from '@/types';
import { generateId } from '@/utils';
import { STORAGE_KEYS, storage } from './storage';

async function readDecks(): Promise<FlashcardDeck[]> {
  return (await storage.get<FlashcardDeck[]>(STORAGE_KEYS.flashcardDecks)) ?? [];
}
async function writeDecks(decks: FlashcardDeck[]): Promise<void> {
  await storage.set(STORAGE_KEYS.flashcardDecks, decks);
}
async function readCards(): Promise<Flashcard[]> {
  return (await storage.get<Flashcard[]>(STORAGE_KEYS.flashcards)) ?? [];
}
async function writeCards(cards: Flashcard[]): Promise<void> {
  await storage.set(STORAGE_KEYS.flashcards, cards);
}

async function listDecksBySubject(subjectId: ID): Promise<FlashcardDeck[]> {
  const [decks, cards] = await Promise.all([readDecks(), readCards()]);
  return decks
    .filter((deck) => deck.subjectId === subjectId)
    .map((deck) => ({ ...deck, cardIds: cards.filter((card) => card.deckId === deck.id).map((card) => card.id) }));
}

async function listCardsByDeck(deckId: ID): Promise<Flashcard[]> {
  return (await readCards()).filter((card) => card.deckId === deckId);
}

interface DeckInput {
  name: string;
  difficulty: Difficulty;
  generated: boolean;
}

async function addDeck(subjectId: ID, input: DeckInput): Promise<FlashcardDeck> {
  const decks = await readDecks();
  const now = new Date().toISOString();
  const deck: FlashcardDeck = {
    id: generateId('deck'),
    subjectId,
    name: input.name.trim(),
    difficulty: input.difficulty,
    cardIds: [],
    generated: input.generated,
    createdAt: now,
    updatedAt: now,
  };
  await writeDecks([...decks, deck]);
  return deck;
}

async function removeDeck(deckId: ID): Promise<void> {
  const [decks, cards] = await Promise.all([readDecks(), readCards()]);
  await writeDecks(decks.filter((deck) => deck.id !== deckId));
  await writeCards(cards.filter((card) => card.deckId !== deckId));
}

interface CardInput {
  question: string;
  answer: string;
  contentId?: ID;
}

async function addCard(deckId: ID, input: CardInput): Promise<Flashcard> {
  const cards = await readCards();
  const now = new Date().toISOString();
  const card: Flashcard = {
    id: generateId('card'),
    deckId,
    contentId: input.contentId,
    question: input.question.trim(),
    answer: input.answer.trim(),
    mastery: 'new',
    timesReviewed: 0,
    createdAt: now,
    updatedAt: now,
  };
  await writeCards([...cards, card]);
  return card;
}

async function addCardsBulk(deckId: ID, inputs: CardInput[]): Promise<Flashcard[]> {
  const cards = await readCards();
  const now = new Date().toISOString();
  const newCards: Flashcard[] = inputs.map((input) => ({
    id: generateId('card'),
    deckId,
    contentId: input.contentId,
    question: input.question.trim(),
    answer: input.answer.trim(),
    mastery: 'new',
    timesReviewed: 0,
    createdAt: now,
    updatedAt: now,
  }));
  await writeCards([...cards, ...newCards]);
  return newCards;
}

type ReviewOutcome = 'unknown' | 'known' | 'mastered';

const OUTCOME_TO_MASTERY: Record<ReviewOutcome, FlashcardMastery> = {
  unknown: 'new',
  known: 'learning',
  mastered: 'mastered',
};

async function reviewCard(cardId: ID, outcome: ReviewOutcome): Promise<Flashcard[]> {
  const cards = await readCards();
  const now = new Date().toISOString();
  const next = cards.map((card) =>
    card.id === cardId
      ? { ...card, mastery: OUTCOME_TO_MASTERY[outcome], timesReviewed: card.timesReviewed + 1, lastReviewedAt: now, updatedAt: now }
      : card,
  );
  await writeCards(next);
  return next;
}

interface SubjectFlashcardStats {
  total: number;
  mastered: number;
  learning: number;
  pending: number;
}

async function getSubjectStats(subjectId: ID): Promise<SubjectFlashcardStats> {
  const decks = await listDecksBySubject(subjectId);
  const deckIds = new Set(decks.map((deck) => deck.id));
  const cards = (await readCards()).filter((card) => deckIds.has(card.deckId));
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
