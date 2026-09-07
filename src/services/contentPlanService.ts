import { getCurrentUserId, supabase } from '@/lib/supabase';
import { ContentPlanAssignment, ID, WeekDay } from '@/types';

interface AssignmentRow {
  id: string;
  subject_id: string;
  content_id: string;
  day: WeekDay;
}

function mapAssignment(row: AssignmentRow): ContentPlanAssignment {
  return { id: row.id, subjectId: row.subject_id, contentId: row.content_id, day: row.day };
}

async function listBySubjectRows(subjectId: ID): Promise<ContentPlanAssignment[]> {
  const { data, error } = await supabase.from('content_plan_assignments').select('*').eq('subject_id', subjectId);
  if (error) throw error;
  return (data as AssignmentRow[]).map(mapAssignment);
}

export const contentPlanService = {
  async listBySubject(subjectId: ID): Promise<ContentPlanAssignment[]> {
    return listBySubjectRows(subjectId);
  },

  /** A content can only be assigned to one day at a time — assigning again replaces the previous day. */
  async assign(subjectId: ID, contentId: ID, day: WeekDay): Promise<ContentPlanAssignment[]> {
    const userId = await getCurrentUserId();
    const { error } = await supabase
      .from('content_plan_assignments')
      .upsert(
        { user_id: userId, subject_id: subjectId, content_id: contentId, day },
        { onConflict: 'subject_id,content_id' },
      );
    if (error) throw error;
    return listBySubjectRows(subjectId);
  },

  async unassign(subjectId: ID, contentId: ID): Promise<ContentPlanAssignment[]> {
    const { error } = await supabase
      .from('content_plan_assignments')
      .delete()
      .eq('subject_id', subjectId)
      .eq('content_id', contentId);
    if (error) throw error;
    return listBySubjectRows(subjectId);
  },
};
