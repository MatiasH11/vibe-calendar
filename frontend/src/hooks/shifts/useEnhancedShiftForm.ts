'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { shiftsApiService } from '@/lib/shifts';
import { 
  EnhancedShiftFormData, 
  EnhancedShiftFormErrors, 
  CreateShiftRequest, 
  UpdateShiftRequest,
  ShiftFormValidationState
} from '@/types/shifts/forms';
import { 
  TimeSuggestion, 
  ConflictInfo, 
  ShiftTemplate,
  ConflictValidationRequest 
} from '@/types/shifts/templates';
import { localTimeToUTC, getClientTimezone } from '@/lib/timezone-client';
import { useTimeSuggestions, useConflictValidation } from '@/hooks/shifts/useEnhancedShifts';
import { useShiftTemplates } from '@/hooks/shifts/useShiftTemplates';

export function useEnhancedShiftForm(
  initialData?: Partial<EnhancedShiftFormData>, 
  shiftId?: number,
  options?: {
    enableTemplates?: boolean;
    enableSuggestions?: boolean;
    enableConflictValidation?: boolean;
    enableBulkMode?: boolean;
  }
) {
  const {
    enableTemplates = true,
    enableSuggestions = true,
    enableConflictValidation = true,
    enableBulkMode = false
  } = options || {};

  const [formData, setFormData] = useState<EnhancedShiftFormData>({
    // Basic shift data
    company_employee_id: initialData?.company_employee_id || 0,
    shift_date: initialData?.shift_date || '',
    start_time: initialData?.start_time || '',
    end_time: initialData?.end_time || '',
    notes: initialData?.notes || '',
    
    // Enhanced functionality
    template_id: initialData?.template_id,
    use_template: initialData?.use_template || false,
    bulk_mode: initialData?.bulk_mode || false,
    selected_employees: initialData?.selected_employees || [],
    selected_dates: initialData?.selected_dates || [],
    duplicate_source: initialData?.duplicate_source,
    skip_conflict_validation: initialData?.skip_conflict_validation || false,
  });

  const [errors, setErrors] = useState<EnhancedShiftFormErrors>({});
  const [validationState, setValidationState] = useState<ShiftFormValidationState>({
    isValidating: false,
    hasConflicts: false,
    conflicts: [],
    suggestions: [],
    lastValidated: null,
  });

  const queryClient = useQueryClient();

  // Hooks for enhanced functionality
  const { templates } = useShiftTemplates();
  const { validateConflicts, isValidating } = useConflictValidation();
  
  const suggestionRequest = useMemo(() => {
    if (!enableSuggestions || !formData.company_employee_id) return null;
    return {
      employee_id: formData.company_employee_id,
      date: formData.shift_date || undefined,
      limit: 5
    };
  }, [enableSuggestions, formData.company_employee_id, formData.shift_date]);

  const { data: suggestions = [] } = useTimeSuggestions(suggestionRequest);

  // Update formData when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        selected_employees: initialData.selected_employees || prev.selected_employees,
        selected_dates: initialData.selected_dates || prev.selected_dates,
      }));
    }
  }, [initialData]);

  // Real-time conflict validation
  useEffect(() => {
    if (!enableConflictValidation || formData.skip_conflict_validation) return;
    if (!formData.company_employee_id || !formData.shift_date || !formData.start_time || !formData.end_time) return;

    const validateAsync = async () => {
      setValidationState(prev => ({ ...prev, isValidating: true }));
      
      try {
        const validationRequest: ConflictValidationRequest = {
          shifts: [{
            company_employee_id: formData.company_employee_id,
            shift_date: formData.shift_date,
            start_time: formData.start_time,
            end_time: formData.end_time,
          }]
        };

        const result = await validateConflicts(validationRequest);
        
        // Validación defensiva: verificar que result existe y tiene la estructura esperada
        if (!result || typeof result !== 'object') {
          console.warn('⚠️ Conflict validation returned invalid result:', result);
          setValidationState(prev => ({
            ...prev,
            isValidating: false,
            hasConflicts: false,
            conflicts: [],
            lastValidated: new Date(),
          }));
          return;
        }

        const hasConflicts = Boolean(result.has_conflicts);
        const conflicts = Array.isArray(result.conflicts) ? result.conflicts : [];

        setValidationState(prev => ({
          ...prev,
          isValidating: false,
          hasConflicts,
          conflicts,
          lastValidated: new Date(),
        }));

        // Clear conflict errors if no conflicts
        if (!hasConflicts && errors.conflicts) {
          setErrors(prev => ({ ...prev, conflicts: undefined }));
        }
      } catch (error) {
        console.error('❌ Conflict validation error:', error);
        setValidationState(prev => ({ 
          ...prev, 
          isValidating: false,
          lastValidated: new Date(),
        }));
      }
    };

    // Debounce validation
    const timeoutId = setTimeout(validateAsync, 500);
    return () => clearTimeout(timeoutId);
  }, [
    enableConflictValidation,
    formData.company_employee_id,
    formData.shift_date,
    formData.start_time,
    formData.end_time,
    formData.skip_conflict_validation,
    validateConflicts,
    errors.conflicts
  ]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateShiftRequest) => shiftsApiService.createShift(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['employees-for-shifts'] });
      queryClient.invalidateQueries({ queryKey: ['employee-patterns'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateShiftRequest }) => 
      shiftsApiService.updateShift(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['employees-for-shifts'] });
      queryClient.invalidateQueries({ queryKey: ['employee-patterns'] });
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: shiftsApiService.createBulkShifts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['employees-for-shifts'] });
      queryClient.invalidateQueries({ queryKey: ['employee-patterns'] });
    },
  });

  // Form field setter
  const setField = useCallback((field: keyof EnhancedShiftFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear related errors
    if (field in errors && errors[field as keyof EnhancedShiftFormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // Special handling for template selection
    if (field === 'template_id' && value && templates) {
      const selectedTemplate = templates.find(t => t.id === value);
      if (selectedTemplate) {
        setFormData(prev => ({
          ...prev,
          template_id: value,
          start_time: selectedTemplate.start_time,
          end_time: selectedTemplate.end_time,
          use_template: true,
        }));
      }
    }

    // Toggle bulk mode
    if (field === 'bulk_mode') {
      if (!value) {
        setFormData(prev => ({
          ...prev,
          bulk_mode: false,
          selected_employees: [],
          selected_dates: [],
        }));
      }
    }
  }, [errors, templates]);

  const setError = useCallback((field: keyof EnhancedShiftFormErrors, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Apply template
  const applyTemplate = useCallback((template: ShiftTemplate) => {
    setFormData(prev => ({
      ...prev,
      template_id: template.id,
      start_time: template.start_time,
      end_time: template.end_time,
      use_template: true,
    }));
    
    // Clear time-related errors
    setErrors(prev => ({
      ...prev,
      start_time: undefined,
      end_time: undefined,
    }));
  }, []);

  // Apply suggestion
  const applySuggestion = useCallback((suggestion: TimeSuggestion) => {
    setFormData(prev => ({
      ...prev,
      start_time: suggestion.start_time,
      end_time: suggestion.end_time,
      template_id: suggestion.template_id,
      use_template: !!suggestion.template_id,
    }));
    
    // Clear time-related errors
    setErrors(prev => ({
      ...prev,
      start_time: undefined,
      end_time: undefined,
    }));
  }, []);

  // Validation
  const validate = useCallback((): boolean => {
    const newErrors: EnhancedShiftFormErrors = {};

    // Basic validation
    if (!formData.company_employee_id && !formData.bulk_mode) {
      newErrors.company_employee_id = 'Selecciona un empleado';
    }

    if (!formData.shift_date && !formData.bulk_mode) {
      newErrors.shift_date = 'Selecciona una fecha';
    }

    if (!formData.start_time) {
      newErrors.start_time = 'Selecciona hora de inicio';
    }

    if (!formData.end_time) {
      newErrors.end_time = 'Selecciona hora de fin';
    }

    if (formData.start_time && formData.end_time) {
      if (formData.start_time >= formData.end_time) {
        newErrors.end_time = 'La hora de fin debe ser posterior a la de inicio';
      }
    }

    // Bulk mode validation
    if (formData.bulk_mode) {
      if (!formData.selected_employees?.length) {
        newErrors.selected_employees = 'Selecciona al menos un empleado';
      }
      if (!formData.selected_dates?.length) {
        newErrors.selected_dates = 'Selecciona al menos una fecha';
      }
    }

    // Conflict validation
    if (enableConflictValidation && validationState.hasConflicts && !formData.skip_conflict_validation) {
      newErrors.conflicts = 'Hay conflictos de horarios que deben resolverse';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, enableConflictValidation, validationState.hasConflicts]);

  // Submit
  const submit = useCallback(async () => {
    if (!validate()) {
      return;
    }

    try {
      const clientTimezone = getClientTimezone();
      const shiftDate = new Date(formData.bulk_mode ? formData.selected_dates![0] : formData.shift_date);
      
      const utcData = {
        ...formData,
        start_time: localTimeToUTC(formData.start_time, shiftDate, clientTimezone),
        end_time: localTimeToUTC(formData.end_time, shiftDate, clientTimezone),
      };

      if (formData.bulk_mode) {
        // Bulk creation
        await bulkCreateMutation.mutateAsync({
          employee_ids: formData.selected_employees!,
          dates: formData.selected_dates!,
          start_time: utcData.start_time,
          end_time: utcData.end_time,
          notes: formData.notes,
          template_id: formData.template_id,
        });
      } else if (shiftId) {
        // Update existing shift
        await updateMutation.mutateAsync({ id: shiftId, data: utcData });
      } else {
        // Create single shift
        await createMutation.mutateAsync(utcData);
      }
      
      // Reset form on success
      reset();
    } catch (error) {
      console.error('❌ Enhanced shift operation failed:', error);
      setError('general', 'Error al procesar el turno');
    }
  }, [formData, validate, createMutation, updateMutation, bulkCreateMutation, setError, shiftId]);

  const reset = useCallback(() => {
    setFormData({
      company_employee_id: initialData?.company_employee_id || 0,
      shift_date: initialData?.shift_date || '',
      start_time: initialData?.start_time || '',
      end_time: initialData?.end_time || '',
      notes: initialData?.notes || '',
      template_id: initialData?.template_id,
      use_template: initialData?.use_template || false,
      bulk_mode: initialData?.bulk_mode || false,
      selected_employees: initialData?.selected_employees || [],
      selected_dates: initialData?.selected_dates || [],
      duplicate_source: initialData?.duplicate_source,
      skip_conflict_validation: initialData?.skip_conflict_validation || false,
    });
    setErrors({});
    setValidationState({
      isValidating: false,
      hasConflicts: false,
      conflicts: [],
      suggestions: [],
      lastValidated: null,
    });
  }, [initialData]);

  return {
    // Form state
    formData,
    errors,
    validationState,
    
    // Loading states
    isLoading: createMutation.isPending || updateMutation.isPending || bulkCreateMutation.isPending,
    isValidating: validationState.isValidating,
    
    // Form actions
    setFormData: setField,
    setError,
    clearErrors,
    validate,
    submit,
    reset,
    
    // Enhanced actions
    applyTemplate,
    applySuggestion,
    
    // Data for enhanced features
    templates: templates || [],
    suggestions,
    conflicts: validationState.conflicts,
    
    // Flags
    isEditing: !!shiftId,
    isBulkMode: formData.bulk_mode,
    hasConflicts: validationState.hasConflicts,
  };
}