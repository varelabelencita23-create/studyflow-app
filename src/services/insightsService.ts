import { AppNotification } from '@/types';
import { formatDuration, getTodayWeekDayIndex, WEEK_DAYS } from '@/utils';
import { examService } from './examService';
import { sessionService } from './sessionService';
import { statsService } from './statsService';
import { subjectsService } from './subjectsService';

/**
 * Builds a small feed of rule-based insights from real app data (sessions,
 * subjects, exams) — nothing is invented or hardcoded. Each insight is only
 * included when its underlying condition is meaningfully true, so a fresh
 * account with no data simply gets an empty feed instead of fake content.
 * These aren't persisted notifications: they're recomputed fresh every time
 * the Estadísticas screen loads (same "derived-on-read" pattern used
 * elsewhere in this app), so `read` is always false and `id` is deterministic
 * per rule rather than a stored record.
 */
async function getInsights(): Promise<AppNotification[]> {
  const now = new Date().toISOString();
  const insights: AppNotification[] = [];

  const [subjects, sessions, exams, overview, timeBreakdown, dailyActivity] = await Promise.all([
    subjectsService.list(),
    sessionService.listAll(),
    examService.listAll(),
    statsService.getOverview(),
    statsService.getSubjectTimeBreakdown(),
    statsService.getDailyActivity(14),
  ]);
  const activeSubjects = subjects.filter((subject) => !subject.archived);
  const completedSessions = sessions.filter((session) => session.durationSeconds > 0);

  // Racha activa
  if (overview.streakDays >= 3) {
    insights.push({
      id: 'insight-streak',
      kind: 'streak',
      title: `¡Racha de ${overview.streakDays} días!`,
      body: 'Seguís estudiando día a día. No cortes la cadena.',
      createdAt: now,
      read: false,
    });
  }

  // Parcial más urgente con ritmo atrasado
  const examSubjectPairs: { exam: (typeof exams)[number]; subject: (typeof activeSubjects)[number] }[] = [];
  for (const exam of exams) {
    const subject = activeSubjects.find((item) => item.id === exam.subjectId);
    if (subject) examSubjectPairs.push({ exam, subject });
  }

  const readinessResults = await Promise.all(
    examSubjectPairs.map(async ({ exam, subject }) => ({
      exam,
      subject,
      readiness: await examService.getReadiness(exam, subject.progress),
    })),
  );

  const mostUrgentBehind = readinessResults
    .filter((item) => item.readiness.daysRemaining >= 0 && item.readiness.pace === 'behind')
    .sort((a, b) => a.readiness.daysRemaining - b.readiness.daysRemaining)[0];

  if (mostUrgentBehind) {
    insights.push({
      id: `insight-exam-${mostUrgentBehind.exam.id}`,
      kind: 'exam-alert',
      title: `Vas atrasada para ${mostUrgentBehind.exam.title}`,
      body: `Faltan ${mostUrgentBehind.readiness.daysRemaining} días y tu ritmo actual no alcanza. Reforzá ${mostUrgentBehind.subject.name}.`,
      createdAt: now,
      read: false,
      subjectId: mostUrgentBehind.subject.id,
    });
  }

  // Materia a la que más tiempo le dedicaste
  if (timeBreakdown.length >= 2) {
    const top = [...timeBreakdown].sort((a, b) => b.minutes - a.minutes)[0];
    const subject = activeSubjects.find((item) => item.id === top.subjectId);
    if (subject && top.minutes > 0) {
      insights.push({
        id: 'insight-top-subject',
        kind: 'insight',
        title: `${subject.name} es tu materia con más tiempo`,
        body: `Le dedicaste ${formatDuration(top.minutes * 60)} en total, más que a cualquier otra materia.`,
        createdAt: now,
        read: false,
        subjectId: subject.id,
      });
    }
  }

  // Día de la semana más productivo (histórico)
  if (completedSessions.length >= 5) {
    const minutesByWeekday = new Array(7).fill(0);
    for (const session of completedSessions) {
      const weekdayIndex = getTodayWeekDayIndex(new Date(session.date));
      minutesByWeekday[weekdayIndex] += session.durationSeconds / 60;
    }
    const maxMinutes = Math.max(...minutesByWeekday);
    if (maxMinutes > 0) {
      const bestIndex = minutesByWeekday.indexOf(maxMinutes);
      insights.push({
        id: 'insight-productive-day',
        kind: 'insight',
        title: `Tu día más productivo es ${WEEK_DAYS[bestIndex].label.toLowerCase()}`,
        body: `Es el día en el que más estudiaste, sumando todas tus sesiones.`,
        createdAt: now,
        read: false,
      });
    }
  }

  // Tendencia semanal (últimos 7 días vs los 7 anteriores)
  if (dailyActivity.length === 14) {
    const previousWeek = dailyActivity.slice(0, 7).reduce((sum, day) => sum + day.minutes, 0);
    const thisWeek = dailyActivity.slice(7, 14).reduce((sum, day) => sum + day.minutes, 0);
    if (previousWeek > 0) {
      const changePercent = Math.round(((thisWeek - previousWeek) / previousWeek) * 100);
      if (Math.abs(changePercent) >= 15) {
        const isUp = changePercent > 0;
        insights.push({
          id: 'insight-week-trend',
          kind: 'insight',
          title: isUp ? `Estudiaste ${changePercent}% más que la semana pasada` : `Estudiaste ${Math.abs(changePercent)}% menos que la semana pasada`,
          body: isUp ? 'Buen impulso — mantené el ritmo.' : 'Nada grave, pero podés retomar el ritmo esta semana.',
          createdAt: now,
          read: false,
        });
      }
    }
  }

  return insights;
}

export const insightsService = {
  getInsights,
};
