// Tipos de usuario (permisos del sistema)
export type UserType = 'SUPER_ADMIN' | 'USER';

// Roles de empresa (nivel de acceso en la empresa)
export type CompanyRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

// Roles de negocio (cargos/posiciones) - deprecated, usar CompanyRole
export type BusinessRole = 'Admin' | 'Vendedor' | 'Gerente' | 'Recepcionista';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  company_name: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

// JWT Payload actualizado con separación clara
export interface JWTPayload {
  user_id: number;
  admin_company_id: number;       // Company ID from backend
  employee_id: number;
  company_role: CompanyRole;      // Role in the company: "OWNER", "ADMIN", "MANAGER", "EMPLOYEE"
  user_type: UserType;            // System-level: "SUPER_ADMIN" | "USER"
  email: string;
  exp?: number;

  // Legacy fields for compatibility
  company_id?: number;            // Alias for admin_company_id
  role_id?: number;
  role_name?: BusinessRole;
}

// Constantes para uso en el frontend
export const USER_TYPES = {
  SUPER_ADMIN: 'SUPER_ADMIN' as const,
  USER: 'USER' as const,
} as const;

export const COMPANY_ROLES = {
  OWNER: 'OWNER' as const,
  ADMIN: 'ADMIN' as const,
  MANAGER: 'MANAGER' as const,
  EMPLOYEE: 'EMPLOYEE' as const,
} as const;

export const BUSINESS_ROLES = {
  ADMIN: 'Admin' as const,
  VENDEDOR: 'Vendedor' as const,
  GERENTE: 'Gerente' as const,
  RECEPCIONISTA: 'Recepcionista' as const,
} as const;
