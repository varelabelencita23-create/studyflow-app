import { ID, ISODateString } from './common';

export type NotificationKind = 'reminder' | 'exam-alert' | 'streak' | 'insight' | 'system';

export interface AppNotification {
  id: ID;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAt: ISODateString;
  read: boolean;
  subjectId?: ID;
}

export type AchievementKind =
  | 'streak-7'
  | 'streak-30'
  | 'first-session'
  | 'subject-completed'
  | 'perfect-week';

export interface Achievement {
  id: ID;
  kind: AchievementKind;
  title: string;
  description: string;
  unlockedAt?: ISODateString;
}
