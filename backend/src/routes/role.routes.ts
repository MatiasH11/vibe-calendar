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
 *     responses:
 *       201:
 *         description: Created
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
 */
router.get('/', authMiddleware, adminMiddleware, getRolesHandler);

export default router;


