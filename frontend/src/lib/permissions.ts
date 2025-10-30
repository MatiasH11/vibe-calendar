import { UserType, BusinessRole, CompanyRole, JWTPayload } from '@/types/auth';

/**
 * Verifica si el usuario tiene permisos de administrador
 * Un usuario es admin si:
 * - Es SUPER_ADMIN a nivel de sistema, o
 * - Es OWNER o ADMIN a nivel de empresa
 */
export function isAdmin(user: JWTPayload | null): boolean {
  if (!user) return false;

  // Super admin at system level
  if (user.user_type === 'SUPER_ADMIN') return true;

  // Owner or Admin at company level
  return user.company_role === 'OWNER' || user.company_role === 'ADMIN';
}

/**
 * Verifica si el usuario es empleado (no admin)
 */
export function isEmployee(user: JWTPayload | null): boolean {
  return !isAdmin(user);
}

/**
 * Obtiene el rol de negocio del usuario (legacy)
 * @deprecated Use getCompanyRole instead
 */
export function getUserBusinessRole(user: JWTPayload | null): BusinessRole | null {
  return user?.role_name || null;
}

/**
 * Obtiene el rol de empresa del usuario
 */
export function getCompanyRole(user: JWTPayload | null): CompanyRole | null {
  return user?.company_role || null;
}

/**
 * Verifica si el usuario tiene un rol de negocio específico (legacy)
 * @deprecated Use hasCompanyRole instead
 */
export function hasBusinessRole(user: JWTPayload | null, role: BusinessRole): boolean {
  return user?.role_name === role;
}

/**
 * Verifica si el usuario tiene un rol de empresa específico
 */
export function hasCompanyRole(user: JWTPayload | null, role: CompanyRole): boolean {
  return user?.company_role === role;
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
