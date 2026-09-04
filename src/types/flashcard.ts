import { Difficulty, ID, ISODateString, Timestamped } from './common';

export type FlashcardMastery = 'new' | 'learning' | 'mastered';

export interface Flashcard extends Timestamped {
  id: ID;
  deckId: ID;
  contentId?: ID;
  question: string;
  answer: string;
  mastery: FlashcardMastery;
  timesReviewed: number;
  lastReviewedAt?: ISODateString;
}

export interface FlashcardDeck extends Timestamped {
  id: ID;
  subjectId: ID;
  name: string;
  difficulty: Difficulty;
  cardIds: ID[];
  /** True when cards were produced by the (future) AI generation pipeline. */
  generated: boolean;
}
