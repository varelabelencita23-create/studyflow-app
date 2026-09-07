import { supabase } from '@/lib/supabase';
import { User } from '@/types';

interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface ProfileRow {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  study_mode: User['studyMode'];
  max_subjects_per_week: number;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapProfile(row: ProfileRow): User {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    avatarUrl: row.avatar_url ?? undefined,
    studyMode: row.study_mode,
    maxSubjectsPerWeek: row.max_subjects_per_week,
    onboardingCompletedAt: row.onboarding_completed_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchProfile(userId: string): Promise<User> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) throw error;
  return mapProfile(data as ProfileRow);
}

export const authService = {
  /** Reads the session Supabase already restored from AsyncStorage on launch. */
  async getSession(): Promise<User | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!data.session) return null;
    return fetchProfile(data.session.user.id);
  },

  async register({ fullName, email, password }: RegisterInput): Promise<User> {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { full_name: fullName.trim() } },
    });
    if (error) throw error;
    if (!data.user) {
      throw new Error('No se pudo crear la cuenta. Intentá de nuevo.');
    }
    if (!data.session) {
      // Email confirmation is required before a session exists.
      throw new Error('Te enviamos un email de confirmación. Confirmá tu cuenta y volvé a iniciar sesión.');
    }
    // The `handle_new_user` trigger inserts the profiles row synchronously
    // within the same signup transaction, so it's already there to read.
    return fetchProfile(data.user.id);
  },

  async login({ email, password }: LoginInput): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw error;
    return fetchProfile(data.user.id);
  },

  async sendPasswordReset(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
    if (error) throw error;
  },

  async updateUser(patch: Partial<Pick<User, 'fullName' | 'email'>>): Promise<User> {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    const userId = sessionData.session?.user.id;
    if (!userId) throw new Error('No hay una sesión activa.');

    if (patch.email) {
      const { error: authError } = await supabase.auth.updateUser({ email: patch.email.trim().toLowerCase() });
      if (authError) throw authError;
    }

    const profilePatch: Partial<Pick<ProfileRow, 'full_name' | 'email'>> = {};
    if (patch.fullName) profilePatch.full_name = patch.fullName.trim();
    if (patch.email) profilePatch.email = patch.email.trim().toLowerCase();

    if (Object.keys(profilePatch).length > 0) {
      const { error } = await supabase.from('profiles').update(profilePatch).eq('id', userId);
      if (error) throw error;
    }

    return fetchProfile(userId);
  },

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
};
