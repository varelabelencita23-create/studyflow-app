import { Difficulty, ID, ISODateString, Priority, Timestamped } from './common';

export type ContentStatus = 'not-started' | 'in-progress' | 'completed';

interface ContentBase extends Timestamped {
  id: ID;
  subjectId: ID;
  title: string;
  status: ContentStatus;
  progress: number; // 0-1
  minutesStudied: number;
  lastSessionAt?: ISODateString;
  priority: Priority;
  difficulty: Difficulty;
  targetDate?: ISODateString;
  importantForExam: boolean;
  order: number;
}

export interface Unit extends ContentBase {
  type: 'unit';
  topicIds: ID[];
}

export interface Topic extends ContentBase {
  type: 'topic';
  unitId: ID;
  subtopicIds: ID[];
}

export interface Subtopic extends ContentBase {
  type: 'subtopic';
  topicId: ID;
}

export type ContentNode = Unit | Topic | Subtopic;
