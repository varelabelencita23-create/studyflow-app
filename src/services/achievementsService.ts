import { getCurrentUserId, supabase } from '@/lib/supabase';
import { Achievement, AchievementKind, Subject, WeeklyPlan } from '@/types';
import { addDaysToISODate, getTodayWeekDayIndex, WEEK_DAYS } from '@/utils';
import { sessionService } from './sessionService';
import { statsService } from './statsService';

interface UnlockedRecord {
  kind: AchievementKind;
  unlockedAt: string;
}

const DEFINITIONS: Record<AchievementKind, { title: string; description: string }> = {
  'first-session': { title: 'Primer paso', description: 'Registraste tu primera sesión de estudio.' },
  'streak-7': { title: 'Una semana seguida', description: 'Estudiaste 7 días seguidos.' },
  'streak-30': { title: 'Un mes de constancia', description: 'Estudiaste 30 días seguidos.' },
  'subject-completed': { title: 'Materia completa', description: 'Llegaste al 100% de progreso en una materia.' },
  'perfect-week': { title: 'Semana perfecta', description: 'Cumpliste con todos los días planificados de la semana.' },
};

const ALL_KINDS = Object.keys(DEFINITIONS) as AchievementKind[];

async function readUnlocked(): Promise<UnlockedRecord[]> {
  const { data, error } = await supabase.from('user_achievements').select('kind, unlocked_at');
  if (error) throw error;
  return (data as { kind: AchievementKind; unlocked_at: string }[]).map((row) => ({
    kind: row.kind,
    unlockedAt: row.unlocked_at,
  }));
}

/**
 * Simplified heuristic: only certifies "perfect week" on the last day of the
 * week (Sunday), and only when every planned day in the current weekly plan
 * has a matching study session on its exact date. Past weeks aren't tracked
 * (the app only keeps the current week's plan), so this only looks at "now".
 */
async function checkPerfectWeek(weeklyPlan: WeeklyPlan | null): Promise<boolean> {
  if (!weeklyPlan || weeklyPlan.assignments.length === 0) return false;
  if (getTodayWeekDayIndex() !== 6) return false;

  const sessions = await sessionService.listAll();
  return weeklyPlan.assignments.every((assignment) => {
    const dayIndex = WEEK_DAYS.findIndex((day) => day.key === assignment.day);
    const date = addDaysToISODate(weeklyPlan.weekStartDate, dayIndex);
    return sessions.some(
      (session) =>
        session.subjectId === assignment.subjectId &&
        session.durationSeconds > 0 &&
        session.date.slice(0, 10) === date,
    );
  });
}

/**
 * Evaluates the 5 fixed achievement kinds against real app data and persists
 * (once) the first moment each is met, so it stays unlocked afterwards even
 * if the underlying condition later stops being true (e.g. a streak breaks).
 */
async function evaluateAndUnlock(params: { subjects: Subject[]; weeklyPlan: WeeklyPlan | null }): Promise<Achievement[]> {
  const unlocked = await readUnlocked();
  const unlockedKinds = new Set(unlocked.map((record) => record.kind));

  const [sessions, bestStreak, perfectWeek] = await Promise.all([
    sessionService.listAll(),
    statsService.getBestStreakDays(),
    checkPerfectWeek(params.weeklyPlan),
  ]);

  const met: Record<AchievementKind, boolean> = {
    'first-session': sessions.some((session) => session.durationSeconds > 0),
    'streak-7': bestStreak >= 7,
    'streak-30': bestStreak >= 30,
    'subject-completed': params.subjects.some((subject) => subject.progress >= 0.999),
    'perfect-week': perfectWeek,
  };

  const now = new Date().toISOString();
  const newlyUnlockedKinds = ALL_KINDS.filter((kind) => met[kind] && !unlockedKinds.has(kind));

  if (newlyUnlockedKinds.length > 0) {
    const userId = await getCurrentUserId();
    const { error } = await supabase
      .from('user_achievements')
      .insert(newlyUnlockedKinds.map((kind) => ({ user_id: userId, kind, unlocked_at: now })));
    if (error) throw error;
  }

  const allUnlocked =
    newlyUnlockedKinds.length > 0
      ? [...unlocked, ...newlyUnlockedKinds.map((kind) => ({ kind, unlockedAt: now }))]
      : unlocked;

  return ALL_KINDS.map((kind) => {
    const record = allUnlocked.find((item) => item.kind === kind);
    return {
      id: kind,
      kind,
      title: DEFINITIONS[kind].title,
      description: DEFINITIONS[kind].description,
      unlockedAt: record?.unlockedAt,
    };
  });
}

export const achievementsService = {
  evaluateAndUnlock,
};
