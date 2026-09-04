import { ID, Timestamped, WeekDay } from './common';

/** A single subject assigned to a day within a weekly plan. */
export interface WeeklyAssignment {
  day: WeekDay;
  subjectId: ID;
}

export interface WeeklyPlan extends Timestamped {
  id: ID;
  userId: ID;
  weekStartDate: string; // ISO date (Monday of the week)
  selectedSubjectIds: ID[];
  assignments: WeeklyAssignment[];
}

/** A content item scheduled for a specific day within a subject's own plan. */
export interface ContentPlanAssignment {
  id: ID;
  subjectId: ID;
  contentId: ID;
  day: WeekDay;
}
