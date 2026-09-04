import { User } from '@/types';
import { generateId } from '@/utils';
import { mockNetworkDelay, STORAGE_KEYS, storage } from './storage';

/**
 * Mock auth backed by local storage. Every method mirrors the shape a real
 * Supabase Auth call would have (async, throws on failure) so this file is
 * the only thing that needs to change when Supabase is introduced.
 */

interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

function createUser(fullName: string, email: string): User {
  const now = new Date().toISOString();
  return {
    id: generateId('user'),
    fullName,
    email: email.trim().toLowerCase(),
    studyMode: 'standard',
    maxSubjectsPerWeek: 3,
    createdAt: now,
    updatedAt: now,
  };
}

export const authService = {
  async getSession(): Promise<User | null> {
    return storage.get<User>(STORAGE_KEYS.session);
  },

  async register({ fullName, email, password }: RegisterInput): Promise<User> {
    await mockNetworkDelay();
    if (password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres.');
    }
    const user = createUser(fullName.trim(), email);
    await storage.set(STORAGE_KEYS.session, user);
    return user;
  },

  async login({ email, password }: LoginInput): Promise<User> {
    await mockNetworkDelay();
    if (password.length < 6) {
      throw new Error('Email o contraseña incorrectos.');
    }
    const existing = await storage.get<User>(STORAGE_KEYS.session);
    const user = existing && existing.email === email.trim().toLowerCase()
      ? existing
      : createUser(email.split('@')[0], email);
    await storage.set(STORAGE_KEYS.session, user);
    return user;
  },

  async sendPasswordReset(email: string): Promise<void> {
    await mockNetworkDelay();
    if (!email.trim()) {
      throw new Error('Ingresá un email válido.');
    }
  },

  async updateUser(patch: Partial<User>): Promise<User> {
    const current = await storage.get<User>(STORAGE_KEYS.session);
    if (!current) throw new Error('No hay una sesión activa.');
    const updated: User = { ...current, ...patch, updatedAt: new Date().toISOString() };
    await storage.set(STORAGE_KEYS.session, updated);
    return updated;
  },

  async logout(): Promise<void> {
    await storage.remove(STORAGE_KEYS.session);
  },
};
