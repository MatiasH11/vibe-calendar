import { Request, Response, NextFunction } from 'express';
import { template_shift_position_service } from '../services/template_shift_position.service';
import {
  create_template_shift_position_schema,
  update_template_shift_position_schema,
  template_shift_position_filters_schema,
  bulk_create_template_shift_position_schema,
  bulk_update_template_shift_position_schema,
  bulk_delete_template_shift_position_schema,
} from '../validations/template_shift_position.validation';

export const template_shift_position_controller = {
  /**
   * Get all template_shift_positions
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = template_shift_position_filters_schema.parse(req.query);
      const company_id = req.user!.admin_company_id;

      const result = await template_shift_position_service.getAll(company_id, filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get template_shift_position by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const company_id = req.user!.admin_company_id;

      const result = await template_shift_position_service.getById(id, company_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create template_shift_position
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = create_template_shift_position_schema.parse(req.body);
      const company_id = req.user!.admin_company_id;
      const user_id = req.user!.user_id;

      const result = await template_shift_position_service.create(data, company_id, user_id);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update template_shift_position
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const data = update_template_shift_position_schema.parse(req.body);
      const company_id = req.user!.admin_company_id;
      const user_id = req.user!.user_id;

      const result = await template_shift_position_service.update(id, data, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete template_shift_position
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const company_id = req.user!.admin_company_id;
      const user_id = req.user!.user_id;

      const result = await template_shift_position_service.delete(id, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Bulk create template_shift_positions
   */
  async bulkCreate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulk_create_template_shift_position_schema.parse(req.body);
      const company_id = req.user!.admin_company_id;
      const user_id = req.user!.user_id;

      const result = await template_shift_position_service.bulkCreate(data, company_id, user_id);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Bulk update template_shift_positions
   */
  async bulkUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulk_update_template_shift_position_schema.parse(req.body);
      const company_id = req.user!.admin_company_id;
      const user_id = req.user!.user_id;

      const result = await template_shift_position_service.bulkUpdate(data, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Bulk delete template_shift_positions
   */
  async bulkDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulk_delete_template_shift_position_schema.parse(req.body);
      const company_id = req.user!.admin_company_id;
      const user_id = req.user!.user_id;

      const result = await template_shift_position_service.bulkDelete(data, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};
