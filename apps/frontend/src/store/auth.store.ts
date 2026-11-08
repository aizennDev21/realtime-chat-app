import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: 'USER' | 'ADMIN';
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null, accessToken: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  setUser: (user, accessToken) => set({ user, accessToken, isAuthenticated: !!user }),
  logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
}));
