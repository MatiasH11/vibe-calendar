'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { shiftsApiService } from '@/lib/shifts';
import { ShiftFormData, ShiftFormErrors, CreateShiftRequest, UpdateShiftRequest } from '@/types/shifts/forms';
import { localTimeToUTC, getClientTimezone } from '@/lib/timezone-client';
import { 
  validateInitialShiftData, 
  normalizeDateForInput, 
  normalizeTimeForInput,
  createInitialLoadingStates,
  handleFormError,
  FormLoadingStates
} from '@/lib/form-utils';
import { normalizeDateForForm } from '@/lib/dateUtils';

export function useShiftForm(initialData?: Partial<ShiftFormData>, shiftId?: number) {
  const [formData, setFormData] = useState<ShiftFormData>({
    company_employee_id: initialData?.company_employee_id || 0,
    shift_date: normalizeDateForForm(initialData?.shift_date) || '',
    start_time: normalizeTimeForInput(initialData?.start_time, !!shiftId) || '',
    end_time: normalizeTimeForInput(initialData?.end_time, !!shiftId) || '',
    notes: initialData?.notes || '',
  });

  const [loadingStates, setLoadingStates] = useState<FormLoadingStates>(createInitialLoadingStates());
  const initialDataApplied = useRef(false);

  // Actualizar formData cuando cambien los initialData - con validación mejorada
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
        }));
        
        initialDataApplied.current = true;
      } catch (error) {
        console.error('Error applying initial data:', error);
      } finally {
        setLoadingStates(prev => ({ ...prev, initializing: false }));
      }
    }
  }, [initialData]);

  const [errors, setErrors] = useState<ShiftFormErrors>({});
  const queryClient = useQueryClient();

  // Mutación para crear turno
  const createMutation = useMutation({
    mutationFn: (data: CreateShiftRequest) => shiftsApiService.createShift(data),
    onSuccess: () => {
      // Invalidar todas las queries relacionadas con turnos
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['employees-for-shifts'] });
    },
  });

  // Mutación para actualizar turno
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateShiftRequest }) => 
      shiftsApiService.updateShift(id, data),
    onSuccess: () => {
      // Invalidar todas las queries relacionadas con turnos
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['employees-for-shifts'] });
    },
  });

  const setField = useCallback((field: keyof ShiftFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const setError = useCallback((field: keyof ShiftFormErrors, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: ShiftFormErrors = {};

    if (!formData.company_employee_id) {
      newErrors.company_employee_id = 'Selecciona un empleado';
    }

    if (!formData.shift_date) {
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const submit = useCallback(async () => {
    if (!validate()) {
      return;
    }

    setLoadingStates(prev => ({ ...prev, submitting: true }));

    try {
      // Convertir tiempos locales a UTC antes de enviar (solución flexible)
      const clientTimezone = getClientTimezone();
      const shiftDate = new Date(formData.shift_date);
      
      const utcData = {
        ...formData,
        start_time: localTimeToUTC(formData.start_time, shiftDate, clientTimezone),
        end_time: localTimeToUTC(formData.end_time, shiftDate, clientTimezone),
      };

      if (shiftId) {
        // Actualizar turno existente
        await updateMutation.mutateAsync({ id: shiftId, data: utcData });
      } else {
        // Crear nuevo turno
        await createMutation.mutateAsync(utcData);
      }
      
      // Reset form on success
      setFormData({
        company_employee_id: 0,
        shift_date: '',
        start_time: '',
        end_time: '',
        notes: '',
      });
      
      // Reset applied flag for next use
      initialDataApplied.current = false;
    } catch (error) {
      console.error('❌ Shift operation failed:', error);
      const errorMessage = handleFormError(error, 'shift submission');
      setError('general', errorMessage);
    } finally {
      setLoadingStates(prev => ({ ...prev, submitting: false }));
    }
  }, [formData, validate, createMutation, updateMutation, setError, shiftId]);

  const reset = useCallback(() => {
    setFormData({
      company_employee_id: initialData?.company_employee_id || 0,
      shift_date: normalizeDateForForm(initialData?.shift_date) || '',
      start_time: normalizeTimeForInput(initialData?.start_time, !!shiftId) || '',
      end_time: normalizeTimeForInput(initialData?.end_time, !!shiftId) || '',
      notes: initialData?.notes || '',
    });
    setErrors({});
    setLoadingStates(createInitialLoadingStates());
    initialDataApplied.current = false;
  }, [initialData, shiftId]);

  return {
    formData,
    errors,
    isLoading: createMutation.isPending || updateMutation.isPending || loadingStates.submitting,
    loadingStates,
    setFormData: setField,
    setError,
    clearErrors,
    validate,
    submit,
    reset,
    isEditing: !!shiftId,
    isInitializing: loadingStates.initializing,
  };
}
