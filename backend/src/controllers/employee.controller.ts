import { Request, Response, NextFunction } from 'express';
import { employee_service } from '../services/employee.service';
import {
  create_employee_schema,
  update_employee_schema,
  employee_filters_schema,
  bulk_create_employee_schema,
  bulk_update_employee_schema,
  bulk_delete_employee_schema,
} from '../validations/employee.validation';

export const employee_controller = {
  /**
   * Get all employees
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = employee_filters_schema.parse(req.query);
      const company_id = req.user!.company_id;

      const result = await employee_service.getAll(company_id, filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get employee by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const company_id = req.user!.company_id;

      const result = await employee_service.getById(id, company_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create employee
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = create_employee_schema.parse(req.body);
      const company_id = req.user!.company_id;
      const user_id = req.user!.user_id;

      const result = await employee_service.create(data, company_id, user_id);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update employee
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const data = update_employee_schema.parse(req.body);
      const company_id = req.user!.company_id;
      const user_id = req.user!.user_id;

      const result = await employee_service.update(id, data, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete employee
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const company_id = req.user!.company_id;
      const user_id = req.user!.user_id;

      const result = await employee_service.delete(id, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Bulk create employees
   */
  async bulkCreate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulk_create_employee_schema.parse(req.body);
      const company_id = req.user!.company_id;
      const user_id = req.user!.user_id;

      const result = await employee_service.bulkCreate(data, company_id, user_id);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Bulk update employees
   */
  async bulkUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulk_update_employee_schema.parse(req.body);
      const company_id = req.user!.company_id;
      const user_id = req.user!.user_id;

      const result = await employee_service.bulkUpdate(data, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Bulk delete employees
   */
  async bulkDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulk_delete_employee_schema.parse(req.body);
      const company_id = req.user!.company_id;
      const user_id = req.user!.user_id;

      const result = await employee_service.bulkDelete(data, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};
