import { getCurrentUserId, supabase } from '@/lib/supabase';
import { Difficulty, ID, Quiz, QuizAttempt, QuizQuestion } from '@/types';

interface QuizRow {
  id: string;
  subject_id: string;
  name: string;
  difficulty: Difficulty;
  created_at: string;
  updated_at: string;
}

interface QuestionRow {
  id: string;
  quiz_id: string;
  content_id: string | null;
  prompt: string;
  options: string[];
  correct_option_index: number;
}

interface AttemptRow {
  id: string;
  quiz_id: string;
  date: string;
  correct_count: number;
  total_count: number;
  answer_index_by_question_id: Record<string, number>;
}

function mapQuiz(row: QuizRow, questionIds: ID[]): Quiz {
  return {
    id: row.id,
    subjectId: row.subject_id,
    name: row.name,
    difficulty: row.difficulty,
    questionIds,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapQuestion(row: QuestionRow): QuizQuestion {
  return {
    id: row.id,
    quizId: row.quiz_id,
    contentId: row.content_id ?? undefined,
    prompt: row.prompt,
    options: row.options,
    correctOptionIndex: row.correct_option_index,
  };
}

function mapAttempt(row: AttemptRow): QuizAttempt {
  return {
    id: row.id,
    quizId: row.quiz_id,
    date: row.date,
    correctCount: row.correct_count,
    totalCount: row.total_count,
    answerIndexByQuestionId: row.answer_index_by_question_id,
  };
}

async function listQuizzesBySubject(subjectId: ID): Promise<Quiz[]> {
  const { data, error } = await supabase
    .from('quizzes')
    .select('*, quiz_questions(id)')
    .eq('subject_id', subjectId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as (QuizRow & { quiz_questions: { id: string }[] })[]).map((row) =>
    mapQuiz(row, row.quiz_questions.map((question) => question.id)),
  );
}

async function listQuestionsByQuiz(quizId: ID): Promise<QuizQuestion[]> {
  const { data, error } = await supabase.from('quiz_questions').select('*').eq('quiz_id', quizId);
  if (error) throw error;
  return (data as QuestionRow[]).map(mapQuestion);
}

interface QuizInput {
  name: string;
  difficulty: Difficulty;
}

async function addQuiz(subjectId: ID, input: QuizInput): Promise<Quiz> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('quizzes')
    .insert({ user_id: userId, subject_id: subjectId, name: input.name.trim(), difficulty: input.difficulty })
    .select('*')
    .single();
  if (error) throw error;
  return mapQuiz(data as QuizRow, []);
}

async function removeQuiz(quizId: ID): Promise<void> {
  const { error } = await supabase.from('quizzes').delete().eq('id', quizId);
  if (error) throw error;
}

interface QuestionInput {
  prompt: string;
  options: string[];
  correctOptionIndex: number;
  contentId?: ID;
}

async function addQuestion(quizId: ID, input: QuestionInput): Promise<QuizQuestion> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('quiz_questions')
    .insert({
      user_id: userId,
      quiz_id: quizId,
      content_id: input.contentId ?? null,
      prompt: input.prompt.trim(),
      options: input.options,
      correct_option_index: input.correctOptionIndex,
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapQuestion(data as QuestionRow);
}

async function addQuestionsBulk(quizId: ID, inputs: QuestionInput[]): Promise<QuizQuestion[]> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('quiz_questions')
    .insert(
      inputs.map((input) => ({
        user_id: userId,
        quiz_id: quizId,
        content_id: input.contentId ?? null,
        prompt: input.prompt.trim(),
        options: input.options,
        correct_option_index: input.correctOptionIndex,
      })),
    )
    .select('*');
  if (error) throw error;
  return (data as QuestionRow[]).map(mapQuestion);
}

async function removeQuestion(id: ID): Promise<void> {
  const { error } = await supabase.from('quiz_questions').delete().eq('id', id);
  if (error) throw error;
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
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('quiz_attempts')
    .insert({
      user_id: userId,
      quiz_id: quizId,
      correct_count: input.correctCount,
      total_count: input.totalCount,
      answer_index_by_question_id: input.answerIndexByQuestionId,
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapAttempt(data as AttemptRow);
}

async function listAttemptsByQuiz(quizId: ID): Promise<QuizAttempt[]> {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('quiz_id', quizId)
    .order('date', { ascending: false });
  if (error) throw error;
  return (data as AttemptRow[]).map(mapAttempt);
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
