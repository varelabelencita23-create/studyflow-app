import { ID, ISODateString } from './common';

export interface DailyActivity {
  date: ISODateString;
  minutesStudied: number;
  sessionsCount: number;
}

export interface StudyStats {
  todayMinutes: number;
  weekMinutes: number;
  monthMinutes: number;
  currentStreakDays: number;
  bestStreakDays: number;
  minutesBySubject: Record<ID, number>;
  activity: DailyActivity[];
}
