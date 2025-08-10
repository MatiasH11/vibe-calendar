import { Request, Response, NextFunction } from 'express';
import { CreateRoleBody } from '../validations/role.validation';
import { role_service } from '../services/role.service';
import { HTTP_CODES } from '../constants/http_codes';

export const createRoleHandler = async (
  req: Request<{}, {}, CreateRoleBody>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const role = await role_service.create(req.body, company_id);
    return res.status(HTTP_CODES.CREATED).json({ success: true, data: role });
  } catch (error: any) {
    if (error?.message === 'DUPLICATE_ROLE') {
      return res.status(HTTP_CODES.CONFLICT).json({ success: false, error: { error_code: 'DUPLICATE_ROLE', message: 'Role name already exists for this company' } });
    }
    next(error);
  }
};

export const getRolesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const roles = await role_service.find_by_company(company_id);
    return res.status(HTTP_CODES.OK).json({ success: true, data: roles });
  } catch (error) {
    next(error);
  }
};


