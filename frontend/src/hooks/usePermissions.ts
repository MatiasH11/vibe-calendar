import { useAuth } from './useAuth';
import { 
  isAdmin, 
  isEmployee, 
  canManageShifts, 
  canManageEmployees, 
  canViewStatistics,
  getUserBusinessRole,
  hasBusinessRole
} from '@/lib/permissions';
import { BusinessRole } from '@/types/auth';

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
    
    // Información del rol de negocio
    businessRole: getUserBusinessRole(user),
    hasBusinessRole: (role: BusinessRole) => hasBusinessRole(user, role),
    
    // Información del usuario
    user,
    isAuthenticated: !!user,
  };
}
