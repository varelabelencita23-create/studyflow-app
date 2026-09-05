import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  authService,
  DEFAULT_STUDY_MODE_CONFIG,
  onboardingService,
  StudyModeConfig,
  subjectsService,
  weeklyPlanService,
} from '@/services';
import { ID, Subject, User, WeekDay, WeeklyPlan } from '@/types';
import { getWeekStartISO } from '@/utils';

interface SubjectInput {
  name: string;
  shortName?: string;
  professor?: string;
}

interface AppStateContextValue {
  isLoading: boolean;
  user: User | null;
  subjects: Subject[];
  studyModeConfig: StudyModeConfig;
  onboardingCompleted: boolean;
  weekStartDate: string;
  weeklyPlan: WeeklyPlan | null;

  login: (email: string, password: string) => Promise<User>;
  register: (fullName: string, email: string, password: string) => Promise<User>;
  sendPasswordReset: (email: string) => Promise<void>;

  addSubject: (input: SubjectInput) => Promise<Subject>;
  updateSubject: (id: string, patch: Partial<SubjectInput>) => Promise<void>;
  removeSubject: (id: string) => Promise<void>;
  reorderSubjects: (orderedIds: string[]) => Promise<void>;

  setStudyModeConfig: (config: StudyModeConfig) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;

  setWeekSelectedSubjects: (subjectIds: ID[]) => Promise<void>;
  assignSubjectToDay: (day: WeekDay, subjectId: ID) => Promise<void>;
  clearDayAssignment: (day: WeekDay) => Promise<void>;

  /** Re-reads the subjects list from storage — used after a mutation made outside this context (e.g. a session finalizing and updating a subject's progress). */
  refreshSubjects: () => Promise<void>;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [studyModeConfig, setStudyModeConfigState] = useState<StudyModeConfig>(DEFAULT_STUDY_MODE_CONFIG);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [weekStartDate] = useState(() => getWeekStartISO());
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);

  useEffect(() => {
    (async () => {
      const [session, subjectList, modeConfig, completed] = await Promise.all([
        authService.getSession(),
        subjectsService.list(),
        onboardingService.getStudyModeConfig(),
        onboardingService.isCompleted(),
      ]);
      setUser(session);
      setSubjects(subjectList);
      setStudyModeConfigState(modeConfig);
      setOnboardingCompleted(completed);

      if (completed) {
        const plan = await weeklyPlanService.getOrCreate(
          weekStartDate,
          session?.id ?? 'guest',
          subjectList.map((subject) => subject.id),
          modeConfig.maxSubjectsPerWeek,
        );
        setWeeklyPlan(plan);
      }

      setIsLoading(false);
    })();
  }, [weekStartDate]);

  const login = useCallback(async (email: string, password: string) => {
    const loggedInUser = await authService.login({ email, password });
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const register = useCallback(async (fullName: string, email: string, password: string) => {
    const newUser = await authService.register({ fullName, email, password });
    setUser(newUser);
    return newUser;
  }, []);

  const sendPasswordReset = useCallback((email: string) => authService.sendPasswordReset(email), []);

  const addSubject = useCallback(
    async (input: SubjectInput) => {
      const subject = await subjectsService.add(input, user?.id ?? 'guest');
      setSubjects((current) => [...current, subject]);
      return subject;
    },
    [user],
  );

  const updateSubject = useCallback(async (id: string, patch: Partial<SubjectInput>) => {
    const next = await subjectsService.update(id, patch);
    setSubjects(next);
  }, []);

  const removeSubject = useCallback(async (id: string) => {
    const next = await subjectsService.remove(id);
    setSubjects(next);
  }, []);

  const reorderSubjects = useCallback(async (orderedIds: string[]) => {
    const next = await subjectsService.reorder(orderedIds);
    setSubjects(next);
  }, []);

  const setStudyModeConfig = useCallback(async (config: StudyModeConfig) => {
    await onboardingService.setStudyModeConfig(config);
    setStudyModeConfigState(config);
  }, []);

  const completeOnboarding = useCallback(async () => {
    await onboardingService.complete();
    const plan = await weeklyPlanService.getOrCreate(
      weekStartDate,
      user?.id ?? 'guest',
      subjects.map((subject) => subject.id),
      studyModeConfig.maxSubjectsPerWeek,
    );
    setWeeklyPlan(plan);
    setOnboardingCompleted(true);
  }, [weekStartDate, user, subjects, studyModeConfig]);

  const resetOnboarding = useCallback(async () => {
    await onboardingService.reset();
    setUser(null);
    setSubjects([]);
    setStudyModeConfigState(DEFAULT_STUDY_MODE_CONFIG);
    setOnboardingCompleted(false);
    setWeeklyPlan(null);
  }, []);

  const ensurePlan = useCallback(async () => {
    if (weeklyPlan) return weeklyPlan;
    const plan = await weeklyPlanService.getOrCreate(
      weekStartDate,
      user?.id ?? 'guest',
      subjects.map((subject) => subject.id),
      studyModeConfig.maxSubjectsPerWeek,
    );
    setWeeklyPlan(plan);
    return plan;
  }, [weeklyPlan, weekStartDate, user, subjects, studyModeConfig]);

  const setWeekSelectedSubjects = useCallback(
    async (subjectIds: ID[]) => {
      await ensurePlan();
      const next = await weeklyPlanService.setSelectedSubjects(weekStartDate, subjectIds);
      if (next) setWeeklyPlan(next);
    },
    [ensurePlan, weekStartDate],
  );

  const assignSubjectToDay = useCallback(
    async (day: WeekDay, subjectId: ID) => {
      await ensurePlan();
      const next = await weeklyPlanService.assignSubject(weekStartDate, day, subjectId);
      if (next) setWeeklyPlan(next);
    },
    [ensurePlan, weekStartDate],
  );

  const clearDayAssignment = useCallback(
    async (day: WeekDay) => {
      const next = await weeklyPlanService.clearDay(weekStartDate, day);
      if (next) setWeeklyPlan(next);
    },
    [weekStartDate],
  );

  const refreshSubjects = useCallback(async () => {
    const next = await subjectsService.list();
    setSubjects(next);
  }, []);

  const value = useMemo<AppStateContextValue>(
    () => ({
      isLoading,
      user,
      subjects,
      studyModeConfig,
      onboardingCompleted,
      weekStartDate,
      weeklyPlan,
      login,
      register,
      sendPasswordReset,
      addSubject,
      updateSubject,
      removeSubject,
      reorderSubjects,
      setStudyModeConfig,
      completeOnboarding,
      resetOnboarding,
      setWeekSelectedSubjects,
      assignSubjectToDay,
      clearDayAssignment,
      refreshSubjects,
    }),
    [
      isLoading,
      user,
      subjects,
      studyModeConfig,
      onboardingCompleted,
      weekStartDate,
      weeklyPlan,
      login,
      register,
      sendPasswordReset,
      addSubject,
      updateSubject,
      removeSubject,
      reorderSubjects,
      setStudyModeConfig,
      completeOnboarding,
      resetOnboarding,
      setWeekSelectedSubjects,
      assignSubjectToDay,
      clearDayAssignment,
      refreshSubjects,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within an AppStateProvider');
  return ctx;
}
