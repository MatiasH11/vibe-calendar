import { Request, Response, NextFunction } from 'express';
import { AddEmployeeBody, EmployeeFiltersQuery, UpdateEmployeeBody, BulkUpdateEmployeesBody } from '../validations/employee.validation';
import { employee_service } from '../services/employee.service';
import { HTTP_CODES } from '../constants/http_codes';

export const addEmployeeHandler = async (
  req: Request<{}, {}, AddEmployeeBody>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const employee = await employee_service.add(req.body, company_id);
    return res.status(HTTP_CODES.CREATED).json({ success: true, data: employee });
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED_COMPANY_ACCESS') {
      return res.status(HTTP_CODES.FORBIDDEN).json({ success: false, error: { error_code: 'UNAUTHORIZED_COMPANY_ACCESS', message: 'Role does not belong to your company' } });
    }
    if (error?.message === 'EMPLOYEE_ALREADY_EXISTS') {
      return res.status(HTTP_CODES.CONFLICT).json({ success: false, error: { error_code: 'EMPLOYEE_ALREADY_EXISTS', message: 'Employee already exists in this company' } });
    }
    next(error);
  }
};

// NUEVO: Handler con filtros avanzados
export const getEmployeesWithFiltersHandler = async (
  req: Request<{}, {}, {}, EmployeeFiltersQuery>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const result = await employee_service.findByCompanyWithFilters(company_id, req.query);
    return res.status(HTTP_CODES.OK).json({ 
      success: true, 
      data: result.employees,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// NUEVO: Handler específico para vista de turnos (mejorado)
export const getEmployeesForShiftsHandler = async (
  req: Request<{}, {}, {}, { start_date?: string; end_date?: string; week_start?: string; week_end?: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const { start_date, end_date, week_start, week_end } = req.query;
    
    // Obtener todos los empleados activos con sus turnos del rango
    const result = await employee_service.findByCompanyForShifts(company_id, {
      start_date,
      end_date,
      week_start, // Mantener compatibilidad
      week_end,   // Mantener compatibilidad
    });
    
    return res.status(HTTP_CODES.OK).json({ 
      success: true, 
      data: result.employees,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

// Handler existente mantenido para compatibilidad
export const getEmployeesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const employees = await employee_service.findByCompany(company_id);
    return res.status(HTTP_CODES.OK).json({ success: true, data: employees });
  } catch (error) {
    next(error);
  }
};

// NUEVO: Obtener empleado por ID
export const getEmployeeByIdHandler = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(HTTP_CODES.BAD_REQUEST).json({
        success: false,
        error: { error_code: 'INVALID_ID', message: 'Invalid employee ID' }
      });
    }

    const employee = await employee_service.findById(id, company_id);
    return res.status(HTTP_CODES.OK).json({ success: true, data: employee });
  } catch (error: any) {
    if (error?.message === 'EMPLOYEE_NOT_FOUND') {
      return res.status(HTTP_CODES.NOT_FOUND).json({
        success: false,
        error: { error_code: 'EMPLOYEE_NOT_FOUND', message: 'Employee not found' }
      });
    }
    next(error);
  }
};

// NUEVO: Actualizar empleado
export const updateEmployeeHandler = async (
  req: Request<{ id: string }, {}, UpdateEmployeeBody>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(HTTP_CODES.BAD_REQUEST).json({
        success: false,
        error: { error_code: 'INVALID_ID', message: 'Invalid employee ID' }
      });
    }

    const employee = await employee_service.update(id, req.body, company_id);
    return res.status(HTTP_CODES.OK).json({ success: true, data: employee });
  } catch (error: any) {
    if (error?.message === 'EMPLOYEE_NOT_FOUND') {
      return res.status(HTTP_CODES.NOT_FOUND).json({
        success: false,
        error: { error_code: 'EMPLOYEE_NOT_FOUND', message: 'Employee not found' }
      });
    }
    if (error?.message === 'UNAUTHORIZED_COMPANY_ACCESS') {
      return res.status(HTTP_CODES.FORBIDDEN).json({
        success: false,
        error: { error_code: 'UNAUTHORIZED_COMPANY_ACCESS', message: 'Role does not belong to your company' }
      });
    }
    next(error);
  }
};

// NUEVO: Eliminar empleado
export const deleteEmployeeHandler = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(HTTP_CODES.BAD_REQUEST).json({
        success: false,
        error: { error_code: 'INVALID_ID', message: 'Invalid employee ID' }
      });
    }

    await employee_service.softDelete(id, company_id);
    return res.status(HTTP_CODES.OK).json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error: any) {
    if (error?.message === 'EMPLOYEE_NOT_FOUND') {
      return res.status(HTTP_CODES.NOT_FOUND).json({
        success: false,
        error: { error_code: 'EMPLOYEE_NOT_FOUND', message: 'Employee not found' }
      });
    }
    next(error);
  }
};

// NUEVO: Bulk update employees (activate/deactivate/change role)
export const bulkUpdateEmployeesHandler = async (
  req: Request<{}, {}, BulkUpdateEmployeesBody>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { employee_ids, action, role_id } = req.body;
    const company_id = req.user!.company_id;

    const result = await employee_service.bulkUpdate(
      employee_ids,
      action,
      company_id,
      role_id
    );

    // Generate appropriate success message based on action
    let message = '';
    switch (action) {
      case 'activate':
        message = `${result.count} employee(s) activated successfully.`;
        break;
      case 'deactivate':
        message = `${result.count} employee(s) deactivated successfully.`;
        break;
      case 'change_role':
        message = `${result.count} employee(s) role changed successfully.`;
        break;
    }

    return res.status(HTTP_CODES.OK).json({
      success: true,
      message,
      data: result,
    });
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED_COMPANY_ACCESS') {
      return res.status(HTTP_CODES.FORBIDDEN).json({
        success: false,
        error: {
          error_code: 'UNAUTHORIZED_COMPANY_ACCESS',
          message: 'Role does not belong to your company'
        }
      });
    }
    if (error?.message === 'ROLE_ID_REQUIRED') {
      return res.status(HTTP_CODES.BAD_REQUEST).json({
        success: false,
        error: {
          error_code: 'ROLE_ID_REQUIRED',
          message: 'role_id is required when action is change_role'
        }
      });
    }
    if (error?.message === 'INVALID_ACTION') {
      return res.status(HTTP_CODES.BAD_REQUEST).json({
        success: false,
        error: {
          error_code: 'INVALID_ACTION',
          message: 'Invalid action. Must be activate, deactivate, or change_role'
        }
      });
    }
    next(error);
  }
};