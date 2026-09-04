import { ID, ISODateString, Timestamped } from './common';

export type StudySessionStatus = 'in-progress' | 'paused' | 'completed' | 'discarded';

export interface StudySession extends Timestamped {
  id: ID;
  subjectId: ID;
  contentIds: ID[];
  date: ISODateString;
  durationSeconds: number;
  status: StudySessionStatus;
  goalMinutes?: number;
  goalMet?: boolean;
  progressBefore: number;
  progressAfter: number;
  notes?: string;
}
