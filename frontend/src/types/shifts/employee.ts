import { Shift } from './shift';

export interface EmployeeWithShifts {
  id: number;
  company_id: number;
  user_id: number;
  role_id: number;
  position: string;               // Posición del empleado
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
  };
  role: {
    id: number;
    company_id: number;
    name: string;                 // Rol de negocio: "Admin", "Vendedor", etc.
    description?: string;
    color: string;
    created_at: string;
    updated_at: string;
  };
  shifts: ShiftByDay[];
  // weekShifts mantiene compatibilidad pero es deprecated
  weekShifts?: ShiftByDay[];
}

export interface ShiftByDay {
  date: string; // YYYY-MM-DD
  shifts: Shift[];
}

export interface EmployeeShiftSummary {
  employee: EmployeeWithShifts;
  shifts: ShiftByDay[];
  // weekShifts mantiene compatibilidad pero es deprecated
  weekShifts?: ShiftByDay[];
}

export interface ShiftsResponseMeta {
  start_date: string | null;
  end_date: string | null;
  total_employees: number;
  employees_with_shifts: number;
  total_shifts: number;
}

export interface EmployeesWithShiftsResponse {
  success: boolean;
  data: EmployeeWithShifts[];
  meta: ShiftsResponseMeta;
}
