import { Difficulty, ID, ISODateString, Timestamped } from './common';

export interface QuizQuestion {
  id: ID;
  quizId: ID;
  contentId?: ID;
  prompt: string;
  options: string[];
  correctOptionIndex: number;
}

export interface Quiz extends Timestamped {
  id: ID;
  subjectId: ID;
  name: string;
  difficulty: Difficulty;
  questionIds: ID[];
}

export interface QuizAttempt {
  id: ID;
  quizId: ID;
  date: ISODateString;
  correctCount: number;
  totalCount: number;
  answerIndexByQuestionId: Record<ID, number>;
}
