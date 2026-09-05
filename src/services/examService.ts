import { Exam, ExamPace, ExamReadiness, ExamType, ID, ISODateString } from '@/types';
import { generateId } from '@/utils';
import { contentService } from './contentService';
import { sessionService } from './sessionService';
import { STORAGE_KEYS, storage } from './storage';

const DAY_MS = 1000 * 60 * 60 * 24;

/**
 * Rough estimate of total study effort (in minutes) to go from 0% to 100%
 * prepared for one exam. There's no real signal for this in a mock app, so
 * it's a flat, documented heuristic rather than invented precision.
 */
const ESTIMATED_MINUTES_TO_FULLY_PREPARE = 600;

async function readAll(): Promise<Exam[]> {
  return (await storage.get<Exam[]>(STORAGE_KEYS.exams)) ?? [];
}
async function writeAll(exams: Exam[]): Promise<void> {
  await storage.set(STORAGE_KEYS.exams, exams);
}

async function listBySubject(subjectId: ID): Promise<Exam[]> {
  const exams = (await readAll()).filter((exam) => exam.subjectId === subjectId);
  return exams.sort((a, b) => (a.date < b.date ? 1 : -1));
}

async function listAll(): Promise<Exam[]> {
  const exams = await readAll();
  return exams.sort((a, b) => (a.date < b.date ? 1 : -1));
}

async function get(id: ID): Promise<Exam | null> {
  const exams = await readAll();
  return exams.find((exam) => exam.id === id) ?? null;
}

interface ExamInput {
  title: string;
  type: ExamType;
  date: ISODateString;
}

async function add(subjectId: ID, input: ExamInput): Promise<Exam> {
  const exams = await readAll();
  const now = new Date().toISOString();
  const exam: Exam = {
    id: generateId('exam'),
    subjectId,
    title: input.title.trim(),
    type: input.type,
    date: input.date,
    topicIds: [],
    createdAt: now,
    updatedAt: now,
  };
  await writeAll([...exams, exam]);
  return exam;
}

async function update(id: ID, patch: Partial<ExamInput>): Promise<Exam[]> {
  const exams = await readAll();
  const next = exams.map((exam) =>
    exam.id === id
      ? {
          ...exam,
          title: patch.title?.trim() ?? exam.title,
          type: patch.type ?? exam.type,
          date: patch.date ?? exam.date,
          updatedAt: new Date().toISOString(),
        }
      : exam,
  );
  await writeAll(next);
  return next;
}

async function setTopics(id: ID, topicIds: ID[]): Promise<Exam[]> {
  const exams = await readAll();
  const next = exams.map((exam) => (exam.id === id ? { ...exam, topicIds, updatedAt: new Date().toISOString() } : exam));
  await writeAll(next);
  return next;
}

async function attachMaterial(id: ID, materialFileId: ID): Promise<Exam[]> {
  const exams = await readAll();
  const next = exams.map((exam) =>
    exam.id === id ? { ...exam, materialFileId, updatedAt: new Date().toISOString() } : exam,
  );
  await writeAll(next);
  return next;
}

async function remove(id: ID): Promise<void> {
  const exams = await readAll();
  await writeAll(exams.filter((exam) => exam.id !== id));
}

/**
 * Countdown + how prepared the learner is + the pace needed vs. their actual
 * recent pace. `subjectProgressFallback` (the subject's overall progress) is
 * used only when the exam has no contents linked yet.
 */
async function getReadiness(exam: Exam, subjectProgressFallback: number): Promise<ExamReadiness> {
  const now = new Date();
  const examDate = new Date(exam.date);
  const daysRemaining = Math.ceil((examDate.getTime() - now.getTime()) / DAY_MS);

  let percentPrepared = subjectProgressFallback;
  if (exam.topicIds.length > 0) {
    const topics = await contentService.listBySubject(exam.subjectId);
    const relevant = topics.filter((topic) => exam.topicIds.includes(topic.id));
    if (relevant.length > 0) {
      percentPrepared = relevant.reduce((sum, topic) => sum + topic.progress, 0) / relevant.length;
    }
  }

  const sessions = await sessionService.listBySubject(exam.subjectId);
  const sevenDaysAgo = now.getTime() - 7 * DAY_MS;
  const recentSessions = sessions.filter((session) => new Date(session.date).getTime() >= sevenDaysAgo);
  const currentPacePerDay = recentSessions.reduce((sum, session) => sum + session.durationSeconds, 0) / 60 / 7;

  const remainingMinutes = (1 - percentPrepared) * ESTIMATED_MINUTES_TO_FULLY_PREPARE;
  const requiredPacePerDay = daysRemaining > 0 ? remainingMinutes / daysRemaining : remainingMinutes;

  let pace: ExamPace;
  if (percentPrepared >= 1) {
    pace = 'ahead';
  } else if (requiredPacePerDay <= 0 || currentPacePerDay >= requiredPacePerDay * 1.1) {
    pace = 'ahead';
  } else if (currentPacePerDay >= requiredPacePerDay * 0.8) {
    pace = 'on-track';
  } else {
    pace = 'behind';
  }

  return {
    examId: exam.id,
    daysRemaining,
    percentPrepared,
    requiredPacePerDay: Math.round(requiredPacePerDay),
    currentPacePerDay: Math.round(currentPacePerDay),
    pace,
  };
}

export const examService = {
  listBySubject,
  listAll,
  get,
  add,
  update,
  setTopics,
  attachMaterial,
  remove,
  getReadiness,
};
