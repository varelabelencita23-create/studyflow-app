import { ID, StudySession } from '@/types';
import { generateId } from '@/utils';
import { STORAGE_KEYS, storage } from './storage';

type NewSession = Omit<StudySession, 'id' | 'createdAt' | 'updatedAt'>;

async function readAll(): Promise<StudySession[]> {
  const sessions = await storage.get<StudySession[]>(STORAGE_KEYS.sessions);
  return sessions ?? [];
}

export const sessionService = {
  async listBySubject(subjectId: ID): Promise<StudySession[]> {
    const sessions = await readAll();
    return sessions
      .filter((session) => session.subjectId === subjectId)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  },

  async get(id: ID): Promise<StudySession | null> {
    const sessions = await readAll();
    return sessions.find((session) => session.id === id) ?? null;
  },

  async create(input: NewSession): Promise<StudySession> {
    const sessions = await readAll();
    const now = new Date().toISOString();
    const session: StudySession = {
      ...input,
      id: generateId('session'),
      createdAt: now,
      updatedAt: now,
    };
    await storage.set(STORAGE_KEYS.sessions, [...sessions, session]);
    return session;
  },
};
