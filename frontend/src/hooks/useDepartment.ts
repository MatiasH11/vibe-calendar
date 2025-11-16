/**
 * useDepartment Hook
 * Manages department state and operations
 */

import { useCallback } from 'react';
import { useApiResource, UseResourceOptions } from './useApiResource';
import { departmentApi, Department, CreateDepartmentInput, UpdateDepartmentInput, DepartmentFilters } from '@/api/departmentApi';
import { ApiError } from '@/lib/errors';

/**
 * Department-specific hook extending base resource hook
 */
export function useDepartment(options?: UseResourceOptions) {
  // Use base resource hook for CRUD operations
  const baseHook = useApiResource<Department, CreateDepartmentInput, UpdateDepartmentInput>(
    departmentApi,
    options
  );

  /**
   * Search departments by name
   */
  const search = useCallback(
    async (query: string, filters?: Omit<DepartmentFilters, 'search'>): Promise<Department[]> => {
      baseHook.clearError();

      try {
        const results = await departmentApi.search(query, filters);
        return results;
      } catch (err) {
        const apiError = err as ApiError;
        if (options?.onError) {
          options.onError(apiError);
        }
        return [];
      }
    },
    [baseHook, options]
  );

  /**
   * Get departments by location
   */
  const getByLocation = useCallback(
    async (locationId: number, filters?: DepartmentFilters): Promise<Department[]> => {
      baseHook.clearError();

      try {
        const departments = await departmentApi.getByLocation(locationId, filters);
        return departments;
      } catch (err) {
        const apiError = err as ApiError;
        if (options?.onError) {
          options.onError(apiError);
        }
        return [];
      }
    },
    [baseHook, options]
  );

  /**
   * Get active departments only
   */
  const getActive = useCallback(
    async (filters?: Omit<DepartmentFilters, 'is_active'>): Promise<Department[]> => {
      baseHook.clearError();

      try {
        const departments = await departmentApi.getActive(filters);
        return departments;
      } catch (err) {
        const apiError = err as ApiError;
        if (options?.onError) {
          options.onError(apiError);
        }
        return [];
      }
    },
    [baseHook, options]
  );

  /**
   * Get department with employees
   */
  const getWithEmployees = useCallback(
    async (id: number): Promise<Department | null> => {
      baseHook.clearError();

      try {
        const department = await departmentApi.getWithEmployees(id);
        return department;
      } catch (err) {
        const apiError = err as ApiError;
        if (options?.onError) {
          options.onError(apiError);
        }
        return null;
      }
    },
    [baseHook, options]
  );

  /**
   * Bulk create departments
   */
  const bulkCreate = useCallback(
    async (items: CreateDepartmentInput[]) => {
      baseHook.clearError();

      try {
        const result = await departmentApi.bulkCreate({ items });

        if (options?.onSuccess) {
          if (result.failureCount === 0) {
            options.onSuccess(`Successfully created ${result.successCount} departments`);
          } else {
            options.onSuccess(
              `Created ${result.successCount} departments, ${result.failureCount} failed`
            );
          }
        }

        return result;
      } catch (err) {
        const apiError = err as ApiError;
        if (options?.onError) {
          options.onError(apiError);
        }
        return {
          succeeded: [],
          failed: [],
          successCount: 0,
          failureCount: items.length,
        };
      }
    },
    [baseHook, options]
  );

  /**
   * Bulk update departments
   */
  const bulkUpdate = useCallback(
    async (ids: number[], data: UpdateDepartmentInput) => {
      baseHook.clearError();

      try {
        const result = await departmentApi.bulkUpdate(ids, data);

        if (options?.onSuccess) {
          if (result.failureCount === 0) {
            options.onSuccess(`Successfully updated ${result.successCount} departments`);
          } else {
            options.onSuccess(
              `Updated ${result.successCount} departments, ${result.failureCount} failed`
            );
          }
        }

        return result;
      } catch (err) {
        const apiError = err as ApiError;
        if (options?.onError) {
          options.onError(apiError);
        }
        return {
          succeeded: [],
          failed: [],
          successCount: 0,
          failureCount: ids.length,
        };
      }
    },
    [baseHook, options]
  );

  /**
   * Bulk delete departments
   */
  const bulkDelete = useCallback(
    async (ids: number[]) => {
      baseHook.clearError();

      try {
        const result = await departmentApi.bulkDelete(ids);

        if (options?.onSuccess) {
          if (result.failureCount === 0) {
            options.onSuccess(`Successfully deleted ${result.successCount} departments`);
          } else {
            options.onSuccess(
              `Deleted ${result.successCount} departments, ${result.failureCount} failed`
            );
          }
        }

        return result;
      } catch (err) {
        const apiError = err as ApiError;
        if (options?.onError) {
          options.onError(apiError);
        }
        return {
          succeeded: [],
          failed: [],
          successCount: 0,
          failureCount: ids.length,
        };
      }
    },
    [baseHook, options]
  );

  return {
    ...baseHook,
    // Extended methods
    search,
    getByLocation,
    getActive,
    getWithEmployees,
    bulkCreate,
    bulkUpdate,
    bulkDelete,
  };
}

// Helper to get department display color with fallback
export function getDepartmentColor(department: Department | null | undefined): string {
  return department?.color ?? '#3B82F6';
}

// Helper to check if department is active
export function isDepartmentActive(department: Department | null | undefined): boolean {
  return department?.is_active ?? false;
}

// Helper to get employee count from department (when employees are loaded)
export function getDepartmentEmployeeCount(department: Department | null | undefined): number {
  return department?.employees?.length ?? 0;
}
