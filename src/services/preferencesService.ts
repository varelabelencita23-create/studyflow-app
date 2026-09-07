import { getCurrentUserId, supabase } from '@/lib/supabase';

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
 * persists the user's choice in Postgres so the real integration can read it
 * later without changing any UI.
 */
export const preferencesService = {
  async getNotificationPreferences(): Promise<NotificationPreferences> {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('daily_reminder, exam_reminders')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return DEFAULT_NOTIFICATION_PREFERENCES;
    return { dailyReminder: data.daily_reminder, examReminders: data.exam_reminders };
  },

  async setNotificationPreferences(preferences: NotificationPreferences): Promise<void> {
    const userId = await getCurrentUserId();
    const { error } = await supabase.from('notification_preferences').upsert({
      user_id: userId,
      daily_reminder: preferences.dailyReminder,
      exam_reminders: preferences.examReminders,
    });
    if (error) throw error;
  },
};
