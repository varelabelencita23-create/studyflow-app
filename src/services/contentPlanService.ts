import { ContentPlanAssignment, ID, WeekDay } from '@/types';
import { generateId } from '@/utils';
import { STORAGE_KEYS, storage } from './storage';

async function readAll(): Promise<ContentPlanAssignment[]> {
  return (await storage.get<ContentPlanAssignment[]>(STORAGE_KEYS.contentPlan)) ?? [];
}

export const contentPlanService = {
  async listBySubject(subjectId: ID): Promise<ContentPlanAssignment[]> {
    return (await readAll()).filter((assignment) => assignment.subjectId === subjectId);
  },

  /** A content can only be assigned to one day at a time — assigning again replaces the previous day. */
  async assign(subjectId: ID, contentId: ID, day: WeekDay): Promise<ContentPlanAssignment[]> {
    const all = await readAll();
    const next: ContentPlanAssignment[] = [
      ...all.filter((assignment) => assignment.contentId !== contentId),
      { id: generateId('plan-item'), subjectId, contentId, day },
    ];
    await storage.set(STORAGE_KEYS.contentPlan, next);
    return next.filter((assignment) => assignment.subjectId === subjectId);
  },

  async unassign(subjectId: ID, contentId: ID): Promise<ContentPlanAssignment[]> {
    const all = await readAll();
    const next = all.filter((assignment) => assignment.contentId !== contentId);
    await storage.set(STORAGE_KEYS.contentPlan, next);
    return next.filter((assignment) => assignment.subjectId === subjectId);
  },
};
