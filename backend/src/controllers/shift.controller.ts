import { Request, Response, NextFunction } from 'express';
import { shift_service } from '../services/shift.service';
import {
  create_shift_schema,
  update_shift_schema,
  shift_filters_schema,
  bulk_create_shift_schema,
  bulk_update_shift_schema,
  bulk_delete_shift_schema,
} from '../validations/shift.validation';

/**
 * Shift Controller
 *
 * Handles HTTP requests for shift CRUD operations with comprehensive business logic.
 *
 * IMPORTANT - UTC Date/Time Handling:
 * - shift_date: ISO date format YYYY-MM-DD (e.g., "2025-10-26")
 * - start_time, end_time: UTC time format HH:mm (e.g., "14:30", "09:00")
 * - Validation ensures proper formats and rejects timezone indicators
 * - Service layer handles conversion between UTC strings and PostgreSQL Date/Time
 * - Frontend is responsible for timezone conversions for display
 *
 * Business Logic Enforced:
 * - Conflict detection: No overlapping shifts for same employee on same date
 * - Max daily hours: Validates against company_settings.max_daily_hours
 * - Employee validation: Ensures employee belongs to company
 * - Pattern tracking: Automatically learns employee shift patterns
 * - Audit logging: All operations tracked with UTC timestamps
 */
export const shift_controller = {
  /**
   * Get all shifts
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = shift_filters_schema.parse(req.query);
      const company_id = req.user!.company_id;

      const result = await shift_service.getAll(company_id, filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get shift by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const company_id = req.user!.company_id;

      const result = await shift_service.getById(id, company_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create shift
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = create_shift_schema.parse(req.body);
      const company_id = req.user!.company_id;
      const user_id = req.user!.user_id;

      const result = await shift_service.create(data, company_id, user_id);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update shift
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const data = update_shift_schema.parse(req.body);
      const company_id = req.user!.company_id;
      const user_id = req.user!.user_id;

      const result = await shift_service.update(id, data, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete shift
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const company_id = req.user!.company_id;
      const user_id = req.user!.user_id;

      const result = await shift_service.delete(id, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Bulk create shifts
   */
  async bulkCreate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulk_create_shift_schema.parse(req.body);
      const company_id = req.user!.company_id;
      const user_id = req.user!.user_id;

      const result = await shift_service.bulkCreate(data, company_id, user_id);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Bulk update shifts
   */
  async bulkUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulk_update_shift_schema.parse(req.body);
      const company_id = req.user!.company_id;
      const user_id = req.user!.user_id;

      const result = await shift_service.bulkUpdate(data, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Bulk delete shifts
   */
  async bulkDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulk_delete_shift_schema.parse(req.body);
      const company_id = req.user!.company_id;
      const user_id = req.user!.user_id;

      const result = await shift_service.bulkDelete(data, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};
