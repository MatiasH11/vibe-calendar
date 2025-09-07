import { UserType, BusinessRole, JWTPayload } from '@/types/auth';

/**
 * Verifica si el usuario tiene permisos de administrador
 */
export function isAdmin(user: JWTPayload | null): boolean {
  return user?.user_type === 'admin';
}

/**
 * Verifica si el usuario es empleado
 */
export function isEmployee(user: JWTPayload | null): boolean {
  return user?.user_type === 'employee';
}

/**
 * Obtiene el rol de negocio del usuario
 */
export function getUserBusinessRole(user: JWTPayload | null): BusinessRole | null {
  return user?.role_name || null;
}

/**
 * Verifica si el usuario tiene un rol de negocio específico
 */
export function hasBusinessRole(user: JWTPayload | null, role: BusinessRole): boolean {
  return user?.role_name === role;
}

/**
 * Verifica si el usuario puede gestionar turnos
 */
export function canManageShifts(user: JWTPayload | null): boolean {
  return isAdmin(user);
}

/**
 * Verifica si el usuario puede gestionar empleados
 */
export function canManageEmployees(user: JWTPayload | null): boolean {
  return isAdmin(user);
}

/**
 * Verifica si el usuario puede ver estadísticas
 */
export function canViewStatistics(user: JWTPayload | null): boolean {
  return isAdmin(user);
}

/**
 * Obtiene el nombre completo del usuario
 */
export function getUserFullName(user: JWTPayload | null): string {
  if (!user) return '';
  // Nota: El JWT no incluye first_name y last_name, se obtiene del contexto
  return 'Usuario'; // Se actualizará cuando se obtenga del contexto
}
