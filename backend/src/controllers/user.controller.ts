import { Request, Response, NextFunction } from 'express';
import { user_service } from '../services/user.service';
import {
  create_user_schema,
  update_user_schema,
  user_filters_schema,
  bulk_create_user_schema,
  bulk_update_user_schema,
  bulk_delete_user_schema,
} from '../validations/user.validation';

export const user_controller = {
  /**
   * Get all users
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = user_filters_schema.parse(req.query);
      const company_id = req.user!.company_id;

      const result = await user_service.getAll(company_id, filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get user by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const company_id = req.user!.company_id;

      const result = await user_service.getById(id, company_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create user
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = create_user_schema.parse(req.body);
      const company_id = req.user!.company_id;
      const user_id = req.user!.user_id;

      const result = await user_service.create(data, company_id, user_id);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update user
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const data = update_user_schema.parse(req.body);
      const company_id = req.user!.company_id;
      const user_id = req.user!.user_id;

      const result = await user_service.update(id, data, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete user
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const company_id = req.user!.company_id;
      const user_id = req.user!.user_id;

      const result = await user_service.delete(id, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Bulk create users
   */
  async bulkCreate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulk_create_user_schema.parse(req.body);
      const company_id = req.user!.company_id;
      const user_id = req.user!.user_id;

      const result = await user_service.bulkCreate(data, company_id, user_id);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Bulk update users
   */
  async bulkUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulk_update_user_schema.parse(req.body);
      const company_id = req.user!.company_id;
      const user_id = req.user!.user_id;

      const result = await user_service.bulkUpdate(data, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Bulk delete users
   */
  async bulkDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulk_delete_user_schema.parse(req.body);
      const company_id = req.user!.company_id;
      const user_id = req.user!.user_id;

      const result = await user_service.bulkDelete(data, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};
