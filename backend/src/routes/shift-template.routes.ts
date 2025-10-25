import { Router } from 'express';
import { 
  create_shift_template_handler,
  get_shift_templates_handler,
  get_shift_template_handler,
  update_shift_template_handler,
  delete_shift_template_handler,
  increment_template_usage_handler,
  get_template_statistics_handler
} from '../controllers/shift-template.controller';
import { 
  create_shift_template_schema,
  update_shift_template_schema,
  get_shift_templates_schema,
  shift_template_id_schema
} from '../validations/shift-template.validation';
import { validate_body, validate_query, validate_params } from '../middlewares/validation_middleware';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminMiddleware } from '../middlewares/admin.middleware';

const router = Router();

// All routes require authentication and admin privileges
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * @openapi
 * /shift-templates:
 *   post:
 *     summary: Create a new reusable shift template
 *     description: |
 *       Creates a shift template that can be used for quick shift creation.
 *       Templates are company-scoped and can be used repeatedly to create shifts with predefined times.
 *
 *       **Features:**
 *       - Automatic usage tracking when template is used
 *       - In-memory caching for frequently used templates
 *       - Name uniqueness validation per company
 *
 *       **Common errors:**
 *       - `DUPLICATE_TEMPLATE_NAME` (409) - Template name already exists in company
 *       - `VALIDATION_ERROR` (400) - Invalid time format or missing required fields
 *     tags: [Shift Templates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - start_time
 *               - end_time
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Template name (must be unique within company)
 *                 example: "Morning Shift"
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Optional template description
 *                 example: "Standard morning shift for weekdays"
 *               start_time:
 *                 type: string
 *                 pattern: '^([01]\d|2[0-3]):([0-5]\d)$'
 *                 description: Start time in UTC HH:mm format
 *                 example: "09:00"
 *               end_time:
 *                 type: string
 *                 pattern: '^([01]\d|2[0-3]):([0-5]\d)$'
 *                 description: End time in UTC HH:mm format
 *                 example: "17:00"
 *           examples:
 *             morning_shift:
 *               summary: Morning shift template
 *               value:
 *                 name: "Morning Shift"
 *                 description: "Standard morning shift for weekdays"
 *                 start_time: "09:00"
 *                 end_time: "17:00"
 *             night_shift:
 *               summary: Night shift template
 *               value:
 *                 name: "Night Shift"
 *                 description: "Overnight shift for 24/7 operations"
 *                 start_time: "22:00"
 *                 end_time: "06:00"
 *             part_time:
 *               summary: Part-time shift template
 *               value:
 *                 name: "Part-Time Afternoon"
 *                 start_time: "14:00"
 *                 end_time: "18:00"
 *     responses:
 *       201:
 *         description: Template created successfully
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
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "Morning Shift"
 *                     description:
 *                       type: string
 *                       example: "Standard morning shift for weekdays"
 *                     start_time:
 *                       type: string
 *                       example: "09:00"
 *                     end_time:
 *                       type: string
 *                       example: "17:00"
 *                     company_id:
 *                       type: integer
 *                       example: 1
 *                     usage_count:
 *                       type: integer
 *                       example: 0
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       409:
 *         description: Conflict - Template name already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "DUPLICATE_TEMPLATE_NAME"
 *                 message: "A template with this name already exists in your company"
 *                 metadata:
 *                   name: "Morning Shift"
 */
router.post(
  '/',
  validate_body(create_shift_template_schema),
  create_shift_template_handler
);

/**
 * @openapi
 * /shift-templates:
 *   get:
 *     summary: List all shift templates for the company
 *     description: |
 *       Returns all shift templates belonging to the company with optional search and sorting.
 *       Results are paginated and cached in-memory for performance.
 *
 *       **Features:**
 *       - Full-text search in template name and description
 *       - Sort by name, usage frequency, or creation date
 *       - Pagination support
 *       - Results cached for 5 minutes
 *
 *       **Use cases:**
 *       - Template selection dropdown in shift creation form
 *       - Template management interface
 *       - Analytics on most-used templates
 *     tags: [Shift Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in template name and description (case-insensitive)
 *         example: "morning"
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [name, usage_count, created_at]
 *           default: name
 *         description: Field to sort by
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort direction (ascending or descending)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Templates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "Morning Shift"
 *                       description:
 *                         type: string
 *                         example: "Standard morning shift for weekdays"
 *                       start_time:
 *                         type: string
 *                         example: "09:00"
 *                       end_time:
 *                         type: string
 *                         example: "17:00"
 *                       usage_count:
 *                         type: integer
 *                         example: 42
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 15
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     totalPages:
 *                       type: integer
 *                       example: 1
 *             examples:
 *               with_templates:
 *                 summary: Company with multiple templates
 *                 value:
 *                   success: true
 *                   data:
 *                     - id: 1
 *                       name: "Morning Shift"
 *                       description: "Standard morning shift"
 *                       start_time: "09:00"
 *                       end_time: "17:00"
 *                       usage_count: 42
 *                       created_at: "2025-01-15T10:00:00Z"
 *                     - id: 2
 *                       name: "Night Shift"
 *                       description: "Overnight coverage"
 *                       start_time: "22:00"
 *                       end_time: "06:00"
 *                       usage_count: 15
 *                       created_at: "2025-01-15T10:05:00Z"
 *                   meta:
 *                     total: 2
 *                     page: 1
 *                     limit: 20
 *                     totalPages: 1
 *               empty_result:
 *                 summary: No templates found
 *                 value:
 *                   success: true
 *                   data: []
 *                   meta:
 *                     total: 0
 *                     page: 1
 *                     limit: 20
 *                     totalPages: 0
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  '/',
  validate_query(get_shift_templates_schema),
  get_shift_templates_handler as any
);

/**
 * @openapi
 * /shift-templates/statistics:
 *   get:
 *     summary: Get template usage statistics and analytics
 *     description: |
 *       Returns aggregated statistics about template usage across the company.
 *       Useful for understanding which templates are most popular and identifying usage patterns.
 *
 *       **Metrics returned:**
 *       - Total number of templates
 *       - Most frequently used templates
 *       - Templates never used
 *       - Average usage count
 *       - Usage trends over time
 *
 *       **Use cases:**
 *       - Template management dashboard
 *       - Identifying unused templates for cleanup
 *       - Understanding shift scheduling patterns
 *     tags: [Shift Templates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
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
 *                     total_templates:
 *                       type: integer
 *                       description: Total number of templates in company
 *                       example: 8
 *                     total_usage:
 *                       type: integer
 *                       description: Sum of all usage_count values
 *                       example: 156
 *                     average_usage:
 *                       type: number
 *                       description: Average usage per template
 *                       example: 19.5
 *                     most_used:
 *                       type: array
 *                       description: Top 5 most frequently used templates
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           usage_count:
 *                             type: integer
 *                     unused_templates:
 *                       type: array
 *                       description: Templates with usage_count = 0
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *             example:
 *               success: true
 *               data:
 *                 total_templates: 8
 *                 total_usage: 156
 *                 average_usage: 19.5
 *                 most_used:
 *                   - id: 1
 *                     name: "Morning Shift"
 *                     usage_count: 42
 *                   - id: 3
 *                     name: "Afternoon Shift"
 *                     usage_count: 35
 *                   - id: 2
 *                     name: "Night Shift"
 *                     usage_count: 28
 *                 unused_templates:
 *                   - id: 7
 *                     name: "Weekend Split Shift"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/statistics', get_template_statistics_handler);

/**
 * @openapi
 * /shift-templates/{id}:
 *   get:
 *     summary: Get a specific shift template by ID
 *     description: |
 *       Retrieves detailed information about a single shift template.
 *       The template must belong to the authenticated user's company.
 *
 *       **Use cases:**
 *       - Pre-filling shift creation form with template data
 *       - Template detail view for editing
 *       - Inspecting template before using it
 *     tags: [Shift Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Template ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Template retrieved successfully
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
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "Morning Shift"
 *                     description:
 *                       type: string
 *                       example: "Standard morning shift for weekdays"
 *                     start_time:
 *                       type: string
 *                       example: "09:00"
 *                     end_time:
 *                       type: string
 *                       example: "17:00"
 *                     company_id:
 *                       type: integer
 *                       example: 1
 *                     usage_count:
 *                       type: integer
 *                       example: 42
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Template not found or does not belong to your company
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "TEMPLATE_NOT_FOUND"
 *                 message: "Shift template not found"
 */
router.get(
  '/:id',
  validate_params(shift_template_id_schema),
  get_shift_template_handler as any
);

/**
 * @openapi
 * /shift-templates/{id}:
 *   put:
 *     summary: Update an existing shift template
 *     description: |
 *       Updates a shift template's name, description, or time range.
 *       All fields are optional - only send the fields you want to update.
 *
 *       **Important notes:**
 *       - Template must belong to your company
 *       - Name must remain unique within company if changed
 *       - Cache is automatically invalidated after update
 *       - Does NOT affect shifts already created with this template
 *
 *       **Common errors:**
 *       - `TEMPLATE_NOT_FOUND` (404) - Template doesn't exist or belongs to another company
 *       - `DUPLICATE_TEMPLATE_NAME` (409) - New name conflicts with existing template
 *       - `VALIDATION_ERROR` (400) - Invalid time format
 *     tags: [Shift Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Template ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Template name (must be unique within company)
 *                 example: "Morning Shift (Updated)"
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Template description
 *                 example: "Updated description for morning shift"
 *               start_time:
 *                 type: string
 *                 pattern: '^([01]\d|2[0-3]):([0-5]\d)$'
 *                 description: Start time in UTC HH:mm format
 *                 example: "08:00"
 *               end_time:
 *                 type: string
 *                 pattern: '^([01]\d|2[0-3]):([0-5]\d)$'
 *                 description: End time in UTC HH:mm format
 *                 example: "16:00"
 *           examples:
 *             update_name_only:
 *               summary: Update only the template name
 *               value:
 *                 name: "Early Morning Shift"
 *             update_times:
 *               summary: Update shift times
 *               value:
 *                 start_time: "08:00"
 *                 end_time: "16:00"
 *             full_update:
 *               summary: Update all fields
 *               value:
 *                 name: "Updated Morning Shift"
 *                 description: "Adjusted to new company hours"
 *                 start_time: "08:00"
 *                 end_time: "16:00"
 *     responses:
 *       200:
 *         description: Template updated successfully
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
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "Updated Morning Shift"
 *                     description:
 *                       type: string
 *                       example: "Adjusted to new company hours"
 *                     start_time:
 *                       type: string
 *                       example: "08:00"
 *                     end_time:
 *                       type: string
 *                       example: "16:00"
 *                     company_id:
 *                       type: integer
 *                       example: 1
 *                     usage_count:
 *                       type: integer
 *                       example: 42
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Template not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "TEMPLATE_NOT_FOUND"
 *                 message: "Shift template not found"
 *       409:
 *         description: Template name already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "DUPLICATE_TEMPLATE_NAME"
 *                 message: "A template with this name already exists in your company"
 *                 metadata:
 *                   name: "Morning Shift"
 */
router.put(
  '/:id',
  validate_params(shift_template_id_schema),
  validate_body(update_shift_template_schema),
  update_shift_template_handler as any
);

/**
 * @openapi
 * /shift-templates/{id}:
 *   delete:
 *     summary: Delete a shift template (soft delete)
 *     description: |
 *       Soft deletes a shift template by setting its `deleted_at` timestamp.
 *       The template is hidden from listings but preserved in the database for audit purposes.
 *
 *       **Important notes:**
 *       - This is a SOFT delete - data is not permanently removed
 *       - Template must belong to your company
 *       - Shifts already created with this template are NOT affected
 *       - Cache is automatically invalidated after deletion
 *       - Template can be restored by admin via database query if needed
 *
 *       **Common errors:**
 *       - `TEMPLATE_NOT_FOUND` (404) - Template doesn't exist or belongs to another company
 *     tags: [Shift Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Template ID to delete
 *         example: 1
 *     responses:
 *       200:
 *         description: Template deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Template deleted successfully"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Template not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "TEMPLATE_NOT_FOUND"
 *                 message: "Shift template not found"
 */
router.delete(
  '/:id',
  validate_params(shift_template_id_schema),
  delete_shift_template_handler as any
);

/**
 * @openapi
 * /shift-templates/{id}/increment-usage:
 *   post:
 *     summary: Increment template usage counter
 *     description: |
 *       Increments the `usage_count` field of a template by 1.
 *       This endpoint is automatically called by the frontend when a template is used to create shifts.
 *
 *       **Tracking purpose:**
 *       - Identify most popular templates
 *       - Template usage analytics
 *       - Inform template suggestions to users
 *       - Help identify unused templates for cleanup
 *
 *       **When to call:**
 *       - After successfully creating shift(s) using this template
 *       - NOT called when template is just viewed or edited
 *
 *       **Note:** This is an atomic operation - concurrent calls are safely handled by the database.
 *     tags: [Shift Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Template ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Usage count incremented successfully
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
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     usage_count:
 *                       type: integer
 *                       description: New usage count after increment
 *                       example: 43
 *             example:
 *               success: true
 *               data:
 *                 id: 1
 *                 usage_count: 43
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Template not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "TEMPLATE_NOT_FOUND"
 *                 message: "Shift template not found"
 */
router.post(
  '/:id/increment-usage',
  validate_params(shift_template_id_schema),
  increment_template_usage_handler as any
);

export default router;