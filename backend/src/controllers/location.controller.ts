import { Request, Response, NextFunction } from 'express';
import { location_service } from '../services/location.service';
import {
  create_location_schema,
  update_location_schema,
  location_filters_schema,
  bulk_create_location_schema,
  bulk_update_location_schema,
  bulk_delete_location_schema,
} from '../validations/location.validation';

export const location_controller = {
  /**
   * Get all locations
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = location_filters_schema.parse(req.query);
      const company_id = req.user!.company_id;

      const result = await location_service.getAll(company_id, filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get location by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const company_id = req.user!.company_id;

      const result = await location_service.getById(id, company_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create location
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = create_location_schema.parse(req.body);
      const company_id = req.user!.company_id;
      const user_id = req.user!.user_id;

      const result = await location_service.create(data, company_id, user_id);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update location
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const data = update_location_schema.parse(req.body);
      const company_id = req.user!.company_id;
      const user_id = req.user!.user_id;

      const result = await location_service.update(id, data, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete location
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const company_id = req.user!.company_id;
      const user_id = req.user!.user_id;

      const result = await location_service.delete(id, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Bulk create locations
   */
  async bulkCreate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulk_create_location_schema.parse(req.body);
      const company_id = req.user!.company_id;
      const user_id = req.user!.user_id;

      const result = await location_service.bulkCreate(data, company_id, user_id);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Bulk update locations
   */
  async bulkUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulk_update_location_schema.parse(req.body);
      const company_id = req.user!.company_id;
      const user_id = req.user!.user_id;

      const result = await location_service.bulkUpdate(data, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Bulk delete locations
   */
  async bulkDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulk_delete_location_schema.parse(req.body);
      const company_id = req.user!.company_id;
      const user_id = req.user!.user_id;

      const result = await location_service.bulkDelete(data, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};
