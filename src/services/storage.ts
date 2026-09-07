import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Thin JSON wrapper around AsyncStorage. All persistent app data lives in
 * Supabase now — this is only for local, per-device cache/ephemeral state
 * (e.g. recovering an in-progress study timer if the app gets killed), never
 * a source of truth for anything a user creates.
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
};

export const STORAGE_KEYS = {
  /** Snapshot of an in-progress study session timer, so it survives the app being killed mid-session. */
  activeSessionCache: 'studyflow/active-session-cache',
} as const;
