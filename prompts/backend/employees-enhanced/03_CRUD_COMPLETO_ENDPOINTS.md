# 🔧 FASE 3: CRUD Completo y Endpoints

## 🎯 Objetivo
Completar todos los endpoints CRUD para empleados y roles, configurar las rutas con validaciones y documentación Swagger, manteniendo compatibilidad total con el sistema existente.

## 📝 PASO 1: Rutas de Estadísticas

### `src/routes/statistics.routes.ts`
Crear nuevas rutas para estadísticas:

```typescript
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { 
  getEmployeeStatsHandler, 
  getRoleStatsHandler, 
  getDashboardStatsHandler,
  getGrowthStatsHandler
} from '../controllers/statistics.controller';

const router = Router();

/**
 * @openapi
 * /statistics/employees:
 *   get:
 *     summary: Get employee statistics for the company
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data: { 
 *                 total_employees: 25, 
 *                 active_employees: 23, 
 *                 inactive_employees: 2,
 *                 active_percentage: 92,
 *                 distribution_by_role: [
 *                   { role_id: 1, role_name: "Cashier", total_employees: 8, active_employees: 7 }
 *                 ]
 *               }
 */
router.get('/employees', authMiddleware, adminMiddleware, getEmployeeStatsHandler);

/**
 * @openapi
 * /statistics/roles:
 *   get:
 *     summary: Get role statistics for the company
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data: { 
 *                 total_roles: 5, 
 *                 roles_with_employees: 3, 
 *                 empty_roles: 2,
 *                 utilization_percentage: 60
 *               }
 */
router.get('/roles', authMiddleware, adminMiddleware, getRoleStatsHandler);

/**
 * @openapi
 * /statistics/dashboard:
 *   get:
 *     summary: Get complete dashboard statistics
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data: { 
 *                 employees: { total_employees: 25 },
 *                 roles: { total_roles: 5 },
 *                 growth: { monthly_growth_rate: 8 }
 *               }
 */
router.get('/dashboard', authMiddleware, adminMiddleware, getDashboardStatsHandler);

/**
 * @openapi
 * /statistics/growth:
 *   get:
 *     summary: Get growth and trend statistics
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/growth', authMiddleware, adminMiddleware, getGrowthStatsHandler);

export default router;
```

## 📝 PASO 2: Actualizar Rutas de Empleados

### `src/routes/employee.routes.ts`
Expandir rutas existentes:

```typescript
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { validate_body, validate_query } from '../middlewares/validation_middleware';
import { 
  add_employee_schema, 
  employee_filters_schema, 
  update_employee_schema 
} from '../validations/employee.validation';
import { 
  addEmployeeHandler, 
  getEmployeesHandler,
  getEmployeesWithFiltersHandler,
  getEmployeeByIdHandler,
  updateEmployeeHandler,
  deleteEmployeeHandler
} from '../controllers/employee.controller';

const router = Router();

/**
 * @openapi
 * /employees:
 *   get:
 *     summary: List employees with advanced filters (NEW - Enhanced)
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search in name, email, role, position
 *       - in: query
 *         name: role_id
 *         schema: { type: integer }
 *         description: Filter by specific role
 *       - in: query
 *         name: is_active
 *         schema: { type: boolean }
 *         description: Filter by active status
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *         description: Items per page
 *       - in: query
 *         name: sort_by
 *         schema: { type: string, enum: [created_at, user.first_name, user.last_name, role.name] }
 *         description: Sort field
 *       - in: query
 *         name: sort_order
 *         schema: { type: string, enum: [asc, desc] }
 *         description: Sort order
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data: [ 
 *                 { id: 5, position: "Staff", user: { email: "emp1@example.com" }, role: { name: "Cashier" } } 
 *               ]
 *               pagination: { total: 25, page: 1, limit: 10, totalPages: 3, hasNext: true, hasPrev: false }
 */
// NUEVA RUTA con filtros avanzados
router.get('/advanced', authMiddleware, adminMiddleware, validate_query(employee_filters_schema), getEmployeesWithFiltersHandler);

/**
 * @openapi
 * /employees:
 *   get:
 *     summary: List employees of the company (LEGACY - Simple)
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data: [ { id: 5, position: "Staff", user: { email: "emp1@example.com" }, role: { name: "Cashier" } } ]
 */
// RUTA EXISTENTE mantenida para compatibilidad
router.get('/', authMiddleware, adminMiddleware, getEmployeesHandler);

/**
 * @openapi
 * /employees:
 *   post:
 *     summary: Add an employee to the company
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               first_name: { type: string }
 *               last_name: { type: string }
 *               role_id: { type: number }
 *               position: { type: string }
 *           examples:
 *             example-1:
 *               value: { email: "emp1@example.com", first_name: "Emp", last_name: "One", role_id: 2, position: "Staff" }
 *     responses:
 *       201:
 *         description: Created
 */
// RUTA EXISTENTE mantenida
router.post('/', authMiddleware, adminMiddleware, validate_body(add_employee_schema), addEmployeeHandler);

/**
 * @openapi
 * /employees/{id}:
 *   get:
 *     summary: Get employee by ID (NEW)
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Employee not found
 */
router.get('/:id', authMiddleware, adminMiddleware, getEmployeeByIdHandler);

/**
 * @openapi
 * /employees/{id}:
 *   put:
 *     summary: Update employee (NEW)
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: Employee ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role_id: { type: number }
 *               position: { type: string }
 *               is_active: { type: boolean }
 *           examples:
 *             example-1:
 *               value: { role_id: 3, position: "Senior Staff", is_active: true }
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Employee not found
 */
router.put('/:id', authMiddleware, adminMiddleware, validate_body(update_employee_schema), updateEmployeeHandler);

/**
 * @openapi
 * /employees/{id}:
 *   delete:
 *     summary: Delete employee (NEW - Soft Delete)
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: Employee deleted successfully
 *       404:
 *         description: Employee not found
 */
router.delete('/:id', authMiddleware, adminMiddleware, deleteEmployeeHandler);

export default router;
```

## 📝 PASO 3: Actualizar Rutas de Roles

### `src/routes/role.routes.ts`
Expandir rutas existentes:

```typescript
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { validate_body, validate_query } from '../middlewares/validation_middleware';
import { 
  create_role_schema, 
  role_filters_schema, 
  update_role_schema 
} from '../validations/role.validation';
import { 
  createRoleHandler, 
  getRolesHandler,
  getRolesWithFiltersHandler,
  getRoleByIdHandler,
  updateRoleHandler,
  deleteRoleHandler
} from '../controllers/role.controller';

const router = Router();

/**
 * @openapi
 * /roles:
 *   get:
 *     summary: List roles with advanced filters (NEW - Enhanced)
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search in role name or description
 *       - in: query
 *         name: include
 *         schema: { type: string, enum: [stats, employees] }
 *         description: Include additional data
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50, maximum: 100 }
 *         description: Items per page
 *       - in: query
 *         name: sort_by
 *         schema: { type: string, enum: [created_at, name, employee_count] }
 *         description: Sort field
 *       - in: query
 *         name: sort_order
 *         schema: { type: string, enum: [asc, desc] }
 *         description: Sort order
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             examples:
 *               with_stats:
 *                 value: { 
 *                   success: true,
 *                   data: [ { id: 1, name: "Admin", _count: { employees: 5 } } ],
 *                   pagination: { total: 3, page: 1, limit: 50 }
 *                 }
 *               with_employees:
 *                 value: { 
 *                   success: true,
 *                   data: [ { 
 *                     id: 1, 
 *                     name: "Admin", 
 *                     employees: [ { user: { first_name: "John" } } ]
 *                   } ]
 *                 }
 */
// NUEVA RUTA con filtros avanzados
router.get('/advanced', authMiddleware, adminMiddleware, validate_query(role_filters_schema), getRolesWithFiltersHandler);

/**
 * @openapi
 * /roles:
 *   get:
 *     summary: List roles for the current company (LEGACY - Simple)
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data: [ { id: 1, name: "Admin" }, { id: 2, name: "Cashier" } ]
 */
// RUTA EXISTENTE mantenida para compatibilidad
router.get('/', authMiddleware, adminMiddleware, getRolesHandler);

/**
 * @openapi
 * /roles:
 *   post:
 *     summary: Create a role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               color: { type: string }
 *           examples:
 *             example-1:
 *               value: { name: "Cashier", description: "Handles payments", color: "#FFD700" }
 *     responses:
 *       201:
 *         description: Created
 */
// RUTA EXISTENTE mantenida
router.post('/', authMiddleware, adminMiddleware, validate_body(create_role_schema), createRoleHandler);

/**
 * @openapi
 * /roles/{id}:
 *   get:
 *     summary: Get role by ID (NEW)
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: Role ID
 *       - in: query
 *         name: include
 *         schema: { type: string, enum: [employees] }
 *         description: Include employees assigned to this role
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Role not found
 */
router.get('/:id', authMiddleware, adminMiddleware, getRoleByIdHandler);

/**
 * @openapi
 * /roles/{id}:
 *   put:
 *     summary: Update role (NEW)
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: Role ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               color: { type: string }
 *           examples:
 *             example-1:
 *               value: { name: "Senior Cashier", description: "Experienced cashier", color: "#FFD700" }
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Role not found
 *       409:
 *         description: Role name already exists
 */
router.put('/:id', authMiddleware, adminMiddleware, validate_body(update_role_schema), updateRoleHandler);

/**
 * @openapi
 * /roles/{id}:
 *   delete:
 *     summary: Delete role (NEW)
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role deleted successfully
 *       404:
 *         description: Role not found
 *       409:
 *         description: Cannot delete role with assigned employees
 */
router.delete('/:id', authMiddleware, adminMiddleware, deleteRoleHandler);

export default router;
```

## 📝 PASO 4: Actualizar App Principal

### `src/app.ts`
Registrar nuevas rutas:

```typescript
// Importaciones existentes mantenidas
import express from 'express';
import cors from 'cors';
import { errorHandler } from './middlewares/error_handler';

// Rutas existentes
import authRoutes from './routes/auth.routes';
import employeeRoutes from './routes/employee.routes';
import roleRoutes from './routes/role.routes';
import shiftRoutes from './routes/shift.routes';

// NUEVA: Ruta de estadísticas
import statisticsRoutes from './routes/statistics.routes';

const app = express();

// Middleware existente mantenido
app.use(cors());
app.use(express.json());

// Rutas existentes mantenidas
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/roles', roleRoutes);
app.use('/api/v1/shifts', shiftRoutes);

// NUEVA: Ruta de estadísticas
app.use('/api/v1/statistics', statisticsRoutes);

// Middleware de error mantenido
app.use(errorHandler);

export default app;
```

## 📝 PASO 5: Optimización de Base de Datos

### Crear índices para performance (opcional pero recomendado)

```sql
-- Índices para optimizar consultas frecuentes
-- Ejecutar estos comandos directamente en PostgreSQL o crear migración

-- Índice para búsquedas de empleados por empresa y estado
CREATE INDEX IF NOT EXISTS idx_company_employee_company_deleted_active 
ON company_employee(company_id, deleted_at, is_active);

-- Índice para búsquedas de empleados por rol
CREATE INDEX IF NOT EXISTS idx_company_employee_role_id 
ON company_employee(role_id) WHERE deleted_at IS NULL;

-- Índice para búsquedas de texto en usuarios
CREATE INDEX IF NOT EXISTS idx_user_search 
ON user USING gin(to_tsvector('spanish', first_name || ' ' || last_name || ' ' || email));

-- Índice para búsquedas de texto en roles
CREATE INDEX IF NOT EXISTS idx_role_search 
ON role USING gin(to_tsvector('spanish', name || ' ' || COALESCE(description, '')));

-- Índice para ordenamiento por fecha de creación
CREATE INDEX IF NOT EXISTS idx_company_employee_created_at 
ON company_employee(created_at DESC);

-- Índice para contadores de roles
CREATE INDEX IF NOT EXISTS idx_role_company_name 
ON role(company_id, name);
```

Alternativamente, crear migración con Prisma:

```bash
# En la terminal del backend, crear nueva migración
npx prisma migrate dev --name add_performance_indexes
```

## ✅ Validación de la Fase 3

```bash
# 1. OBLIGATORIO: Verificar que no hay errores de TypeScript
cd backend && npm run build
# Si falla: DETENTE y corrige errores antes de continuar

# 2. Verificar nuevas rutas de empleados
curl "http://localhost:3001/api/v1/employees/advanced?page=1&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Verificar CRUD de empleados
# GET empleado por ID
curl "http://localhost:3001/api/v1/employees/1" \
  -H "Authorization: Bearer YOUR_TOKEN"

# PUT actualizar empleado
curl -X PUT "http://localhost:3001/api/v1/employees/1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"position":"Senior Staff","is_active":true}'

# 4. Verificar nuevas rutas de roles
curl "http://localhost:3001/api/v1/roles/advanced?include=stats" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 5. Verificar CRUD de roles
# GET rol con empleados
curl "http://localhost:3001/api/v1/roles/1?include=employees" \
  -H "Authorization: Bearer YOUR_TOKEN"

# PUT actualizar rol
curl -X PUT "http://localhost:3001/api/v1/roles/1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Senior Cashier","color":"#FFD700"}'

# 6. Verificar estadísticas
curl "http://localhost:3001/api/v1/statistics/dashboard" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**CHECKLIST DE LA FASE 3:**
□ Rutas de estadísticas implementadas y documentadas
□ Rutas de empleados expandidas con CRUD completo
□ Rutas de roles expandidas con CRUD completo
□ Documentación Swagger actualizada
□ Validaciones en todas las nuevas rutas
□ Compatibilidad con rutas existentes mantenida
□ App principal registra nuevas rutas
□ Índices de performance opcionales documentados
□ Build sin errores de TypeScript
□ Todos los endpoints responden correctamente

## 🎯 Resultado de la Fase 3

- ✅ **CRUD completo** para empleados y roles
- ✅ **Rutas optimizadas** con filtros avanzados
- ✅ **Documentación Swagger** completa y actualizada
- ✅ **Validaciones robustas** en todos los endpoints
- ✅ **Compatibilidad total** con sistema existente
- ✅ **Estadísticas integradas** en endpoints dedicados
- ✅ **Performance preparada** con índices opcionales
- ✅ **Build sin errores** de TypeScript

**CRUD completo implementado** - Listo para paginación optimizada en la siguiente fase.
