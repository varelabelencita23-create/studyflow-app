import { ID, WeekDay, WeeklyAssignment, WeeklyPlan } from '@/types';
import { generateId } from '@/utils';
import { STORAGE_KEYS, storage } from './storage';

function keyFor(weekStartDate: string): string {
  return `${STORAGE_KEYS.weeklyPlanPrefix}${weekStartDate}`;
}

export const weeklyPlanService = {
  async getOrCreate(
    weekStartDate: string,
    userId: string,
    allSubjectIds: ID[],
    maxSubjectsPerWeek: number,
  ): Promise<WeeklyPlan> {
    const existing = await storage.get<WeeklyPlan>(keyFor(weekStartDate));
    if (existing) return existing;

    const now = new Date().toISOString();
    const plan: WeeklyPlan = {
      id: generateId('plan'),
      userId,
      weekStartDate,
      selectedSubjectIds: allSubjectIds.slice(0, Math.max(maxSubjectsPerWeek, 0)),
      assignments: [],
      createdAt: now,
      updatedAt: now,
    };
    await storage.set(keyFor(weekStartDate), plan);
    return plan;
  },

  async setSelectedSubjects(weekStartDate: string, selectedSubjectIds: ID[]): Promise<WeeklyPlan | null> {
    const plan = await storage.get<WeeklyPlan>(keyFor(weekStartDate));
    if (!plan) return null;
    const next: WeeklyPlan = {
      ...plan,
      selectedSubjectIds,
      assignments: plan.assignments.filter((assignment) => selectedSubjectIds.includes(assignment.subjectId)),
      updatedAt: new Date().toISOString(),
    };
    await storage.set(keyFor(weekStartDate), next);
    return next;
  },

  async assignSubject(weekStartDate: string, day: WeekDay, subjectId: ID): Promise<WeeklyPlan | null> {
    const plan = await storage.get<WeeklyPlan>(keyFor(weekStartDate));
    if (!plan) return null;
    const assignments: WeeklyAssignment[] = [
      ...plan.assignments.filter((assignment) => assignment.day !== day),
      { day, subjectId },
    ];
    const next: WeeklyPlan = { ...plan, assignments, updatedAt: new Date().toISOString() };
    await storage.set(keyFor(weekStartDate), next);
    return next;
  },

  async clearDay(weekStartDate: string, day: WeekDay): Promise<WeeklyPlan | null> {
    const plan = await storage.get<WeeklyPlan>(keyFor(weekStartDate));
    if (!plan) return null;
    const next: WeeklyPlan = {
      ...plan,
      assignments: plan.assignments.filter((assignment) => assignment.day !== day),
      updatedAt: new Date().toISOString(),
    };
    await storage.set(keyFor(weekStartDate), next);
    return next;
  },
};
