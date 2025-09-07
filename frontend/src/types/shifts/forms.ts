export interface ShiftFormData {
  company_employee_id: number;
  shift_date: string;
  start_time: string;
  end_time: string;
  notes?: string;
}

export interface ShiftFormErrors {
  company_employee_id?: string;
  shift_date?: string;
  start_time?: string;
  end_time?: string;
  notes?: string;
  general?: string;
}

import { EmployeeWithShifts } from './employee';

export interface ShiftFormProps {
  initialData?: Partial<ShiftFormData>;
  onSubmit: (data: ShiftFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  employees: EmployeeWithShifts[];
  selectedDate?: string;
  selectedEmployee?: number;
}

// Re-export types from shift.ts
export type { CreateShiftRequest, UpdateShiftRequest } from './shift';