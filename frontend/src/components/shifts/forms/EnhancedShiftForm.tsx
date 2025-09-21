'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Calendar, 
  Layout, 
  Lightbulb, 
  AlertTriangle,
  Settings,
  Copy
} from 'lucide-react';
import { useEnhancedShiftForm } from '@/hooks/shifts/useEnhancedShiftForm';
import { EnhancedShiftFormProps } from '@/types/shifts/forms';
import { EmployeeWithShifts } from '@/types/shifts/shift';
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
}: EnhancedShiftFormProps) {
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  const {
    formData,
    errors,
    validationState,
    isLoading: formLoading,
    isValidating,
    setFormData,
    setError,
    clearErrors,
    validate,
    submit,
    reset,
    applyTemplate,
    applySuggestion,
    templates,
    suggestions,
    conflicts,
    isBulkMode,
    hasConflicts,
  } = useEnhancedShiftForm(initialData, undefined, {
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
      setFormData('shift_date', selectedDate);
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

  const handleAlternativeSelect = (employeeId: number, alternative: any) => {
    setFormData('start_time', alternative.start_time);
    setFormData('end_time', alternative.end_time);
  };

  const isSubmitting = externalLoading || formLoading;
  const showConflicts = enableConflictValidation && (hasConflicts || isValidating);
  const showSuggestions = enableSuggestions && suggestions.length > 0 && formData.company_employee_id;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mode Toggle */}
      {enableBulkMode && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Modo de creación</span>
              </CardTitle>
              <Switch
                checked={isBulkMode}
                onCheckedChange={(checked: boolean) => setFormData('bulk_mode', checked)}
                disabled={isSubmitting}
              />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              {isBulkMode ? (
                <>
                  <Users className="h-4 w-4" />
                  <span>Creación masiva - Múltiples empleados y fechas</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Creación individual - Un turno a la vez</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Template Selector */}
      {enableTemplates && templates.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Layout className="h-4 w-4" />
              <span>Plantillas de turnos</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ShiftTemplateSelector
              selectedTemplateId={formData.template_id}
              onTemplateSelect={handleTemplateSelect}
              disabled={isSubmitting}
            />
          </CardContent>
        </Card>
      )}

      {/* Employee Selection */}
      {!isBulkMode ? (
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
      ) : (
        <div className="space-y-2">
          <Label>Empleados *</Label>
          <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
            {employees.map((employee) => (
              <label key={employee.id} className="flex items-center space-x-2 cursor-pointer">
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
                  className="rounded"
                />
                <span className="text-sm">
                  {employee.user.first_name} {employee.user.last_name} - {employee.role.name}
                </span>
              </label>
            ))}
          </div>
          {formData.selected_employees && formData.selected_employees.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
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
            <p className="text-sm text-red-600">{errors.selected_employees}</p>
          )}
        </div>
      )}

      {/* Date Selection */}
      {!isBulkMode ? (
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
      ) : (
        <div className="space-y-2">
          <Label>Fechas *</Label>
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
            <p className="text-sm text-red-600">{errors.selected_dates}</p>
          )}
        </div>
      )}

      {/* Time Selection */}
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

      {/* Suggestions */}
      {showSuggestions && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Lightbulb className="h-4 w-4" />
              <span>Sugerencias inteligentes</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ShiftSuggestions
              suggestions={suggestions}
              onSuggestionSelect={handleSuggestionSelect}
              isLoading={false}
            />
          </CardContent>
        </Card>
      )}

      {/* Conflict Validation */}
      {showConflicts && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Validación de conflictos</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ConflictValidator
              conflicts={conflicts}
              isValidating={isValidating}
              onAlternativeSelect={handleAlternativeSelect}
              onConflictResolve={handleConflictResolution}
              showAlternatives={true}
            />
          </CardContent>
        </Card>
      )}

      {/* Notes */}
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

      {/* Advanced Options */}
      <div className="space-y-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          <Settings className="h-4 w-4 mr-2" />
          {showAdvancedOptions ? 'Ocultar' : 'Mostrar'} opciones avanzadas
        </Button>
        
        {showAdvancedOptions && (
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="skip_validation" className="text-sm">
                    Omitir validación de conflictos
                  </Label>
                  <Switch
                    id="skip_validation"
                    checked={formData.skip_conflict_validation}
                    onCheckedChange={(checked: boolean) => setFormData('skip_conflict_validation', checked)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* General Error */}
      {errors.general && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{errors.general}</p>
        </div>
      )}

      {/* Conflict Error */}
      {errors.conflicts && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">{errors.conflicts}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2 pt-4 border-t">
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
          disabled={isSubmitting || (hasConflicts && !formData.skip_conflict_validation)}
          className={cn(
            hasConflicts && !formData.skip_conflict_validation && 
            "bg-yellow-600 hover:bg-yellow-700"
          )}
        >
          {isSubmitting ? 'Guardando...' : 
           isBulkMode ? 'Crear turnos' : 'Guardar turno'}
        </Button>
      </div>
    </form>
  );
}