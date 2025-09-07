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
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data: { id: 2, company_id: 1, name: "Cashier", description: "Handles payments", color: "#FFD700" }
 *       409:
 *         description: Conflict
 */
router.post('/', authMiddleware, adminMiddleware, validate_body(create_role_schema), createRoleHandler);

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
router.get('/advanced', authMiddleware, adminMiddleware, validate_query(role_filters_schema), getRolesWithFiltersHandler as any);

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


