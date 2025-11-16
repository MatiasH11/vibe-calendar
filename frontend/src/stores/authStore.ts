import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { JWTPayload } from '@/types/auth';
import { authApi } from '@/api/authApi';
import type { User, Employee, LoginInput, RegisterInput } from '@/api/authApi';

/**
 * Auth Store - Refactored to integrate with new API pattern
 *
 * This store now focuses on:
 * - Cross-component auth state (user, authentication status)
 * - Convenience methods that wrap authApi
 * - Token synchronization with API client
 *
 * API calls are delegated to authApi module for consistency
 */

interface AuthState {
  // State
  user: JWTPayload | null;
  isAuthenticated: boolean;

  // Basic setters (for use by components)
  setUser: (user: JWTPayload | null) => void;
  clearAuth: () => void;

  // Enhanced methods that integrate with authApi
  login: (credentials: LoginInput) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterInput) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;

  // Utility methods
  initializeFromToken: () => void;
  refreshUserFromToken: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,

      // Basic setters (backward compatibility)
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      clearAuth: () => set({ user: null, isAuthenticated: false }),

      // Enhanced login method that uses authApi
      login: async (credentials: LoginInput) => {
        try {
          const response = await authApi.login(credentials);

          if (response.success && response.data) {
            const { user: userData, employee } = response.data;

            // Create JWTPayload from response
            const jwtPayload: JWTPayload = {
              user_id: userData.id,
              email: userData.email,
              user_type: userData.user_type,
              admin_company_id: employee.company_id,
              employee_id: employee.id,
              company_role: employee.company_role,
            };

            // Update store state
            set({ user: jwtPayload, isAuthenticated: true });

            return { success: true };
          }

          return { success: false, error: 'Login failed' };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Login failed'
          };
        }
      },

      // Enhanced register method that uses authApi
      register: async (data: RegisterInput) => {
        try {
          const response = await authApi.register(data);

          if (response.success) {
            return { success: true };
          }

          return { success: false, error: 'Registration failed' };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Registration failed'
          };
        }
      },

      // Enhanced logout method that uses authApi
      logout: async () => {
        await authApi.logout();
        set({ user: null, isAuthenticated: false });
      },

      // Initialize auth state from existing token
      initializeFromToken: () => {
        const userData = authApi.getUserFromToken();
        if (userData) {
          const jwtPayload: JWTPayload = {
            user_id: userData.id || 0,
            email: userData.email || '',
            user_type: userData.user_type || 'USER',
            admin_company_id: userData.admin_company_id || 0,
            employee_id: userData.employee_id || 0,
            company_role: userData.company_role || 'EMPLOYEE',
          };
          set({ user: jwtPayload, isAuthenticated: true });
        } else {
          set({ user: null, isAuthenticated: false });
        }
      },

      // Refresh user data from token
      refreshUserFromToken: () => {
        get().initializeFromToken();
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        // Only persist authentication status, not the full user object
        // User data will be refreshed from token on initialization
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
