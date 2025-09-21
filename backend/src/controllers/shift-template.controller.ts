import { Request, Response, NextFunction } from 'express';
import { 
  CreateShiftTemplateBody, 
  UpdateShiftTemplateBody, 
  GetShiftTemplatesQuery,
  ShiftTemplateIdParams 
} from '../validations/shift-template.validation';
import { shift_template_service } from '../services/shift-template.service';
import { HTTP_CODES } from '../constants/http_codes';

export const create_shift_template_handler = async (
  req: Request<{}, {}, CreateShiftTemplateBody>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const created_by = req.user!.user_id;
    const template = await shift_template_service.create(req.body, company_id, created_by);
    return res.status(HTTP_CODES.CREATED).json({ success: true, data: template });
  } catch (error: any) {
    if (error?.message === 'DUPLICATE_TEMPLATE_NAME') {
      return res.status(HTTP_CODES.CONFLICT).json({ 
        success: false, 
        error: { 
          error_code: 'DUPLICATE_TEMPLATE_NAME', 
          message: 'A template with this name already exists' 
        } 
      });
    }
    next(error);
  }
};

export const get_shift_templates_handler = async (
  req: Request<{}, {}, {}, GetShiftTemplatesQuery>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const result = await shift_template_service.findByCompany(req.query, company_id);
    return res.status(HTTP_CODES.OK).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const get_shift_template_handler = async (
  req: Request<ShiftTemplateIdParams>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const template_id = req.params.id;
    const template = await shift_template_service.findById(template_id, company_id);
    return res.status(HTTP_CODES.OK).json({ success: true, data: template });
  } catch (error: any) {
    if (error?.message === 'TEMPLATE_NOT_FOUND') {
      return res.status(HTTP_CODES.NOT_FOUND).json({ 
        success: false, 
        error: { 
          error_code: 'TEMPLATE_NOT_FOUND', 
          message: 'Template not found' 
        } 
      });
    }
    next(error);
  }
};

export const update_shift_template_handler = async (
  req: Request<ShiftTemplateIdParams, {}, UpdateShiftTemplateBody>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const template_id = req.params.id;
    const template = await shift_template_service.update(template_id, req.body, company_id);
    return res.status(HTTP_CODES.OK).json({ success: true, data: template });
  } catch (error: any) {
    if (error?.message === 'TEMPLATE_NOT_FOUND') {
      return res.status(HTTP_CODES.NOT_FOUND).json({ 
        success: false, 
        error: { 
          error_code: 'TEMPLATE_NOT_FOUND', 
          message: 'Template not found' 
        } 
      });
    }
    if (error?.message === 'DUPLICATE_TEMPLATE_NAME') {
      return res.status(HTTP_CODES.CONFLICT).json({ 
        success: false, 
        error: { 
          error_code: 'DUPLICATE_TEMPLATE_NAME', 
          message: 'A template with this name already exists' 
        } 
      });
    }
    next(error);
  }
};

export const delete_shift_template_handler = async (
  req: Request<ShiftTemplateIdParams>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const template_id = req.params.id;
    await shift_template_service.delete(template_id, company_id);
    return res.status(HTTP_CODES.NO_CONTENT).send();
  } catch (error: any) {
    if (error?.message === 'TEMPLATE_NOT_FOUND') {
      return res.status(HTTP_CODES.NOT_FOUND).json({ 
        success: false, 
        error: { 
          error_code: 'TEMPLATE_NOT_FOUND', 
          message: 'Template not found' 
        } 
      });
    }
    next(error);
  }
};

export const increment_template_usage_handler = async (
  req: Request<ShiftTemplateIdParams>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const template_id = req.params.id;
    const template = await shift_template_service.incrementUsageCount(template_id, company_id);
    return res.status(HTTP_CODES.OK).json({ success: true, data: template });
  } catch (error: any) {
    if (error?.message === 'TEMPLATE_NOT_FOUND') {
      return res.status(HTTP_CODES.NOT_FOUND).json({ 
        success: false, 
        error: { 
          error_code: 'TEMPLATE_NOT_FOUND', 
          message: 'Template not found' 
        } 
      });
    }
    next(error);
  }
};

export const get_template_statistics_handler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const stats = await shift_template_service.getUsageStatistics(company_id);
    return res.status(HTTP_CODES.OK).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};