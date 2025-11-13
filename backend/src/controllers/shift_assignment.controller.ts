import { Request, Response, NextFunction } from 'express';
import { shift_assignment_service } from '../services/shift_assignment.service';
import {
  create_shift_assignment_schema,
  update_shift_assignment_schema,
  shift_assignment_filters_schema,
  bulk_create_shift_assignment_schema,
  bulk_update_shift_assignment_schema,
  bulk_delete_shift_assignment_schema,
} from '../validations/shift_assignment.validation';

export const shift_assignment_controller = {
  /**
   * Get all shift_assignments
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = shift_assignment_filters_schema.parse(req.query);
      const company_id = req.user!.admin_company_id;

      const result = await shift_assignment_service.getAll(company_id, filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get shift_assignment by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const company_id = req.user!.admin_company_id;

      const result = await shift_assignment_service.getById(id, company_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create shift_assignment
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = create_shift_assignment_schema.parse(req.body);
      const company_id = req.user!.admin_company_id;
      const user_id = req.user!.user_id;

      const result = await shift_assignment_service.create(data, company_id, user_id);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update shift_assignment
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const data = update_shift_assignment_schema.parse(req.body);
      const company_id = req.user!.admin_company_id;
      const user_id = req.user!.user_id;

      const result = await shift_assignment_service.update(id, data, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete shift_assignment
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const company_id = req.user!.admin_company_id;
      const user_id = req.user!.user_id;

      const result = await shift_assignment_service.delete(id, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Bulk create shift_assignments
   */
  async bulkCreate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulk_create_shift_assignment_schema.parse(req.body);
      const company_id = req.user!.admin_company_id;
      const user_id = req.user!.user_id;

      const result = await shift_assignment_service.bulkCreate(data, company_id, user_id);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Bulk update shift_assignments
   */
  async bulkUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulk_update_shift_assignment_schema.parse(req.body);
      const company_id = req.user!.admin_company_id;
      const user_id = req.user!.user_id;

      const result = await shift_assignment_service.bulkUpdate(data, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Bulk delete shift_assignments
   */
  async bulkDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulk_delete_shift_assignment_schema.parse(req.body);
      const company_id = req.user!.admin_company_id;
      const user_id = req.user!.user_id;

      const result = await shift_assignment_service.bulkDelete(data, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Confirm shift_assignment (change status from pending to confirmed)
   */
  async confirmShift(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const company_id = req.user!.admin_company_id;
      const user_id = req.user!.user_id;

      const result = await shift_assignment_service.confirmShift(id, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};
