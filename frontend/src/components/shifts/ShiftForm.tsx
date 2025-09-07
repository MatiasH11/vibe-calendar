'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useShiftForm } from '@/hooks/shifts/useShiftForm';
import { ShiftFormData, ShiftFormProps } from '@/types/shifts/forms';
import { EmployeeWithShifts } from '@/types/shifts/shift';

export function ShiftForm({ 
  initialData, 
  employees, 
  onSubmit, 
  onCancel, 
  isLoading 
}: ShiftFormProps) {
  const {
    formData,
    errors,
    isLoading: formLoading,
    setFormData,
    setError,
    clearErrors,
    validate,
    submit,
    reset,
  } = useShiftForm(initialData);

  // El hook useShiftForm ya maneja la actualización de datos

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    try {
      await submit();
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting shift:', error);
      setError('general', 'Error al procesar el turno');
    }
  };

  const handleCancel = () => {
    reset();
    onCancel();
  };

  const isSubmitting = isLoading || formLoading;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Empleado */}
      <div className="space-y-2">
        <Label htmlFor="employee">Empleado *</Label>
        <Select
          value={formData.company_employee_id.toString()}
          onValueChange={(value) => setFormData('company_employee_id', parseInt(value))}
          disabled={isSubmitting}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un empleado" />
          </SelectTrigger>
          <SelectContent>
            {employees.map((employee) => (
              <SelectItem key={employee.id} value={employee.id.toString()}>
                {employee.user.first_name} {employee.user.last_name} - {employee.role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.company_employee_id && (
          <p className="text-sm text-red-600">{errors.company_employee_id}</p>
        )}
      </div>

      {/* Fecha */}
      <div className="space-y-2">
        <Label htmlFor="shift_date">Fecha *</Label>
        <Input
          id="shift_date"
          type="date"
          value={formData.shift_date}
          onChange={(e) => setFormData('shift_date', e.target.value)}
          disabled={isSubmitting}
        />
        {errors.shift_date && (
          <p className="text-sm text-red-600">{errors.shift_date}</p>
        )}
      </div>

      {/* Horas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_time">Hora de inicio *</Label>
          <Input
            id="start_time"
            type="time"
            value={formData.start_time}
            onChange={(e) => setFormData('start_time', e.target.value)}
            disabled={isSubmitting}
          />
          {errors.start_time && (
            <p className="text-sm text-red-600">{errors.start_time}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_time">Hora de fin *</Label>
          <Input
            id="end_time"
            type="time"
            value={formData.end_time}
            onChange={(e) => setFormData('end_time', e.target.value)}
            disabled={isSubmitting}
          />
          {errors.end_time && (
            <p className="text-sm text-red-600">{errors.end_time}</p>
          )}
        </div>
      </div>

      {/* Notas */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData('notes', e.target.value)}
          placeholder="Notas adicionales sobre el turno..."
          disabled={isSubmitting}
          rows={3}
        />
        {errors.notes && (
          <p className="text-sm text-red-600">{errors.notes}</p>
        )}
      </div>

      {/* Error general */}
      {errors.general && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{errors.general}</p>
        </div>
      )}

      {/* Botones */}
      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
}
