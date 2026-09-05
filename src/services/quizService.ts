import { Difficulty, ID, Quiz, QuizAttempt, QuizQuestion } from '@/types';
import { generateId } from '@/utils';
import { STORAGE_KEYS, storage } from './storage';

async function readQuizzes(): Promise<Quiz[]> {
  return (await storage.get<Quiz[]>(STORAGE_KEYS.quizzes)) ?? [];
}
async function writeQuizzes(quizzes: Quiz[]): Promise<void> {
  await storage.set(STORAGE_KEYS.quizzes, quizzes);
}
async function readQuestions(): Promise<QuizQuestion[]> {
  return (await storage.get<QuizQuestion[]>(STORAGE_KEYS.quizQuestions)) ?? [];
}
async function writeQuestions(questions: QuizQuestion[]): Promise<void> {
  await storage.set(STORAGE_KEYS.quizQuestions, questions);
}
async function readAttempts(): Promise<QuizAttempt[]> {
  return (await storage.get<QuizAttempt[]>(STORAGE_KEYS.quizAttempts)) ?? [];
}
async function writeAttempts(attempts: QuizAttempt[]): Promise<void> {
  await storage.set(STORAGE_KEYS.quizAttempts, attempts);
}

async function listQuizzesBySubject(subjectId: ID): Promise<Quiz[]> {
  const [quizzes, questions] = await Promise.all([readQuizzes(), readQuestions()]);
  return quizzes
    .filter((quiz) => quiz.subjectId === subjectId)
    .map((quiz) => ({ ...quiz, questionIds: questions.filter((q) => q.quizId === quiz.id).map((q) => q.id) }));
}

async function listQuestionsByQuiz(quizId: ID): Promise<QuizQuestion[]> {
  return (await readQuestions()).filter((question) => question.quizId === quizId);
}

interface QuizInput {
  name: string;
  difficulty: Difficulty;
}

async function addQuiz(subjectId: ID, input: QuizInput): Promise<Quiz> {
  const quizzes = await readQuizzes();
  const now = new Date().toISOString();
  const quiz: Quiz = {
    id: generateId('quiz'),
    subjectId,
    name: input.name.trim(),
    difficulty: input.difficulty,
    questionIds: [],
    createdAt: now,
    updatedAt: now,
  };
  await writeQuizzes([...quizzes, quiz]);
  return quiz;
}

async function removeQuiz(quizId: ID): Promise<void> {
  const [quizzes, questions, attempts] = await Promise.all([readQuizzes(), readQuestions(), readAttempts()]);
  await writeQuizzes(quizzes.filter((quiz) => quiz.id !== quizId));
  await writeQuestions(questions.filter((question) => question.quizId !== quizId));
  await writeAttempts(attempts.filter((attempt) => attempt.quizId !== quizId));
}

interface QuestionInput {
  prompt: string;
  options: string[];
  correctOptionIndex: number;
  contentId?: ID;
}

async function addQuestion(quizId: ID, input: QuestionInput): Promise<QuizQuestion> {
  const questions = await readQuestions();
  const question: QuizQuestion = {
    id: generateId('question'),
    quizId,
    contentId: input.contentId,
    prompt: input.prompt.trim(),
    options: input.options,
    correctOptionIndex: input.correctOptionIndex,
  };
  await writeQuestions([...questions, question]);
  return question;
}

async function addQuestionsBulk(quizId: ID, inputs: QuestionInput[]): Promise<QuizQuestion[]> {
  const questions = await readQuestions();
  const newQuestions: QuizQuestion[] = inputs.map((input) => ({
    id: generateId('question'),
    quizId,
    contentId: input.contentId,
    prompt: input.prompt.trim(),
    options: input.options,
    correctOptionIndex: input.correctOptionIndex,
  }));
  await writeQuestions([...questions, ...newQuestions]);
  return newQuestions;
}

async function removeQuestion(id: ID): Promise<void> {
  const questions = await readQuestions();
  await writeQuestions(questions.filter((question) => question.id !== id));
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

/**
 * Mock "generation": produces a plausible multiple-choice question per
 * content title, with the real answer shuffled among 3 filler distractors.
 * Swap this function's body for a real call (e.g. the Claude API) later —
 * callers already treat its output as a plain array of
 * `{prompt, options, correctOptionIndex, contentId}`, so nothing else changes.
 */
function generateMockQuestions(
  topics: { id: ID; title: string }[],
  count: number,
): { prompt: string; options: string[]; correctOptionIndex: number; contentId: ID }[] {
  if (topics.length === 0) return [];
  const questions: { prompt: string; options: string[]; correctOptionIndex: number; contentId: ID }[] = [];

  for (let i = 0; i < count; i++) {
    const topic = topics[i % topics.length];
    const correctLabel = `Definición correcta de "${topic.title}"`;
    const distractors = [
      `Definición de un tema no relacionado`,
      `Concepto opuesto a "${topic.title}"`,
      `Ninguna de las anteriores`,
    ];
    const options = shuffle([correctLabel, ...distractors]);
    questions.push({
      prompt: `¿Cuál de las siguientes opciones describe mejor "${topic.title}"?`,
      options,
      correctOptionIndex: options.indexOf(correctLabel),
      contentId: topic.id,
    });
  }
  return questions;
}

async function recordAttempt(
  quizId: ID,
  input: { correctCount: number; totalCount: number; answerIndexByQuestionId: Record<ID, number> },
): Promise<QuizAttempt> {
  const attempts = await readAttempts();
  const attempt: QuizAttempt = {
    id: generateId('attempt'),
    quizId,
    date: new Date().toISOString(),
    correctCount: input.correctCount,
    totalCount: input.totalCount,
    answerIndexByQuestionId: input.answerIndexByQuestionId,
  };
  await writeAttempts([...attempts, attempt]);
  return attempt;
}

async function listAttemptsByQuiz(quizId: ID): Promise<QuizAttempt[]> {
  const attempts = await readAttempts();
  return attempts.filter((attempt) => attempt.quizId === quizId).sort((a, b) => (a.date < b.date ? 1 : -1));
}

export const quizService = {
  listQuizzesBySubject,
  listQuestionsByQuiz,
  addQuiz,
  removeQuiz,
  addQuestion,
  addQuestionsBulk,
  removeQuestion,
  generateMockQuestions,
  recordAttempt,
  listAttemptsByQuiz,
};
