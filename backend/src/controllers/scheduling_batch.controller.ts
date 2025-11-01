import { Request, Response, NextFunction } from 'express';
import { scheduling_batch_service } from '../services/scheduling_batch.service';
import {
  create_scheduling_batch_schema,
  update_scheduling_batch_schema,
  scheduling_batch_filters_schema,
  bulk_create_scheduling_batch_schema,
  bulk_update_scheduling_batch_schema,
  bulk_delete_scheduling_batch_schema,
} from '../validations/scheduling_batch.validation';

export const scheduling_batch_controller = {
  /**
   * Get all scheduling_batchs
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = scheduling_batch_filters_schema.parse(req.query);
      const company_id = req.user!.company_id;

      const result = await scheduling_batch_service.getAll(company_id, filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get scheduling_batch by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const company_id = req.user!.company_id;

      const result = await scheduling_batch_service.getById(id, company_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create scheduling_batch
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = create_scheduling_batch_schema.parse(req.body);
      const company_id = req.user!.company_id;
      const user_id = req.user!.user_id;

      const result = await scheduling_batch_service.create(data, company_id, user_id);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update scheduling_batch
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const data = update_scheduling_batch_schema.parse(req.body);
      const company_id = req.user!.company_id;
      const user_id = req.user!.user_id;

      const result = await scheduling_batch_service.update(id, data, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete scheduling_batch
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const company_id = req.user!.company_id;
      const user_id = req.user!.user_id;

      const result = await scheduling_batch_service.delete(id, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Bulk create scheduling_batchs
   */
  async bulkCreate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulk_create_scheduling_batch_schema.parse(req.body);
      const company_id = req.user!.company_id;
      const user_id = req.user!.user_id;

      const result = await scheduling_batch_service.bulkCreate(data, company_id, user_id);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Bulk update scheduling_batchs
   */
  async bulkUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulk_update_scheduling_batch_schema.parse(req.body);
      const company_id = req.user!.company_id;
      const user_id = req.user!.user_id;

      const result = await scheduling_batch_service.bulkUpdate(data, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Bulk delete scheduling_batchs
   */
  async bulkDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulk_delete_scheduling_batch_schema.parse(req.body);
      const company_id = req.user!.company_id;
      const user_id = req.user!.user_id;

      const result = await scheduling_batch_service.bulkDelete(data, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};
