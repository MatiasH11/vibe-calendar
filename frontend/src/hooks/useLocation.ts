/**
 * useLocation Hook
 * Manages location state and operations
 */

import { useCallback } from 'react';
import { useApiResource, UseResourceOptions } from './useApiResource';
import { locationApi, Location, CreateLocationInput, UpdateLocationInput, LocationFilters } from '@/api/locationApi';
import { ApiError } from '@/lib/errors';

/**
 * Location-specific hook extending base resource hook
 */
export function useLocation(options?: UseResourceOptions) {
  // Use base resource hook for CRUD operations
  const baseHook = useApiResource<Location, CreateLocationInput, UpdateLocationInput>(
    locationApi,
    options
  );

  /**
   * Search locations by name
   */
  const search = useCallback(
    async (query: string, filters?: Omit<LocationFilters, 'search'>): Promise<Location[]> => {
      baseHook.clearError();

      try {
        const results = await locationApi.search(query, filters);
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
   * Get active locations only
   */
  const getActive = useCallback(
    async (filters?: Omit<LocationFilters, 'is_active'>): Promise<Location[]> => {
      baseHook.clearError();

      try {
        const locations = await locationApi.getActive(filters);
        return locations;
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
   * Get location with departments
   */
  const getWithDepartments = useCallback(
    async (id: number): Promise<Location | null> => {
      baseHook.clearError();

      try {
        const location = await locationApi.getWithDepartments(id);
        return location;
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
   * Bulk create locations
   */
  const bulkCreate = useCallback(
    async (items: CreateLocationInput[]) => {
      baseHook.clearError();

      try {
        const result = await locationApi.bulkCreate({ items });

        if (options?.onSuccess) {
          if (result.failureCount === 0) {
            options.onSuccess(`Successfully created ${result.successCount} locations`);
          } else {
            options.onSuccess(
              `Created ${result.successCount} locations, ${result.failureCount} failed`
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
   * Bulk update locations
   */
  const bulkUpdate = useCallback(
    async (ids: number[], data: UpdateLocationInput) => {
      baseHook.clearError();

      try {
        const result = await locationApi.bulkUpdate(ids, data);

        if (options?.onSuccess) {
          if (result.failureCount === 0) {
            options.onSuccess(`Successfully updated ${result.successCount} locations`);
          } else {
            options.onSuccess(
              `Updated ${result.successCount} locations, ${result.failureCount} failed`
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
   * Bulk delete locations
   */
  const bulkDelete = useCallback(
    async (ids: number[]) => {
      baseHook.clearError();

      try {
        const result = await locationApi.bulkDelete(ids);

        if (options?.onSuccess) {
          if (result.failureCount === 0) {
            options.onSuccess(`Successfully deleted ${result.successCount} locations`);
          } else {
            options.onSuccess(
              `Deleted ${result.successCount} locations, ${result.failureCount} failed`
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
    getActive,
    getWithDepartments,
    bulkCreate,
    bulkUpdate,
    bulkDelete,
  };
}

// Helper to check if location is active
export function isLocationActive(location: Location | null | undefined): boolean {
  return location?.is_active ?? false;
}

// Helper to get department count from location (when departments are loaded)
export function getLocationDepartmentCount(location: Location | null | undefined): number {
  return location?.departments?.length ?? 0;
}

// Helper to get employee count from location (when employees are loaded)
export function getLocationEmployeeCount(location: Location | null | undefined): number {
  return location?.employees?.length ?? 0;
}

// Helper to format location address
export function formatLocationAddress(location: Location | null | undefined): string {
  if (!location) return '';

  const parts = [];
  if (location.address) parts.push(location.address);
  if (location.city) parts.push(location.city);

  return parts.join(', ') || 'No address';
}
