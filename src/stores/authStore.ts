import { create } from 'zustand';
import { User } from '../types';
import { authService } from '../services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (identifier: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  initializeAuth: () => Promise<void>;
  updateUser: (user: User, token: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  clearError: () => set({ error: null }),

  login: async (identifier: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { user, token } = await authService.login(identifier, password);
      localStorage.setItem('token', token);
      set({ user, isAuthenticated: true, isLoading: false });
      return true;
    } catch (error) {
      console.error('Login error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to login', 
        isLoading: false 
      });
      return false;
    }
  },

  register: async (username: string, email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { user, token } = await authService.register(username, email, password);
      localStorage.setItem('token', token);
      set({ user, isAuthenticated: true, isLoading: false });
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to register', 
        isLoading: false 
      });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, isAuthenticated: false, error: null });
  },

  initializeAuth: async () => {
    set({ isLoading: true, error: null });
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const user = await authService.getCurrentUser();
        set({ user, isAuthenticated: true, isLoading: false });
      } catch (error) {
        console.error('Failed to restore session:', error);
        localStorage.removeItem('token');
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },

  updateUser: (user: User, token: string) => {
    localStorage.setItem('token', token);
    set({ user, isAuthenticated: true });
  }
}));

// Listen for auth errors
window.addEventListener('auth-error', () => {
  useAuthStore.getState().logout();
});