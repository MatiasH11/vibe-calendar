import { useAuth } from './useAuth';
import {
  isAdmin,
  isEmployee,
  canManageShifts,
  canManageEmployees,
  canViewStatistics,
  getUserBusinessRole,
  hasBusinessRole,
  getCompanyRole,
  hasCompanyRole
} from '@/lib/permissions';
import { BusinessRole, CompanyRole } from '@/types/auth';

export function usePermissions() {
  const { user } = useAuth();

  return {
    // Permisos básicos
    isAdmin: isAdmin(user),
    isEmployee: isEmployee(user),

    // Permisos específicos
    canManageShifts: canManageShifts(user),
    canManageEmployees: canManageEmployees(user),
    canViewStatistics: canViewStatistics(user),

    // Información del rol de negocio (legacy)
    businessRole: getUserBusinessRole(user),
    hasBusinessRole: (role: BusinessRole) => hasBusinessRole(user, role),

    // Información del rol de empresa (nuevo)
    companyRole: getCompanyRole(user),
    hasCompanyRole: (role: CompanyRole) => hasCompanyRole(user, role),

    // Información del usuario
    user,
    isAuthenticated: !!user,
  };
}
