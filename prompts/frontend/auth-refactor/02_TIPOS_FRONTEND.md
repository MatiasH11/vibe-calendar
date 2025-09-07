# 🎯 FASE 2: Actualizar Tipos Frontend

## 🎯 Objetivo
Actualizar los tipos TypeScript del frontend para reflejar la nueva separación entre permisos de usuario y roles de negocio.

## 🔧 PASO 1: Actualizar Tipos de Autenticación

### `frontend/src/types/auth.ts`
```typescript
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
```

## 🔧 PASO 2: Actualizar Tipos de Empleados

### `frontend/src/types/employee.ts`
```typescript
// ... existing code ...

export interface Employee {
  id: number;
  company_id: number;
  user_id: number;
  role_id: number;
  position: string;               // Posición/cargo del empleado
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
  };
  role: {
    id: number;
    company_id: number;
    name: string;                 // Nombre del rol de negocio: "Admin", "Vendedor", etc.
    description?: string;
    color: string;
    created_at: string;
    updated_at: string;
  };
}

// ... rest of existing code ...
```

## 🔧 PASO 3: Actualizar Tipos de Turnos

### `frontend/src/types/shifts/employee.ts`
```typescript
// ... existing code ...

export interface EmployeeWithShifts {
  id: number;
  company_id: number;
  user_id: number;
  role_id: number;
  position: string;               // Posición del empleado
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
  };
  role: {
    id: number;
    company_id: number;
    name: string;                 // Rol de negocio: "Admin", "Vendedor", etc.
    description?: string;
    color: string;
    created_at: string;
    updated_at: string;
  };
  shifts: ShiftByDay[];
}

// ... rest of existing code ...
```

## 🔧 PASO 4: Crear Utilidades de Permisos

### `frontend/src/lib/permissions.ts`
```typescript
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
```

## 🔧 PASO 5: Actualizar Constantes de Colores

### `frontend/src/lib/constants.ts`
```typescript
// Colores para roles de negocio
export const ROLE_COLORS = {
  'Admin': 'bg-blue-500',
  'Vendedor': 'bg-green-500',
  'Gerente': 'bg-purple-500',
  'Recepcionista': 'bg-orange-500',
  'default': 'bg-gray-500',
} as const;

// Colores para tipos de usuario (permisos)
export const USER_TYPE_COLORS = {
  admin: 'bg-red-500',
  employee: 'bg-blue-500',
} as const;

// Iconos para roles de negocio
export const ROLE_ICONS = {
  'Admin': '👑',
  'Vendedor': '🛒',
  'Gerente': '👔',
  'Recepcionista': '📞',
  'default': '👤',
} as const;

// Iconos para tipos de usuario
export const USER_TYPE_ICONS = {
  admin: '🔑',
  employee: '👤',
} as const;
```

## ✅ Validación Frontend

```bash
# Verificar compilación del frontend
cd frontend
npm run build

# Verificar que no hay errores de TypeScript
npx tsc --noEmit

# Verificar que los tipos se importan correctamente
```

## 🎯 Resultado Frontend

- **Tipos actualizados** con separación clara entre permisos y roles
- **Utilidades de permisos** para verificar acceso fácilmente
- **Constantes organizadas** para colores e iconos
- **JWT payload tipado** correctamente
- **Compatibilidad mantenida** con código existente

**Los tipos del frontend ahora reflejan correctamente la separación entre permisos de usuario y roles de negocio.**
