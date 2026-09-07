import { getCurrentUserId, supabase } from '@/lib/supabase';
import { ContentStatus, Difficulty, ID, ISODateString, Priority, Subtopic, Topic, Unit } from '@/types';
import { subjectsService } from './subjectsService';

/**
 * Hierarchical content: Subject -> Unit -> Topic -> Subtopic, each its own
 * table with a parent foreign key. `topicIds`/`subtopicIds` on Unit/Topic are
 * never stored — they're derived on every read via a query against the
 * child table, so there's no parent/child array to keep in sync.
 */

interface ContentRow {
  id: string;
  subject_id: string;
  title: string;
  status: ContentStatus;
  progress: number;
  minutes_studied: number;
  last_session_at: string | null;
  priority: Priority;
  difficulty: Difficulty;
  target_date: string | null;
  important_for_exam: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

interface UnitRow extends ContentRow {}
interface TopicRow extends ContentRow {
  unit_id: string;
}
interface SubtopicRow extends ContentRow {
  topic_id: string;
}

function mapUnit(row: UnitRow, topicIds: ID[]): Unit {
  return {
    type: 'unit',
    id: row.id,
    subjectId: row.subject_id,
    title: row.title,
    status: row.status,
    progress: row.progress,
    minutesStudied: row.minutes_studied,
    lastSessionAt: row.last_session_at ?? undefined,
    priority: row.priority,
    difficulty: row.difficulty,
    targetDate: row.target_date ?? undefined,
    importantForExam: row.important_for_exam,
    order: row.order_index,
    topicIds,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTopic(row: TopicRow, subtopicIds: ID[]): Topic {
  return {
    type: 'topic',
    id: row.id,
    subjectId: row.subject_id,
    unitId: row.unit_id,
    title: row.title,
    status: row.status,
    progress: row.progress,
    minutesStudied: row.minutes_studied,
    lastSessionAt: row.last_session_at ?? undefined,
    priority: row.priority,
    difficulty: row.difficulty,
    targetDate: row.target_date ?? undefined,
    importantForExam: row.important_for_exam,
    order: row.order_index,
    subtopicIds,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSubtopic(row: SubtopicRow): Subtopic {
  return {
    type: 'subtopic',
    id: row.id,
    subjectId: row.subject_id,
    topicId: row.topic_id,
    title: row.title,
    status: row.status,
    progress: row.progress,
    minutesStudied: row.minutes_studied,
    lastSessionAt: row.last_session_at ?? undefined,
    priority: row.priority,
    difficulty: row.difficulty,
    targetDate: row.target_date ?? undefined,
    importantForExam: row.important_for_exam,
    order: row.order_index,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function statusFromProgress(progress: number): ContentStatus {
  if (progress >= 1) return 'completed';
  if (progress > 0) return 'in-progress';
  return 'not-started';
}

async function readSubtopicRows(topicId: ID): Promise<SubtopicRow[]> {
  const { data, error } = await supabase
    .from('subtopics')
    .select('*')
    .eq('topic_id', topicId)
    .order('order_index', { ascending: true });
  if (error) throw error;
  return data as SubtopicRow[];
}

async function readTopicRows(unitId: ID): Promise<TopicRow[]> {
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('unit_id', unitId)
    .order('order_index', { ascending: true });
  if (error) throw error;
  return data as TopicRow[];
}

async function listUnits(subjectId: ID): Promise<Unit[]> {
  const { data, error } = await supabase
    .from('units')
    .select('*, topics(id)')
    .eq('subject_id', subjectId)
    .order('order_index', { ascending: true });
  if (error) throw error;
  return (data as (UnitRow & { topics: { id: string }[] })[]).map((row) =>
    mapUnit(row, row.topics.map((topic) => topic.id)),
  );
}

async function addUnit(subjectId: ID, title: string): Promise<Unit> {
  const userId = await getCurrentUserId();
  const { count } = await supabase
    .from('units')
    .select('id', { count: 'exact', head: true })
    .eq('subject_id', subjectId);
  const { data, error } = await supabase
    .from('units')
    .insert({ user_id: userId, subject_id: subjectId, title: title.trim(), order_index: count ?? 0 })
    .select('*')
    .single();
  if (error) throw error;
  return mapUnit(data as UnitRow, []);
}

async function updateUnit(id: ID, subjectId: ID, patch: { title?: string }): Promise<Unit[]> {
  if (patch.title !== undefined) {
    const { error } = await supabase.from('units').update({ title: patch.title.trim() }).eq('id', id);
    if (error) throw error;
  }
  return listUnits(subjectId);
}

async function removeUnit(id: ID, subjectId: ID): Promise<Unit[]> {
  const { error } = await supabase.from('units').delete().eq('id', id);
  if (error) throw error;
  await recomputeSubjectProgress(subjectId);
  return listUnits(subjectId);
}

async function listTopicsByUnit(unitId: ID): Promise<Topic[]> {
  const { data, error } = await supabase
    .from('topics')
    .select('*, subtopics(id)')
    .eq('unit_id', unitId)
    .order('order_index', { ascending: true });
  if (error) throw error;
  return (data as (TopicRow & { subtopics: { id: string }[] })[]).map((row) =>
    mapTopic(row, row.subtopics.map((subtopic) => subtopic.id)),
  );
}

/** Flat list of every topic for a subject, ordered by unit order then topic order — used by session setup and subject-level stats. */
async function listBySubject(subjectId: ID): Promise<Topic[]> {
  const units = await listUnits(subjectId);
  const unitOrderIndex = new Map(units.map((unit, index) => [unit.id, index]));
  const { data, error } = await supabase.from('topics').select('*, subtopics(id)').eq('subject_id', subjectId);
  if (error) throw error;
  const topics = (data as (TopicRow & { subtopics: { id: string }[] })[]).map((row) =>
    mapTopic(row, row.subtopics.map((subtopic) => subtopic.id)),
  );
  return topics.sort((a, b) => {
    const unitOrderA = unitOrderIndex.get(a.unitId) ?? 999;
    const unitOrderB = unitOrderIndex.get(b.unitId) ?? 999;
    return unitOrderA !== unitOrderB ? unitOrderA - unitOrderB : a.order - b.order;
  });
}

async function addTopic(unitId: ID, subjectId: ID, title: string): Promise<Topic> {
  const userId = await getCurrentUserId();
  const { count } = await supabase.from('topics').select('id', { count: 'exact', head: true }).eq('unit_id', unitId);
  const { data, error } = await supabase
    .from('topics')
    .insert({
      user_id: userId,
      subject_id: subjectId,
      unit_id: unitId,
      title: title.trim(),
      order_index: count ?? 0,
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapTopic(data as TopicRow, []);
}

interface TopicPatch {
  title?: string;
  priority?: Priority;
  difficulty?: Difficulty;
  targetDate?: ISODateString | null;
  importantForExam?: boolean;
}

async function updateTopic(id: ID, unitId: ID, patch: TopicPatch): Promise<Topic[]> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.title !== undefined) dbPatch.title = patch.title.trim();
  if (patch.priority !== undefined) dbPatch.priority = patch.priority;
  if (patch.difficulty !== undefined) dbPatch.difficulty = patch.difficulty;
  if (patch.targetDate !== undefined) dbPatch.target_date = patch.targetDate;
  if (patch.importantForExam !== undefined) dbPatch.important_for_exam = patch.importantForExam;

  const { error } = await supabase.from('topics').update(dbPatch).eq('id', id);
  if (error) throw error;
  return listTopicsByUnit(unitId);
}

async function removeTopic(id: ID, unitId: ID, subjectId: ID): Promise<Topic[]> {
  const { error } = await supabase.from('topics').delete().eq('id', id);
  if (error) throw error;
  await recomputeUnitFromTopics(unitId);
  await recomputeSubjectProgress(subjectId);
  return listTopicsByUnit(unitId);
}

/** Only meaningful for a leaf topic (no subtopics yet) — a topic with subtopics reflects their completion instead. */
async function toggleTopicComplete(id: ID, unitId: ID, subjectId: ID): Promise<Topic[]> {
  const { data: current, error: readError } = await supabase.from('topics').select('status').eq('id', id).single();
  if (readError) throw readError;
  const completed = current.status === 'completed';

  const { error } = await supabase
    .from('topics')
    .update({ status: completed ? 'not-started' : 'completed', progress: completed ? 0 : 1 })
    .eq('id', id);
  if (error) throw error;

  await recomputeUnitFromTopics(unitId);
  await recomputeSubjectProgress(subjectId);
  return listTopicsByUnit(unitId);
}

async function listSubtopicsByTopic(topicId: ID): Promise<Subtopic[]> {
  const rows = await readSubtopicRows(topicId);
  return rows.map(mapSubtopic);
}

async function listAllSubtopicsForSubject(subjectId: ID): Promise<Subtopic[]> {
  const { data, error } = await supabase.from('subtopics').select('*').eq('subject_id', subjectId);
  if (error) throw error;
  return (data as SubtopicRow[]).map(mapSubtopic);
}

async function addSubtopic(topicId: ID, subjectId: ID, title: string): Promise<Subtopic> {
  const userId = await getCurrentUserId();
  const { count } = await supabase
    .from('subtopics')
    .select('id', { count: 'exact', head: true })
    .eq('topic_id', topicId);
  const { data, error } = await supabase
    .from('subtopics')
    .insert({
      user_id: userId,
      subject_id: subjectId,
      topic_id: topicId,
      title: title.trim(),
      order_index: count ?? 0,
    })
    .select('*')
    .single();
  if (error) throw error;
  await recomputeTopicFromSubtopics(topicId);
  return mapSubtopic(data as SubtopicRow);
}

interface SubtopicPatch {
  title?: string;
  priority?: Priority;
  difficulty?: Difficulty;
  importantForExam?: boolean;
}

async function updateSubtopic(id: ID, topicId: ID, patch: SubtopicPatch): Promise<Subtopic[]> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.title !== undefined) dbPatch.title = patch.title.trim();
  if (patch.priority !== undefined) dbPatch.priority = patch.priority;
  if (patch.difficulty !== undefined) dbPatch.difficulty = patch.difficulty;
  if (patch.importantForExam !== undefined) dbPatch.important_for_exam = patch.importantForExam;

  const { error } = await supabase.from('subtopics').update(dbPatch).eq('id', id);
  if (error) throw error;
  return listSubtopicsByTopic(topicId);
}

async function removeSubtopic(id: ID, topicId: ID, unitId: ID, subjectId: ID): Promise<Subtopic[]> {
  const { error } = await supabase.from('subtopics').delete().eq('id', id);
  if (error) throw error;
  await recomputeTopicFromSubtopics(topicId);
  await recomputeUnitFromTopics(unitId);
  await recomputeSubjectProgress(subjectId);
  return listSubtopicsByTopic(topicId);
}

async function toggleSubtopicComplete(id: ID, topicId: ID, unitId: ID, subjectId: ID): Promise<Subtopic[]> {
  const { data: current, error: readError } = await supabase
    .from('subtopics')
    .select('status')
    .eq('id', id)
    .single();
  if (readError) throw readError;
  const completed = current.status === 'completed';

  const { error } = await supabase
    .from('subtopics')
    .update({ status: completed ? 'not-started' : 'completed', progress: completed ? 0 : 1 })
    .eq('id', id);
  if (error) throw error;

  await recomputeTopicFromSubtopics(topicId);
  await recomputeUnitFromTopics(unitId);
  await recomputeSubjectProgress(subjectId);
  return listSubtopicsByTopic(topicId);
}

/** A topic with no subtopics manages its own status directly and is left untouched here. */
async function recomputeTopicFromSubtopics(topicId: ID): Promise<void> {
  const children = await readSubtopicRows(topicId);
  if (children.length === 0) return;
  const progress = children.reduce((sum, subtopic) => sum + subtopic.progress, 0) / children.length;
  const { error } = await supabase
    .from('topics')
    .update({ progress, status: statusFromProgress(progress) })
    .eq('id', topicId);
  if (error) throw error;
}

async function recomputeUnitFromTopics(unitId: ID): Promise<void> {
  const children = await readTopicRows(unitId);
  const progress =
    children.length > 0 ? children.reduce((sum, topic) => sum + topic.progress, 0) / children.length : 0;
  const { error } = await supabase
    .from('units')
    .update({ progress, status: statusFromProgress(progress) })
    .eq('id', unitId);
  if (error) throw error;
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
  if (selectedIds.length === 0) return listBySubject(subjectId);

  const { data: touched, error: readError } = await supabase
    .from('topics')
    .select('id, unit_id, progress')
    .in('id', selectedIds);
  if (readError) throw readError;

  const touchedUnitIds = new Set<ID>();
  await Promise.all(
    (touched as { id: string; unit_id: string; progress: number }[]).map((topic) => {
      touchedUnitIds.add(topic.unit_id);
      const isCompleted = completedIds.includes(topic.id);
      return supabase
        .from('topics')
        .update({
          status: isCompleted ? 'completed' : 'in-progress',
          progress: isCompleted ? 1 : Math.max(topic.progress, 0.5),
          last_session_at: date,
        })
        .eq('id', topic.id);
    }),
  );

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
