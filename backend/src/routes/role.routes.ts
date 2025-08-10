import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { validate_body } from '../middlewares/validation_middleware';
import { create_role_schema } from '../validations/role.validation';
import { createRoleHandler, getRolesHandler } from '../controllers/role.controller';

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
 *     summary: List roles for the current company
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
router.get('/', authMiddleware, adminMiddleware, getRolesHandler);

export default router;


