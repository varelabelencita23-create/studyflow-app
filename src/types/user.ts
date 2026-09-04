import { ID, ISODateString, StudyMode, Timestamped } from './common';

export interface User extends Timestamped {
  id: ID;
  fullName: string;
  email: string;
  avatarUrl?: string;
  studyMode: StudyMode;
  maxSubjectsPerWeek: number;
  onboardingCompletedAt?: ISODateString;
}
