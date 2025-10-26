import { Request, Response, NextFunction } from 'express';
import { company_service } from '../services/company.service';
import {
  create_company_schema,
  update_company_schema,
  company_filters_schema,
  bulk_create_company_schema,
  bulk_update_company_schema,
  bulk_delete_company_schema,
} from '../validations/company.validation';

export const company_controller = {
  /**
   * Get all companies
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = company_filters_schema.parse(req.query);
      const result = await company_service.getAll(filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get company by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const result = await company_service.getById(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create company
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = create_company_schema.parse(req.body);
      const user_id = req.user!.user_id;

      const result = await company_service.create(data, user_id);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update company
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const data = update_company_schema.parse(req.body);
      const user_id = req.user!.user_id;

      const result = await company_service.update(id, data, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete company
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const user_id = req.user!.user_id;

      const result = await company_service.delete(id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Bulk create companies
   */
  async bulkCreate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulk_create_company_schema.parse(req.body);
      const user_id = req.user!.user_id;

      const result = await company_service.bulkCreate(data, user_id);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Bulk update companies
   */
  async bulkUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulk_update_company_schema.parse(req.body);
      const user_id = req.user!.user_id;

      const result = await company_service.bulkUpdate(data, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Bulk delete companies
   */
  async bulkDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulk_delete_company_schema.parse(req.body);
      const user_id = req.user!.user_id;

      const result = await company_service.bulkDelete(data, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};
