import { Router } from 'express';
import { validate_body } from '../middlewares/validation_middleware';
import { login_schema, register_schema } from '../validations/auth.validation';
import { login_handler, register_handler } from '../controllers/auth.controller';

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
 *             type: object
 *             properties:
 *               company_name: { type: string }
 *               first_name: { type: string }
 *               last_name: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       201:
 *         description: Created
 *       409:
 *         description: Conflict
 */
router.post('/register', validate_body(register_schema), register_handler);

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
 *             type: object
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: Unauthorized
 */
router.post('/login', validate_body(login_schema), login_handler);

export default router;


