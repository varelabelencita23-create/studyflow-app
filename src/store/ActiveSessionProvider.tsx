import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { contentService, sessionService } from '@/services';
import { ID } from '@/types';
import { useAppState } from './AppStateProvider';

export interface ActiveSession {
  subjectId: ID;
  subjectName: string;
  contentIds: ID[];
  goalMinutes: number | null;
  accumulatedMs: number;
  isRunning: boolean;
  lastResumeAt: number;
}

export interface SessionSummary {
  subjectId: ID;
  subjectName: string;
  durationSeconds: number;
  contentsSelectedCount: number;
  contentsCompletedCount: number;
  progressBefore: number;
  progressAfter: number;
  goalMinutes: number | null;
  goalMet: boolean;
}

interface ActiveSessionContextValue {
  activeSession: ActiveSession | null;
  startSession: (subjectId: ID, subjectName: string, contentIds: ID[], goalMinutes: number | null) => void;
  pause: () => void;
  resume: () => void;
  discardSession: () => void;
  finalize: (completedContentIds: ID[]) => Promise<SessionSummary>;
}

const ActiveSessionContext = createContext<ActiveSessionContextValue | null>(null);

/** Elapsed milliseconds for the current active session, computed from wall-clock timestamps (safe across app backgrounding). */
export function getElapsedMs(session: ActiveSession): number {
  const runningSegment = session.isRunning ? Date.now() - session.lastResumeAt : 0;
  return session.accumulatedMs + runningSegment;
}

export function ActiveSessionProvider({ children }: { children: ReactNode }) {
  const { subjects, refreshSubjects } = useAppState();
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);

  const startSession = useCallback(
    (subjectId: ID, subjectName: string, contentIds: ID[], goalMinutes: number | null) => {
      setActiveSession({
        subjectId,
        subjectName,
        contentIds,
        goalMinutes,
        accumulatedMs: 0,
        isRunning: true,
        lastResumeAt: Date.now(),
      });
    },
    [],
  );

  const pause = useCallback(() => {
    setActiveSession((current) => {
      if (!current || !current.isRunning) return current;
      return {
        ...current,
        isRunning: false,
        accumulatedMs: current.accumulatedMs + (Date.now() - current.lastResumeAt),
      };
    });
  }, []);

  const resume = useCallback(() => {
    setActiveSession((current) => {
      if (!current || current.isRunning) return current;
      return { ...current, isRunning: true, lastResumeAt: Date.now() };
    });
  }, []);

  const discardSession = useCallback(() => {
    setActiveSession(null);
  }, []);

  const finalize = useCallback(
    async (completedContentIds: ID[]): Promise<SessionSummary> => {
      if (!activeSession) {
        throw new Error('No hay una sesión activa para finalizar.');
      }

      const durationSeconds = Math.round(getElapsedMs(activeSession) / 1000);
      const date = new Date().toISOString();
      const subject = subjects.find((item) => item.id === activeSession.subjectId);
      const progressBefore = subject?.progress ?? 0;

      await contentService.applySessionOutcome(
        activeSession.subjectId,
        activeSession.contentIds,
        completedContentIds,
        date,
      );
      const progressAfter = await contentService.recomputeSubjectProgress(activeSession.subjectId);

      const goalMet = activeSession.goalMinutes ? durationSeconds / 60 >= activeSession.goalMinutes : false;

      await sessionService.create({
        subjectId: activeSession.subjectId,
        contentIds: activeSession.contentIds,
        date,
        durationSeconds,
        status: 'completed',
        goalMinutes: activeSession.goalMinutes ?? undefined,
        goalMet: activeSession.goalMinutes ? goalMet : undefined,
        progressBefore,
        progressAfter,
      });

      await refreshSubjects();
      setActiveSession(null);

      return {
        subjectId: activeSession.subjectId,
        subjectName: activeSession.subjectName,
        durationSeconds,
        contentsSelectedCount: activeSession.contentIds.length,
        contentsCompletedCount: completedContentIds.length,
        progressBefore,
        progressAfter,
        goalMinutes: activeSession.goalMinutes,
        goalMet,
      };
    },
    [activeSession, subjects, refreshSubjects],
  );

  const value = useMemo<ActiveSessionContextValue>(
    () => ({ activeSession, startSession, pause, resume, discardSession, finalize }),
    [activeSession, startSession, pause, resume, discardSession, finalize],
  );

  return <ActiveSessionContext.Provider value={value}>{children}</ActiveSessionContext.Provider>;
}

export function useActiveSession() {
  const ctx = useContext(ActiveSessionContext);
  if (!ctx) throw new Error('useActiveSession must be used within an ActiveSessionProvider');
  return ctx;
}
