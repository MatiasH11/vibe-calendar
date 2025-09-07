export const AUTH_CONSTANTS = {
  BCRYPT_SALT_ROUNDS: 10,
  JWT_EXPIRATION: '8h',
} as const;

// Roles de negocio (cargos/posiciones)
export const BUSINESS_ROLES = {
  ADMIN: 'Admin',
  VENDEDOR: 'Vendedor',
  GERENTE: 'Gerente',
  RECEPCIONISTA: 'Recepcionista',
} as const;

import { user_type } from '@prisma/client';

// Tipos de usuario (permisos del sistema) - usando enum de Prisma
export const USER_TYPES = {
  ADMIN: 'admin' as user_type,
  EMPLOYEE: 'employee' as user_type,
} as const;

// Mantener compatibilidad con código existente
export const ADMIN_ROLE_NAME = BUSINESS_ROLES.ADMIN;


