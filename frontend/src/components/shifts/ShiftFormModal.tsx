'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ShiftForm } from './ShiftForm';
import { Shift, EmployeeWithShifts } from '@/types/shifts/shift';
import { ShiftFormData } from '@/types/shifts/forms';
import { formatTimeSafe } from '@/lib/timezone-client';

interface ShiftFormModalProps {
  isOpen: boolean;
  shift?: Shift;
  employee?: EmployeeWithShifts;
  selectedDate?: string;
  employees: EmployeeWithShifts[];
  onSubmit: (data: ShiftFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ShiftFormModal({ 
  isOpen, 
  shift, 
  employee,
  selectedDate,
  employees,
  onSubmit, 
  onCancel, 
  isLoading 
}: ShiftFormModalProps) {
  // Preparar datos iniciales
  const initialData: Partial<ShiftFormData> = shift ? {
    company_employee_id: shift.company_employee_id,
    shift_date: shift.shift_date,
    start_time: formatTimeSafe(shift.start_time),
    end_time: formatTimeSafe(shift.end_time),
    notes: shift.notes || '',
  } : employee && selectedDate ? {
    company_employee_id: employee.id,
    shift_date: selectedDate,
    start_time: '',
    end_time: '',
    notes: '',
  } : {};

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {shift ? 'Editar Turno' : 'Nuevo Turno'}
          </DialogTitle>
        </DialogHeader>
        <ShiftForm
          initialData={initialData}
          employees={employees}
          onSubmit={onSubmit}
          onCancel={onCancel}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}
