import { 
  isAdmin, 
  isEmployee, 
  canManageShifts, 
  canManageEmployees, 
  canViewStatistics,
  getUserBusinessRole,
  hasBusinessRole
} from '../permissions';
import { JWTPayload } from '@/types/auth';

describe('Permission Utilities', () => {
  const adminUser: JWTPayload = {
    user_id: 1,
    company_id: 1,
    employee_id: 1,
    role_id: 1,
    role_name: 'Admin',
    user_type: 'admin',
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  const employeeUser: JWTPayload = {
    user_id: 2,
    company_id: 1,
    employee_id: 2,
    role_id: 2,
    role_name: 'Vendedor',
    user_type: 'employee',
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  describe('isAdmin', () => {
    it('should return true for admin user', () => {
      expect(isAdmin(adminUser)).toBe(true);
    });

    it('should return false for employee user', () => {
      expect(isAdmin(employeeUser)).toBe(false);
    });

    it('should return false for null user', () => {
      expect(isAdmin(null)).toBe(false);
    });
  });

  describe('isEmployee', () => {
    it('should return true for employee user', () => {
      expect(isEmployee(employeeUser)).toBe(true);
    });

    it('should return false for admin user', () => {
      expect(isEmployee(adminUser)).toBe(false);
    });

    it('should return false for null user', () => {
      expect(isEmployee(null)).toBe(false);
    });
  });

  describe('canManageShifts', () => {
    it('should return true for admin user', () => {
      expect(canManageShifts(adminUser)).toBe(true);
    });

    it('should return false for employee user', () => {
      expect(canManageShifts(employeeUser)).toBe(false);
    });
  });

  describe('getUserBusinessRole', () => {
    it('should return business role for admin user', () => {
      expect(getUserBusinessRole(adminUser)).toBe('Admin');
    });

    it('should return business role for employee user', () => {
      expect(getUserBusinessRole(employeeUser)).toBe('Vendedor');
    });

    it('should return null for null user', () => {
      expect(getUserBusinessRole(null)).toBe(null);
    });
  });

  describe('hasBusinessRole', () => {
    it('should return true for matching business role', () => {
      expect(hasBusinessRole(adminUser, 'Admin')).toBe(true);
    });

    it('should return false for non-matching business role', () => {
      expect(hasBusinessRole(employeeUser, 'Admin')).toBe(false);
    });
  });
});
