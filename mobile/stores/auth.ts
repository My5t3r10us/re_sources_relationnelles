import { create } from 'zustand';
import { saveToken, getToken, deleteToken, saveUser, getUser, deleteUser } from '@/lib/storage';
import type { User } from '@/types/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (user: User, token: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  setAuth: async (user, token) => {
    await Promise.all([saveToken(token), saveUser(user)]);
    set({ user, token, isLoading: false });
  },

  clearAuth: async () => {
    await Promise.all([deleteToken(), deleteUser()]);
    set({ user: null, token: null, isLoading: false });
  },

  loadFromStorage: async () => {
    set({ isLoading: true });
    const [token, user] = await Promise.all([getToken(), getUser<User>()]);
    set({ token, user, isLoading: false });
  },
}));
