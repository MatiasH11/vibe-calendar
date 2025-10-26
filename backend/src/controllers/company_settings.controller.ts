import { Request, Response, NextFunction } from 'express';
import { company_settings_service } from '../services/company_settings.service';
import {
  create_company_settings_schema,
  update_company_settings_schema,
  company_settings_filters_schema,
  bulk_create_company_settings_schema,
  bulk_update_company_settings_schema,
  bulk_delete_company_settings_schema,
} from '../validations/company_settings.validation';

export const company_settings_controller = {
  /**
   * Get all company_settingss
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = company_settings_filters_schema.parse(req.query);
      const company_id = req.user!.company_id;

      const result = await company_settings_service.getAll(company_id, filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get company_settings by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const company_id = req.user!.company_id;

      const result = await company_settings_service.getById(id, company_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create company_settings
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = create_company_settings_schema.parse(req.body);
      const company_id = req.user!.company_id;
      const user_id = req.user!.user_id;

      const result = await company_settings_service.create(data, company_id, user_id);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update company_settings
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const data = update_company_settings_schema.parse(req.body);
      const company_id = req.user!.company_id;
      const user_id = req.user!.user_id;

      const result = await company_settings_service.update(id, data, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete company_settings
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const company_id = req.user!.company_id;
      const user_id = req.user!.user_id;

      const result = await company_settings_service.delete(id, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Bulk create company_settingss
   */
  async bulkCreate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulk_create_company_settings_schema.parse(req.body);
      const company_id = req.user!.company_id;
      const user_id = req.user!.user_id;

      const result = await company_settings_service.bulkCreate(data, company_id, user_id);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Bulk update company_settingss
   */
  async bulkUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulk_update_company_settings_schema.parse(req.body);
      const company_id = req.user!.company_id;
      const user_id = req.user!.user_id;

      const result = await company_settings_service.bulkUpdate(data, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Bulk delete company_settingss
   */
  async bulkDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulk_delete_company_settings_schema.parse(req.body);
      const company_id = req.user!.company_id;
      const user_id = req.user!.user_id;

      const result = await company_settings_service.bulkDelete(data, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};
