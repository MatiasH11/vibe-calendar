'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Layout,
  Lightbulb,
  AlertTriangle,
  Settings
} from 'lucide-react';
import { useEnhancedShiftForm } from '@/hooks/shifts/useEnhancedShiftForm';
import { EnhancedShiftFormProps } from '@/types/shifts/forms';
import { ShiftTemplateSelector } from '@/components/shifts/templates/ShiftTemplateSelector';
import { ShiftSuggestions } from './ShiftSuggestions';
import { ConflictValidator } from './ConflictValidator';
import { cn } from '@/lib/utils';

export function EnhancedShiftForm({
  initialData,
  employees,
  onSubmit,
  onCancel,
  isLoading: externalLoading,
  selectedDate,
  selectedEmployee,
  enableTemplates = true,
  enableSuggestions = true,
  enableBulkMode = false,
  enableConflictValidation = true,
  onTemplateSelect,
  onSuggestionSelect,
  onConflictResolution,
  shiftId, // Agregar shiftId prop
}: EnhancedShiftFormProps) {
  // Para edición, usar modo manual por defecto; para creación, usar plantilla
  const isEditing = initialData?.company_employee_id && initialData?.shift_date;
  const [useTemplate, setUseTemplate] = useState(!isEditing);

  // Limpiar plantilla cuando se cambie a modo manual
  const handleTemplateToggle = (checked: boolean) => {
    setUseTemplate(checked);
    if (!checked) {
      // Limpiar plantilla cuando se cambie a manual
      setFormData('template_id', null);
    }
  };

  const {
    formData,
    errors,
    isLoading: formLoading,
    isValidating,
    loadingStates,
    setFormData,
    setError,
    validate,
    submit,
    reset,
    applyTemplate,
    applySuggestion,
    validateConflictsManually,
    templates,
    suggestions,
    conflicts,
    isBulkMode,
    hasConflicts,
  } = useEnhancedShiftForm(initialData, shiftId, {
    enableTemplates,
    enableSuggestions,
    enableConflictValidation,
    enableBulkMode,
  });

  // Set initial selected values
  useEffect(() => {
    if (selectedEmployee && !formData.company_employee_id) {
      setFormData('company_employee_id', selectedEmployee);
    }
    if (selectedDate && !formData.shift_date) {
      // Asegurar que la fecha esté en formato YYYY-MM-DD
      let formattedDate = selectedDate;
      if (selectedDate.includes('T')) {
        formattedDate = selectedDate.split('T')[0];
      }
      setFormData('shift_date', formattedDate);
    }
  }, [selectedEmployee, selectedDate, formData.company_employee_id, formData.shift_date, setFormData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      await submit();
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting enhanced shift:', error);
      setError('general', 'Error al procesar el turno');
    }
  };

  const handleCancel = () => {
    reset();
    onCancel();
  };

  const handleTemplateSelect = (template: any) => {
    applyTemplate(template);
    onTemplateSelect?.(template);
  };

  const handleSuggestionSelect = (suggestion: any) => {
    applySuggestion(suggestion);
    onSuggestionSelect?.(suggestion);
  };

  const handleConflictResolution = (conflictList: any[]) => {
    onConflictResolution?.(conflictList);
  };
  const handleAlternativeSelect = (_employeeId: number, alternative: any) => {
    setFormData('start_time', alternative.start_time);
    setFormData('end_time', alternative.end_time);
  };

  const isSubmitting = externalLoading || formLoading || loadingStates?.submitting;
  const isInitializing = loadingStates?.initializing || false;
  const isValidatingConflicts = isValidating || loadingStates?.validating || false;
  
  // No mostrar conflictos durante la inicialización para evitar parpadeos
  // Solo mostrar si realmente HAY conflictos, no solo si está validando
  const showConflicts = enableConflictValidation && !isInitializing && hasConflicts;
  const showSuggestions = enableSuggestions && suggestions.length > 0 && formData.company_employee_id;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Loading indicator for initialization */}
      {isInitializing && (
        <div className="flex items-center justify-center py-4">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-sm text-gray-600">Cargando datos...</span>
        </div>
      )}

      {/* Employee Selection */}
      {!isBulkMode ? (
        <div className="space-y-2">
          <Label htmlFor="employee" className="text-sm font-medium">Empleado</Label>
          <Select
            value={formData.company_employee_id.toString()}
            onValueChange={(value) => setFormData('company_employee_id', parseInt(value))}
            disabled={isSubmitting}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Selecciona un empleado">
                {formData.company_employee_id && (() => {
                  const selectedEmployee = employees.find(e => e.id === formData.company_employee_id);
                  return selectedEmployee ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-600">
                          {selectedEmployee.user.first_name[0]}{selectedEmployee.user.last_name[0]}
                        </span>
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-sm">{selectedEmployee.user.first_name} {selectedEmployee.user.last_name}</div>
                        <div className="text-xs text-gray-500">{selectedEmployee.role.name}</div>
                      </div>
                    </div>
                  ) : null;
                })()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {employees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id.toString()}>
                  <div className="flex items-center space-x-2 py-1">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">
                        {employee.user.first_name[0]}{employee.user.last_name[0]}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-sm">{employee.user.first_name} {employee.user.last_name}</div>
                      <div className="text-xs text-gray-500">{employee.role.name}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.company_employee_id && (
            <p className="text-sm text-red-500">{errors.company_employee_id}</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Empleados</Label>
          <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto bg-gray-50">
            {employees.map((employee) => (
              <label key={employee.id} className="flex items-center space-x-2 cursor-pointer hover:bg-white p-2 rounded transition-colors">
                <input
                  type="checkbox"
                  checked={formData.selected_employees?.includes(employee.id) || false}
                  onChange={(e) => {
                    const currentSelected = formData.selected_employees || [];
                    if (e.target.checked) {
                      setFormData('selected_employees', [...currentSelected, employee.id]);
                    } else {
                      setFormData('selected_employees', currentSelected.filter(id => id !== employee.id));
                    }
                  }}
                  disabled={isSubmitting}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600">
                    {employee.user.first_name[0]}{employee.user.last_name[0]}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{employee.user.first_name} {employee.user.last_name}</div>
                  <div className="text-xs text-gray-500">{employee.role.name}</div>
                </div>
              </label>
            ))}
          </div>
          {formData.selected_employees && formData.selected_employees.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {formData.selected_employees!.map(empId => {
                const emp = employees.find(e => e.id === empId);
                return emp ? (
                  <Badge key={empId} variant="secondary" className="text-xs">
                    {emp.user.first_name} {emp.user.last_name}
                  </Badge>
                ) : null;
              })}
            </div>
          )}
          {errors.selected_employees && (
            <p className="text-sm text-red-500">{errors.selected_employees}</p>
          )}
        </div>
      )}

      {/* Date Selection */}
      {!isBulkMode ? (
        <div className="space-y-2">
          <Label htmlFor="shift_date" className="text-sm font-medium">Fecha</Label>
          <Input
            id="shift_date"
            type="date"
            value={formData.shift_date}
            onChange={(e) => setFormData('shift_date', e.target.value)}
            disabled={isSubmitting}
            className="w-full h-11"
          />
          {errors.shift_date && (
            <p className="text-sm text-red-500">{errors.shift_date}</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Fechas</Label>
          <div className="space-y-2">
            <Input
              type="date"
              onChange={(e) => {
                if (e.target.value && !formData.selected_dates?.includes(e.target.value)) {
                  setFormData('selected_dates', [...(formData.selected_dates || []), e.target.value]);
                }
              }}
              disabled={isSubmitting}
            />
            {formData.selected_dates && formData.selected_dates.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {formData.selected_dates!.map(date => (
                  <Badge
                    key={date}
                    variant="secondary"
                    className="text-xs cursor-pointer hover:bg-red-100"
                    onClick={() => {
                      setFormData('selected_dates', formData.selected_dates?.filter(d => d !== date) || []);
                    }}
                  >
                    {new Date(date).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short'
                    })} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>
          {errors.selected_dates && (
            <p className="text-sm text-red-500">{errors.selected_dates}</p>
          )}
        </div>
      )}

      {/* Time Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Horario</Label>
          {enableTemplates && templates.length > 0 && (
            <div className="flex items-center bg-gray-100 rounded-full p-1">
              <button
                type="button"
                onClick={() => handleTemplateToggle(false)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-all",
                  !useTemplate
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                )}
                disabled={isSubmitting}
              >
                Manual
              </button>
              <button
                type="button"
                onClick={() => handleTemplateToggle(true)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-all",
                  useTemplate
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                )}
                disabled={isSubmitting}
              >
                Plantilla
              </button>
            </div>
          )}
        </div>

        {/* Contenedor con altura fija para evitar cambios de tamaño */}
        <div className="min-h-[80px]">
          {useTemplate ? (
            <div className="space-y-2">
              <Label className="text-xs text-gray-600">Selecciona una plantilla</Label>
              <ShiftTemplateSelector
                selectedTemplateId={formData.template_id}
                onTemplateSelect={handleTemplateSelect}
                disabled={isSubmitting}
                showPreview={false}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="start_time" className="text-xs text-gray-600">Inicio</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData('start_time', e.target.value)}
                  disabled={isSubmitting}
                />
                {errors.start_time && (
                  <p className="text-xs text-red-500">{errors.start_time}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="end_time" className="text-xs text-gray-600">Fin</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData('end_time', e.target.value)}
                  disabled={isSubmitting}
                />
                {errors.end_time && (
                  <p className="text-xs text-red-500">{errors.end_time}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>



      {/* Suggestions - Solo en modo manual */}
      {!useTemplate && showSuggestions && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <Lightbulb className="h-4 w-4 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-amber-900 mb-2">Sugerencias inteligentes</h4>
              <ShiftSuggestions
                suggestions={suggestions}
                onSuggestionSelect={handleSuggestionSelect}
                isLoading={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* Conflict Validation - Solo mostrar cuando hay conflictos reales */}
      {showConflicts && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-red-900">
                  Conflictos detectados
                </h4>
              </div>
              <ConflictValidator
                conflicts={conflicts}
                isValidating={false}
                onAlternativeSelect={handleAlternativeSelect}
                onConflictResolve={handleConflictResolution}
                showAlternatives={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Indicador de validación separado - solo para turnos nuevos */}
      {!initialData?.company_employee_id && isValidatingConflicts && !isInitializing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-blue-800">Validando conflictos...</span>
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes" className="text-sm font-medium">Notas adicionales</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData('notes', e.target.value)}
          placeholder="Agrega cualquier información adicional sobre este turno..."
          disabled={isSubmitting}
          rows={3}
          className="resize-none"
        />
        {errors.notes && (
          <p className="text-sm text-red-500">{errors.notes}</p>
        )}
      </div>

      {/* Manual Conflict Validation - Solo para turnos nuevos */}
      {!(initialData?.company_employee_id && initialData?.shift_date) && enableConflictValidation && formData.company_employee_id && formData.shift_date && formData.start_time && formData.end_time && (
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={validateConflictsManually}
            disabled={isSubmitting || isValidatingConflicts}
            className="w-full"
          >
            {isValidatingConflicts ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Validando conflictos...</span>
              </div>
            ) : (
              'Verificar conflictos de horario'
            )}
          </Button>
        </div>
      )}



      {/* Errores generales */}
      {(errors.general || errors.conflicts) && (
        <div className="space-y-2">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <p className="text-sm text-red-800">{errors.general}</p>
              </div>
            </div>
          )}
          {errors.conflicts && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <p className="text-sm text-yellow-800">{errors.conflicts}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || (hasConflicts && !formData.skip_conflict_validation)}
          className={cn(
            "flex-1",
            hasConflicts && !formData.skip_conflict_validation &&
            "bg-yellow-600 hover:bg-yellow-700"
          )}
        >
          {isSubmitting ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Guardando...</span>
            </div>
          ) : (
            isBulkMode ? 'Crear turnos' : 'Guardar turno'
          )}
        </Button>
      </div>
    </form>
  );
}