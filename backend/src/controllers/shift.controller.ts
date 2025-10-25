import { Request, Response, NextFunction } from 'express';
import { create_shift_body, get_shifts_query, update_shift_body, duplicate_shift_body, bulk_create_shifts_body, validate_conflicts_body, get_employee_patterns_query, get_suggestions_query, BulkDeleteShiftsBody } from '../validations/shift.validation';
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
    // NUEVO: Manejo de duplicado exacto (PLAN.md 1.2)
    if (error?.message === 'SHIFT_DUPLICATE_EXACT') {
      return res.status(HTTP_CODES.CONFLICT).json({
        success: false,
        error: {
          error_code: 'SHIFT_DUPLICATE_EXACT',
          message: 'An identical shift already exists for this employee on this date and time'
        }
      });
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
    next(error);
  }
};

export const get_employee_patterns_handler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const admin_company_id = req.user!.company_id;
    const query: get_employee_patterns_query = {
      employee_id: parseInt(req.params.employeeId, 10),
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
    };
    const patterns = await shift_service.getEmployeePatterns(query, admin_company_id);
    return res.status(HTTP_CODES.OK).json({ success: true, data: patterns });
  } catch (error) {
    next(error);
  }
};

export const get_suggestions_handler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const admin_company_id = req.user!.company_id;
    const query: get_suggestions_query = {
      employee_id: parseInt(req.query.employee_id as string, 10),
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 5,
      date: req.query.date as string | undefined,
    };
    const suggestions = await shift_service.getSuggestions(query, admin_company_id);
    return res.status(HTTP_CODES.OK).json({ success: true, data: suggestions });
  } catch (error) {
    next(error);
  }
};

export const bulkDeleteShiftsHandler = async (
  req: Request<{}, {}, BulkDeleteShiftsBody>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { shift_ids } = req.body;
    const company_id = req.user!.company_id;
    
    const result = await shift_service.bulkDelete(shift_ids, company_id);
    
    return res.status(HTTP_CODES.OK).json({
      success: true,
      message: `${result.count} shifts deleted successfully.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};