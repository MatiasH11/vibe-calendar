'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

// Enhanced debounce implementation with cancel method and immediate execution option
function debounce<T extends (...args: any[]) => any>(
  func: T, 
  wait: number,
  options: { leading?: boolean; trailing?: boolean; maxWait?: number } = {}
): T & { cancel: () => void; flush: () => void } {
  let timeout: NodeJS.Timeout | null = null;
  let maxTimeout: NodeJS.Timeout | null = null;
  let lastCallTime: number | null = null;
  let lastInvokeTime = 0;
  let lastArgs: Parameters<T> | null = null;
  let result: ReturnType<T>;

  const { leading = false, trailing = true, maxWait } = options;

  function invokeFunc(time: number) {
    const args = lastArgs!;
    lastArgs = null;
    lastInvokeTime = time;
    result = func(...args);
    return result;
  }

  function leadingEdge(time: number) {
    lastInvokeTime = time;
    timeout = setTimeout(timerExpired, wait);
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time: number) {
    const timeSinceLastCall = time - lastCallTime!;
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;

    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  }

  function shouldInvoke(time: number) {
    const timeSinceLastCall = time - lastCallTime!;
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === null ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  }

  function timerExpired() {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    timeout = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time: number) {
    timeout = null;
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = null;
    return result;
  }

  function cancel() {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    if (maxTimeout !== null) {
      clearTimeout(maxTimeout);
    }
    lastInvokeTime = 0;
    lastCallTime = null;
    lastArgs = null;
    timeout = null;
    maxTimeout = null;
  }

  function flush() {
    return timeout === null ? result : trailingEdge(Date.now());
  }

  const debounced = ((...args: Parameters<T>) => {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastCallTime = time;

    if (isInvoking) {
      if (timeout === null) {
        return leadingEdge(lastCallTime);
      }
      if (maxWait !== undefined) {
        timeout = setTimeout(timerExpired, wait);
        maxTimeout = setTimeout(() => invokeFunc(time), maxWait);
        return leading ? invokeFunc(lastCallTime) : result;
      }
    }
    if (timeout === null) {
      timeout = setTimeout(timerExpired, wait);
    }
    return result;
  }) as T & { cancel: () => void; flush: () => void };

  debounced.cancel = cancel;
  debounced.flush = flush;

  return debounced;
}

import { shiftsApiService } from '@/lib/shifts';
import { 
  ConflictValidationRequest,
  ConflictValidationResponse,
  ConflictInfo
} from '@/types/shifts/templates';
import { ShiftFormData } from '@/types/shifts/forms';

// Conflict validation cache
interface ConflictCacheEntry {
  response: ConflictValidationResponse;
  timestamp: number;
  ttl: number;
}

class ConflictValidationCache {
  private cache = new Map<string, ConflictCacheEntry>();
  private readonly TTL = 30 * 1000; // 30 seconds
  private readonly MAX_SIZE = 100;

  generateKey(request: ConflictValidationRequest): string {
    return JSON.stringify({
      shifts: request.shifts.map(s => ({
        employee_id: s.company_employee_id,
        date: s.shift_date,
        start: s.start_time,
        end: s.end_time
      })).sort((a, b) => `${a.employee_id}-${a.date}`.localeCompare(`${b.employee_id}-${b.date}`))
    });
  }

  get(key: string): ConflictValidationResponse | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.response;
  }

  set(key: string, response: ConflictValidationResponse): void {
    if (this.cache.size >= this.MAX_SIZE) {
      // Remove oldest entry
      const oldestKey = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      response,
      timestamp: Date.now(),
      ttl: this.TTL
    });
  }

  invalidate(employeeId?: number, date?: string): void {
    if (!employeeId && !date) {
      this.cache.clear();
      return;
    }

    const keysToDelete: string[] = [];
    for (const [key] of Array.from(this.cache.entries())) {
      try {
        const parsed = JSON.parse(key);
        const shouldInvalidate = parsed.shifts.some((shift: any) => 
          (!employeeId || shift.employee_id === employeeId) &&
          (!date || shift.date === date)
        );
        if (shouldInvalidate) {
          keysToDelete.push(key);
        }
      } catch {
        // Invalid key format, remove it
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

const conflictCache = new ConflictValidationCache();

interface ConflictValidationState {
  isValidating: boolean;
  hasConflicts: boolean;
  conflicts: ConflictInfo[];
  lastValidated: Date | null;
  error: string | null;
}

interface UseRealTimeConflictValidationOptions {
  debounceMs?: number;
  enabled?: boolean;
  validateOnMount?: boolean;
}

/**
 * Hook for real-time conflict validation in shift forms
 */
export function useRealTimeConflictValidation(
  formData: ShiftFormData | ShiftFormData[],
  options: UseRealTimeConflictValidationOptions = {}
) {
  const {
    debounceMs = 500,
    enabled = true,
    validateOnMount = false
  } = options;

  const [validationState, setValidationState] = useState<ConflictValidationState>({
    isValidating: false,
    hasConflicts: false,
    conflicts: [],
    lastValidated: null,
    error: null,
  });

  // Convert form data to validation request format
  const validationRequest = useMemo((): ConflictValidationRequest | null => {
    const shifts = Array.isArray(formData) ? formData : [formData];
    
    // Filter out incomplete shifts
    const validShifts = shifts.filter(shift => 
      shift.company_employee_id && 
      shift.shift_date && 
      shift.start_time && 
      shift.end_time
    );

    if (validShifts.length === 0) {
      return null;
    }

    return {
      shifts: validShifts.map(shift => ({
        company_employee_id: shift.company_employee_id,
        shift_date: shift.shift_date,
        start_time: shift.start_time,
        end_time: shift.end_time,
      }))
    };
  }, [formData]);

  // Debounced validation function with caching
  const debouncedValidate = useMemo(
    () => debounce(async (request: ConflictValidationRequest) => {
      if (!enabled) return;

      // Check cache first
      const cacheKey = conflictCache.generateKey(request);
      const cachedResponse = conflictCache.get(cacheKey);
      
      if (cachedResponse) {
        setValidationState(prev => ({
          ...prev,
          isValidating: false,
          hasConflicts: cachedResponse.has_conflicts,
          conflicts: cachedResponse.conflicts,
          lastValidated: new Date(),
        }));
        return;
      }

      setValidationState(prev => ({ ...prev, isValidating: true, error: null }));

      try {
        const response = await shiftsApiService.validateConflicts(request);
        
        // Cache the response
        conflictCache.set(cacheKey, response);
        
        setValidationState(prev => ({
          ...prev,
          isValidating: false,
          hasConflicts: response.has_conflicts,
          conflicts: response.conflicts,
          lastValidated: new Date(),
        }));
      } catch (error) {
        console.error('❌ Real-time conflict validation error:', error);
        setValidationState(prev => ({
          ...prev,
          isValidating: false,
          error: error instanceof Error ? error.message : 'Validation failed',
        }));
      }
    }, debounceMs, { 
      leading: false, 
      trailing: true, 
      maxWait: debounceMs * 3 // Ensure validation happens within 3x debounce time
    }),
    [enabled, debounceMs]
  );

  // Manual validation function (immediate, not debounced)
  const validateNow = useCallback(async (): Promise<ConflictValidationResponse | null> => {
    if (!validationRequest || !enabled) return null;

    setValidationState(prev => ({ ...prev, isValidating: true, error: null }));

    try {
      const response = await shiftsApiService.validateConflicts(validationRequest);
      
      setValidationState(prev => ({
        ...prev,
        isValidating: false,
        hasConflicts: response.has_conflicts,
        conflicts: response.conflicts,
        lastValidated: new Date(),
      }));

      return response;
    } catch (error) {
      console.error('❌ Manual conflict validation error:', error);
      setValidationState(prev => ({
        ...prev,
        isValidating: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      }));
      return null;
    }
  }, [validationRequest, enabled]);

  // Clear validation state
  const clearValidation = useCallback(() => {
    setValidationState({
      isValidating: false,
      hasConflicts: false,
      conflicts: [],
      lastValidated: null,
      error: null,
    });
  }, []);

  // Invalidate cache for specific employee/date
  const invalidateCache = useCallback((employeeId?: number, date?: string) => {
    conflictCache.invalidate(employeeId, date);
  }, []);

  // Effect to trigger validation when form data changes
  useEffect(() => {
    if (validationRequest && enabled) {
      debouncedValidate(validationRequest);
    } else {
      // Clear validation if request is invalid
      clearValidation();
    }

    // Cleanup debounced function on unmount
    return () => {
      debouncedValidate.cancel();
    };
  }, [validationRequest, enabled, debouncedValidate, clearValidation]);

  // Effect to validate on mount if requested
  useEffect(() => {
    if (validateOnMount && validationRequest && enabled) {
      validateNow();
    }
  }, [validateOnMount, validationRequest, enabled, validateNow]);

  // Helper functions for specific conflict types
  const getConflictsForEmployee = useCallback((employeeId: number) => {
    return validationState.conflicts.filter(conflict => conflict.employee_id === employeeId);
  }, [validationState.conflicts]);

  const getConflictsForDate = useCallback((date: string) => {
    return validationState.conflicts.filter(conflict => conflict.date === date);
  }, [validationState.conflicts]);

  const hasConflictsForEmployee = useCallback((employeeId: number) => {
    return validationState.conflicts.some(conflict => conflict.employee_id === employeeId);
  }, [validationState.conflicts]);

  const hasConflictsForDate = useCallback((date: string) => {
    return validationState.conflicts.some(conflict => conflict.date === date);
  }, [validationState.conflicts]);

  return {
    // Validation state
    isValidating: validationState.isValidating,
    hasConflicts: validationState.hasConflicts,
    conflicts: validationState.conflicts,
    lastValidated: validationState.lastValidated,
    error: validationState.error,

    // Actions
    validateNow,
    clearValidation,
    invalidateCache,

    // Helper functions
    getConflictsForEmployee,
    getConflictsForDate,
    hasConflictsForEmployee,
    hasConflictsForDate,

    // Computed values
    conflictCount: validationState.conflicts.length,
    isValid: !validationState.hasConflicts && !validationState.error,
  };
}