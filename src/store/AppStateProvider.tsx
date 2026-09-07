import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
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
  updateUser: (patch: Partial<Pick<User, 'fullName' | 'email'>>) => Promise<User>;
  logout: () => Promise<void>;

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

  const weekStartDateRef = useRef(weekStartDate);
  weekStartDateRef.current = weekStartDate;

  /** Populates subjects/onboarding/weekly-plan for a just-known-signed-in user. */
  const loadForUser = useCallback(async (sessionUser: User) => {
    const [subjectList, modeConfig, completed] = await Promise.all([
      subjectsService.list(),
      onboardingService.getStudyModeConfig(),
      onboardingService.isCompleted(),
    ]);
    setSubjects(subjectList);
    setStudyModeConfigState(modeConfig);
    setOnboardingCompleted(completed);

    if (completed) {
      const plan = await weeklyPlanService.getOrCreate(
        weekStartDateRef.current,
        sessionUser.id,
        subjectList.map((subject) => subject.id),
        modeConfig.maxSubjectsPerWeek,
      );
      setWeeklyPlan(plan);
    } else {
      setWeeklyPlan(null);
    }
  }, []);

  const clearForSignedOut = useCallback(() => {
    setSubjects([]);
    setStudyModeConfigState(DEFAULT_STUDY_MODE_CONFIG);
    setOnboardingCompleted(false);
    setWeeklyPlan(null);
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      const session = await authService.getSession();
      if (!active) return;
      setUser(session);
      if (session) await loadForUser(session);
      if (active) setIsLoading(false);
    })();

    // Reacts to sign-out triggered from anywhere (this screen, token expiry,
    // another tab) so the app never shows stale data for a session that's
    // no longer valid — this is what actually protects routes, not the
    // one-time check above.
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        clearForSignedOut();
      }
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [loadForUser, clearForSignedOut]);

  const login = useCallback(
    async (email: string, password: string) => {
      const loggedInUser = await authService.login({ email, password });
      setUser(loggedInUser);
      await loadForUser(loggedInUser);
      return loggedInUser;
    },
    [loadForUser],
  );

  const register = useCallback(
    async (fullName: string, email: string, password: string) => {
      const newUser = await authService.register({ fullName, email, password });
      setUser(newUser);
      await loadForUser(newUser);
      return newUser;
    },
    [loadForUser],
  );

  const sendPasswordReset = useCallback((email: string) => authService.sendPasswordReset(email), []);

  const logout = useCallback(async () => {
    await authService.logout();
    // state cleanup happens via the onAuthStateChange listener above
  }, []);

  const updateUser = useCallback(async (patch: Partial<Pick<User, 'fullName' | 'email'>>) => {
    const updated = await authService.updateUser(patch);
    setUser(updated);
    return updated;
  }, []);

  const addSubject = useCallback(
    async (input: SubjectInput) => {
      if (!user) throw new Error('No hay una sesión activa.');
      const subject = await subjectsService.add(input, user.id);
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
    if (!user) throw new Error('No hay una sesión activa.');
    await onboardingService.complete();
    const plan = await weeklyPlanService.getOrCreate(
      weekStartDate,
      user.id,
      subjects.map((subject) => subject.id),
      studyModeConfig.maxSubjectsPerWeek,
    );
    setWeeklyPlan(plan);
    setOnboardingCompleted(true);
  }, [weekStartDate, user, subjects, studyModeConfig]);

  const resetOnboarding = useCallback(async () => {
    await onboardingService.reset();
    // state cleanup happens via the onAuthStateChange listener above
  }, []);

  const ensurePlan = useCallback(async () => {
    if (weeklyPlan) return weeklyPlan;
    if (!user) throw new Error('No hay una sesión activa.');
    const plan = await weeklyPlanService.getOrCreate(
      weekStartDate,
      user.id,
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
      updateUser,
      logout,
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
      updateUser,
      logout,
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
