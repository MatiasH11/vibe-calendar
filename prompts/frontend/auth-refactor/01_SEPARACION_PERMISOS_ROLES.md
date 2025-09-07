# 🔐 FASE 1: Separación de Permisos y Roles de Negocio

## 🎯 Objetivo
Refactorizar el sistema de autenticación para separar claramente los **permisos de usuario** (admin/employee) de los **roles de negocio** (Vendedor, Gerente, etc.). Esto evitará confusión y permitirá un sistema más escalable.

## 🧠 Conceptos Clave

### **Permisos de Usuario (Sistema)**
- **`admin`**: Acceso completo al sistema (gestionar turnos, empleados, roles, estadísticas)
- **`employee`**: Acceso limitado (solo ver sus propios turnos - futuro)

### **Roles de Negocio (Lógica de Negocio)**
- **`"Admin"`**: Cargo de administrador en la empresa
- **`"Vendedor"`**: Cargo de vendedor
- **`"Gerente"`**: Cargo de gerente
- **`"Recepcionista"`**: Cargo de recepcionista
- etc.

## 🔧 PASO 1: Actualizar Constantes Backend

### `backend/src/constants/auth.ts`
```typescript
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

// Tipos de usuario (permisos del sistema)
export const USER_TYPES = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
} as const;

// Mantener compatibilidad con código existente
export const ADMIN_ROLE_NAME = BUSINESS_ROLES.ADMIN;
```

## 🔧 PASO 2: Actualizar Servicio de Autenticación

### `backend/src/services/auth.service.ts`
```typescript
import { prisma } from '../config/prisma_client';
import { register_body, login_body } from '../validations/auth.validation';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AUTH_CONSTANTS, BUSINESS_ROLES, USER_TYPES } from '../constants/auth';
import { env } from '../config/environment';

export const auth_service = {
  async register(data: register_body) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new Error('EMAIL_ALREADY_EXISTS');
    }

    const existingCompany = await prisma.company.findFirst({ where: { name: data.company_name } });
    if (existingCompany) {
      throw new Error('COMPANY_NAME_ALREADY_EXISTS');
    }

    const password_hash = await bcrypt.hash(data.password, AUTH_CONSTANTS.BCRYPT_SALT_ROUNDS);

    try {
      const result = await prisma.$transaction(async (tx) => {
        const company = await tx.company.create({
          data: {
            name: data.company_name,
            email: data.email,
          },
        });

        const user = await tx.user.create({
          data: {
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            password_hash,
          },
        });

        // Crear rol de administrador para la empresa
        const adminRole = await tx.role.create({
          data: {
            company_id: company.id,
            name: BUSINESS_ROLES.ADMIN,
            description: 'Administrador de la empresa',
            color: '#3B82F6', // Azul para admin
          },
        });

        // Asociar usuario como empleado con rol de admin
        const employee = await tx.company_employee.create({
          data: {
            company_id: company.id,
            user_id: user.id,
            role_id: adminRole.id,
            position: BUSINESS_ROLES.ADMIN,
            is_active: true,
          },
        });

        return { company, user, role: adminRole, employee };
      });

      return { 
        success: true, 
        data: { 
          company_id: result.company.id, 
          user_id: result.user.id, 
          role_id: result.role.id, 
          employee_id: result.employee.id 
        } 
      };
    } catch (e) {
      throw new Error('TRANSACTION_FAILED');
    }
  },

  async login(data: login_body) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const valid = await bcrypt.compare(data.password, user.password_hash);
    if (!valid) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const employee = await prisma.company_employee.findFirst({
      where: { user_id: user.id, deleted_at: null },
      include: { role: true, company: true },
    });

    if (!employee) {
      throw new Error('USER_NOT_ASSOCIATED_WITH_COMPANY');
    }

    // Determinar tipo de usuario basado en el rol de negocio
    const userType = employee.role.name === BUSINESS_ROLES.ADMIN 
      ? USER_TYPES.ADMIN 
      : USER_TYPES.EMPLOYEE;

    const payload = {
      user_id: user.id,
      company_id: employee.company_id,
      employee_id: employee.id,
      role_id: employee.role_id,
      role_name: employee.role.name,        // Rol de negocio: "Admin", "Vendedor", etc.
      user_type: userType,                  // Permisos del sistema: "admin" | "employee"
      exp: Math.floor(Date.now() / 1000) + (8 * 60 * 60), // 8 horas
    } as const;

    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: AUTH_CONSTANTS.JWT_EXPIRATION });

    return { success: true, data: { token } };
  },
};
```

## 🔧 PASO 3: Actualizar Middleware de Admin

### `backend/src/middlewares/admin.middleware.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { HTTP_CODES } from '../constants/http_codes';
import { USER_TYPES } from '../constants/auth';

export const adminMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(HTTP_CODES.UNAUTHORIZED).json({ 
      success: false, 
      error: { error_code: 'UNAUTHORIZED', message: 'Missing user context' } 
    });
  }

  // Verificar permisos de administrador usando user_type
  if (req.user.user_type !== USER_TYPES.ADMIN) {
    return res.status(HTTP_CODES.FORBIDDEN).json({ 
      success: false, 
      error: { error_code: 'FORBIDDEN', message: 'Access denied. Admin privileges required.' } 
    });
  }

  return next();
};
```

## 🔧 PASO 4: Actualizar Tipos de Express

### `backend/src/types/express.d.ts`
```typescript
import { USER_TYPES, BUSINESS_ROLES } from '../constants/auth';

declare global {
  namespace Express {
    interface User {
      user_id: number;
      company_id: number;
      employee_id: number;
      role_id: number;
      role_name: string;        // Rol de negocio: "Admin", "Vendedor", etc.
      user_type: typeof USER_TYPES[keyof typeof USER_TYPES]; // "admin" | "employee"
      exp?: number;
    }
  }
}
```

## ✅ Validación Backend

```bash
# Verificar compilación del backend
cd backend
npm run build

# Verificar que no hay errores de TypeScript
npx tsc --noEmit

# Probar registro de nueva compañía
# El usuario creado debe tener user_type: "admin"
```

## 🎯 Resultado Backend

- **Separación clara** entre permisos de usuario y roles de negocio
- **JWT payload mejorado** con `user_type` y `role_name`
- **Middleware actualizado** para usar `user_type` en lugar de `role_name`
- **Constantes organizadas** para mejor mantenimiento
- **Tipos TypeScript** actualizados para Express

**El backend ahora distingue correctamente entre permisos del sistema y roles de negocio.**
