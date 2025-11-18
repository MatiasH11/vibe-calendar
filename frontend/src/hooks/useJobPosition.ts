/**
 * useJobPosition Hook
 * Manages job position state and operations
 */

import { useCallback } from 'react';
import { useApiResource, UseResourceOptions } from './useApiResource';
import { jobPositionApi, JobPosition, CreateJobPositionInput, UpdateJobPositionInput, JobPositionFilters } from '@/api/jobPositionApi';
import { ApiError } from '@/lib/errors';

/**
 * JobPosition-specific hook extending base resource hook
 */
export function useJobPosition(options?: UseResourceOptions) {
  // Use base resource hook for CRUD operations
  const baseHook = useApiResource<JobPosition, CreateJobPositionInput, UpdateJobPositionInput>(
    jobPositionApi,
    options
  );

  /**
   * Search job positions by name
   */
  const search = useCallback(
    async (query: string, filters?: Omit<JobPositionFilters, 'search'>): Promise<JobPosition[]> => {
      baseHook.clearError();

      try {
        const results = await jobPositionApi.search(query, filters);
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
   * Get job positions by department
   */
  const getByDepartment = useCallback(
    async (departmentId: number, filters?: JobPositionFilters): Promise<JobPosition[]> => {
      baseHook.clearError();

      try {
        const positions = await jobPositionApi.getByDepartment(departmentId, filters);
        return positions;
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
   * Get active job positions only
   */
  const getActive = useCallback(
    async (filters?: Omit<JobPositionFilters, 'is_active'>): Promise<JobPosition[]> => {
      baseHook.clearError();

      try {
        const positions = await jobPositionApi.getActive(filters);
        return positions;
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
   * Get job position with employees
   */
  const getWithEmployees = useCallback(
    async (id: number): Promise<JobPosition | null> => {
      baseHook.clearError();

      try {
        const position = await jobPositionApi.getWithEmployees(id);
        return position;
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
   * Bulk create job positions
   */
  const bulkCreate = useCallback(
    async (items: CreateJobPositionInput[]) => {
      baseHook.clearError();

      try {
        const result = await jobPositionApi.bulkCreate({ items });

        if (options?.onSuccess) {
          if (result.failureCount === 0) {
            options.onSuccess(`Successfully created ${result.successCount} job positions`);
          } else {
            options.onSuccess(
              `Created ${result.successCount} job positions, ${result.failureCount} failed`
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
   * Bulk update job positions
   */
  const bulkUpdate = useCallback(
    async (ids: number[], data: UpdateJobPositionInput) => {
      baseHook.clearError();

      try {
        const result = await jobPositionApi.bulkUpdate(ids, data);

        if (options?.onSuccess) {
          if (result.failureCount === 0) {
            options.onSuccess(`Successfully updated ${result.successCount} job positions`);
          } else {
            options.onSuccess(
              `Updated ${result.successCount} job positions, ${result.failureCount} failed`
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
   * Bulk delete job positions
   */
  const bulkDelete = useCallback(
    async (ids: number[]) => {
      baseHook.clearError();

      try {
        const result = await jobPositionApi.bulkDelete(ids);

        if (options?.onSuccess) {
          if (result.failureCount === 0) {
            options.onSuccess(`Successfully deleted ${result.successCount} job positions`);
          } else {
            options.onSuccess(
              `Deleted ${result.successCount} job positions, ${result.failureCount} failed`
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
    getByDepartment,
    getActive,
    getWithEmployees,
    bulkCreate,
    bulkUpdate,
    bulkDelete,
  };
}

// Helper to get job position display color with fallback
export function getJobPositionColor(position: JobPosition | null | undefined): string {
  return position?.color ?? '#3B82F6';
}

// Helper to check if job position is active
export function isJobPositionActive(position: JobPosition | null | undefined): boolean {
  return position?.is_active ?? false;
}

// Helper to get employee count from job position (when employees are loaded)
export function getJobPositionEmployeeCount(position: JobPosition | null | undefined): number {
  return position?.employees?.length ?? 0;
}

// Helper to get department name from job position
export function getJobPositionDepartmentName(position: JobPosition | null | undefined): string {
  return position?.department?.name ?? '';
}
