import { STORAGE_KEYS, storage } from './storage';

export interface NotificationPreferences {
  dailyReminder: boolean;
  examReminders: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  dailyReminder: true,
  examReminders: true,
};

/**
 * Mock notification preferences — no real push notifications are scheduled
 * yet (that would need `expo-notifications` + a permissions flow). This just
 * persists the user's choice locally so the real integration can read it
 * later without changing any UI.
 */
export const preferencesService = {
  async getNotificationPreferences(): Promise<NotificationPreferences> {
    return (await storage.get<NotificationPreferences>(STORAGE_KEYS.preferences)) ?? DEFAULT_NOTIFICATION_PREFERENCES;
  },

  async setNotificationPreferences(preferences: NotificationPreferences): Promise<void> {
    await storage.set(STORAGE_KEYS.preferences, preferences);
  },
};
