import { ID, ISODateString, Topic } from '@/types';
import { generateId } from '@/utils';
import { STORAGE_KEYS, storage } from './storage';
import { subjectsService } from './subjectsService';

/**
 * Flat MVP for subject content: every item is a `Topic` attached to a single
 * deterministic "default unit" per subject. Stage 6 introduces real multiple
 * units with nesting (unit -> topic -> subtopic); this placeholder unitId
 * lets that migration happen later without touching already-created topics.
 */
function defaultUnitId(subjectId: ID): ID {
  return `unit_default_${subjectId}`;
}

async function readAll(): Promise<Topic[]> {
  const topics = await storage.get<Topic[]>(STORAGE_KEYS.topics);
  return topics ?? [];
}

function bySubject(topics: Topic[], subjectId: ID): Topic[] {
  return topics.filter((topic) => topic.subjectId === subjectId).sort((a, b) => a.order - b.order);
}

export const contentService = {
  async listBySubject(subjectId: ID): Promise<Topic[]> {
    return bySubject(await readAll(), subjectId);
  },

  async add(subjectId: ID, title: string): Promise<Topic> {
    const topics = await readAll();
    const now = new Date().toISOString();
    const topic: Topic = {
      id: generateId('topic'),
      type: 'topic',
      subjectId,
      unitId: defaultUnitId(subjectId),
      subtopicIds: [],
      title: title.trim(),
      status: 'not-started',
      progress: 0,
      minutesStudied: 0,
      priority: 'medium',
      difficulty: 'medium',
      importantForExam: false,
      order: bySubject(topics, subjectId).length,
      createdAt: now,
      updatedAt: now,
    };
    await storage.set(STORAGE_KEYS.topics, [...topics, topic]);
    return topic;
  },

  async update(id: ID, subjectId: ID, patch: { title?: string }): Promise<Topic[]> {
    const topics = await readAll();
    const next = topics.map((topic) =>
      topic.id === id
        ? { ...topic, title: patch.title?.trim() ?? topic.title, updatedAt: new Date().toISOString() }
        : topic,
    );
    await storage.set(STORAGE_KEYS.topics, next);
    return bySubject(next, subjectId);
  },

  async remove(id: ID, subjectId: ID): Promise<Topic[]> {
    const topics = await readAll();
    const next = topics.filter((topic) => topic.id !== id);
    await storage.set(STORAGE_KEYS.topics, next);
    return bySubject(next, subjectId);
  },

  async toggleComplete(id: ID, subjectId: ID): Promise<Topic[]> {
    const topics = await readAll();
    const next = topics.map((topic) => {
      if (topic.id !== id) return topic;
      const completed = topic.status === 'completed';
      return {
        ...topic,
        status: completed ? ('not-started' as const) : ('completed' as const),
        progress: completed ? 0 : 1,
        updatedAt: new Date().toISOString(),
      };
    });
    await storage.set(STORAGE_KEYS.topics, next);
    return bySubject(next, subjectId);
  },

  /**
   * Applies the outcome of a finished study session: contents the learner
   * confirmed as completed become `completed`; the rest of the selected
   * contents (studied but not finished) move to `in-progress`.
   */
  async applySessionOutcome(
    subjectId: ID,
    selectedIds: ID[],
    completedIds: ID[],
    date: ISODateString,
  ): Promise<Topic[]> {
    const topics = await readAll();
    const next = topics.map((topic) => {
      if (!selectedIds.includes(topic.id)) return topic;
      const isCompleted = completedIds.includes(topic.id);
      return {
        ...topic,
        status: isCompleted ? ('completed' as const) : ('in-progress' as const),
        progress: isCompleted ? 1 : Math.max(topic.progress, 0.5),
        lastSessionAt: date,
        updatedAt: date,
      };
    });
    await storage.set(STORAGE_KEYS.topics, next);
    return bySubject(next, subjectId);
  },

  /** Recomputes and persists a subject's progress as completed/total contents. */
  async recomputeSubjectProgress(subjectId: ID): Promise<number> {
    const topics = bySubject(await readAll(), subjectId);
    const progress = topics.length > 0 ? topics.filter((topic) => topic.status === 'completed').length / topics.length : 0;
    await subjectsService.setProgress(subjectId, progress);
    return progress;
  },
};
