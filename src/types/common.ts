export type ID = string;

export type ISODateString = string;

export type WeekDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type Priority = 'low' | 'medium' | 'high';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type StudyMode = 'standard' | 'deep' | 'free';

export interface Timestamped {
  createdAt: ISODateString;
  updatedAt: ISODateString;
}
