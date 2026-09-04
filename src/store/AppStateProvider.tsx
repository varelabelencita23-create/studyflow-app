import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  authService,
  DEFAULT_STUDY_MODE_CONFIG,
  onboardingService,
  StudyModeConfig,
  subjectsService,
} from '@/services';
import { Subject, User } from '@/types';

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
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [studyModeConfig, setStudyModeConfigState] = useState<StudyModeConfig>(DEFAULT_STUDY_MODE_CONFIG);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

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
      setIsLoading(false);
    })();
  }, []);

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
    setOnboardingCompleted(true);
  }, []);

  const resetOnboarding = useCallback(async () => {
    await onboardingService.reset();
    setUser(null);
    setSubjects([]);
    setStudyModeConfigState(DEFAULT_STUDY_MODE_CONFIG);
    setOnboardingCompleted(false);
  }, []);

  const value = useMemo<AppStateContextValue>(
    () => ({
      isLoading,
      user,
      subjects,
      studyModeConfig,
      onboardingCompleted,
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
    }),
    [
      isLoading,
      user,
      subjects,
      studyModeConfig,
      onboardingCompleted,
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
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within an AppStateProvider');
  return ctx;
}
