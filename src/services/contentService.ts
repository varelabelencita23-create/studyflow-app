import { ContentStatus, Difficulty, ID, ISODateString, Priority, Subtopic, Topic, Unit } from '@/types';
import { generateId } from '@/utils';
import { STORAGE_KEYS, storage } from './storage';
import { subjectsService } from './subjectsService';

/**
 * Hierarchical content: Subject -> Unit -> Topic -> Subtopic. Each level is
 * stored as its own flat array (parent reference on the child, e.g.
 * `topic.unitId`) rather than keeping parent-side id arrays as the source of
 * truth — that avoids a two-way sync between parent/child records. The
 * `topicIds`/`subtopicIds` fields on Unit/Topic are still populated on every
 * read (derived from the children), only to satisfy the public type shape.
 */

function defaultUnitId(subjectId: ID): ID {
  return `unit_default_${subjectId}`;
}

async function readUnits(): Promise<Unit[]> {
  return (await storage.get<Unit[]>(STORAGE_KEYS.units)) ?? [];
}
async function writeUnits(units: Unit[]): Promise<void> {
  await storage.set(STORAGE_KEYS.units, units);
}
async function readTopics(): Promise<Topic[]> {
  return (await storage.get<Topic[]>(STORAGE_KEYS.topics)) ?? [];
}
async function writeTopics(topics: Topic[]): Promise<void> {
  await storage.set(STORAGE_KEYS.topics, topics);
}
async function readSubtopics(): Promise<Subtopic[]> {
  return (await storage.get<Subtopic[]>(STORAGE_KEYS.subtopics)) ?? [];
}
async function writeSubtopics(subtopics: Subtopic[]): Promise<void> {
  await storage.set(STORAGE_KEYS.subtopics, subtopics);
}

function statusFromProgress(progress: number): ContentStatus {
  if (progress >= 1) return 'completed';
  if (progress > 0) return 'in-progress';
  return 'not-started';
}

/** Lists a subject's units, auto-migrating Stage 5's flat topics (attached to a placeholder unit) into a real "General" unit the first time they're read. */
async function listUnits(subjectId: ID): Promise<Unit[]> {
  const units = await readUnits();
  let subjectUnits = units.filter((unit) => unit.subjectId === subjectId).sort((a, b) => a.order - b.order);

  if (subjectUnits.length === 0) {
    const topics = await readTopics();
    const hasLegacyTopics = topics.some((topic) => topic.subjectId === subjectId);
    if (hasLegacyTopics) {
      const now = new Date().toISOString();
      const generalUnit: Unit = {
        id: defaultUnitId(subjectId),
        type: 'unit',
        subjectId,
        title: 'General',
        topicIds: [],
        status: 'not-started',
        progress: 0,
        minutesStudied: 0,
        priority: 'medium',
        difficulty: 'medium',
        importantForExam: false,
        order: 0,
        createdAt: now,
        updatedAt: now,
      };
      await writeUnits([...units, generalUnit]);
      // Legacy topics may already carry progress from before Stage 6 — seed
      // the new unit's progress from them instead of leaving it at 0.
      await recomputeUnitFromTopics(generalUnit.id);
      subjectUnits = (await readUnits()).filter((unit) => unit.id === generalUnit.id);
    }
  }

  const topics = await readTopics();
  return subjectUnits.map((unit) => ({
    ...unit,
    topicIds: topics.filter((topic) => topic.unitId === unit.id).map((topic) => topic.id),
  }));
}

async function addUnit(subjectId: ID, title: string): Promise<Unit> {
  const units = await readUnits();
  const order = units.filter((unit) => unit.subjectId === subjectId).length;
  const now = new Date().toISOString();
  const unit: Unit = {
    id: generateId('unit'),
    type: 'unit',
    subjectId,
    title: title.trim(),
    topicIds: [],
    status: 'not-started',
    progress: 0,
    minutesStudied: 0,
    priority: 'medium',
    difficulty: 'medium',
    importantForExam: false,
    order,
    createdAt: now,
    updatedAt: now,
  };
  await writeUnits([...units, unit]);
  return unit;
}

async function updateUnit(id: ID, subjectId: ID, patch: { title?: string }): Promise<Unit[]> {
  const units = await readUnits();
  const next = units.map((unit) =>
    unit.id === id ? { ...unit, title: patch.title?.trim() ?? unit.title, updatedAt: new Date().toISOString() } : unit,
  );
  await writeUnits(next);
  return listUnits(subjectId);
}

async function removeUnit(id: ID, subjectId: ID): Promise<Unit[]> {
  const [units, topics, subtopics] = await Promise.all([readUnits(), readTopics(), readSubtopics()]);
  const removedTopicIds = topics.filter((topic) => topic.unitId === id).map((topic) => topic.id);
  await writeUnits(units.filter((unit) => unit.id !== id));
  await writeTopics(topics.filter((topic) => topic.unitId !== id));
  await writeSubtopics(subtopics.filter((subtopic) => !removedTopicIds.includes(subtopic.topicId)));
  await recomputeSubjectProgress(subjectId);
  return listUnits(subjectId);
}

async function listTopicsByUnit(unitId: ID): Promise<Topic[]> {
  const topics = await readTopics();
  return topics
    .filter((topic) => topic.unitId === unitId)
    .map((topic) => topic)
    .sort((a, b) => a.order - b.order);
}

/** Flat list of every topic for a subject, ordered by unit order then topic order — used by session setup and subject-level stats. */
async function listBySubject(subjectId: ID): Promise<Topic[]> {
  const units = await listUnits(subjectId);
  const unitOrderIndex = new Map(units.map((unit, index) => [unit.id, index]));
  const topics = (await readTopics()).filter((topic) => topic.subjectId === subjectId);
  return [...topics].sort((a, b) => {
    const unitOrderA = unitOrderIndex.get(a.unitId) ?? 999;
    const unitOrderB = unitOrderIndex.get(b.unitId) ?? 999;
    return unitOrderA !== unitOrderB ? unitOrderA - unitOrderB : a.order - b.order;
  });
}

async function addTopic(unitId: ID, subjectId: ID, title: string): Promise<Topic> {
  const topics = await readTopics();
  const order = topics.filter((topic) => topic.unitId === unitId).length;
  const now = new Date().toISOString();
  const topic: Topic = {
    id: generateId('topic'),
    type: 'topic',
    subjectId,
    unitId,
    subtopicIds: [],
    title: title.trim(),
    status: 'not-started',
    progress: 0,
    minutesStudied: 0,
    priority: 'medium',
    difficulty: 'medium',
    importantForExam: false,
    order,
    createdAt: now,
    updatedAt: now,
  };
  await writeTopics([...topics, topic]);
  return topic;
}

interface TopicPatch {
  title?: string;
  priority?: Priority;
  difficulty?: Difficulty;
  targetDate?: ISODateString | null;
  importantForExam?: boolean;
}

async function updateTopic(id: ID, unitId: ID, patch: TopicPatch): Promise<Topic[]> {
  const topics = await readTopics();
  const next = topics.map((topic) =>
    topic.id === id
      ? {
          ...topic,
          title: patch.title?.trim() ?? topic.title,
          priority: patch.priority ?? topic.priority,
          difficulty: patch.difficulty ?? topic.difficulty,
          targetDate: patch.targetDate === null ? undefined : patch.targetDate ?? topic.targetDate,
          importantForExam: patch.importantForExam ?? topic.importantForExam,
          updatedAt: new Date().toISOString(),
        }
      : topic,
  );
  await writeTopics(next);
  return listTopicsByUnit(unitId);
}

async function removeTopic(id: ID, unitId: ID, subjectId: ID): Promise<Topic[]> {
  const [topics, subtopics] = await Promise.all([readTopics(), readSubtopics()]);
  await writeTopics(topics.filter((topic) => topic.id !== id));
  await writeSubtopics(subtopics.filter((subtopic) => subtopic.topicId !== id));
  await recomputeUnitFromTopics(unitId);
  await recomputeSubjectProgress(subjectId);
  return listTopicsByUnit(unitId);
}

/** Only meaningful for a leaf topic (no subtopics yet) — a topic with subtopics reflects their completion instead. */
async function toggleTopicComplete(id: ID, unitId: ID, subjectId: ID): Promise<Topic[]> {
  const topics = await readTopics();
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
  await writeTopics(next);
  await recomputeUnitFromTopics(unitId);
  await recomputeSubjectProgress(subjectId);
  return listTopicsByUnit(unitId);
}

async function listSubtopicsByTopic(topicId: ID): Promise<Subtopic[]> {
  const subtopics = await readSubtopics();
  return subtopics.filter((subtopic) => subtopic.topicId === topicId).sort((a, b) => a.order - b.order);
}

async function listAllSubtopicsForSubject(subjectId: ID): Promise<Subtopic[]> {
  const subtopics = await readSubtopics();
  return subtopics.filter((subtopic) => subtopic.subjectId === subjectId);
}

async function addSubtopic(topicId: ID, subjectId: ID, title: string): Promise<Subtopic> {
  const subtopics = await readSubtopics();
  const order = subtopics.filter((subtopic) => subtopic.topicId === topicId).length;
  const now = new Date().toISOString();
  const subtopic: Subtopic = {
    id: generateId('subtopic'),
    type: 'subtopic',
    subjectId,
    topicId,
    title: title.trim(),
    status: 'not-started',
    progress: 0,
    minutesStudied: 0,
    priority: 'medium',
    difficulty: 'medium',
    importantForExam: false,
    order,
    createdAt: now,
    updatedAt: now,
  };
  await writeSubtopics([...subtopics, subtopic]);
  await recomputeTopicFromSubtopics(topicId);
  return subtopic;
}

interface SubtopicPatch {
  title?: string;
  priority?: Priority;
  difficulty?: Difficulty;
  importantForExam?: boolean;
}

async function updateSubtopic(id: ID, topicId: ID, patch: SubtopicPatch): Promise<Subtopic[]> {
  const subtopics = await readSubtopics();
  const next = subtopics.map((subtopic) =>
    subtopic.id === id
      ? {
          ...subtopic,
          title: patch.title?.trim() ?? subtopic.title,
          priority: patch.priority ?? subtopic.priority,
          difficulty: patch.difficulty ?? subtopic.difficulty,
          importantForExam: patch.importantForExam ?? subtopic.importantForExam,
          updatedAt: new Date().toISOString(),
        }
      : subtopic,
  );
  await writeSubtopics(next);
  return listSubtopicsByTopic(topicId);
}

async function removeSubtopic(id: ID, topicId: ID, unitId: ID, subjectId: ID): Promise<Subtopic[]> {
  const subtopics = await readSubtopics();
  await writeSubtopics(subtopics.filter((subtopic) => subtopic.id !== id));
  await recomputeTopicFromSubtopics(topicId);
  await recomputeUnitFromTopics(unitId);
  await recomputeSubjectProgress(subjectId);
  return listSubtopicsByTopic(topicId);
}

async function toggleSubtopicComplete(id: ID, topicId: ID, unitId: ID, subjectId: ID): Promise<Subtopic[]> {
  const subtopics = await readSubtopics();
  const next = subtopics.map((subtopic) => {
    if (subtopic.id !== id) return subtopic;
    const completed = subtopic.status === 'completed';
    return {
      ...subtopic,
      status: completed ? ('not-started' as const) : ('completed' as const),
      progress: completed ? 0 : 1,
      updatedAt: new Date().toISOString(),
    };
  });
  await writeSubtopics(next);
  await recomputeTopicFromSubtopics(topicId);
  await recomputeUnitFromTopics(unitId);
  await recomputeSubjectProgress(subjectId);
  return listSubtopicsByTopic(topicId);
}

/** A topic with no subtopics manages its own status directly and is left untouched here. */
async function recomputeTopicFromSubtopics(topicId: ID): Promise<void> {
  const [topics, subtopics] = await Promise.all([readTopics(), readSubtopics()]);
  const children = subtopics.filter((subtopic) => subtopic.topicId === topicId);
  if (children.length === 0) return;
  const progress = children.reduce((sum, subtopic) => sum + subtopic.progress, 0) / children.length;
  const next = topics.map((topic) =>
    topic.id === topicId
      ? { ...topic, progress, status: statusFromProgress(progress), updatedAt: new Date().toISOString() }
      : topic,
  );
  await writeTopics(next);
}

async function recomputeUnitFromTopics(unitId: ID): Promise<void> {
  const [units, topics] = await Promise.all([readUnits(), readTopics()]);
  const children = topics.filter((topic) => topic.unitId === unitId);
  const progress =
    children.length > 0 ? children.reduce((sum, topic) => sum + topic.progress, 0) / children.length : 0;
  const next = units.map((unit) =>
    unit.id === unitId
      ? { ...unit, progress, status: statusFromProgress(progress), updatedAt: new Date().toISOString() }
      : unit,
  );
  await writeUnits(next);
}

async function recomputeSubjectProgress(subjectId: ID): Promise<number> {
  const topics = await listBySubject(subjectId);
  const progress = topics.length > 0 ? topics.reduce((sum, topic) => sum + topic.progress, 0) / topics.length : 0;
  await subjectsService.setProgress(subjectId, progress);
  return progress;
}

/**
 * Applies the outcome of a finished study session: contents the learner
 * confirmed as completed become `completed`; the rest of the selected
 * contents (studied but not finished) move to `in-progress`. Recomputes
 * every unit touched by the session so their progress rings stay accurate.
 */
async function applySessionOutcome(
  subjectId: ID,
  selectedIds: ID[],
  completedIds: ID[],
  date: ISODateString,
): Promise<Topic[]> {
  const topics = await readTopics();
  const touchedUnitIds = new Set<ID>();
  const next = topics.map((topic) => {
    if (!selectedIds.includes(topic.id)) return topic;
    touchedUnitIds.add(topic.unitId);
    const isCompleted = completedIds.includes(topic.id);
    return {
      ...topic,
      status: isCompleted ? ('completed' as const) : ('in-progress' as const),
      progress: isCompleted ? 1 : Math.max(topic.progress, 0.5),
      lastSessionAt: date,
      updatedAt: date,
    };
  });
  await writeTopics(next);
  await Promise.all([...touchedUnitIds].map((unitId) => recomputeUnitFromTopics(unitId)));
  return listBySubject(subjectId);
}

export const contentService = {
  listUnits,
  addUnit,
  updateUnit,
  removeUnit,
  listTopicsByUnit,
  listBySubject,
  addTopic,
  updateTopic,
  removeTopic,
  toggleTopicComplete,
  listSubtopicsByTopic,
  listAllSubtopicsForSubject,
  addSubtopic,
  updateSubtopic,
  removeSubtopic,
  toggleSubtopicComplete,
  recomputeSubjectProgress,
  applySessionOutcome,
};
