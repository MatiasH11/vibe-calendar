import { Request, Response, NextFunction } from 'express';
import { create_shift_body, get_shifts_query, update_shift_body, duplicate_shift_body, bulk_create_shifts_body, validate_conflicts_body, get_employee_patterns_query, get_suggestions_query } from '../validations/shift.validation';
import { shift_service } from '../services/shift.service';
import { HTTP_CODES } from '../constants/http_codes';

export const create_shift_handler = async (
  req: Request<{}, {}, create_shift_body>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const admin_company_id = req.user!.company_id;
    const shift = await shift_service.create(req.body, admin_company_id);
    return res.status(HTTP_CODES.CREATED).json({ success: true, data: shift });
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED_COMPANY_ACCESS') {
      return res.status(HTTP_CODES.FORBIDDEN).json({ success: false, error: { error_code: 'UNAUTHORIZED_COMPANY_ACCESS', message: 'Employee does not belong to your company' } });
    }
    if (error?.message === 'OVERNIGHT_NOT_ALLOWED') {
      return res.status(HTTP_CODES.BAD_REQUEST).json({ success: false, error: { error_code: 'OVERNIGHT_NOT_ALLOWED', message: 'Overnight shifts are not allowed' } });
    }
    if (error?.message === 'SHIFT_OVERLAP') {
      return res.status(HTTP_CODES.CONFLICT).json({ success: false, error: { error_code: 'SHIFT_OVERLAP', message: 'Shift overlaps with an existing one' } });
    }
    next(error);
  }
};

export const get_shifts_handler = async (
  req: Request<{}, {}, {}, get_shifts_query>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const shifts = await shift_service.find_by_company(req.query, company_id);
    return res.status(HTTP_CODES.OK).json({ success: true, data: shifts });
  } catch (error) {
    next(error);
  }
};

export const update_shift_handler = async (
  req: Request<{ id: string }, {}, update_shift_body>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const id = Number(req.params.id);
    const shift = await shift_service.update(id, req.body, company_id);
    return res.status(HTTP_CODES.OK).json({ success: true, data: shift });
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED_COMPANY_ACCESS') {
      return res.status(HTTP_CODES.FORBIDDEN).json({ success: false, error: { error_code: 'UNAUTHORIZED_COMPANY_ACCESS', message: 'Shift does not belong to your company' } });
    }
    if (error?.message === 'OVERNIGHT_NOT_ALLOWED') {
      return res.status(HTTP_CODES.BAD_REQUEST).json({ success: false, error: { error_code: 'OVERNIGHT_NOT_ALLOWED', message: 'Overnight shifts are not allowed' } });
    }
    if (error?.message === 'SHIFT_OVERLAP') {
      return res.status(HTTP_CODES.CONFLICT).json({ success: false, error: { error_code: 'SHIFT_OVERLAP', message: 'Shift overlaps with an existing one' } });
    }
    next(error);
  }
};

export const delete_shift_handler = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const id = Number(req.params.id);
    await shift_service.delete(id, company_id);
    return res.status(HTTP_CODES.NO_CONTENT).send();
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED_COMPANY_ACCESS') {
      return res.status(HTTP_CODES.FORBIDDEN).json({ success: false, error: { error_code: 'UNAUTHORIZED_COMPANY_ACCESS', message: 'Shift does not belong to your company' } });
    }
    next(error);
  }
};

export const duplicate_shifts_handler = async (
  req: Request<{}, {}, duplicate_shift_body>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const admin_company_id = req.user!.company_id;
    const result = await shift_service.duplicate(req.body, admin_company_id);
    return res.status(HTTP_CODES.CREATED).json({ success: true, data: result });
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED_SHIFT_ACCESS') {
      return res.status(HTTP_CODES.FORBIDDEN).json({ 
        success: false, 
        error: { 
          error_code: 'UNAUTHORIZED_SHIFT_ACCESS', 
          message: 'One or more source shifts do not belong to your company' 
        } 
      });
    }
    if (error?.message === 'UNAUTHORIZED_EMPLOYEE_ACCESS') {
      return res.status(HTTP_CODES.FORBIDDEN).json({ 
        success: false, 
        error: { 
          error_code: 'UNAUTHORIZED_EMPLOYEE_ACCESS', 
          message: 'One or more target employees do not belong to your company' 
        } 
      });
    }
    if (error?.message === 'DUPLICATION_CONFLICTS_DETECTED') {
      return res.status(HTTP_CODES.CONFLICT).json({ 
        success: false, 
        error: { 
          error_code: 'DUPLICATION_CONFLICTS_DETECTED', 
          message: 'Conflicts detected during duplication. Use conflict_resolution strategy to handle them.' 
        } 
      });
    }
    next(error);
  }
};

export const bulk_create_shifts_handler = async (
  req: Request<{}, {}, bulk_create_shifts_body>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const admin_company_id = req.user!.company_id;
    const result = await shift_service.bulkCreate(req.body, admin_company_id);
    return res.status(HTTP_CODES.CREATED).json({ success: true, data: result });
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED_EMPLOYEE_ACCESS') {
      return res.status(HTTP_CODES.FORBIDDEN).json({ 
        success: false, 
        error: { 
          error_code: 'UNAUTHORIZED_EMPLOYEE_ACCESS', 
          message: 'One or more employees do not belong to your company' 
        } 
      });
    }
    if (error?.message === 'TEMPLATE_NOT_FOUND') {
      return res.status(HTTP_CODES.NOT_FOUND).json({ 
        success: false, 
        error: { 
          error_code: 'TEMPLATE_NOT_FOUND', 
          message: 'Shift template not found or does not belong to your company' 
        } 
      });
    }
    if (error?.message === 'BULK_CREATION_CONFLICTS_DETECTED') {
      return res.status(HTTP_CODES.CONFLICT).json({ 
        success: false, 
        error: { 
          error_code: 'BULK_CREATION_CONFLICTS_DETECTED', 
          message: 'Conflicts detected during bulk creation. Use conflict_resolution strategy to handle them.' 
        } 
      });
    }
    if (error?.message === 'INVALID_TIME_FORMAT') {
      return res.status(HTTP_CODES.BAD_REQUEST).json({ 
        success: false, 
        error: { 
          error_code: 'INVALID_TIME_FORMAT', 
          message: 'Invalid time format. Use HH:mm format.' 
        } 
      });
    }
    if (error?.message === 'OVERNIGHT_NOT_ALLOWED') {
      return res.status(HTTP_CODES.BAD_REQUEST).json({ 
        success: false, 
        error: { 
          error_code: 'OVERNIGHT_NOT_ALLOWED', 
          message: 'Overnight shifts are not allowed' 
        } 
      });
    }
    next(error);
  }
};

export const validate_conflicts_handler = async (
  req: Request<{}, {}, validate_conflicts_body>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const admin_company_id = req.user!.company_id;
    const result = await shift_service.validateConflicts(req.body, admin_company_id);
    return res.status(HTTP_CODES.OK).json({ success: true, data: result });
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED_EMPLOYEE_ACCESS') {
      return res.status(HTTP_CODES.FORBIDDEN).json({ 
        success: false, 
        error: { 
          error_code: 'UNAUTHORIZED_EMPLOYEE_ACCESS', 
          message: 'One or more employees do not belong to your company' 
        } 
      });
    }
    next(error);
  }
};


export const get_employee_patterns_handler = async (
  req: Request<{ employeeId: string }, {}, {}, Omit<get_employee_patterns_query, 'employee_id'>>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const admin_company_id = req.user!.company_id;
    const query: get_employee_patterns_query = {
      employee_id: parseInt(req.params.employeeId, 10),
      limit: req.query.limit || 10,
    };
    const patterns = await shift_service.getEmployeePatterns(query, admin_company_id);
    return res.status(HTTP_CODES.OK).json({ success: true, data: patterns });
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED_EMPLOYEE_ACCESS') {
      return res.status(HTTP_CODES.FORBIDDEN).json({ 
        success: false, 
        error: { 
          error_code: 'UNAUTHORIZED_EMPLOYEE_ACCESS', 
          message: 'Employee does not belong to your company' 
        } 
      });
    }
    next(error);
  }
};

export const get_suggestions_handler = async (
  req: Request<{}, {}, {}, get_suggestions_query>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const admin_company_id = req.user!.company_id;
    const suggestions = await shift_service.getSuggestions(req.query, admin_company_id);
    return res.status(HTTP_CODES.OK).json({ success: true, data: suggestions });
  } catch (error: any) {
    if (error?.message === 'UNAUTHORIZED_EMPLOYEE_ACCESS') {
      return res.status(HTTP_CODES.FORBIDDEN).json({ 
        success: false, 
        error: { 
          error_code: 'UNAUTHORIZED_EMPLOYEE_ACCESS', 
          message: 'Employee does not belong to your company' 
        } 
      });
    }
    next(error);
  }
};