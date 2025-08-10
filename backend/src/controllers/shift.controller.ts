import { Request, Response, NextFunction } from 'express';
import { create_shift_body, get_shifts_query, update_shift_body } from '../validations/shift.validation';
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


