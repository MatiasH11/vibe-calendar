/**
 * useShift Hook
 *
 * Provides comprehensive shift management functionality using the modular pattern.
 * Extends base useApiResource with shift-specific operations including week views,
 * validation, duplication, and bulk operations.
 */

import { useState, useCallback } from 'react';
import { useApiResource } from './useApiResource';
import { shiftApi } from '@/api/shiftApi';
import type {
  Shift,
  CreateShiftInput,
  UpdateShiftInput,
  ShiftFilter,
  WeekViewParams,
  WeekViewResponse,
  EmployeeScheduleParams,
  ConflictInfo,
  RuleViolation,
  ValidationResult,
  DuplicateShiftParams,
  DuplicateShiftResult,
  BulkCreateInput,
  BulkUpdateInput,
  BulkDeleteInput,
  BulkOperationResult,
} from '@/api/shiftApi';

export interface UseShiftOptions {
  initialFilters?: ShiftFilter;
  onSuccess?: (message: string) => void;
  onError?: (error: Error) => void;
  autoLoad?: boolean;
}

export interface UseShiftReturn {
  // Base resource state
  shifts: Shift[];
  selectedShift: Shift | null;
  isLoading: boolean;
  error: Error | null;

  // Operation states
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isValidating: boolean;
  isDuplicating: boolean;

  // Week view state
  weekView: WeekViewResponse | null;
  isLoadingWeekView: boolean;

  // Employee schedule state
  employeeSchedule: Shift[] | null;
  isLoadingEmployeeSchedule: boolean;

  // Validation state
  validationResult: ValidationResult | null;

  // Base CRUD operations
  loadAll: (filters?: ShiftFilter) => Promise<void>;
  loadById: (id: number) => Promise<void>;
  create: (data: CreateShiftInput) => Promise<Shift | null>;
  update: (id: number, data: UpdateShiftInput) => Promise<Shift | null>;
  delete: (id: number) => Promise<boolean>;
  refresh: () => Promise<void>;
  reset: () => void;

  // Week view operations
  loadWeekView: (params: WeekViewParams) => Promise<void>;
  clearWeekView: () => void;

  // Employee schedule operations
  loadEmployeeSchedule: (params: EmployeeScheduleParams) => Promise<void>;
  clearEmployeeSchedule: () => void;

  // Validation operations
  validateConflicts: (shift: CreateShiftInput | UpdateShiftInput, shiftId?: number) => Promise<ConflictInfo[]>;
  validateBusinessRules: (shift: CreateShiftInput | UpdateShiftInput, shiftId?: number) => Promise<RuleViolation[]>;
  validate: (shift: CreateShiftInput | UpdateShiftInput, shiftId?: number) => Promise<ValidationResult>;
  clearValidation: () => void;

  // Duplication operations
  duplicateShift: (params: DuplicateShiftParams) => Promise<DuplicateShiftResult | null>;

  // Bulk operations
  bulkCreate: (input: BulkCreateInput) => Promise<BulkOperationResult | null>;
  bulkUpdate: (input: BulkUpdateInput) => Promise<BulkOperationResult | null>;
  bulkDelete: (input: BulkDeleteInput) => Promise<BulkOperationResult<{ shift_id: number }> | null>;

  // AI/Pattern operations
  getEmployeePatterns: (employeeId: number) => Promise<any>;
  getSuggestions: (params: {
    employee_id?: number;
    date?: string;
    location_id?: number;
    department_id?: number;
  }) => Promise<any>;
}

/**
 * Custom hook for shift management
 */
export function useShift(options: UseShiftOptions = {}): UseShiftReturn {
  const {
    initialFilters,
    onSuccess,
    onError,
    autoLoad = false,
  } = options;

  // Base resource hook
  const baseHook = useApiResource<Shift, CreateShiftInput, UpdateShiftInput>(
    {
      getAll: (filters) => shiftApi.getAll(filters as ShiftFilter),
      getById: shiftApi.getById,
      create: shiftApi.create,
      update: shiftApi.update,
      delete: shiftApi.delete,
    },
    {
      onSuccess,
      onError,
      autoLoad,
      initialFilters,
    }
  );

  // Additional state for shift-specific features
  const [weekView, setWeekView] = useState<WeekViewResponse | null>(null);
  const [isLoadingWeekView, setIsLoadingWeekView] = useState(false);

  const [employeeSchedule, setEmployeeSchedule] = useState<Shift[] | null>(null);
  const [isLoadingEmployeeSchedule, setIsLoadingEmployeeSchedule] = useState(false);

  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const [isDuplicating, setIsDuplicating] = useState(false);

  // Week view operations
  const loadWeekView = useCallback(async (params: WeekViewParams) => {
    setIsLoadingWeekView(true);
    try {
      const response = await shiftApi.getWeekView(params);
      if (response.success && response.data) {
        setWeekView(response.data);
      }
    } catch (error) {
      onError?.(error as Error);
    } finally {
      setIsLoadingWeekView(false);
    }
  }, [onError]);

  const clearWeekView = useCallback(() => {
    setWeekView(null);
  }, []);

  // Employee schedule operations
  const loadEmployeeSchedule = useCallback(async (params: EmployeeScheduleParams) => {
    setIsLoadingEmployeeSchedule(true);
    try {
      const response = await shiftApi.getEmployeeSchedule(params);
      if (response.success && response.data) {
        setEmployeeSchedule(response.data);
      }
    } catch (error) {
      onError?.(error as Error);
    } finally {
      setIsLoadingEmployeeSchedule(false);
    }
  }, [onError]);

  const clearEmployeeSchedule = useCallback(() => {
    setEmployeeSchedule(null);
  }, []);

  // Validation operations
  const validateConflicts = useCallback(async (
    shift: CreateShiftInput | UpdateShiftInput,
    shiftId?: number
  ): Promise<ConflictInfo[]> => {
    setIsValidating(true);
    try {
      const response = await shiftApi.validateConflicts(shift, shiftId);
      return response.data || [];
    } catch (error) {
      onError?.(error as Error);
      return [];
    } finally {
      setIsValidating(false);
    }
  }, [onError]);

  const validateBusinessRules = useCallback(async (
    shift: CreateShiftInput | UpdateShiftInput,
    shiftId?: number
  ): Promise<RuleViolation[]> => {
    setIsValidating(true);
    try {
      const response = await shiftApi.validateBusinessRules(shift, shiftId);
      return response.data || [];
    } catch (error) {
      onError?.(error as Error);
      return [];
    } finally {
      setIsValidating(false);
    }
  }, [onError]);

  const validate = useCallback(async (
    shift: CreateShiftInput | UpdateShiftInput,
    shiftId?: number
  ): Promise<ValidationResult> => {
    setIsValidating(true);
    try {
      const response = await shiftApi.validate(shift, shiftId);
      const result = response.data || { valid: true, conflicts: [], rule_violations: [] };
      setValidationResult(result);
      return result;
    } catch (error) {
      onError?.(error as Error);
      return { valid: false, conflicts: [], rule_violations: [] };
    } finally {
      setIsValidating(false);
    }
  }, [onError]);

  const clearValidation = useCallback(() => {
    setValidationResult(null);
  }, []);

  // Duplication operations
  const duplicateShift = useCallback(async (
    params: DuplicateShiftParams
  ): Promise<DuplicateShiftResult | null> => {
    setIsDuplicating(true);
    try {
      const response = await shiftApi.duplicateShift(params);
      if (response.success && response.data) {
        onSuccess?.(`Duplicated ${response.data.summary.total_succeeded} shifts successfully`);
        return response.data;
      }
      return null;
    } catch (error) {
      onError?.(error as Error);
      return null;
    } finally {
      setIsDuplicating(false);
    }
  }, [onSuccess, onError]);

  // Bulk operations
  const bulkCreate = useCallback(async (
    input: BulkCreateInput
  ): Promise<BulkOperationResult | null> => {
    try {
      const response = await shiftApi.bulkCreate(input);
      if (response.success && response.data) {
        onSuccess?.(`Created ${response.data.summary.total_succeeded} shifts successfully`);
        await baseHook.refresh();
        return response.data;
      }
      return null;
    } catch (error) {
      onError?.(error as Error);
      return null;
    }
  }, [onSuccess, onError, baseHook]);

  const bulkUpdate = useCallback(async (
    input: BulkUpdateInput
  ): Promise<BulkOperationResult | null> => {
    try {
      const response = await shiftApi.bulkUpdate(input);
      if (response.success && response.data) {
        onSuccess?.(`Updated ${response.data.summary.total_succeeded} shifts successfully`);
        await baseHook.refresh();
        return response.data;
      }
      return null;
    } catch (error) {
      onError?.(error as Error);
      return null;
    }
  }, [onSuccess, onError, baseHook]);

  const bulkDelete = useCallback(async (
    input: BulkDeleteInput
  ): Promise<BulkOperationResult<{ shift_id: number }> | null> => {
    try {
      const response = await shiftApi.bulkDelete(input);
      if (response.success && response.data) {
        onSuccess?.(`Deleted ${response.data.summary.total_succeeded} shifts successfully`);
        await baseHook.refresh();
        return response.data;
      }
      return null;
    } catch (error) {
      onError?.(error as Error);
      return null;
    }
  }, [onSuccess, onError, baseHook]);

  // AI/Pattern operations
  const getEmployeePatterns = useCallback(async (employeeId: number) => {
    try {
      const response = await shiftApi.getEmployeePatterns(employeeId);
      return response.data;
    } catch (error) {
      onError?.(error as Error);
      return null;
    }
  }, [onError]);

  const getSuggestions = useCallback(async (params: {
    employee_id?: number;
    date?: string;
    location_id?: number;
    department_id?: number;
  }) => {
    try {
      const response = await shiftApi.getSuggestions(params);
      return response.data;
    } catch (error) {
      onError?.(error as Error);
      return null;
    }
  }, [onError]);

  return {
    // Base state
    shifts: baseHook.items,
    selectedShift: baseHook.selectedItem,
    isLoading: baseHook.isLoading,
    error: baseHook.error,

    // Operation states
    isCreating: baseHook.isCreating,
    isUpdating: baseHook.isUpdating,
    isDeleting: baseHook.isDeleting,
    isValidating,
    isDuplicating,

    // Week view state
    weekView,
    isLoadingWeekView,

    // Employee schedule state
    employeeSchedule,
    isLoadingEmployeeSchedule,

    // Validation state
    validationResult,

    // Base operations
    loadAll: baseHook.loadAll,
    loadById: baseHook.loadById,
    create: baseHook.create,
    update: baseHook.update,
    delete: baseHook.delete,
    refresh: baseHook.refresh,
    reset: baseHook.reset,

    // Week view operations
    loadWeekView,
    clearWeekView,

    // Employee schedule operations
    loadEmployeeSchedule,
    clearEmployeeSchedule,

    // Validation operations
    validateConflicts,
    validateBusinessRules,
    validate,
    clearValidation,

    // Duplication operations
    duplicateShift,

    // Bulk operations
    bulkCreate,
    bulkUpdate,
    bulkDelete,

    // AI/Pattern operations
    getEmployeePatterns,
    getSuggestions,
  };
}

export default useShift;
