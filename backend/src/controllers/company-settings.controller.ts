import { Request, Response, NextFunction } from 'express';
import { company_settings_service } from '../services/company-settings.service';
import { HTTP_CODES } from '../constants/http_codes';

/**
 * Company Settings Controller (PLAN.md 5.3)
 * Handles HTTP requests for company configuration endpoints
 */

/**
 * GET /api/v1/companies/settings
 * Get current company settings
 * Creates default settings if none exist
 */
export const getCompanySettingsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const settings = await company_settings_service.getSettings(company_id);

    // Convert Decimal to numbers for JSON response
    const response = {
      id: settings.id,
      company_id: settings.company_id,
      max_daily_hours: parseFloat(settings.max_daily_hours.toString()),
      max_weekly_hours: parseFloat(settings.max_weekly_hours.toString()),
      min_break_hours: parseFloat(settings.min_break_hours.toString()),
      allow_overnight_shifts: settings.allow_overnight_shifts,
      timezone: settings.timezone,
      created_at: settings.created_at,
      updated_at: settings.updated_at,
    };

    return res.status(HTTP_CODES.OK).json({
      success: true,
      data: response,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/companies/settings
 * Update company settings
 * All fields are optional - only provided fields will be updated
 */
export const updateCompanySettingsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company_id = req.user!.company_id;
    const updateData = req.body;

    // Additional validation: ensure max_daily_hours <= max_weekly_hours
    if (updateData.max_daily_hours !== undefined || updateData.max_weekly_hours !== undefined) {
      // Get current settings to validate against
      const currentSettings = await company_settings_service.getSettings(company_id);
      const newMaxDaily = updateData.max_daily_hours !== undefined
        ? updateData.max_daily_hours
        : parseFloat(currentSettings.max_daily_hours.toString());
      const newMaxWeekly = updateData.max_weekly_hours !== undefined
        ? updateData.max_weekly_hours
        : parseFloat(currentSettings.max_weekly_hours.toString());

      if (newMaxDaily > newMaxWeekly) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          error: {
            error_code: 'INVALID_SETTINGS',
            message: 'max_daily_hours cannot exceed max_weekly_hours',
          },
        });
      }
    }

    const settings = await company_settings_service.updateSettings(company_id, updateData);

    // Convert Decimal to numbers for JSON response
    const response = {
      id: settings.id,
      company_id: settings.company_id,
      max_daily_hours: parseFloat(settings.max_daily_hours.toString()),
      max_weekly_hours: parseFloat(settings.max_weekly_hours.toString()),
      min_break_hours: parseFloat(settings.min_break_hours.toString()),
      allow_overnight_shifts: settings.allow_overnight_shifts,
      timezone: settings.timezone,
      created_at: settings.created_at,
      updated_at: settings.updated_at,
    };

    return res.status(HTTP_CODES.OK).json({
      success: true,
      data: response,
      message: 'Company settings updated successfully',
    });
  } catch (error: any) {
    if (error?.message === 'COMPANY_NOT_FOUND') {
      return res.status(HTTP_CODES.NOT_FOUND).json({
        success: false,
        error: {
          error_code: 'COMPANY_NOT_FOUND',
          message: 'Company not found',
        },
      });
    }
    next(error);
  }
};

/**
 * GET /api/v1/companies/settings/defaults
 * Get default settings values
 * Useful for frontend to show what defaults are when creating new company
 */
export const getDefaultSettingsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const defaults = company_settings_service.getDefaultSettings();

    return res.status(HTTP_CODES.OK).json({
      success: true,
      data: defaults,
    });
  } catch (error) {
    next(error);
  }
};
