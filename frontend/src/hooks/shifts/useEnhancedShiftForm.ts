'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
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
import { localTimeToUTC, utcTimeToLocal, getClientTimezone } from '@/lib/timezone-client';
import { useTimeSuggestions, useConflictValidation } from '@/hooks/shifts/useEnhancedShifts';
import { useShiftTemplates } from '@/hooks/shifts/useShiftTemplates';
import { 
  validateInitialShiftData, 
  normalizeDateForInput, 
  normalizeTimeForInput,
  createInitialLoadingStates,
  handleFormError,
  FormLoadingStates,
  createDebouncedFunction,
  withTimeout
} from '@/lib/form-utils';
import { normalizeDateForForm } from '@/lib/dateUtils';

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
    shift_date: normalizeDateForForm(initialData?.shift_date) || '',
    start_time: normalizeTimeForInput(initialData?.start_time, !!shiftId) || '',
    end_time: normalizeTimeForInput(initialData?.end_time, !!shiftId) || '',
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

  const [loadingStates, setLoadingStates] = useState<FormLoadingStates>(createInitialLoadingStates());
  const initialDataApplied = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const queryClient = useQueryClient();

  // Hooks for enhanced functionality
  const { templates } = useShiftTemplates();
  const { validateConflicts, isValidating } = useConflictValidation();
  
  const suggestionRequest = useMemo(() => {
    if (!enableSuggestions || !formData.company_employee_id) return null;
    
    // Asegurar que la fecha esté en formato yyyy-MM-dd
    let formattedDate = formData.shift_date;
    if (formattedDate && formattedDate.includes('T')) {
      // Si es una fecha ISO, extraer solo la parte de fecha
      formattedDate = formattedDate.split('T')[0];
    }
    
    return {
      employee_id: formData.company_employee_id,
      date: formattedDate || undefined,
      limit: 5
    };
  }, [enableSuggestions, formData.company_employee_id, formData.shift_date]);

  const { data: suggestions = [] } = useTimeSuggestions(suggestionRequest);

  // Update formData when initialData changes - con validación mejorada
  useEffect(() => {
    // Solo aplicar initialData una vez y si es válido
    if (initialData && !initialDataApplied.current && validateInitialShiftData(initialData)) {
      setLoadingStates(prev => ({ ...prev, initializing: true }));
      
      try {
        setFormData(prev => ({
          ...prev,
          company_employee_id: initialData.company_employee_id ?? prev.company_employee_id,
          shift_date: normalizeDateForForm(initialData.shift_date) || prev.shift_date,
          start_time: normalizeTimeForInput(initialData.start_time, !!shiftId) || prev.start_time,
          end_time: normalizeTimeForInput(initialData.end_time, !!shiftId) || prev.end_time,
          notes: initialData.notes ?? prev.notes,
          template_id: initialData.template_id ?? prev.template_id,
          use_template: initialData.use_template ?? prev.use_template,
          bulk_mode: initialData.bulk_mode ?? prev.bulk_mode,
          selected_employees: initialData.selected_employees || prev.selected_employees,
          selected_dates: initialData.selected_dates || prev.selected_dates,
          duplicate_source: initialData.duplicate_source ?? prev.duplicate_source,
          skip_conflict_validation: initialData.skip_conflict_validation ?? prev.skip_conflict_validation,
        }));
        
        initialDataApplied.current = true;
      } catch (error) {
        console.error('Error applying initial data:', error);
      } finally {
        setLoadingStates(prev => ({ ...prev, initializing: false }));
      }
    }
  }, [initialData]);

  // Real-time conflict validation con manejo de race conditions mejorado
  useEffect(() => {
    if (!enableConflictValidation || formData.skip_conflict_validation) return;
    if (!formData.company_employee_id || !formData.shift_date || !formData.start_time || !formData.end_time) return;
    
    // NUNCA validar conflictos durante la inicialización
    if (loadingStates.initializing) return;
    
    // Para turnos existentes (edición), NO validar automáticamente NUNCA
    // La validación solo debe ocurrir para turnos nuevos o cuando el usuario
    // explícitamente solicite la validación
    if (shiftId || initialData?.company_employee_id) {
      return; // COMPLETAMENTE deshabilitar validación automática para edición
    }

    // Cancelar validación anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    // Crear nuevo controller para cancelación
    abortControllerRef.current = new AbortController();
    
    const validateAsync = async () => {
      setValidationState(prev => ({ ...prev, isValidating: true }));
      setLoadingStates(prev => ({ ...prev, validating: true }));
      
      try {
        const validationRequest: ConflictValidationRequest = {
          shifts: [{
            company_employee_id: formData.company_employee_id,
            shift_date: formData.shift_date,
            start_time: formData.start_time,
            end_time: formData.end_time,
          }]
        };

        // Usar timeout wrapper para evitar validaciones que cuelguen
        const result = await withTimeout(
          validateConflicts(validationRequest),
          3000 // 3 segundos timeout
        );
        
        // Verificar si la operación fue cancelada
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }
        
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
        // Ignorar errores de cancelación
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        
        console.error('❌ Conflict validation error:', error);
        const errorMessage = handleFormError(error, 'conflict validation');
        
        setValidationState(prev => ({ 
          ...prev, 
          isValidating: false,
          lastValidated: new Date(),
        }));
        
        // Solo mostrar error si no es timeout
        if (!(error instanceof Error && error.message?.includes('timeout'))) {
          setErrors(prev => ({ ...prev, conflicts: errorMessage }));
        }
      } finally {
        setLoadingStates(prev => ({ ...prev, validating: false }));
      }
    };

    // Debounce validation - solo para turnos nuevos
    const delay = 500;
    validationTimeoutRef.current = setTimeout(validateAsync, delay);
    
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
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

    // Debounce para fecha - evitar errores temporales durante el cambio
    if (field === 'shift_date') {
      // Limpiar error de fecha temporalmente durante el cambio
      if (errors.shift_date) {
        setErrors(prev => ({ ...prev, shift_date: undefined }));
      }
    }

    // Special handling for template selection
    if (field === 'template_id' && value && templates) {
      const selectedTemplate = templates.find(t => t.id === value);
      if (selectedTemplate) {
        const clientTimezone = getClientTimezone();
        const today = new Date();
        
        setFormData(prev => ({
          ...prev,
          template_id: value,
          // Convertir horarios UTC de la plantilla a local para mostrar al usuario
          start_time: utcTimeToLocal(selectedTemplate.start_time, today, clientTimezone),
          end_time: utcTimeToLocal(selectedTemplate.end_time, today, clientTimezone),
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
    const clientTimezone = getClientTimezone();
    const today = new Date();
    
    setFormData(prev => ({
      ...prev,
      template_id: template.id,
      // Convertir horarios UTC de la plantilla a local para mostrar al usuario
      start_time: utcTimeToLocal(template.start_time, today, clientTimezone),
      end_time: utcTimeToLocal(template.end_time, today, clientTimezone),
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
    const clientTimezone = getClientTimezone();
    const today = new Date();
    
    setFormData(prev => ({
      ...prev,
      // Convertir horarios UTC de la sugerencia a local para mostrar al usuario
      start_time: utcTimeToLocal(suggestion.start_time, today, clientTimezone),
      end_time: utcTimeToLocal(suggestion.end_time, today, clientTimezone),
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

  // Manual conflict validation - solo cuando el usuario lo solicite
  const validateConflictsManually = useCallback(async () => {
    if (!enableConflictValidation || !formData.company_employee_id || !formData.shift_date || !formData.start_time || !formData.end_time) {
      return;
    }

    setValidationState(prev => ({ ...prev, isValidating: true }));
    setLoadingStates(prev => ({ ...prev, validating: true }));
    
    try {
      const validationRequest: ConflictValidationRequest = {
        shifts: [{
          company_employee_id: formData.company_employee_id,
          shift_date: formData.shift_date,
          start_time: formData.start_time,
          end_time: formData.end_time,
        }]
      };

      const result = await withTimeout(
        validateConflicts(validationRequest),
        3000
      );
      
      if (!result || typeof result !== 'object') {
        console.warn('⚠️ Conflict validation returned invalid result:', result);
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

      if (!hasConflicts && errors.conflicts) {
        setErrors(prev => ({ ...prev, conflicts: undefined }));
      }
    } catch (error) {
      console.error('❌ Manual conflict validation error:', error);
      const errorMessage = handleFormError(error, 'conflict validation');
      setErrors(prev => ({ ...prev, conflicts: errorMessage }));
    } finally {
      setValidationState(prev => ({ ...prev, isValidating: false }));
      setLoadingStates(prev => ({ ...prev, validating: false }));
    }
  }, [formData, enableConflictValidation, validateConflicts, errors.conflicts]);

  // Validation
  const validate = useCallback((): boolean => {
    const newErrors: EnhancedShiftFormErrors = {};

    // Basic validation
    if (!formData.company_employee_id && !formData.bulk_mode) {
      newErrors.company_employee_id = 'Selecciona un empleado';
    }

    // Validar fecha solo si no está vacía (evitar errores temporales durante el cambio)
    if (!formData.shift_date && !formData.bulk_mode) {
      newErrors.shift_date = 'Selecciona una fecha';
    } else if (formData.shift_date) {
      // Validar formato de fecha
      const date = new Date(formData.shift_date);
      if (isNaN(date.getTime())) {
        newErrors.shift_date = 'Formato de fecha inválido';
      }
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
      shift_date: normalizeDateForForm(initialData?.shift_date) || '',
      start_time: normalizeTimeForInput(initialData?.start_time, !!shiftId) || '',
      end_time: normalizeTimeForInput(initialData?.end_time, !!shiftId) || '',
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
    setLoadingStates(createInitialLoadingStates());
    initialDataApplied.current = false;
    
    // Cancelar validaciones pendientes
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }
  }, [initialData]);

  return {
    // Form state
    formData,
    errors,
    validationState,
    
    // Loading states
    isLoading: createMutation.isPending || updateMutation.isPending || bulkCreateMutation.isPending || loadingStates.submitting,
    isValidating: validationState.isValidating || loadingStates.validating,
    loadingStates,
    
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
    validateConflictsManually,
    
    // Data for enhanced features
    templates: templates || [],
    suggestions,
    conflicts: validationState.conflicts,
    
    // Flags
    isEditing: !!shiftId,
    isBulkMode: formData.bulk_mode,
    hasConflicts: validationState.hasConflicts,
    isInitializing: loadingStates.initializing,
  };
}