import { Router } from 'express';
import { user_controller } from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @openapi
 * /user:
 *   get:
 *     tags: [user]
 *     summary: Get all users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: string
 *           enum: [true, false]
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: List of users with pagination
 */
router.get('/', user_controller.getAll);

/**
 * @openapi
 * /user/{id}:
 *   get:
 *     tags: [user]
 *     summary: Get user by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: user details
 *       404:
 *         description: user not found
 */
router.get('/:id', user_controller.getById);

/**
 * @openapi
 * /user:
 *   post:
 *     tags: [user]
 *     summary: Create new user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: user created successfully
 */
router.post('/', user_controller.create);

/**
 * @openapi
 * /user/{id}:
 *   put:
 *     tags: [user]
 *     summary: Update user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: user updated successfully
 */
router.put('/:id', user_controller.update);

/**
 * @openapi
 * /user/{id}:
 *   delete:
 *     tags: [user]
 *     summary: Delete user (soft delete)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: user deleted successfully
 */
router.delete('/:id', user_controller.delete);

/**
 * @openapi
 * /user/bulk/create:
 *   post:
 *     tags: [user]
 *     summary: Bulk create users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 100
 *     responses:
 *       201:
 *         description: users created successfully
 */
router.post('/bulk/create', user_controller.bulkCreate);

/**
 * @openapi
 * /user/bulk/update:
 *   put:
 *     tags: [user]
 *     summary: Bulk update users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 minItems: 1
 *                 maxItems: 100
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: users updated successfully
 */
router.put('/bulk/update', user_controller.bulkUpdate);

/**
 * @openapi
 * /user/bulk/delete:
 *   delete:
 *     tags: [user]
 *     summary: Bulk delete users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 minItems: 1
 *                 maxItems: 100
 *     responses:
 *       200:
 *         description: users deleted successfully
 */
router.delete('/bulk/delete', user_controller.bulkDelete);

export default router;
