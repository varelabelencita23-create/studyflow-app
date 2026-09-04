import { ID, Timestamped } from './common';

export type SubjectStatus = 'on-track' | 'behind' | 'ahead' | 'neglected';

export interface Subject extends Timestamped {
  id: ID;
  userId: ID;
  name: string;
  shortName: string;
  professor?: string;
  progress: number; // 0-1
  order: number;
  archived: boolean;
}

export interface SubjectSummary {
  subjectId: ID;
  progress: number;
  hoursStudied: number;
  topicsCompleted: number;
  topicsTotal: number;
  sessionsCount: number;
  averageDailyMinutes: number;
  status: SubjectStatus;
  nextExamId?: ID;
  daysUntilNextExam?: number;
}
