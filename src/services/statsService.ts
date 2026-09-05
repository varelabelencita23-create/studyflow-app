import { sessionService } from './sessionService';

function toISODateOnly(isoDateTime: string): string {
  return isoDateTime.slice(0, 10);
}

function daysAgoISODate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return toISODateOnly(date.toISOString());
}

export interface StatsOverview {
  todayMinutes: number;
  weekMinutes: number;
  monthMinutes: number;
  totalMinutes: number;
  totalSessions: number;
  streakDays: number;
}

export interface DailyActivityPoint {
  date: string; // yyyy-mm-dd
  minutes: number;
}

export interface SubjectTimeBreakdown {
  subjectId: string;
  minutes: number;
  sessionsCount: number;
}

/**
 * Aggregates real `StudySession` records (all local/mock data today) into the
 * shapes the Estadísticas dashboard renders. Swapping the underlying storage
 * for Supabase later only changes `sessionService`, not this aggregation.
 */
async function getOverview(): Promise<StatsOverview> {
  const sessions = await sessionService.listAll();
  const completed = sessions.filter((session) => session.durationSeconds > 0);

  const today = toISODateOnly(new Date().toISOString());
  const weekStart = daysAgoISODate(6);
  const monthStart = daysAgoISODate(29);

  let todaySeconds = 0;
  let weekSeconds = 0;
  let monthSeconds = 0;
  let totalSeconds = 0;
  const activeDates = new Set<string>();

  for (const session of completed) {
    const date = toISODateOnly(session.date);
    totalSeconds += session.durationSeconds;
    if (date >= monthStart) monthSeconds += session.durationSeconds;
    if (date >= weekStart) weekSeconds += session.durationSeconds;
    if (date === today) todaySeconds += session.durationSeconds;
    activeDates.add(date);
  }

  let streakDays = 0;
  let cursor = activeDates.has(today) ? 0 : 1;
  if (cursor === 1 && !activeDates.has(daysAgoISODate(1))) {
    streakDays = 0;
  } else {
    while (activeDates.has(daysAgoISODate(cursor))) {
      streakDays += 1;
      cursor += 1;
    }
  }

  return {
    todayMinutes: Math.round(todaySeconds / 60),
    weekMinutes: Math.round(weekSeconds / 60),
    monthMinutes: Math.round(monthSeconds / 60),
    totalMinutes: Math.round(totalSeconds / 60),
    totalSessions: completed.length,
    streakDays,
  };
}

async function getDailyActivity(days: number): Promise<DailyActivityPoint[]> {
  const sessions = await sessionService.listAll();
  const minutesByDate = new Map<string, number>();
  for (const session of sessions) {
    if (session.durationSeconds <= 0) continue;
    const date = toISODateOnly(session.date);
    minutesByDate.set(date, (minutesByDate.get(date) ?? 0) + session.durationSeconds / 60);
  }

  const points: DailyActivityPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = daysAgoISODate(i);
    points.push({ date, minutes: Math.round(minutesByDate.get(date) ?? 0) });
  }
  return points;
}

/** Longest run of consecutive active days across all recorded history (not just the current streak). */
async function getBestStreakDays(): Promise<number> {
  const sessions = await sessionService.listAll();
  const activeDates = new Set<string>();
  for (const session of sessions) {
    if (session.durationSeconds <= 0) continue;
    activeDates.add(toISODateOnly(session.date));
  }
  if (activeDates.size === 0) return 0;

  const sortedDates = Array.from(activeDates).sort();
  let best = 1;
  let run = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const previousDate = new Date(sortedDates[i - 1]);
    const thisDate = new Date(sortedDates[i]);
    const diffDays = Math.round((thisDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
    run = diffDays === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}

async function getSubjectTimeBreakdown(): Promise<SubjectTimeBreakdown[]> {
  const sessions = await sessionService.listAll();
  const bySubject = new Map<string, { seconds: number; count: number }>();

  for (const session of sessions) {
    if (session.durationSeconds <= 0) continue;
    const entry = bySubject.get(session.subjectId) ?? { seconds: 0, count: 0 };
    entry.seconds += session.durationSeconds;
    entry.count += 1;
    bySubject.set(session.subjectId, entry);
  }

  return Array.from(bySubject.entries()).map(([subjectId, entry]) => ({
    subjectId,
    minutes: Math.round(entry.seconds / 60),
    sessionsCount: entry.count,
  }));
}

export const statsService = {
  getOverview,
  getDailyActivity,
  getBestStreakDays,
  getSubjectTimeBreakdown,
};
