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
 *     summary: Register new company and admin user
 *     description: |
 *       Creates a new company along with its first admin user in a single transaction.
 *       This is the initial registration endpoint for new organizations.
 *
 *       **Rate Limit:** 5 requests / 15 minutes
 *
 *       **What happens:**
 *       1. Creates a new company
 *       2. Creates the admin user account
 *       3. Creates a default "Admin" role for the company
 *       4. Links the user to the company as an employee with admin role
 *       5. Returns JWT token for immediate authentication
 *
 *       **Common errors:**
 *       - `EMAIL_ALREADY_EXISTS` (409) - Email is already registered
 *       - `COMPANY_NAME_ALREADY_EXISTS` (409) - Company name is taken
 *       - `VALIDATION_ERROR` (400) - Invalid input data
 *     tags: [Auth]
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
 *                 description: Name of the company to create
 *                 example: "Acme Corp"
 *               first_name:
 *                 type: string
 *                 description: Admin user's first name
 *                 example: "John"
 *               last_name:
 *                 type: string
 *                 description: Admin user's last name
 *                 example: "Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Admin user's email (must be unique)
 *                 example: "john@acme.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: Admin user's password (min 8 characters)
 *                 example: "SecurePass123!"
 *           examples:
 *             restaurant:
 *               summary: Restaurant registration
 *               value:
 *                 company_name: "Pizza Palace"
 *                 first_name: "Maria"
 *                 last_name: "Garcia"
 *                 email: "maria@pizzapalace.com"
 *                 password: "MySecurePassword2025!"
 *             retail:
 *               summary: Retail store registration
 *               value:
 *                 company_name: "TechMart"
 *                 first_name: "David"
 *                 last_name: "Chen"
 *                 email: "david@techmart.com"
 *                 password: "StrongPassword123!"
 *     responses:
 *       201:
 *         description: Company and admin user created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: JWT authentication token
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         email:
 *                           type: string
 *                           example: "john@acme.com"
 *                         first_name:
 *                           type: string
 *                           example: "John"
 *                         last_name:
 *                           type: string
 *                           example: "Doe"
 *                     company:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         name:
 *                           type: string
 *                           example: "Acme Corp"
 *             example:
 *               success: true
 *               data:
 *                 token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJjb21wYW55X2lkIjoxLCJ1c2VyX3R5cGUiOiJhZG1pbiJ9.abc123"
 *                 user:
 *                   id: 1
 *                   email: "john@acme.com"
 *                   first_name: "John"
 *                   last_name: "Doe"
 *                 company:
 *                   id: 1
 *                   name: "Acme Corp"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Conflict - Email or company name already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               email_exists:
 *                 summary: Email already registered
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "EMAIL_ALREADY_EXISTS"
 *                     message: "A user with this email already exists"
 *                     metadata:
 *                       email: "john@acme.com"
 *               company_exists:
 *                 summary: Company name taken
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "COMPANY_NAME_ALREADY_EXISTS"
 *                     message: "A company with this name already exists"
 *                     metadata:
 *                       company_name: "Acme Corp"
 *       429:
 *         $ref: '#/components/responses/RateLimitExceeded'
 */
router.post('/register', authRateLimiter, validate_body(register_schema), register_handler);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login with email and password
 *     description: |
 *       Authenticates a user with their email and password. Returns a JWT token for subsequent API requests.
 *
 *       **Rate Limit:** 5 requests / 15 minutes
 *
 *       **How to use the token:**
 *       ```
 *       Authorization: Bearer <token>
 *       ```
 *
 *       **Token contains:**
 *       - user_id - User's ID
 *       - company_id - User's company ID (for multi-tenancy)
 *       - user_type - User type (admin or employee)
 *
 *       **Common errors:**
 *       - `INVALID_CREDENTIALS` (401) - Wrong email or password
 *       - `VALIDATION_ERROR` (400) - Invalid email format
 *     tags: [Auth]
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
 *                 description: User's email address
 *                 example: "john@acme.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password
 *                 example: "SecurePass123!"
 *           examples:
 *             admin_login:
 *               summary: Admin login
 *               value:
 *                 email: "admin@acme.com"
 *                 password: "AdminPass123!"
 *             employee_login:
 *               summary: Employee login
 *               value:
 *                 email: "employee@acme.com"
 *                 password: "EmployeePass123!"
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
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: JWT authentication token (valid for 24 hours)
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         email:
 *                           type: string
 *                           example: "john@acme.com"
 *                         first_name:
 *                           type: string
 *                           example: "John"
 *                         last_name:
 *                           type: string
 *                           example: "Doe"
 *                         user_type:
 *                           type: string
 *                           enum: [admin, employee]
 *                           example: "admin"
 *             examples:
 *               admin:
 *                 summary: Admin login success
 *                 value:
 *                   success: true
 *                   data:
 *                     token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJjb21wYW55X2lkIjoxLCJ1c2VyX3R5cGUiOiJhZG1pbiJ9.abc123"
 *                     user:
 *                       id: 1
 *                       email: "admin@acme.com"
 *                       first_name: "John"
 *                       last_name: "Doe"
 *                       user_type: "admin"
 *               employee:
 *                 summary: Employee login success
 *                 value:
 *                   success: true
 *                   data:
 *                     token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo1LCJjb21wYW55X2lkIjoxLCJ1c2VyX3R5cGUiOiJlbXBsb3llZSJ9.xyz789"
 *                     user:
 *                       id: 5
 *                       email: "employee@acme.com"
 *                       first_name: "Jane"
 *                       last_name: "Smith"
 *                       user_type: "employee"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Unauthorized - Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "INVALID_CREDENTIALS"
 *                 message: "Invalid email or password"
 *       429:
 *         $ref: '#/components/responses/RateLimitExceeded'
 */
router.post('/login', authRateLimiter, validate_body(login_schema), login_handler);

export default router;


