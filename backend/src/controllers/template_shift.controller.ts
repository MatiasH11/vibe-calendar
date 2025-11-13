import { Request, Response, NextFunction } from 'express';
import { template_shift_service } from '../services/template_shift.service';
import {
  create_template_shift_schema,
  update_template_shift_schema,
  template_shift_filters_schema,
  bulk_create_template_shift_schema,
  bulk_update_template_shift_schema,
  bulk_delete_template_shift_schema,
} from '../validations/template_shift.validation';

export const template_shift_controller = {
  /**
   * Get all template_shifts
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = template_shift_filters_schema.parse(req.query);
      const company_id = req.user!.admin_company_id;

      const result = await template_shift_service.getAll(company_id, filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get template_shift by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const company_id = req.user!.admin_company_id;

      const result = await template_shift_service.getById(id, company_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create template_shift
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = create_template_shift_schema.parse(req.body);
      const company_id = req.user!.admin_company_id;
      const user_id = req.user!.user_id;

      const result = await template_shift_service.create(data, company_id, user_id);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update template_shift
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const data = update_template_shift_schema.parse(req.body);
      const company_id = req.user!.admin_company_id;
      const user_id = req.user!.user_id;

      const result = await template_shift_service.update(id, data, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete template_shift
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const company_id = req.user!.admin_company_id;
      const user_id = req.user!.user_id;

      const result = await template_shift_service.delete(id, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Bulk create template_shifts
   */
  async bulkCreate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulk_create_template_shift_schema.parse(req.body);
      const company_id = req.user!.admin_company_id;
      const user_id = req.user!.user_id;

      const result = await template_shift_service.bulkCreate(data, company_id, user_id);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Bulk update template_shifts
   */
  async bulkUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulk_update_template_shift_schema.parse(req.body);
      const company_id = req.user!.admin_company_id;
      const user_id = req.user!.user_id;

      const result = await template_shift_service.bulkUpdate(data, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Bulk delete template_shifts
   */
  async bulkDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulk_delete_template_shift_schema.parse(req.body);
      const company_id = req.user!.admin_company_id;
      const user_id = req.user!.user_id;

      const result = await template_shift_service.bulkDelete(data, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};
