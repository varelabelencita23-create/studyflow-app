import { ID, ISODateString, Timestamped } from './common';

export type ExamType = 'parcial' | 'recuperatorio' | 'final' | 'trabajo-practico';

export type ExamPace = 'ahead' | 'on-track' | 'behind';

export interface Exam extends Timestamped {
  id: ID;
  subjectId: ID;
  title: string;
  type: ExamType;
  date: ISODateString;
  topicIds: ID[];
  materialFileId?: ID;
}

export interface ExamReadiness {
  examId: ID;
  daysRemaining: number;
  percentPrepared: number; // 0-1
  requiredPacePerDay: number; // minutes/day needed
  currentPacePerDay: number; // minutes/day actual (recent average)
  pace: ExamPace;
}
