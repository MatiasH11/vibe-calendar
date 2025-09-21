'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shiftsApiService } from '@/lib/shifts';
import { 
  ShiftDuplicationRequest,
  BulkShiftCreationRequest,
  BulkOperationPreview,
  ConflictValidationRequest,
  ConflictValidationResponse,
  TimeSuggestion,
  EmployeePatternResponse,
  SuggestionRequest
} from '@/types/shifts/templates';
import { Shift } from '@/types/shifts/shift';

/**
 * Hook for shift duplication operations
 */
export function useShiftDuplication() {
  const queryClient = useQueryClient();

  const duplicationMutation = useMutation({
    mutationFn: (data: ShiftDuplicationRequest) => shiftsApiService.duplicateShifts(data),
    onSuccess: () => {
      // Invalidate shifts queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['employees-for-shifts'] });
    },
  });

  const duplicateShifts = useCallback(async (data: ShiftDuplicationRequest): Promise<Shift[]> => {
    return duplicationMutation.mutateAsync(data);
  }, [duplicationMutation]);

  return {
    duplicateShifts,
    isLoading: duplicationMutation.isPending,
    error: duplicationMutation.error?.message || null,
  };
}

/**
 * Hook for bulk shift creation operations
 */
export function useBulkShiftCreation() {
  const queryClient = useQueryClient();

  const bulkCreateMutation = useMutation({
    mutationFn: (data: BulkShiftCreationRequest) => shiftsApiService.createBulkShifts(data),
    onSuccess: () => {
      // Invalidate shifts queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['employees-for-shifts'] });
    },
  });

  const previewMutation = useMutation({
    mutationFn: (data: BulkShiftCreationRequest) => shiftsApiService.previewBulkShifts(data),
  });

  const createBulkShifts = useCallback(async (data: BulkShiftCreationRequest): Promise<Shift[]> => {
    return bulkCreateMutation.mutateAsync(data);
  }, [bulkCreateMutation]);

  const previewBulkShifts = useCallback(async (data: BulkShiftCreationRequest): Promise<BulkOperationPreview> => {
    return previewMutation.mutateAsync(data);
  }, [previewMutation]);

  return {
    createBulkShifts,
    previewBulkShifts,
    isCreating: bulkCreateMutation.isPending,
    isPreviewing: previewMutation.isPending,
    createError: bulkCreateMutation.error?.message || null,
    previewError: previewMutation.error?.message || null,
  };
}

/**
 * Hook for conflict validation
 */
export function useConflictValidation() {
  const [isValidating, setIsValidating] = useState(false);

  const validateConflicts = useCallback(async (data: ConflictValidationRequest): Promise<ConflictValidationResponse> => {
    setIsValidating(true);
    try {
      const result = await shiftsApiService.validateConflicts(data);
      
      // Validación defensiva: asegurar que la respuesta tiene la estructura esperada
      if (!result || typeof result !== 'object') {
        console.warn('⚠️ API returned invalid conflict validation response:', result);
        return {
          has_conflicts: false,
          conflicts: [],
          total_conflicts: 0
        };
      }

      // Asegurar que las propiedades requeridas existen
      return {
        has_conflicts: Boolean(result.has_conflicts),
        conflicts: Array.isArray(result.conflicts) ? result.conflicts : [],
        total_conflicts: typeof result.total_conflicts === 'number' ? result.total_conflicts : 0
      };
    } catch (error) {
      console.error('❌ Conflict validation error:', error);
      
      // En lugar de lanzar el error, retornar una respuesta segura
      // para que la UI no se rompa
      return {
        has_conflicts: false,
        conflicts: [],
        total_conflicts: 0
      };
    } finally {
      setIsValidating(false);
    }
  }, []);

  return {
    validateConflicts,
    isValidating,
  };
}

/**
 * Hook for employee shift patterns
 */
export function useEmployeePatterns(employeeId: number | null) {
  return useQuery({
    queryKey: ['employee-patterns', employeeId],
    queryFn: () => employeeId ? shiftsApiService.getEmployeePatterns(employeeId) : null,
    enabled: !!employeeId,
    staleTime: 10 * 60 * 1000, // 10 minutes - patterns don't change frequently
  });
}

/**
 * Hook for multiple employee patterns (useful for bulk operations)
 */
export function useMultipleEmployeePatterns(employeeIds: number[]) {
  return useQuery({
    queryKey: ['multiple-employee-patterns', employeeIds.sort()],
    queryFn: () => employeeIds.length > 0 ? shiftsApiService.getMultipleEmployeePatterns(employeeIds) : {},
    enabled: employeeIds.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for time suggestions
 */
export function useTimeSuggestions(request: SuggestionRequest | null) {
  return useQuery({
    queryKey: ['time-suggestions', request?.employee_id, request?.date, request?.limit],
    queryFn: () => request ? shiftsApiService.getTimeSuggestions(request) : [],
    enabled: !!request?.employee_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Combined hook for enhanced shift operations
 */
export function useEnhancedShifts() {
  const duplication = useShiftDuplication();
  const bulkCreation = useBulkShiftCreation();
  const conflictValidation = useConflictValidation();

  return {
    // Duplication
    duplicateShifts: duplication.duplicateShifts,
    isDuplicating: duplication.isLoading,
    duplicationError: duplication.error,

    // Bulk creation
    createBulkShifts: bulkCreation.createBulkShifts,
    previewBulkShifts: bulkCreation.previewBulkShifts,
    isBulkCreating: bulkCreation.isCreating,
    isBulkPreviewing: bulkCreation.isPreviewing,
    bulkCreateError: bulkCreation.createError,
    bulkPreviewError: bulkCreation.previewError,

    // Conflict validation
    validateConflicts: conflictValidation.validateConflicts,
    isValidatingConflicts: conflictValidation.isValidating,
  };
}