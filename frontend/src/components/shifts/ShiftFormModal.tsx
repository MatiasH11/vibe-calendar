'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ShiftForm } from './ShiftForm';
import { EnhancedShiftForm } from './forms/EnhancedShiftForm';
import { Shift, EmployeeWithShifts } from '@/types/shifts/shift';
import { ShiftFormData } from '@/types/shifts/forms';
import { formatTimeSafe } from '@/lib/timezone-client';
import { normalizeDateForForm } from '@/lib/dateUtils';
import { normalizeTimeForInput } from '@/lib/form-utils';
import { useShiftsStore } from '@/stores/shiftsStore';
import { useEffect, useCallback } from 'react';

interface ShiftFormModalProps {
  isOpen: boolean;
  shift?: Shift;
  employee?: EmployeeWithShifts;
  selectedDate?: string;
  employees: EmployeeWithShifts[];
  onSubmit: (data: ShiftFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  // Enhanced features
  enableTemplates?: boolean;
  enableShortcuts?: boolean;
  enableSuggestions?: boolean;
  bulkMode?: boolean;
}

export function ShiftFormModal({ 
  isOpen, 
  shift, 
  employee,
  selectedDate,
  employees,
  onSubmit, 
  onCancel, 
  isLoading,
  enableTemplates = false,
  enableShortcuts = false,
  enableSuggestions = false,
  bulkMode = false
}: ShiftFormModalProps) {
  const { 
    shortcutsEnabled, 
    bulkMode: storeBulkMode,
    setBulkMode,
    loadTemplates,
    templates
  } = useShiftsStore();

  // Load templates when modal opens with template support
  useEffect(() => {
    if (isOpen && enableTemplates && templates.length === 0) {
      loadTemplates();
    }
  }, [isOpen, enableTemplates, loadTemplates, templates.length]);

  // Sync bulk mode with store
  useEffect(() => {
    if (bulkMode !== storeBulkMode) {
      setBulkMode(bulkMode);
    }
  }, [bulkMode, storeBulkMode, setBulkMode]);

  // Preparar datos iniciales - dejar que los hooks hagan la conversión UTC→local
  const initialData: Partial<ShiftFormData> = shift ? {
    company_employee_id: shift.company_employee_id,
    shift_date: normalizeDateForForm(shift.shift_date),
    start_time: typeof shift.start_time === 'string' ? shift.start_time : shift.start_time.toString(),
    end_time: typeof shift.end_time === 'string' ? shift.end_time : shift.end_time.toString(),
    notes: shift.notes || '',
  } : employee && selectedDate ? {
    company_employee_id: employee.id,
    shift_date: normalizeDateForForm(selectedDate),
    start_time: '',
    end_time: '',
    notes: '',
  } : {};

  // Enhanced keyboard shortcuts handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen || !enableShortcuts || !shortcutsEnabled) return;

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        onCancel();
        break;
      case 'Enter':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          // The form will handle submission
        }
        break;
      default:
        break;
    }
  }, [isOpen, enableShortcuts, shortcutsEnabled, onCancel]);

  useEffect(() => {
    if (isOpen && enableShortcuts && shortcutsEnabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, enableShortcuts, shortcutsEnabled, handleKeyDown]);

  // Determine which form to use
  const useEnhancedForm = enableTemplates || enableSuggestions || bulkMode;

  // Enhanced modal title
  const getModalTitle = () => {
    if (bulkMode || storeBulkMode) {
      return 'Creación Masiva de Turnos';
    }
    return shift ? 'Editar Turno' : 'Nuevo Turno';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className={`${useEnhancedForm ? 'max-w-2xl' : 'max-w-md sm:max-w-lg'} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getModalTitle()}
            {enableShortcuts && shortcutsEnabled && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                ESC para cerrar
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        
        {useEnhancedForm ? (
          <EnhancedShiftForm
            initialData={initialData}
            employees={employees}
            onSubmit={onSubmit}
            onCancel={onCancel}
            isLoading={isLoading}
            enableTemplates={enableTemplates}
            enableSuggestions={enableSuggestions}
            enableShortcuts={enableShortcuts && shortcutsEnabled}
            enableBulkMode={bulkMode || storeBulkMode}
            shiftId={shift?.id} // Pasar shiftId para detectar edición
          />
        ) : (
          <ShiftForm
            initialData={initialData}
            employees={employees}
            onSubmit={onSubmit}
            onCancel={onCancel}
            isLoading={isLoading}
            shiftId={shift?.id} // Pasar shiftId para detectar edición
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
