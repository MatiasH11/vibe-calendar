import { Request, Response, NextFunction } from 'express';
import { day_template_service } from '../services/day_template.service';
import {
  create_day_template_schema,
  update_day_template_schema,
  day_template_filters_schema,
  bulk_create_day_template_schema,
  bulk_update_day_template_schema,
  bulk_delete_day_template_schema,
} from '../validations/day_template.validation';

export const day_template_controller = {
  /**
   * Get all day_templates
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = day_template_filters_schema.parse(req.query);
      const company_id = req.user!.admin_company_id;

      const result = await day_template_service.getAll(company_id, filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get day_template by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const company_id = req.user!.admin_company_id;

      const result = await day_template_service.getById(id, company_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create day_template
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = create_day_template_schema.parse(req.body);
      const company_id = req.user!.admin_company_id;
      const user_id = req.user!.user_id;

      const result = await day_template_service.create(data, company_id, user_id);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update day_template
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const data = update_day_template_schema.parse(req.body);
      const company_id = req.user!.admin_company_id;
      const user_id = req.user!.user_id;

      const result = await day_template_service.update(id, data, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete day_template
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const company_id = req.user!.admin_company_id;
      const user_id = req.user!.user_id;

      const result = await day_template_service.delete(id, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Bulk create day_templates
   */
  async bulkCreate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulk_create_day_template_schema.parse(req.body);
      const company_id = req.user!.admin_company_id;
      const user_id = req.user!.user_id;

      const result = await day_template_service.bulkCreate(data, company_id, user_id);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Bulk update day_templates
   */
  async bulkUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulk_update_day_template_schema.parse(req.body);
      const company_id = req.user!.admin_company_id;
      const user_id = req.user!.user_id;

      const result = await day_template_service.bulkUpdate(data, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Bulk delete day_templates
   */
  async bulkDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulk_delete_day_template_schema.parse(req.body);
      const company_id = req.user!.admin_company_id;
      const user_id = req.user!.user_id;

      const result = await day_template_service.bulkDelete(data, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};
