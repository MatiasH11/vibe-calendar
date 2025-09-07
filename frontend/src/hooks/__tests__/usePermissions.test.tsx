import { renderHook } from '@testing-library/react';
import { usePermissions } from '../usePermissions';
import { useAuth } from '../useAuth';

// Mock del hook useAuth
jest.mock('../useAuth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('usePermissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return correct permissions for admin user', () => {
    const adminUser = {
      user_id: 1,
      company_id: 1,
      employee_id: 1,
      role_id: 1,
      role_name: 'Admin',
      user_type: 'admin' as const,
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    mockUseAuth.mockReturnValue({
      user: adminUser,
      isLoading: false,
      isAuthenticated: true,
      isAuthenticating: false,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      initializeAuth: jest.fn(),
    });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isEmployee).toBe(false);
    expect(result.current.canManageShifts).toBe(true);
    expect(result.current.canManageEmployees).toBe(true);
    expect(result.current.canViewStatistics).toBe(true);
    expect(result.current.businessRole).toBe('Admin');
  });

  it('should return correct permissions for employee user', () => {
    const employeeUser = {
      user_id: 2,
      company_id: 1,
      employee_id: 2,
      role_id: 2,
      role_name: 'Vendedor',
      user_type: 'employee' as const,
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    mockUseAuth.mockReturnValue({
      user: employeeUser,
      isLoading: false,
      isAuthenticated: true,
      isAuthenticating: false,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      initializeAuth: jest.fn(),
    });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isEmployee).toBe(true);
    expect(result.current.canManageShifts).toBe(false);
    expect(result.current.canManageEmployees).toBe(false);
    expect(result.current.canViewStatistics).toBe(false);
    expect(result.current.businessRole).toBe('Vendedor');
  });

  it('should return correct permissions for unauthenticated user', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      isAuthenticating: false,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      initializeAuth: jest.fn(),
    });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isEmployee).toBe(false);
    expect(result.current.canManageShifts).toBe(false);
    expect(result.current.canManageEmployees).toBe(false);
    expect(result.current.canViewStatistics).toBe(false);
    expect(result.current.businessRole).toBe(null);
  });
});
