// Tipos de usuario (permisos del sistema)
export type UserType = 'admin' | 'employee';

// Roles de negocio (cargos/posiciones)
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
  company_id: number;
  employee_id: number;
  role_id: number;
  role_name: BusinessRole;        // Rol de negocio: "Admin", "Vendedor", etc.
  user_type: UserType;            // Permisos del sistema: "admin" | "employee"
  exp?: number;
}

// Constantes para uso en el frontend
export const USER_TYPES = {
  ADMIN: 'admin' as const,
  EMPLOYEE: 'employee' as const,
} as const;

export const BUSINESS_ROLES = {
  ADMIN: 'Admin' as const,
  VENDEDOR: 'Vendedor' as const,
  GERENTE: 'Gerente' as const,
  RECEPCIONISTA: 'Recepcionista' as const,
} as const;
