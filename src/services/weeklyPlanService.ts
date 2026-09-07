import { supabase } from '@/lib/supabase';
import { ID, WeekDay, WeeklyAssignment, WeeklyPlan } from '@/types';

interface PlanRow {
  id: string;
  user_id: string;
  week_start_date: string;
  selected_subject_ids: string[];
  created_at: string;
  updated_at: string;
}

interface ItemRow {
  id: string;
  day: WeekDay;
  subject_id: string;
}

function mapPlan(row: PlanRow, items: ItemRow[]): WeeklyPlan {
  return {
    id: row.id,
    userId: row.user_id,
    weekStartDate: row.week_start_date,
    selectedSubjectIds: row.selected_subject_ids,
    assignments: items.map((item): WeeklyAssignment => ({ day: item.day, subjectId: item.subject_id })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchPlanRow(weekStartDate: string): Promise<PlanRow | null> {
  const { data, error } = await supabase
    .from('weekly_plans')
    .select('*')
    .eq('week_start_date', weekStartDate)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function fetchItems(weeklyPlanId: string): Promise<ItemRow[]> {
  const { data, error } = await supabase
    .from('weekly_plan_items')
    .select('id, day, subject_id')
    .eq('weekly_plan_id', weeklyPlanId);
  if (error) throw error;
  return data as ItemRow[];
}

async function fetchPlan(weekStartDate: string): Promise<WeeklyPlan | null> {
  const planRow = await fetchPlanRow(weekStartDate);
  if (!planRow) return null;
  const items = await fetchItems(planRow.id);
  return mapPlan(planRow, items);
}

export const weeklyPlanService = {
  async getOrCreate(
    weekStartDate: string,
    userId: string,
    allSubjectIds: ID[],
    maxSubjectsPerWeek: number,
  ): Promise<WeeklyPlan> {
    const existing = await fetchPlan(weekStartDate);
    if (existing) return existing;

    const { data, error } = await supabase
      .from('weekly_plans')
      .insert({
        user_id: userId,
        week_start_date: weekStartDate,
        selected_subject_ids: allSubjectIds.slice(0, Math.max(maxSubjectsPerWeek, 0)),
      })
      .select('*')
      .single();
    if (error) throw error;
    return mapPlan(data as PlanRow, []);
  },

  async setSelectedSubjects(weekStartDate: string, selectedSubjectIds: ID[]): Promise<WeeklyPlan | null> {
    const planRow = await fetchPlanRow(weekStartDate);
    if (!planRow) return null;

    const { error } = await supabase
      .from('weekly_plans')
      .update({ selected_subject_ids: selectedSubjectIds })
      .eq('id', planRow.id);
    if (error) throw error;

    const items = await fetchItems(planRow.id);
    const toRemove = items.filter((item) => !selectedSubjectIds.includes(item.subject_id));
    if (toRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from('weekly_plan_items')
        .delete()
        .in('id', toRemove.map((item) => item.id));
      if (deleteError) throw deleteError;
    }

    return fetchPlan(weekStartDate);
  },

  async assignSubject(weekStartDate: string, day: WeekDay, subjectId: ID): Promise<WeeklyPlan | null> {
    const planRow = await fetchPlanRow(weekStartDate);
    if (!planRow) return null;

    const { error } = await supabase
      .from('weekly_plan_items')
      .upsert(
        { weekly_plan_id: planRow.id, user_id: planRow.user_id, day, subject_id: subjectId },
        { onConflict: 'weekly_plan_id,day' },
      );
    if (error) throw error;

    return fetchPlan(weekStartDate);
  },

  async clearDay(weekStartDate: string, day: WeekDay): Promise<WeeklyPlan | null> {
    const planRow = await fetchPlanRow(weekStartDate);
    if (!planRow) return null;

    const { error } = await supabase
      .from('weekly_plan_items')
      .delete()
      .eq('weekly_plan_id', planRow.id)
      .eq('day', day);
    if (error) throw error;

    return fetchPlan(weekStartDate);
  },
};
