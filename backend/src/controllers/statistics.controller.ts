import { Request, Response, NextFunction } from 'express';
import { statistics_service } from '../services/statistics.service';
import { HTTP_CODES } from '../constants/http_codes';

export const getEmployeeStatsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const stats = await statistics_service.getEmployeeStats(company_id);
    return res.status(HTTP_CODES.OK).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

export const getRoleStatsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const stats = await statistics_service.getRoleStats(company_id);
    return res.status(HTTP_CODES.OK).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

export const getDashboardStatsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const stats = await statistics_service.getDashboardStats(company_id);
    return res.status(HTTP_CODES.OK).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

export const getGrowthStatsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const stats = await statistics_service.getGrowthStats(company_id);
    return res.status(HTTP_CODES.OK).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};
