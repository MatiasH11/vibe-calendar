import { Request, Response, NextFunction } from 'express';
import { shift_template_service } from '../services/shift_template.service';
import {
  create_shift_template_schema,
  update_shift_template_schema,
  shift_template_filters_schema,
  bulk_create_shift_template_schema,
  bulk_update_shift_template_schema,
  bulk_delete_shift_template_schema,
} from '../validations/shift_template.validation';

/**
 * Shift Template Controller
 *
 * Handles HTTP requests for shift template CRUD operations.
 *
 * IMPORTANT - UTC Time Handling:
 * - All time fields (start_time, end_time) are in UTC HH:mm format
 * - Validation ensures times are in "HH:mm" format (e.g., "14:30", "09:00")
 * - Service layer handles conversion between UTC strings and PostgreSQL Time
 * - Frontend is responsible for timezone conversions for display
 */
export const shift_template_controller = {
  /**
   * Get all shift_templates
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = shift_template_filters_schema.parse(req.query);
      const company_id = req.user!.admin_company_id;

      const result = await shift_template_service.getAll(company_id, filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get shift_template by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const company_id = req.user!.admin_company_id;

      const result = await shift_template_service.getById(id, company_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create shift_template
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = create_shift_template_schema.parse(req.body);
      const company_id = req.user!.admin_company_id;
      const user_id = req.user!.user_id;

      const result = await shift_template_service.create(data, company_id, user_id);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update shift_template
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const data = update_shift_template_schema.parse(req.body);
      const company_id = req.user!.admin_company_id;
      const user_id = req.user!.user_id;

      const result = await shift_template_service.update(id, data, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete shift_template
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const company_id = req.user!.admin_company_id;
      const user_id = req.user!.user_id;

      const result = await shift_template_service.delete(id, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Bulk create shift_templates
   */
  async bulkCreate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulk_create_shift_template_schema.parse(req.body);
      const company_id = req.user!.admin_company_id;
      const user_id = req.user!.user_id;

      const result = await shift_template_service.bulkCreate(data, company_id, user_id);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Bulk update shift_templates
   */
  async bulkUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulk_update_shift_template_schema.parse(req.body);
      const company_id = req.user!.admin_company_id;
      const user_id = req.user!.user_id;

      const result = await shift_template_service.bulkUpdate(data, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Bulk delete shift_templates
   */
  async bulkDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulk_delete_shift_template_schema.parse(req.body);
      const company_id = req.user!.admin_company_id;
      const user_id = req.user!.user_id;

      const result = await shift_template_service.bulkDelete(data, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};
