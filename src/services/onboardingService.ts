import { getCurrentUserId, supabase } from '@/lib/supabase';
import { StudyMode } from '@/types';

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
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('profiles')
      .select('study_mode, max_subjects_per_week')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return { studyMode: data.study_mode, maxSubjectsPerWeek: data.max_subjects_per_week };
  },

  async setStudyModeConfig(config: StudyModeConfig): Promise<void> {
    const userId = await getCurrentUserId();
    const { error } = await supabase
      .from('profiles')
      .update({ study_mode: config.studyMode, max_subjects_per_week: config.maxSubjectsPerWeek })
      .eq('id', userId);
    if (error) throw error;
  },

  async isCompleted(): Promise<boolean> {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('profiles')
      .select('onboarding_completed_at')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return !!data.onboarding_completed_at;
  },

  async complete(): Promise<void> {
    const userId = await getCurrentUserId();
    const { error } = await supabase
      .from('profiles')
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) throw error;
  },

  /**
   * QA-only: clears the onboarding flag and signs out so the setup screens
   * can be replayed. Deliberately does NOT touch subjects/content/sessions —
   * this is real user data now, not mock data to wipe.
   */
  async reset(): Promise<void> {
    const userId = await getCurrentUserId();
    await supabase.from('profiles').update({ onboarding_completed_at: null }).eq('id', userId);
    await supabase.auth.signOut();
  },
};
