# 🏗️ CRUD Standard - Vibe Calendar

Esta guía define el estándar para implementar operaciones CRUD en todas las entidades del sistema.

---

## 📐 Arquitectura por Capas

```
Routes → Controllers → Services → Prisma
   ↓          ↓            ↓
Validations  DTOs     Audit Logs
```

**Flujo:**
1. **Route** - Define el endpoint y middlewares (auth, validation)
2. **Controller** - Extrae datos de la request, llama al service, formatea response
3. **Service** - Contiene la lógica de negocio, interactúa con Prisma, crea audit logs
4. **Prisma** - ORM para interactuar con la base de datos

---

## 📋 Endpoints Estándar por Entidad

Para cada entidad (department, employee, shift, etc.) implementar:

### **CRUD Básico**
```
POST   /api/v1/{entity}         - Create
GET    /api/v1/{entity}         - List (con filtros, paginación, búsqueda)
GET    /api/v1/{entity}/:id     - Get by ID
PUT    /api/v1/{entity}/:id     - Update
DELETE /api/v1/{entity}/:id     - Soft Delete
```

### **Operaciones Masivas**
```
POST   /api/v1/{entity}/bulk    - Bulk Create
PUT    /api/v1/{entity}/bulk    - Bulk Update
DELETE /api/v1/{entity}/bulk    - Bulk Delete
```

### **Operaciones Especiales (opcional)**
```
POST   /api/v1/{entity}/:id/restore - Restore soft deleted
GET    /api/v1/{entity}/export      - Export to CSV/Excel
POST   /api/v1/{entity}/import      - Import from CSV/Excel
```

---

## 🔍 Query Parameters Estándar (GET /list)

### **Paginación (obligatorio)**
```typescript
page?: number       // default: 1
limit?: number      // default: 50, max: 100
```

### **Búsqueda (recomendado)**
```typescript
search?: string     // Búsqueda en campos principales (name, description, etc.)
```

### **Filtros Comunes**
```typescript
is_active?: boolean        // Filtrar por activos/inactivos
deleted?: boolean          // Incluir eliminados (soft delete) - default: false
```

### **Ordenamiento**
```typescript
sort_by?: string           // Campo por el que ordenar (name, created_at, etc.)
sort_order?: 'asc' | 'desc' // default: 'asc'
```

### **Filtros de Fecha**
```typescript
start_date?: string        // YYYY-MM-DD
end_date?: string          // YYYY-MM-DD
created_after?: string     // ISO 8601
created_before?: string    // ISO 8601
```

### **Filtros Específicos de la Entidad**
Agregar según la entidad (ej: `department_id`, `company_role`, `status`, etc.)

**Ejemplo de URL:**
```
GET /api/v1/departments?page=1&limit=20&search=kitchen&is_active=true&sort_by=name&sort_order=asc
```

---

## 📤 Response Format Estándar

### **Single Entity Response**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Kitchen",
    "description": "Main kitchen area",
    "color": "#FF5733",
    "is_active": true,
    "created_at": "2025-10-24T10:00:00.000Z",
    "updated_at": "2025-10-24T10:00:00.000Z"
  }
}
```

### **List Response (con paginación)**
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Kitchen" },
    { "id": 2, "name": "Bar" }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 50,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### **Bulk Operation Response**
```json
{
  "success": true,
  "data": {
    "created": 10,
    "failed": 2,
    "errors": [
      {
        "index": 5,
        "error": "DUPLICATE_NAME",
        "message": "Department name already exists",
        "data": { "name": "Kitchen" }
      },
      {
        "index": 8,
        "error": "VALIDATION_ERROR",
        "message": "Invalid color format",
        "data": { "color": "invalid" }
      }
    ]
  }
}
```

### **Error Response**
```json
{
  "success": false,
  "error": {
    "code": "DEPARTMENT_NOT_FOUND",
    "message": "Department with ID 123 not found",
    "metadata": {
      "department_id": 123
    }
  }
}
```

---

## ✅ Validation Schemas (Zod)

### **Ejemplo: Department**

```typescript
// validations/department.validation.ts
import { z } from 'zod';

// CREATE - todos los campos requeridos
export const create_department_schema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).default('#3B82F6'),
});

// UPDATE - todos los campos opcionales
export const update_department_schema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  is_active: z.boolean().optional(),
});

// LIST QUERY PARAMETERS
export const list_departments_query_schema = z.object({
  // Pagination
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),

  // Search
  search: z.string().optional(),

  // Filters
  is_active: z.coerce.boolean().optional(),
  deleted: z.coerce.boolean().default(false),

  // Sorting
  sort_by: z.enum(['name', 'created_at', 'updated_at']).default('name'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
});

// BULK CREATE
export const bulk_create_departments_schema = z.object({
  items: z.array(create_department_schema).min(1).max(100),
});

// BULK UPDATE
export const bulk_update_departments_schema = z.object({
  items: z.array(
    z.object({
      id: z.number().int().positive(),
      data: update_department_schema,
    })
  ).min(1).max(100),
});

// BULK DELETE
export const bulk_delete_departments_schema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(100),
});

// ID PARAM
export const department_id_param_schema = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateDepartmentDto = z.infer<typeof create_department_schema>;
export type UpdateDepartmentDto = z.infer<typeof update_department_schema>;
export type ListDepartmentsQuery = z.infer<typeof list_departments_query_schema>;
```

---

## 🔧 Service Pattern

### **Ejemplo: Department Service**

```typescript
// services/department.service.ts
import { prisma } from '../config/prisma_client';
import { Prisma } from '@prisma/client';
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
  ListDepartmentsQuery,
} from '../validations/department.validation';
import { calculatePagination } from '../utils/pagination.util';
import { createAuditLog } from '../utils/audit.util';

export const department_service = {
  /**
   * Create a new department
   */
  async create(data: CreateDepartmentDto, userId: number, companyId: number) {
    return await prisma.$transaction(async (tx) => {
      // Create department
      const department = await tx.department.create({
        data: {
          company_id: companyId,
          ...data,
        },
      });

      // Audit log
      await createAuditLog(
        userId,
        companyId,
        'CREATE',
        'department',
        department.id,
        undefined,
        data,
        tx
      );

      return department;
    });
  },

  /**
   * List departments with filters, search, and pagination
   */
  async list(filters: ListDepartmentsQuery, companyId: number) {
    const { page, limit, search, is_active, deleted, sort_by, sort_order } = filters;

    // Build WHERE clause
    const where: Prisma.departmentWhereInput = {
      company_id: companyId,
      ...(deleted ? {} : { deleted_at: null }),
      ...(is_active !== undefined && { is_active }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Execute queries in parallel
    const [departments, total] = await Promise.all([
      prisma.department.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sort_by]: sort_order },
        include: {
          _count: {
            select: { employees: true },
          },
        },
      }),
      prisma.department.count({ where }),
    ]);

    return {
      data: departments,
      pagination: calculatePagination(total, page, limit),
    };
  },

  /**
   * Get department by ID
   */
  async getById(id: number, companyId: number) {
    const department = await prisma.department.findFirst({
      where: {
        id,
        company_id: companyId,
        deleted_at: null
      },
      include: {
        employees: {
          where: { deleted_at: null },
          select: {
            id: true,
            position: true,
            user: {
              select: {
                first_name: true,
                last_name: true,
              },
            },
          },
        },
        _count: {
          select: { employees: true },
        },
      },
    });

    if (!department) {
      throw new Error('DEPARTMENT_NOT_FOUND');
    }

    return department;
  },

  /**
   * Update department
   */
  async update(
    id: number,
    data: UpdateDepartmentDto,
    userId: number,
    companyId: number
  ) {
    return await prisma.$transaction(async (tx) => {
      // Get old values for audit
      const oldDepartment = await tx.department.findFirst({
        where: { id, company_id: companyId, deleted_at: null },
      });

      if (!oldDepartment) {
        throw new Error('DEPARTMENT_NOT_FOUND');
      }

      // Update
      const department = await tx.department.update({
        where: { id },
        data: {
          ...data,
          updated_at: new Date(),
        },
      });

      // Audit log
      await createAuditLog(
        userId,
        companyId,
        'UPDATE',
        'department',
        id,
        oldDepartment,
        data,
        tx
      );

      return department;
    });
  },

  /**
   * Soft delete department
   */
  async delete(id: number, userId: number, companyId: number) {
    return await prisma.$transaction(async (tx) => {
      const department = await tx.department.findFirst({
        where: { id, company_id: companyId, deleted_at: null },
      });

      if (!department) {
        throw new Error('DEPARTMENT_NOT_FOUND');
      }

      // Check if department has active employees
      const employeeCount = await tx.employee.count({
        where: { department_id: id, deleted_at: null },
      });

      if (employeeCount > 0) {
        throw new Error('DEPARTMENT_HAS_EMPLOYEES');
      }

      // Soft delete
      await tx.department.update({
        where: { id },
        data: {
          deleted_at: new Date(),
          is_active: false,
        },
      });

      // Audit log
      await createAuditLog(
        userId,
        companyId,
        'DELETE',
        'department',
        id,
        department,
        undefined,
        tx
      );
    });
  },

  /**
   * Restore soft deleted department
   */
  async restore(id: number, userId: number, companyId: number) {
    return await prisma.$transaction(async (tx) => {
      const department = await tx.department.findFirst({
        where: { id, company_id: companyId },
      });

      if (!department) {
        throw new Error('DEPARTMENT_NOT_FOUND');
      }

      if (!department.deleted_at) {
        throw new Error('DEPARTMENT_NOT_DELETED');
      }

      // Restore
      const restored = await tx.department.update({
        where: { id },
        data: {
          deleted_at: null,
          is_active: true,
        },
      });

      // Audit log
      await createAuditLog(
        userId,
        companyId,
        'UPDATE',
        'department',
        id,
        { deleted_at: department.deleted_at },
        { deleted_at: null },
        tx
      );

      return restored;
    });
  },

  /**
   * Bulk create departments
   */
  async bulkCreate(
    items: CreateDepartmentDto[],
    userId: number,
    companyId: number
  ) {
    const results = {
      created: 0,
      failed: 0,
      errors: [] as any[]
    };

    for (let i = 0; i < items.length; i++) {
      try {
        await this.create(items[i], userId, companyId);
        results.created++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          index: i,
          error: error.message,
          message: error.message,
          data: items[i],
        });
      }
    }

    return results;
  },

  /**
   * Bulk update departments
   */
  async bulkUpdate(
    items: Array<{ id: number; data: UpdateDepartmentDto }>,
    userId: number,
    companyId: number
  ) {
    const results = {
      updated: 0,
      failed: 0,
      errors: [] as any[]
    };

    for (let i = 0; i < items.length; i++) {
      try {
        await this.update(items[i].id, items[i].data, userId, companyId);
        results.updated++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          index: i,
          id: items[i].id,
          error: error.message,
          message: error.message,
        });
      }
    }

    return results;
  },

  /**
   * Bulk delete departments
   */
  async bulkDelete(ids: number[], userId: number, companyId: number) {
    const results = {
      deleted: 0,
      failed: 0,
      errors: [] as any[]
    };

    for (let i = 0; i < ids.length; i++) {
      try {
        await this.delete(ids[i], userId, companyId);
        results.deleted++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          index: i,
          id: ids[i],
          error: error.message,
          message: error.message,
        });
      }
    }

    return results;
  },
};
```

---

## 🎮 Controller Pattern

```typescript
// controllers/department.controller.ts
import { Request, Response, NextFunction } from 'express';
import { department_service } from '../services/department.service';
import { HTTP_CODES } from '../constants/http_codes';

export const createDepartmentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { admin_company_id, user_id } = req.user;
    const department = await department_service.create(
      req.body,
      user_id,
      admin_company_id
    );
    return res.status(HTTP_CODES.CREATED).json({
      success: true,
      data: department
    });
  } catch (error) {
    next(error);
  }
};

export const listDepartmentsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { admin_company_id } = req.user;
    const result = await department_service.list(
      req.query as any,
      admin_company_id
    );
    return res.status(HTTP_CODES.OK).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

export const getDepartmentByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { admin_company_id } = req.user;
    const department = await department_service.getById(
      Number(req.params.id),
      admin_company_id
    );
    return res.status(HTTP_CODES.OK).json({
      success: true,
      data: department
    });
  } catch (error) {
    next(error);
  }
};

export const updateDepartmentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { admin_company_id, user_id } = req.user;
    const department = await department_service.update(
      Number(req.params.id),
      req.body,
      user_id,
      admin_company_id
    );
    return res.status(HTTP_CODES.OK).json({
      success: true,
      data: department
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDepartmentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { admin_company_id, user_id } = req.user;
    await department_service.delete(
      Number(req.params.id),
      user_id,
      admin_company_id
    );
    return res.status(HTTP_CODES.NO_CONTENT).send();
  } catch (error) {
    next(error);
  }
};

export const restoreDepartmentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { admin_company_id, user_id } = req.user;
    const department = await department_service.restore(
      Number(req.params.id),
      user_id,
      admin_company_id
    );
    return res.status(HTTP_CODES.OK).json({
      success: true,
      data: department
    });
  } catch (error) {
    next(error);
  }
};

export const bulkCreateDepartmentsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { admin_company_id, user_id } = req.user;
    const result = await department_service.bulkCreate(
      req.body.items,
      user_id,
      admin_company_id
    );
    return res.status(HTTP_CODES.OK).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const bulkUpdateDepartmentsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { admin_company_id, user_id } = req.user;
    const result = await department_service.bulkUpdate(
      req.body.items,
      user_id,
      admin_company_id
    );
    return res.status(HTTP_CODES.OK).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const bulkDeleteDepartmentsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { admin_company_id, user_id } = req.user;
    const result = await department_service.bulkDelete(
      req.body.ids,
      user_id,
      admin_company_id
    );
    return res.status(HTTP_CODES.OK).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
```

---

## 🛣️ Routes Pattern

```typescript
// routes/department.routes.ts
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  validate_body,
  validate_query,
  validate_params
} from '../middlewares/validation_middleware';
import {
  create_department_schema,
  update_department_schema,
  list_departments_query_schema,
  bulk_create_departments_schema,
  bulk_update_departments_schema,
  bulk_delete_departments_schema,
  department_id_param_schema,
} from '../validations/department.validation';
import {
  createDepartmentHandler,
  listDepartmentsHandler,
  getDepartmentByIdHandler,
  updateDepartmentHandler,
  deleteDepartmentHandler,
  restoreDepartmentHandler,
  bulkCreateDepartmentsHandler,
  bulkUpdateDepartmentsHandler,
  bulkDeleteDepartmentsHandler,
} from '../controllers/department.controller';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// CRUD básico
router.post(
  '/',
  validate_body(create_department_schema),
  createDepartmentHandler
);

router.get(
  '/',
  validate_query(list_departments_query_schema),
  listDepartmentsHandler
);

router.get(
  '/:id',
  validate_params(department_id_param_schema),
  getDepartmentByIdHandler
);

router.put(
  '/:id',
  validate_params(department_id_param_schema),
  validate_body(update_department_schema),
  updateDepartmentHandler
);

router.delete(
  '/:id',
  validate_params(department_id_param_schema),
  deleteDepartmentHandler
);

router.post(
  '/:id/restore',
  validate_params(department_id_param_schema),
  restoreDepartmentHandler
);

// Bulk operations
router.post(
  '/bulk',
  validate_body(bulk_create_departments_schema),
  bulkCreateDepartmentsHandler
);

router.put(
  '/bulk',
  validate_body(bulk_update_departments_schema),
  bulkUpdateDepartmentsHandler
);

router.delete(
  '/bulk',
  validate_body(bulk_delete_departments_schema),
  bulkDeleteDepartmentsHandler
);

export default router;

/**
 * @openapi
 * tags:
 *   name: Departments
 *   description: Department management endpoints
 */

/**
 * @openapi
 * /departments:
 *   post:
 *     tags: [Departments]
 *     summary: Create new department
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Kitchen"
 *               description:
 *                 type: string
 *                 example: "Main kitchen area"
 *               color:
 *                 type: string
 *                 pattern: "^#[0-9A-F]{6}$"
 *                 example: "#FF5733"
 *     responses:
 *       201:
 *         description: Department created successfully
 */

/**
 * @openapi
 * /departments:
 *   get:
 *     tags: [Departments]
 *     summary: List departments with filters and pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50, maximum: 100 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: is_active
 *         schema: { type: boolean }
 *       - in: query
 *         name: sort_by
 *         schema: { type: string, enum: [name, created_at, updated_at] }
 *       - in: query
 *         name: sort_order
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200:
 *         description: Departments retrieved successfully
 */
```

---

## 🛠️ Utilities

### **Pagination Utility**

```typescript
// utils/pagination.util.ts

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationResult {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function calculatePagination(
  total: number,
  page: number,
  limit: number
): PaginationResult {
  const totalPages = Math.ceil(total / limit);

  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
```

### **Audit Utility**

```typescript
// utils/audit.util.ts
import { prisma } from '../config/prisma_client';
import { audit_action } from '@prisma/client';

export async function createAuditLog(
  userId: number,
  companyId: number,
  action: audit_action,
  entityType: string,
  entityId: number,
  oldValues?: any,
  newValues?: any,
  tx?: any // Prisma transaction client
) {
  const client = tx || prisma;

  return await client.audit_log.create({
    data: {
      user_id: userId,
      company_id: companyId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_values: oldValues || null,
      new_values: newValues || null,
    },
  });
}
```

---

## 📊 Reglas y Mejores Prácticas

### **Multi-Tenancy**
- ✅ SIEMPRE filtrar por `company_id` en queries
- ✅ Validar que el recurso pertenece a la compañía del usuario
- ✅ Usar `admin_company_id` del JWT para obtener la compañía

### **Soft Delete**
- ✅ SIEMPRE usar `deleted_at` timestamp (no boolean)
- ✅ Por defecto excluir eliminados: `deleted_at: null`
- ✅ Permitir incluir eliminados con query param `deleted=true`
- ✅ Implementar endpoint de restore

### **Audit Logging**
- ✅ SIEMPRE crear audit log en CREATE, UPDATE, DELETE
- ✅ Usar transacciones para garantizar atomicidad
- ✅ Incluir `old_values` en UPDATE/DELETE
- ✅ Incluir `new_values` en CREATE/UPDATE

### **Validación**
- ✅ Validar en 3 niveles: Zod schema, Service logic, Database constraints
- ✅ CREATE: todos los campos requeridos
- ✅ UPDATE: todos los campos opcionales
- ✅ Mensajes de error descriptivos

### **Paginación**
- ✅ SIEMPRE implementar paginación en list endpoints
- ✅ Default: `page=1`, `limit=50`
- ✅ Max limit: 100 items
- ✅ Devolver metadata de paginación

### **Performance**
- ✅ Usar `Promise.all()` para queries paralelas (count + data)
- ✅ Agregar índices en campos usados para filtrar/ordenar
- ✅ Usar `select` para limitar campos devueltos
- ✅ Usar `include` solo cuando sea necesario

### **Transacciones**
- ✅ Usar transacciones cuando:
  - Se crean múltiples registros relacionados
  - Se crean audit logs
  - Se necesita atomicidad (todo o nada)

### **Error Handling**
- ✅ Lanzar errores descriptivos: `throw new Error('DEPARTMENT_NOT_FOUND')`
- ✅ El error handler global se encarga de formatear
- ✅ Incluir metadata útil en errores

---

## 📝 Checklist de Implementación

Para cada nueva entidad, verificar:

- [ ] **Validations** - Schemas de Zod creados
- [ ] **Service** - CRUD completo + bulk operations
- [ ] **Controller** - Handlers para todos los endpoints
- [ ] **Routes** - Endpoints registrados con middlewares
- [ ] **Audit Logs** - CREATE, UPDATE, DELETE registrados
- [ ] **Multi-tenancy** - Filtrado por `company_id`
- [ ] **Soft Delete** - Implementado con `deleted_at`
- [ ] **Paginación** - List endpoint con paginación
- [ ] **Búsqueda** - Search parameter implementado
- [ ] **Swagger** - Endpoints documentados
- [ ] **Tests** - Tests básicos de CRUD
- [ ] **Errors** - Error handling completo

---

## 🎯 Resumen del Estándar

| Aspecto | Estándar |
|---------|----------|
| **Paginación** | `page`, `limit` (default: 1, 50, max: 100) |
| **Búsqueda** | `search` (busca en campos principales con `contains` insensitive) |
| **Filtros** | Campos específicos de la entidad |
| **Ordenamiento** | `sort_by`, `sort_order` (default: 'asc') |
| **Soft Delete** | `deleted_at` timestamp (null = activo) |
| **Multi-tenancy** | Siempre filtrar por `company_id` |
| **Audit Log** | SIEMPRE en CREATE, UPDATE, DELETE |
| **Transacciones** | Usar cuando se crean audit logs o múltiples registros |
| **Bulk Operations** | Max 100 items por request |
| **Response Format** | `{ success, data, pagination? }` |
| **Error Format** | `{ success: false, error: { code, message, metadata? } }` |
| **HTTP Codes** | 200 (OK), 201 (Created), 204 (No Content), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 409 (Conflict), 500 (Server Error) |

---

## 🚀 Próximos Pasos

1. Usar este documento como referencia para implementar nuevas entidades
2. Crear utilidades compartidas (pagination, audit)
3. Considerar crear un generador de código (CLI tool) que genere automáticamente:
   - Validations
   - Service
   - Controller
   - Routes
   - Tests básicos

---

**Última actualización:** 2025-10-24
**Versión:** 1.0
