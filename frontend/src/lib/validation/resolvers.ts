/**
 * React Hook Form resolvers for Zod schemas
 * Provides form validation using backend schemas
 */

import { zodResolver } from '@hookform/resolvers/zod';
import * as schemas from './schemas';

// ============================================================================
// SHIFT ASSIGNMENT RESOLVERS
// ============================================================================

export const createShiftAssignmentResolver = zodResolver(schemas.createShiftAssignmentSchema);
export const updateShiftAssignmentResolver = zodResolver(schemas.updateShiftAssignmentSchema);
export const shiftAssignmentFiltersResolver = zodResolver(schemas.shiftAssignmentFiltersSchema);

// ============================================================================
// DAY TEMPLATE RESOLVERS
// ============================================================================

export const createDayTemplateResolver = zodResolver(schemas.createDayTemplateSchema);
export const updateDayTemplateResolver = zodResolver(schemas.updateDayTemplateSchema);
export const dayTemplateFiltersResolver = zodResolver(schemas.dayTemplateFiltersSchema);

// ============================================================================
// TEMPLATE SHIFT RESOLVERS
// ============================================================================

export const createTemplateShiftResolver = zodResolver(schemas.createTemplateShiftSchema);
export const updateTemplateShiftResolver = zodResolver(schemas.updateTemplateShiftSchema);

// ============================================================================
// COMMON RESOLVERS
// ============================================================================

export const paginationResolver = zodResolver(schemas.paginationSchema);
export const sortResolver = zodResolver(schemas.sortSchema);
export const dateRangeResolver = zodResolver(schemas.dateRangeSchema);
export const timeRangeResolver = zodResolver(schemas.timeRangeSchema);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a custom resolver with additional validation
 */
export function createCustomResolver<T>(
  baseSchema: any,
  customValidation?: (data: T) => Promise<void> | void
) {
  return async (data: T, context: any, options: any) => {
    // Run base Zod validation
    const baseResult = await zodResolver(baseSchema)(data, context, options);

    // If base validation failed, return errors
    if (baseResult.errors && Object.keys(baseResult.errors).length > 0) {
      return baseResult;
    }

    // Run custom validation if provided
    if (customValidation) {
      try {
        await customValidation(data);
      } catch (error) {
        return {
          values: {},
          errors: {
            root: {
              type: 'custom',
              message: error instanceof Error ? error.message : 'Validation failed',
            },
          },
        };
      }
    }

    return baseResult;
  };
}

/**
 * Create a resolver with time range validation
 */
export function createTimeRangeResolver(baseSchema: any) {
  return createCustomResolver(baseSchema, (data: any) => {
    if (data.start_time && data.end_time) {
      schemas.validateTimeRange({
        start_time: data.start_time,
        end_time: data.end_time,
      });
    }
  });
}

/**
 * Create a resolver with date range validation
 */
export function createDateRangeResolver(baseSchema: any) {
  return createCustomResolver(baseSchema, (data: any) => {
    if (data.start_date && data.end_date) {
      schemas.validateDateRange({
        start_date: data.start_date,
        end_date: data.end_date,
      });
    }
  });
}
