import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { deprecationWarning } from '../middlewares/deprecation.middleware';
import { validate_body, validate_query } from '../middlewares/validation_middleware';
import {
  add_employee_schema,
  employee_filters_schema,
  update_employee_schema,
  bulk_update_employees_schema
} from '../validations/employee.validation';
import {
  addEmployeeHandler,
  getEmployeesHandler,
  getEmployeesWithFiltersHandler,
  getEmployeesForShiftsHandler,
  getEmployeeByIdHandler,
  updateEmployeeHandler,
  deleteEmployeeHandler,
  bulkUpdateEmployeesHandler
} from '../controllers/employee.controller';

const router = Router();

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
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data: { id: 5, company_id: 1, user_id: 10, role_id: 2, position: "Staff", user: { id: 10, email: "emp1@example.com" }, role: { id: 2, name: "Cashier" } }
 *       409:
 *         description: Conflict
 */
router.post('/', authMiddleware, adminMiddleware, validate_body(add_employee_schema), addEmployeeHandler);

/**
 * @openapi
 * /employees/bulk:
 *   patch:
 *     summary: Bulk update employees (activate/deactivate/change role)
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employee_ids, action]
 *             properties:
 *               employee_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                   minimum: 1
 *                 minItems: 1
 *                 description: Array of employee IDs to update
 *               action:
 *                 type: string
 *                 enum: [activate, deactivate, change_role]
 *                 description: Action to perform on the employees
 *               role_id:
 *                 type: integer
 *                 minimum: 1
 *                 description: Required when action is 'change_role'
 *           examples:
 *             activate:
 *               summary: Activate employees
 *               value: { employee_ids: [1, 2, 3], action: "activate" }
 *             deactivate:
 *               summary: Deactivate employees
 *               value: { employee_ids: [4, 5], action: "deactivate" }
 *             change_role:
 *               summary: Change employee role
 *               value: { employee_ids: [1, 2], action: "change_role", role_id: 5 }
 *     responses:
 *       200:
 *         description: Employees updated successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "3 employee(s) activated successfully."
 *               data: { count: 3 }
 *       400:
 *         description: Bad request (invalid action or missing role_id)
 *       403:
 *         description: Forbidden (role does not belong to company)
 */
router.patch('/bulk', authMiddleware, adminMiddleware, validate_body(bulk_update_employees_schema), bulkUpdateEmployeesHandler);

/**
 * @openapi
 * /employees/advanced:
 *   get:
 *     summary: List employees with advanced filters
 *     description: |
 *       **⚠️ DEPRECATED:** Use `GET /employees` instead with query parameters.
 *
 *       This endpoint will be removed in v2.0 (planned for 2026-04-18).
 *
 *       **Migration:** Replace `/employees/advanced?search=...` with `/employees?search=...`
 *     deprecated: true
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
 *         headers:
 *           X-Deprecated:
 *             description: Warning that this endpoint is deprecated
 *             schema:
 *               type: string
 *               example: "This endpoint is deprecated. Use GET /employees instead. Sunset date: 2026-04-18"
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data: [
 *                 { id: 5, position: "Staff", user: { email: "emp1@example.com" }, role: { name: "Cashier" } }
 *               ]
 *               pagination: { total: 25, page: 1, limit: 10, totalPages: 3, hasNext: true, hasPrev: false }
 */
// DEPRECATED ROUTE - Use GET /employees instead
router.get(
  '/advanced',
  authMiddleware,
  adminMiddleware,
  deprecationWarning('GET /employees with query parameters'),
  validate_query(employee_filters_schema),
  getEmployeesWithFiltersHandler as any
);

/**
 * @openapi
 * /employees/with-shifts:
 *   get:
 *     summary: Get employees with their shifts for a date range
 *     description: |
 *       Retrieves all active employees along with their scheduled shifts for a specified date range.
 *       This is the **standard endpoint** for calendar/schedule views.
 *
 *       **Use cases:**
 *       - Display weekly calendar view
 *       - Show monthly schedule
 *       - Export shift schedules
 *
 *       **Query params:**
 *       - Use `start_date` and `end_date` for any date range
 *       - Legacy `week_start` and `week_end` params are also supported for backward compatibility
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema: { type: string, format: date }
 *         description: Start date of the range (YYYY-MM-DD). Recommended parameter.
 *         example: "2025-10-20"
 *       - in: query
 *         name: end_date
 *         schema: { type: string, format: date }
 *         description: End date of the range (YYYY-MM-DD). Recommended parameter.
 *         example: "2025-10-26"
 *       - in: query
 *         name: week_start
 *         schema: { type: string, format: date }
 *         description: (Legacy) Start of the week (YYYY-MM-DD). Use start_date instead.
 *         deprecated: true
 *       - in: query
 *         name: week_end
 *         schema: { type: string, format: date }
 *         description: (Legacy) End of the week (YYYY-MM-DD). Use end_date instead.
 *         deprecated: true
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             examples:
 *               with_shifts:
 *                 summary: Week with shifts
 *                 value:
 *                   success: true
 *                   data: [
 *                     {
 *                       id: 1,
 *                       user: { first_name: "John", last_name: "Doe" },
 *                       role: { name: "Bar", color: "#8B5CF6" },
 *                       shifts: [
 *                         { date: "2025-10-20", shifts: [] },
 *                         { date: "2025-10-21", shifts: [{ id: 1, start_time: "09:00", end_time: "17:00", status: "scheduled" }] },
 *                         { date: "2025-10-22", shifts: [{ id: 2, start_time: "14:00", end_time: "22:00", status: "scheduled" }] }
 *                       ]
 *                     }
 *                   ]
 *                   meta: {
 *                     start_date: "2025-10-20",
 *                     end_date: "2025-10-26",
 *                     total_employees: 1,
 *                     employees_with_shifts: 1,
 *                     total_shifts: 2
 *                   }
 *               without_params:
 *                 summary: No date range (all employees, no shifts)
 *                 value:
 *                   success: true
 *                   data: [
 *                     {
 *                       id: 1,
 *                       user: { first_name: "John", last_name: "Doe" },
 *                       role: { name: "Bar", color: "#8B5CF6" },
 *                       shifts: []
 *                     }
 *                   ]
 *                   meta: {
 *                     start_date: null,
 *                     end_date: null,
 *                     total_employees: 1,
 *                     employees_with_shifts: 0,
 *                     total_shifts: 0
 *                   }
 */
// STANDARD ROUTE for getting employees with shifts
router.get('/with-shifts', authMiddleware, adminMiddleware, getEmployeesForShiftsHandler);

/**
 * @openapi
 * /employees/for-shifts:
 *   get:
 *     summary: Get employees for shifts view (LEGACY)
 *     description: |
 *       **⚠️ DEPRECATED:** Use `GET /employees/with-shifts` instead.
 *
 *       This endpoint will be removed in v2.0 (planned for 2026-04-18).
 *
 *       **Migration:**
 *       - Replace `/employees/for-shifts?week_start=...&week_end=...`
 *       - With `/employees/with-shifts?start_date=...&end_date=...`
 *     deprecated: true
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: week_start
 *         schema: { type: string, format: date }
 *         description: Start of the week (YYYY-MM-DD)
 *       - in: query
 *         name: week_end
 *         schema: { type: string, format: date }
 *         description: End of the week (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: OK
 *         headers:
 *           X-Deprecated:
 *             description: Warning that this endpoint is deprecated
 *             schema:
 *               type: string
 *               example: "This endpoint is deprecated. Use GET /employees/with-shifts instead. Sunset date: 2026-04-18"
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data: [
 *                 {
 *                   id: 1,
 *                   user: { first_name: "John", last_name: "Doe" },
 *                   role: { name: "Bar", color: "#8B5CF6" },
 *                   shifts: [
 *                     { date: "2025-08-25", shifts: [] },
 *                     { date: "2025-08-26", shifts: [{ id: 1, start_time: "09:00", end_time: "17:00" }] }
 *                   ]
 *                 }
 *               ]
 *               meta: {
 *                 start_date: "2025-08-25",
 *                 end_date: "2025-08-31",
 *                 total_employees: 1,
 *                 employees_with_shifts: 1,
 *                 total_shifts: 1
 *               }
 */
// DEPRECATED ROUTE - Use GET /employees/with-shifts instead
router.get(
  '/for-shifts',
  authMiddleware,
  adminMiddleware,
  deprecationWarning('GET /employees/with-shifts with start_date and end_date parameters'),
  getEmployeesForShiftsHandler
);

/**
 * @openapi
 * /employees:
 *   get:
 *     summary: List employees of the company with advanced filtering
 *     description: |
 *       **Standard endpoint** for listing employees. Supports advanced filtering, search, pagination, and sorting.
 *
 *       **Use cases:**
 *       - Employee management dashboard
 *       - Search employees by name, email, or role
 *       - Filter by role or active status
 *       - Paginated lists for large companies
 *
 *       **Note:** All query parameters are optional. Without parameters, returns all active employees (paginated).
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search in name, email, role name, or position. Case-insensitive.
 *         example: "john"
 *       - in: query
 *         name: role_id
 *         schema: { type: integer }
 *         description: Filter by specific role ID
 *         example: 2
 *       - in: query
 *         name: is_active
 *         schema: { type: boolean }
 *         description: Filter by active status (true = active, false = inactive)
 *         example: true
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1, minimum: 1 }
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, minimum: 1, maximum: 100 }
 *         description: Number of items per page (max 100)
 *         example: 10
 *       - in: query
 *         name: sort_by
 *         schema: { type: string, enum: [created_at, user.first_name, user.last_name, role.name], default: created_at }
 *         description: Field to sort by
 *         example: "user.first_name"
 *       - in: query
 *         name: sort_order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *         description: Sort order (ascending or descending)
 *         example: "asc"
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             examples:
 *               with_filters:
 *                 summary: Filtered and paginated result
 *                 value:
 *                   success: true
 *                   data: [
 *                     {
 *                       id: 5,
 *                       company_id: 1,
 *                       user_id: 10,
 *                       role_id: 2,
 *                       position: "Staff",
 *                       is_active: true,
 *                       user: {
 *                         id: 10,
 *                         first_name: "John",
 *                         last_name: "Doe",
 *                         email: "john@example.com"
 *                       },
 *                       role: {
 *                         id: 2,
 *                         name: "Cashier",
 *                         description: "Handles transactions",
 *                         color: "#3B82F6"
 *                       }
 *                     }
 *                   ]
 *                   pagination: {
 *                     total: 25,
 *                     page: 1,
 *                     limit: 10,
 *                     totalPages: 3,
 *                     hasNext: true,
 *                     hasPrev: false
 *                   }
 *               simple:
 *                 summary: Simple list (no filters)
 *                 value:
 *                   success: true
 *                   data: [
 *                     { id: 1, position: "Manager", user: { email: "alice@example.com" }, role: { name: "Admin" } },
 *                     { id: 2, position: "Staff", user: { email: "bob@example.com" }, role: { name: "Cashier" } }
 *                   ]
 *                   pagination: {
 *                     total: 2,
 *                     page: 1,
 *                     limit: 10,
 *                     totalPages: 1,
 *                     hasNext: false,
 *                     hasPrev: false
 *                   }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
// STANDARD ROUTE - Enhanced with optional query params for filtering
router.get('/', authMiddleware, adminMiddleware, validate_query(employee_filters_schema), getEmployeesWithFiltersHandler as any);

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