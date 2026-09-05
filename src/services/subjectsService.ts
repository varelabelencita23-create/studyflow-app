import { Subject } from '@/types';
import { generateId } from '@/utils';
import { STORAGE_KEYS, storage } from './storage';

interface SubjectInput {
  name: string;
  shortName?: string;
  professor?: string;
}

async function readAll(): Promise<Subject[]> {
  const subjects = await storage.get<Subject[]>(STORAGE_KEYS.subjects);
  return subjects ?? [];
}

function deriveShortName(name: string): string {
  return name.trim().slice(0, 12).toUpperCase();
}

export const subjectsService = {
  async list(): Promise<Subject[]> {
    const subjects = await readAll();
    return [...subjects].sort((a, b) => a.order - b.order);
  },

  async add(input: SubjectInput, userId: string): Promise<Subject> {
    const subjects = await readAll();
    const now = new Date().toISOString();
    const subject: Subject = {
      id: generateId('subject'),
      userId,
      name: input.name.trim(),
      shortName: (input.shortName?.trim() || deriveShortName(input.name)) as string,
      professor: input.professor?.trim() || undefined,
      progress: 0,
      order: subjects.length,
      archived: false,
      createdAt: now,
      updatedAt: now,
    };
    await storage.set(STORAGE_KEYS.subjects, [...subjects, subject]);
    return subject;
  },

  async update(id: string, patch: Partial<SubjectInput>): Promise<Subject[]> {
    const subjects = await readAll();
    const next = subjects.map((subject) =>
      subject.id === id
        ? {
            ...subject,
            ...patch,
            name: patch.name?.trim() ?? subject.name,
            shortName: patch.shortName?.trim() || subject.shortName,
            updatedAt: new Date().toISOString(),
          }
        : subject,
    );
    await storage.set(STORAGE_KEYS.subjects, next);
    return next;
  },

  async remove(id: string): Promise<Subject[]> {
    const subjects = await readAll();
    const next = subjects
      .filter((subject) => subject.id !== id)
      .map((subject, index) => ({ ...subject, order: index }));
    await storage.set(STORAGE_KEYS.subjects, next);
    return next;
  },

  async setProgress(id: string, progress: number): Promise<Subject[]> {
    const subjects = await readAll();
    const next = subjects.map((subject) =>
      subject.id === id ? { ...subject, progress, updatedAt: new Date().toISOString() } : subject,
    );
    await storage.set(STORAGE_KEYS.subjects, next);
    return next;
  },

  async reorder(orderedIds: string[]): Promise<Subject[]> {
    const subjects = await readAll();
    const byId = new Map(subjects.map((subject) => [subject.id, subject]));
    const next = orderedIds
      .map((id, index) => {
        const subject = byId.get(id);
        return subject ? { ...subject, order: index } : null;
      })
      .filter((subject): subject is Subject => subject !== null);
    await storage.set(STORAGE_KEYS.subjects, next);
    return next;
  },
};
