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
 *     tags: [Auth]
 *     summary: Register new company and user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [company_name, first_name, last_name, email, password]
 *             properties:
 *               company_name:
 *                 type: string
 *                 example: "My Restaurant"
 *               first_name:
 *                 type: string
 *                 example: "John"
 *               last_name:
 *                 type: string
 *                 example: "Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "password123"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     company_id:
 *                       type: integer
 *                     user_id:
 *                       type: integer
 *                     employee_id:
 *                       type: integer
 *       409:
 *         description: Email or company name already exists
 */
router.post('/register', authRateLimiter, validate_body(register_schema), register_handler);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         first_name:
 *                           type: string
 *                         last_name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         user_type:
 *                           type: string
 *                           enum: [SUPER_ADMIN, USER]
 *                     employee:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         company_id:
 *                           type: integer
 *                         company_name:
 *                           type: string
 *                         department:
 *                           type: string
 *                         company_role:
 *                           type: string
 *                           enum: [OWNER, ADMIN, MANAGER, EMPLOYEE]
 *                         position:
 *                           type: string
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', authRateLimiter, validate_body(login_schema), login_handler);

export default router;
