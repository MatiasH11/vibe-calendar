/**
 * Day Template Hook
 * Extends useApiResource with day template specific operations
 */

import { useCallback } from 'react';
import { useApiResource, UseResourceOptions } from './useApiResource';
import { dayTemplateApi } from '@/api';
import {
  DayTemplate,
  CreateDayTemplateInput,
  UpdateDayTemplateInput,
} from '@/lib/validation';
import { ApiError } from '@/lib/errors';

/**
 * Day Template Hook
 * Provides all CRUD operations plus day template-specific methods
 */
export function useDayTemplate(options?: UseResourceOptions) {
  const baseHook = useApiResource<
    DayTemplate,
    CreateDayTemplateInput,
    UpdateDayTemplateInput
  >(dayTemplateApi, options);

  /**
   * Get only active day templates
   */
  const getActive = useCallback(async (): Promise<DayTemplate[]> => {
    try {
      return await dayTemplateApi.getActive();
    } catch (error) {
      if (options?.onError) {
        options.onError(error as ApiError);
      }
      return [];
    }
  }, [options]);

  /**
   * Clone day template with a new name
   */
  const clone = useCallback(async (
    id: number,
    newName: string
  ): Promise<DayTemplate | null> => {
    try {
      const cloned = await dayTemplateApi.clone(id, newName);

      if (options?.onSuccess) {
        options.onSuccess('Day template cloned successfully');
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
   * Toggle active status of a day template
   */
  const toggleActive = useCallback(async (id: number): Promise<DayTemplate | null> => {
    try {
      const updated = await dayTemplateApi.toggleActive(id);

      if (options?.onSuccess) {
        options.onSuccess(
          updated.is_active ? 'Template activated' : 'Template deactivated'
        );
      }

      return updated;
    } catch (error) {
      if (options?.onError) {
        options.onError(error as ApiError);
      }
      return null;
    }
  }, [options]);

  /**
   * Bulk create day templates
   */
  const bulkCreate = useCallback(async (items: CreateDayTemplateInput[]) => {
    try {
      const result = await dayTemplateApi.bulkCreate({ items });

      if (options?.onSuccess) {
        options.onSuccess(`Created ${result.successCount} day templates`);
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
   * Bulk update day templates
   */
  const bulkUpdate = useCallback(async (
    ids: number[],
    data: UpdateDayTemplateInput
  ) => {
    try {
      const result = await dayTemplateApi.bulkUpdate(ids, data);

      if (options?.onSuccess) {
        options.onSuccess(`Updated ${result.successCount} day templates`);
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
   * Bulk delete day templates
   */
  const bulkDelete = useCallback(async (ids: number[]) => {
    try {
      const result = await dayTemplateApi.bulkDelete(ids);

      if (options?.onSuccess) {
        options.onSuccess(`Deleted ${result.successCount} day templates`);
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
    getActive,
    clone,
    toggleActive,
    bulkCreate,
    bulkUpdate,
    bulkDelete,
  };
}
