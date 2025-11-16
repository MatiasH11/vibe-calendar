/**
 * Tests for authApi module
 *
 * Tests authentication operations including login, register, logout,
 * and token management.
 */

import { authApi } from '../authApi';
import { apiClient } from '@/lib/api';
import type { LoginInput, RegisterInput, LoginResponse } from '../authApi';

// Mock apiClient
jest.mock('@/lib/api', () => ({
  apiClient: {
    post: jest.fn(),
    setToken: jest.fn(),
    clearToken: jest.fn(),
    getToken: jest.fn(),
    isAuthenticated: jest.fn(),
  },
}));

describe('authApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('login', () => {
    it('should login user and store token', async () => {
      const credentials: LoginInput = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockResponse: LoginResponse = {
        token: 'test-jwt-token',
        user: {
          id: 1,
          first_name: 'John',
          last_name: 'Doe',
          email: 'test@example.com',
          user_type: 'USER',
        },
        employee: {
          id: 1,
          company_id: 1,
          company_name: 'Test Company',
          department: 'Engineering',
          company_role: 'EMPLOYEE',
          position: 'Developer',
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue({
        success: true,
        data: mockResponse,
      });

      const result = await authApi.login(credentials);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/v1/auth/login',
        credentials
      );
      expect(apiClient.setToken).toHaveBeenCalledWith('test-jwt-token');
      expect(result.data).toEqual(mockResponse);
    });

    it('should handle login failure', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });

      const result = await authApi.login({
        email: 'test@example.com',
        password: 'wrong',
      });

      expect(result.success).toBe(false);
      expect(apiClient.setToken).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('should register new user and company', async () => {
      const data: RegisterInput = {
        company_name: 'New Company',
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        password: 'password123',
      };

      const mockResponse = {
        company_id: 1,
        user_id: 1,
        employee_id: 1,
      };

      (apiClient.post as jest.Mock).mockResolvedValue({
        success: true,
        data: mockResponse,
      });

      const result = await authApi.register(data);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/v1/auth/register',
        data
      );
      expect(result.data).toEqual(mockResponse);
    });

    it('should handle registration failure', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Email already exists',
      });

      const result = await authApi.register({
        company_name: 'Company',
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'existing@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('logout', () => {
    it('should clear token from apiClient', async () => {
      await authApi.logout();

      expect(apiClient.clearToken).toHaveBeenCalled();
    });

    it('should clear token from localStorage if available', async () => {
      // Mock window object
      const mockLocalStorage = {
        removeItem: jest.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
      });

      await authApi.logout();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token');
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when authenticated', () => {
      (apiClient.isAuthenticated as jest.Mock).mockReturnValue(true);

      const result = authApi.isAuthenticated();

      expect(result).toBe(true);
      expect(apiClient.isAuthenticated).toHaveBeenCalled();
    });

    it('should return false when not authenticated', () => {
      (apiClient.isAuthenticated as jest.Mock).mockReturnValue(false);

      const result = authApi.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('getToken', () => {
    it('should return token when available', () => {
      (apiClient.getToken as jest.Mock).mockReturnValue('test-token');

      const result = authApi.getToken();

      expect(result).toBe('test-token');
    });

    it('should return null when no token', () => {
      (apiClient.getToken as jest.Mock).mockReturnValue(null);

      const result = authApi.getToken();

      expect(result).toBeNull();
    });
  });

  describe('setToken', () => {
    it('should set token in apiClient', () => {
      authApi.setToken('new-token');

      expect(apiClient.setToken).toHaveBeenCalledWith('new-token');
    });
  });

  describe('verifyToken', () => {
    it('should return true for valid non-expired token', async () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const payload = { exp: futureExp, user_id: 1 };
      const token = `header.${btoa(JSON.stringify(payload))}.signature`;

      (apiClient.getToken as jest.Mock).mockReturnValue(token);

      const result = await authApi.verifyToken();

      expect(result).toBe(true);
    });

    it('should return false for expired token', async () => {
      const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const payload = { exp: pastExp, user_id: 1 };
      const token = `header.${btoa(JSON.stringify(payload))}.signature`;

      (apiClient.getToken as jest.Mock).mockReturnValue(token);

      const result = await authApi.verifyToken();

      expect(result).toBe(false);
      expect(apiClient.clearToken).toHaveBeenCalled();
    });

    it('should return false when no token', async () => {
      (apiClient.getToken as jest.Mock).mockReturnValue(null);

      const result = await authApi.verifyToken();

      expect(result).toBe(false);
    });

    it('should return false for invalid token format', async () => {
      (apiClient.getToken as jest.Mock).mockReturnValue('invalid-token');

      const result = await authApi.verifyToken();

      expect(result).toBe(false);
      expect(apiClient.clearToken).toHaveBeenCalled();
    });
  });

  describe('getUserFromToken', () => {
    it('should extract user data from valid token', () => {
      const payload = {
        user_id: 1,
        email: 'test@example.com',
        user_type: 'USER',
        admin_company_id: 1,
        employee_id: 1,
        company_role: 'EMPLOYEE',
      };
      const token = `header.${btoa(JSON.stringify(payload))}.signature`;

      (apiClient.getToken as jest.Mock).mockReturnValue(token);

      const result = authApi.getUserFromToken();

      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
        user_type: 'USER',
        admin_company_id: 1,
        employee_id: 1,
        company_role: 'EMPLOYEE',
      });
    });

    it('should return null when no token', () => {
      (apiClient.getToken as jest.Mock).mockReturnValue(null);

      const result = authApi.getUserFromToken();

      expect(result).toBeNull();
    });

    it('should return null for invalid token', () => {
      (apiClient.getToken as jest.Mock).mockReturnValue('invalid');

      const result = authApi.getUserFromToken();

      expect(result).toBeNull();
    });
  });

  describe('refreshToken', () => {
    it('should refresh token and update apiClient', async () => {
      const newToken = 'new-refreshed-token';

      (apiClient.post as jest.Mock).mockResolvedValue({
        success: true,
        data: { token: newToken },
      });

      const result = await authApi.refreshToken();

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/auth/refresh', {});
      expect(apiClient.setToken).toHaveBeenCalledWith(newToken);
      expect(result).toBe(newToken);
    });

    it('should return null on refresh failure', async () => {
      (apiClient.post as jest.Mock).mockRejectedValue(
        new Error('Refresh failed')
      );

      const result = await authApi.refreshToken();

      expect(result).toBeNull();
    });
  });
});
