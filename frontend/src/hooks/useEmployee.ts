/**
 * useEmployee Hook
 * Manages employee state and operations
 */

import { useCallback } from 'react';
import { useApiResource, UseResourceOptions } from './useApiResource';
import { employeeApi, Employee, CreateEmployeeInput, UpdateEmployeeInput, EmployeeFilters } from '@/api/employeeApi';
import { ApiError } from '@/lib/errors';

/**
 * Employee-specific hook extending base resource hook
 */
export function useEmployee(options?: UseResourceOptions) {
  // Use base resource hook for CRUD operations
  const baseHook = useApiResource<Employee, CreateEmployeeInput, UpdateEmployeeInput>(
    employeeApi,
    options
  );

  /**
   * Search employees by name or position
   */
  const search = useCallback(
    async (query: string, filters?: Omit<EmployeeFilters, 'search'>): Promise<Employee[]> => {
      baseHook.clearError();

      try {
        const results = await employeeApi.search(query, filters);
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
   * Get employees by location
   */
  const getByLocation = useCallback(
    async (locationId: number, filters?: Omit<EmployeeFilters, 'location_id'>): Promise<Employee[]> => {
      baseHook.clearError();

      try {
        const employees = await employeeApi.getByLocation(locationId, filters);
        return employees;
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
   * Get employees with their shifts for a date range
   */
  const getWithShifts = useCallback(
    async (
      startDate: string,
      endDate: string,
      filters?: Omit<EmployeeFilters, 'include' | 'shift_start_date' | 'shift_end_date'>
    ): Promise<Employee[]> => {
      baseHook.clearError();

      try {
        const employees = await employeeApi.getWithShifts(startDate, endDate, filters);
        return employees;
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
   * Get active employees only
   */
  const getActive = useCallback(
    async (filters?: Omit<EmployeeFilters, 'is_active'>): Promise<Employee[]> => {
      baseHook.clearError();

      try {
        const employees = await employeeApi.getActive(filters);
        return employees;
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
   * Assign employee to department
   */
  const assignDepartment = useCallback(
    async (employeeId: number, departmentId: number): Promise<Employee | null> => {
      return await baseHook.update(employeeId, { department_id: departmentId });
    },
    [baseHook]
  );

  /**
   * Bulk create employees
   */
  const bulkCreate = useCallback(
    async (items: CreateEmployeeInput[]) => {
      baseHook.clearError();

      try {
        const result = await employeeApi.bulkCreate({ items });

        if (options?.onSuccess) {
          if (result.failureCount === 0) {
            options.onSuccess(`Successfully created ${result.successCount} employees`);
          } else {
            options.onSuccess(
              `Created ${result.successCount} employees, ${result.failureCount} failed`
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
   * Bulk update employees
   */
  const bulkUpdate = useCallback(
    async (ids: number[], data: UpdateEmployeeInput) => {
      baseHook.clearError();

      try {
        const result = await employeeApi.bulkUpdate(ids, data);

        if (options?.onSuccess) {
          if (result.failureCount === 0) {
            options.onSuccess(`Successfully updated ${result.successCount} employees`);
          } else {
            options.onSuccess(
              `Updated ${result.successCount} employees, ${result.failureCount} failed`
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
   * Bulk delete employees
   */
  const bulkDelete = useCallback(
    async (ids: number[]) => {
      baseHook.clearError();

      try {
        const result = await employeeApi.bulkDelete(ids);

        if (options?.onSuccess) {
          if (result.failureCount === 0) {
            options.onSuccess(`Successfully deleted ${result.successCount} employees`);
          } else {
            options.onSuccess(
              `Deleted ${result.successCount} employees, ${result.failureCount} failed`
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
    getWithShifts,
    getActive,
    assignDepartment,
    bulkCreate,
    bulkUpdate,
    bulkDelete,
  };
}

// Helper to get employee full name
export function getEmployeeFullName(employee: Employee | null | undefined): string {
  if (!employee || !employee.user) return '';
  return `${employee.user.first_name} ${employee.user.last_name}`;
}

// Helper to check if employee is active
export function isEmployeeActive(employee: Employee | null | undefined): boolean {
  return employee?.is_active ?? false;
}
