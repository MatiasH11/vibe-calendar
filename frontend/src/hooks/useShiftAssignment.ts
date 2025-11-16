/**
 * Shift Assignment Hook
 * Extends useApiResource with shift assignment specific operations
 */

import { useCallback } from 'react';
import { useApiResource, UseResourceOptions } from './useApiResource';
import { shiftAssignmentApi } from '@/api';
import {
  ShiftAssignment,
  CreateShiftAssignmentInput,
  UpdateShiftAssignmentInput,
  ValidationResult,
  CoverageAnalysis,
} from '@/lib/validation';
import { ApiError } from '@/lib/errors';

/**
 * Shift Assignment Hook
 * Provides all CRUD operations plus shift-specific methods
 */
export function useShiftAssignment(options?: UseResourceOptions) {
  const baseHook = useApiResource<
    ShiftAssignment,
    CreateShiftAssignmentInput,
    UpdateShiftAssignmentInput
  >(shiftAssignmentApi, options);

  /**
   * Confirm a pending shift assignment
   */
  const confirmShift = useCallback(async (id: number): Promise<ShiftAssignment | null> => {
    try {
      const confirmed = await shiftAssignmentApi.confirmShift(id);

      // Update in items list
      baseHook.setSelectedItem(confirmed);

      if (options?.onSuccess) {
        options.onSuccess('Shift confirmed successfully');
      }

      return confirmed;
    } catch (error) {
      if (options?.onError) {
        options.onError(error as ApiError);
      }
      return null;
    }
  }, [options]);

  /**
   * Validate shift assignment for conflicts
   */
  const validateConflicts = useCallback(async (
    assignment: {
      employee_id: number;
      shift_date: string;
      start_time: string;
      end_time: string;
      excludeShiftId?: number;
    }
  ): Promise<ValidationResult | null> => {
    try {
      return await shiftAssignmentApi.validateConflicts(assignment);
    } catch (error) {
      if (options?.onError) {
        options.onError(error as ApiError);
      }
      return null;
    }
  }, [options]);

  /**
   * Validate shift assignment against business rules
   */
  const validateBusinessRules = useCallback(async (
    assignment: {
      employee_id: number;
      company_id: number;
      shift_date: string;
      start_time: string;
      end_time: string;
      excludeShiftId?: number;
    }
  ): Promise<ValidationResult | null> => {
    try {
      return await shiftAssignmentApi.validateBusinessRules(assignment);
    } catch (error) {
      if (options?.onError) {
        options.onError(error as ApiError);
      }
      return null;
    }
  }, [options]);

  /**
   * Get coverage analysis for a date range
   */
  const getCoverageAnalysis = useCallback(async (
    startDate: string,
    endDate: string,
    locationId?: number
  ): Promise<{
    analysis: CoverageAnalysis[];
    summary: {
      totalRequired: number;
      totalAssigned: number;
      totalConfirmed: number;
      averageCoverage: number;
    };
  } | null> => {
    try {
      return await shiftAssignmentApi.getCoverageAnalysis(startDate, endDate, locationId);
    } catch (error) {
      if (options?.onError) {
        options.onError(error as ApiError);
      }
      return null;
    }
  }, [options]);

  /**
   * Get shift assignments by employee
   */
  const getByEmployee = useCallback(async (
    employeeId: number,
    filters?: {
      startDate?: string;
      endDate?: string;
      status?: 'pending' | 'confirmed' | 'cancelled';
    }
  ): Promise<ShiftAssignment[]> => {
    try {
      return await shiftAssignmentApi.getByEmployee(employeeId, filters);
    } catch (error) {
      if (options?.onError) {
        options.onError(error as ApiError);
      }
      return [];
    }
  }, [options]);

  /**
   * Get shift assignments by location
   */
  const getByLocation = useCallback(async (
    locationId: number,
    filters?: {
      startDate?: string;
      endDate?: string;
      status?: 'pending' | 'confirmed' | 'cancelled';
    }
  ): Promise<ShiftAssignment[]> => {
    try {
      return await shiftAssignmentApi.getByLocation(locationId, filters);
    } catch (error) {
      if (options?.onError) {
        options.onError(error as ApiError);
      }
      return [];
    }
  }, [options]);

  return {
    ...baseHook,
    // Extended methods
    confirmShift,
    validateConflicts,
    validateBusinessRules,
    getCoverageAnalysis,
    getByEmployee,
    getByLocation,
  };
}
