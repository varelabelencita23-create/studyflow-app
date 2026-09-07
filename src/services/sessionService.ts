import { getCurrentUserId, supabase } from '@/lib/supabase';
import { ID, StudySession, StudySessionStatus } from '@/types';

type NewSession = Omit<StudySession, 'id' | 'createdAt' | 'updatedAt'>;

interface SessionRow {
  id: string;
  subject_id: string;
  content_ids: string[];
  date: string;
  duration_seconds: number;
  status: StudySessionStatus;
  goal_minutes: number | null;
  goal_met: boolean | null;
  progress_before: number;
  progress_after: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function mapSession(row: SessionRow): StudySession {
  return {
    id: row.id,
    subjectId: row.subject_id,
    contentIds: row.content_ids,
    date: row.date,
    durationSeconds: row.duration_seconds,
    status: row.status,
    goalMinutes: row.goal_minutes ?? undefined,
    goalMet: row.goal_met ?? undefined,
    progressBefore: row.progress_before,
    progressAfter: row.progress_after,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const sessionService = {
  async listAll(): Promise<StudySession[]> {
    const { data, error } = await supabase.from('study_sessions').select('*').order('date', { ascending: false });
    if (error) throw error;
    return (data as SessionRow[]).map(mapSession);
  },

  async listBySubject(subjectId: ID): Promise<StudySession[]> {
    const { data, error } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('subject_id', subjectId)
      .order('date', { ascending: false });
    if (error) throw error;
    return (data as SessionRow[]).map(mapSession);
  },

  async get(id: ID): Promise<StudySession | null> {
    const { data, error } = await supabase.from('study_sessions').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? mapSession(data as SessionRow) : null;
  },

  async create(input: NewSession): Promise<StudySession> {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('study_sessions')
      .insert({
        user_id: userId,
        subject_id: input.subjectId,
        content_ids: input.contentIds,
        date: input.date,
        duration_seconds: input.durationSeconds,
        status: input.status,
        goal_minutes: input.goalMinutes ?? null,
        goal_met: input.goalMet ?? null,
        progress_before: input.progressBefore,
        progress_after: input.progressAfter,
        notes: input.notes ?? null,
      })
      .select('*')
      .single();
    if (error) throw error;
    return mapSession(data as SessionRow);
  },
};
