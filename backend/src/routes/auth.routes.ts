import { Router } from 'express';
import { validate_body } from '../middlewares/validation_middleware';
import { login_schema, register_schema } from '../validations/auth.validation';
import { login_handler, register_handler } from '../controllers/auth.controller';
import { authRateLimiter } from '../middlewares/rate-limit.middleware';

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new company and its admin user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/auth_register_body'
 *           examples:
 *             example-1:
 *               summary: Registro básico
 *               value:
 *                 company_name: "TestCo"
 *                 first_name: "Matias"
 *                 last_name: "Hidalgo"
 *                 email: "admin@example.com"
 *                 password: "Chatwoot1!"
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data: { company_id: 1, user_id: 1, role_id: 1, employee_id: 1 }
 *       409:
 *         description: Conflict
 */
router.post('/register', authRateLimiter, validate_body(register_schema), register_handler);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login with user credentials
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/auth_login_body'
 *           examples:
 *             example-1:
 *               summary: Login básico
 *               value:
 *                 email: "admin@example.com"
 *                 password: "Chatwoot1!"
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data: { token: "<jwt>" }
 *       401:
 *         description: Unauthorized
 */
router.post('/login', authRateLimiter, validate_body(login_schema), login_handler);

export default router;


