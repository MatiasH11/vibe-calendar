/**
 * Auth API Module
 *
 * Handles authentication-related API operations including login, register,
 * and logout. Integrates with ApiClient for token management.
 */

import { apiClient } from '@/lib/api';
import type { ApiResponse } from '@/types/api';

// ============================================================================
// Types
// ============================================================================

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  company_name: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  user_type: 'SUPER_ADMIN' | 'USER';
}

export interface Employee {
  id: number;
  company_id: number;
  company_name: string;
  department: string | null;
  company_role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  position: string | null;
}

export interface LoginResponse {
  token: string;
  user: User;
  employee: Employee;
}

export interface RegisterResponse {
  company_id: number;
  user_id: number;
  employee_id: number;
}

// ============================================================================
// API Methods
// ============================================================================

export const authApi = {
  /**
   * Login user with email and password
   *
   * @param credentials - Email and password
   * @returns Login response with token and user data
   */
  async login(credentials: LoginInput): Promise<ApiResponse<LoginResponse>> {
    const response = await apiClient.post<LoginResponse>('/api/v1/auth/login', credentials);

    // Store token in apiClient after successful login
    if (response.success && response.data?.token) {
      apiClient.setToken(response.data.token);
    }

    return response;
  },

  /**
   * Register new company and user
   *
   * @param data - Registration data including company and user info
   * @returns Registration response with IDs
   */
  async register(data: RegisterInput): Promise<ApiResponse<RegisterResponse>> {
    const response = await apiClient.post<RegisterResponse>('/api/v1/auth/register', data);

    return response;
  },

  /**
   * Logout current user
   * Clears the authentication token from the client
   */
  async logout(): Promise<void> {
    // Clear token from apiClient
    apiClient.clearToken();

    // Clear token from localStorage if stored there
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      // Also clear from cookies if present
      document.cookie = 'auth_token=; Max-Age=0; path=/;';
    }
  },

  /**
   * Check if user is currently authenticated
   *
   * @returns True if authenticated, false otherwise
   */
  isAuthenticated(): boolean {
    return apiClient.isAuthenticated();
  },

  /**
   * Get current auth token
   *
   * @returns Current token or null if not authenticated
   */
  getToken(): string | null {
    return apiClient.getToken();
  },

  /**
   * Set authentication token manually
   * Useful for scenarios like SSR or token refresh
   *
   * @param token - JWT token
   */
  setToken(token: string): void {
    apiClient.setToken(token);
  },

  /**
   * Verify token validity
   * Note: This is a client-side check based on token presence.
   * For true verification, the backend should be queried.
   *
   * @returns True if token exists and appears valid
   */
  async verifyToken(): Promise<boolean> {
    const token = apiClient.getToken();

    if (!token) {
      return false;
    }

    try {
      // Decode JWT to check expiration (basic check)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);

      // Check if token is expired
      if (payload.exp && payload.exp < now) {
        // Token expired, clear it
        apiClient.clearToken();
        return false;
      }

      return true;
    } catch (error) {
      // Invalid token format
      apiClient.clearToken();
      return false;
    }
  },

  /**
   * Get user data from token
   * Extracts user information from JWT payload
   *
   * @returns User data from token or null if not available
   */
  getUserFromToken(): Partial<User & { admin_company_id: number; employee_id: number; company_role: string }> | null {
    const token = apiClient.getToken();

    if (!token) {
      return null;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      return {
        id: payload.user_id,
        email: payload.email,
        user_type: payload.user_type,
        admin_company_id: payload.admin_company_id,
        employee_id: payload.employee_id,
        company_role: payload.company_role,
      };
    } catch (error) {
      return null;
    }
  },

  /**
   * Refresh authentication token
   * Note: This assumes the backend supports token refresh.
   * If not implemented, this will need to be adjusted.
   *
   * @returns New token or null if refresh failed
   */
  async refreshToken(): Promise<string | null> {
    try {
      // Check if refresh endpoint exists
      // This is a placeholder - adjust based on actual backend implementation
      const response = await apiClient.post<{ token: string }>('/api/v1/auth/refresh', {});

      if (response.success && response.data?.token) {
        apiClient.setToken(response.data.token);
        return response.data.token;
      }

      return null;
    } catch (error) {
      // Refresh not supported or failed
      return null;
    }
  },
};

export default authApi;
