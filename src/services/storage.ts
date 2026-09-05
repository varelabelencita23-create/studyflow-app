import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Thin JSON wrapper around AsyncStorage. Every mock service reads/writes
 * through here so that swapping local persistence for Supabase later only
 * touches this file's call sites, not the UI.
 */
export const storage = {
  async get<T>(key: string): Promise<T | null> {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  },
  async set<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },
  async multiRemove(keys: string[]): Promise<void> {
    await AsyncStorage.multiRemove(keys);
  },
};

export const STORAGE_KEYS = {
  session: 'studyflow/session',
  subjects: 'studyflow/subjects',
  studyModeConfig: 'studyflow/study-mode-config',
  onboardingCompleted: 'studyflow/onboarding-completed',
  weeklyPlanPrefix: 'studyflow/weekly-plan/',
  topics: 'studyflow/topics',
  sessions: 'studyflow/sessions',
} as const;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Simulates network latency for mock service calls. */
export const mockNetworkDelay = () => delay(600);
