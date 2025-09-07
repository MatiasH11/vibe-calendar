import { WeekViewData, EmployeeWithShifts, Shift } from './shift';
import { ShiftFormData, ShiftFormErrors } from './forms';

export interface UseShiftsReturn {
  // Datos
  weekData: WeekViewData | null;
  employees: EmployeeWithShifts[];
  currentWeek: string;
  
  // Estados
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  refreshData: () => Promise<void>;
  navigateWeek: (direction: 'prev' | 'next') => void;
  goToToday: () => void;
  goToWeek: (date: string) => void;
}

export interface UseShiftFormReturn {
  formData: ShiftFormData;
  errors: ShiftFormErrors;
  isLoading: boolean;
  
  setFormData: (data: Partial<ShiftFormData>) => void;
  setError: (field: keyof ShiftFormErrors, error: string) => void;
  clearErrors: () => void;
  validate: () => boolean;
  submit: () => Promise<void>;
  reset: () => void;
}

export interface UseShiftGridReturn {
  weekData: WeekViewData | null;
  isLoading: boolean;
  error: string | null;
  
  onShiftClick: (shift: Shift) => void;
  onShiftCreate: (employeeId: number, date: string) => void;
  onShiftUpdate: (shift: Shift) => void;
  onShiftDelete: (shiftId: number) => void;
  onEmployeeFilter: (employeeId: number | null) => void;
  onDateFilter: (date: string | null) => void;
}
