import { Request, Response, NextFunction } from 'express';
import { AddEmployeeBody } from '../validations/employee.validation';
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


