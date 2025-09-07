'use client';

import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { shiftsApiService } from '@/lib/shifts';
import { ShiftFormData, ShiftFormErrors, CreateShiftRequest, UpdateShiftRequest } from '@/types/shifts/forms';

export function useShiftForm(initialData?: Partial<ShiftFormData>, shiftId?: number) {
  const [formData, setFormData] = useState<ShiftFormData>({
    company_employee_id: initialData?.company_employee_id || 0,
    shift_date: initialData?.shift_date || '',
    start_time: initialData?.start_time || '',
    end_time: initialData?.end_time || '',
    notes: initialData?.notes || '',
  });

  // Actualizar formData cuando cambien los initialData
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        company_employee_id: initialData.company_employee_id || prev.company_employee_id,
        shift_date: initialData.shift_date || prev.shift_date,
        start_time: initialData.start_time || prev.start_time,
        end_time: initialData.end_time || prev.end_time,
        notes: initialData.notes || prev.notes,
      }));
    }
  }, [initialData]);

  const [errors, setErrors] = useState<ShiftFormErrors>({});
  const queryClient = useQueryClient();

  // Mutación para crear turno
  const createMutation = useMutation({
    mutationFn: (data: CreateShiftRequest) => shiftsApiService.createShift(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });

  // Mutación para actualizar turno
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateShiftRequest }) => 
      shiftsApiService.updateShift(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
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
    console.log('🔍 useShiftForm submit called with:', { formData, shiftId });
    
    if (!validate()) {
      console.log('❌ Validation failed');
      return;
    }

    try {
      if (shiftId) {
        // Actualizar turno existente
        console.log('🔄 Updating shift:', { id: shiftId, data: formData });
        await updateMutation.mutateAsync({ id: shiftId, data: formData });
      } else {
        // Crear nuevo turno
        console.log('➕ Creating shift:', formData);
        await createMutation.mutateAsync(formData);
      }
      
      console.log('✅ Shift operation successful');
      
      // Reset form on success
      setFormData({
        company_employee_id: 0,
        shift_date: '',
        start_time: '',
        end_time: '',
        notes: '',
      });
    } catch (error) {
      console.error('❌ Shift operation failed:', error);
      setError('general', shiftId ? 'Error al actualizar el turno' : 'Error al crear el turno');
    }
  }, [formData, validate, createMutation, updateMutation, setError, shiftId]);

  const reset = useCallback(() => {
    setFormData({
      company_employee_id: initialData?.company_employee_id || 0,
      shift_date: initialData?.shift_date || '',
      start_time: initialData?.start_time || '',
      end_time: initialData?.end_time || '',
      notes: initialData?.notes || '',
    });
    setErrors({});
  }, [initialData]);

  return {
    formData,
    errors,
    isLoading: createMutation.isPending || updateMutation.isPending,
    setFormData: setField,
    setError,
    clearErrors,
    validate,
    submit,
    reset,
    isEditing: !!shiftId,
  };
}
