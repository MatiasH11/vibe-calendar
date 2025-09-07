import { create } from 'zustand';
import { JWTPayload } from '@/types/auth';

interface AuthState {
  user: JWTPayload | null;
  isAuthenticated: boolean;
  setUser: (user: JWTPayload | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  clearAuth: () => set({ user: null, isAuthenticated: false }),
}));
