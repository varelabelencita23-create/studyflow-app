import { getCurrentUserId, supabase } from '@/lib/supabase';
import { Exam, ExamPace, ExamReadiness, ExamType, ID, ISODateString } from '@/types';
import { contentService } from './contentService';
import { sessionService } from './sessionService';

const DAY_MS = 1000 * 60 * 60 * 24;

/**
 * Rough estimate of total study effort (in minutes) to go from 0% to 100%
 * prepared for one exam. There's no real per-exam signal to derive this
 * from, so it's a flat, documented heuristic rather than invented precision.
 */
const ESTIMATED_MINUTES_TO_FULLY_PREPARE = 600;

interface ExamRow {
  id: string;
  subject_id: string;
  title: string;
  type: ExamType;
  date: string;
  material_file_id: string | null;
  created_at: string;
  updated_at: string;
}

async function mapExam(row: ExamRow): Promise<Exam> {
  const { data, error } = await supabase.from('exam_topics').select('topic_id').eq('exam_id', row.id);
  if (error) throw error;
  return {
    id: row.id,
    subjectId: row.subject_id,
    title: row.title,
    type: row.type,
    date: row.date,
    topicIds: (data as { topic_id: string }[]).map((item) => item.topic_id),
    materialFileId: row.material_file_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listBySubject(subjectId: ID): Promise<Exam[]> {
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('subject_id', subjectId)
    .order('date', { ascending: false });
  if (error) throw error;
  return Promise.all((data as ExamRow[]).map(mapExam));
}

async function listAll(): Promise<Exam[]> {
  const { data, error } = await supabase.from('exams').select('*').order('date', { ascending: false });
  if (error) throw error;
  return Promise.all((data as ExamRow[]).map(mapExam));
}

async function get(id: ID): Promise<Exam | null> {
  const { data, error } = await supabase.from('exams').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapExam(data as ExamRow) : null;
}

interface ExamInput {
  title: string;
  type: ExamType;
  date: ISODateString;
}

async function add(subjectId: ID, input: ExamInput): Promise<Exam> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('exams')
    .insert({ user_id: userId, subject_id: subjectId, title: input.title.trim(), type: input.type, date: input.date })
    .select('*')
    .single();
  if (error) throw error;
  return mapExam(data as ExamRow);
}

async function update(id: ID, patch: Partial<ExamInput>): Promise<Exam[]> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.title !== undefined) dbPatch.title = patch.title.trim();
  if (patch.type !== undefined) dbPatch.type = patch.type;
  if (patch.date !== undefined) dbPatch.date = patch.date;

  const { data: current, error: readError } = await supabase.from('exams').select('subject_id').eq('id', id).single();
  if (readError) throw readError;

  const { error } = await supabase.from('exams').update(dbPatch).eq('id', id);
  if (error) throw error;
  return listBySubject(current.subject_id);
}

async function setTopics(id: ID, topicIds: ID[]): Promise<Exam[]> {
  const userId = await getCurrentUserId();
  const { data: current, error: readError } = await supabase.from('exams').select('subject_id').eq('id', id).single();
  if (readError) throw readError;

  const { error: deleteError } = await supabase.from('exam_topics').delete().eq('exam_id', id);
  if (deleteError) throw deleteError;

  if (topicIds.length > 0) {
    const { error: insertError } = await supabase
      .from('exam_topics')
      .insert(topicIds.map((topicId) => ({ exam_id: id, topic_id: topicId, user_id: userId })));
    if (insertError) throw insertError;
  }

  return listBySubject(current.subject_id);
}

async function attachMaterial(id: ID, materialFileId: ID): Promise<Exam[]> {
  const { data: current, error: readError } = await supabase.from('exams').select('subject_id').eq('id', id).single();
  if (readError) throw readError;

  const { error } = await supabase.from('exams').update({ material_file_id: materialFileId }).eq('id', id);
  if (error) throw error;
  return listBySubject(current.subject_id);
}

async function remove(id: ID): Promise<void> {
  const { error } = await supabase.from('exams').delete().eq('id', id);
  if (error) throw error;
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
