import { StudyMode } from '@/types';
import { STORAGE_KEYS, storage } from './storage';

export interface StudyModeConfig {
  studyMode: StudyMode;
  maxSubjectsPerWeek: number;
}

export const DEFAULT_STUDY_MODE_CONFIG: StudyModeConfig = {
  studyMode: 'standard',
  maxSubjectsPerWeek: 3,
};

export const onboardingService = {
  async getStudyModeConfig(): Promise<StudyModeConfig> {
    return (await storage.get<StudyModeConfig>(STORAGE_KEYS.studyModeConfig)) ?? DEFAULT_STUDY_MODE_CONFIG;
  },

  async setStudyModeConfig(config: StudyModeConfig): Promise<void> {
    await storage.set(STORAGE_KEYS.studyModeConfig, config);
  },

  async isCompleted(): Promise<boolean> {
    return (await storage.get<boolean>(STORAGE_KEYS.onboardingCompleted)) ?? false;
  },

  async complete(): Promise<void> {
    await storage.set(STORAGE_KEYS.onboardingCompleted, true);
  },

  /** Dev-only helper to replay the onboarding flow from scratch. */
  async reset(): Promise<void> {
    await storage.multiRemove([
      STORAGE_KEYS.session,
      STORAGE_KEYS.subjects,
      STORAGE_KEYS.studyModeConfig,
      STORAGE_KEYS.onboardingCompleted,
    ]);
  },
};
