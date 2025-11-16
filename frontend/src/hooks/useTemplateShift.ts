/**
 * Template Shift Hook
 * Extends useApiResource with template shift specific operations
 */

import { useCallback } from 'react';
import { useApiResource, UseResourceOptions } from './useApiResource';
import { templateShiftApi } from '@/api';
import {
  TemplateShift,
  CreateTemplateShiftInput,
  UpdateTemplateShiftInput,
} from '@/lib/validation';
import { ApiError } from '@/lib/errors';

/**
 * Template Shift Hook
 * Provides all CRUD operations plus template-specific methods
 */
export function useTemplateShift(options?: UseResourceOptions) {
  const baseHook = useApiResource<
    TemplateShift,
    CreateTemplateShiftInput,
    UpdateTemplateShiftInput
  >(templateShiftApi, options);

  /**
   * Get all template shifts for a specific day template
   */
  const getTemplateShifts = useCallback(async (dayTemplateId: number): Promise<TemplateShift[]> => {
    try {
      const shifts = await templateShiftApi.getTemplateShifts(dayTemplateId);
      return shifts;
    } catch (error) {
      if (options?.onError) {
        options.onError(error as ApiError);
      }
      return [];
    }
  }, [options]);

  /**
   * Clone template shift to another day template
   */
  const clone = useCallback(async (
    id: number,
    targetDayTemplateId: number,
    newName?: string
  ): Promise<TemplateShift | null> => {
    try {
      const cloned = await templateShiftApi.clone(id, targetDayTemplateId, newName);

      if (options?.onSuccess) {
        options.onSuccess('Template shift cloned successfully');
      }

      return cloned;
    } catch (error) {
      if (options?.onError) {
        options.onError(error as ApiError);
      }
      return null;
    }
  }, [options]);

  /**
   * Bulk create template shifts
   */
  const bulkCreate = useCallback(async (items: CreateTemplateShiftInput[]) => {
    try {
      const result = await templateShiftApi.bulkCreate(items);

      if (options?.onSuccess) {
        options.onSuccess(`Created ${result.successCount} template shifts`);
      }

      return result;
    } catch (error) {
      if (options?.onError) {
        options.onError(error as ApiError);
      }
      return null;
    }
  }, [options]);

  /**
   * Bulk update template shifts
   */
  const bulkUpdate = useCallback(async (
    ids: number[],
    data: UpdateTemplateShiftInput
  ) => {
    try {
      const result = await templateShiftApi.bulkUpdate(ids, data);

      if (options?.onSuccess) {
        options.onSuccess(`Updated ${result.successCount} template shifts`);
      }

      return result;
    } catch (error) {
      if (options?.onError) {
        options.onError(error as ApiError);
      }
      return null;
    }
  }, [options]);

  /**
   * Bulk delete template shifts
   */
  const bulkDelete = useCallback(async (ids: number[]) => {
    try {
      const result = await templateShiftApi.bulkDelete(ids);

      if (options?.onSuccess) {
        options.onSuccess(`Deleted ${result.successCount} template shifts`);
      }

      return result;
    } catch (error) {
      if (options?.onError) {
        options.onError(error as ApiError);
      }
      return null;
    }
  }, [options]);

  return {
    ...baseHook,
    // Extended methods
    getTemplateShifts,
    clone,
    bulkCreate,
    bulkUpdate,
    bulkDelete,
  };
}
