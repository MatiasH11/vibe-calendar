import { Shift } from './shift';

export interface EmployeeWithShifts {
  id: number;
  company_id: number;
  user_id: number;
  department_id: number;
  company_role?: 'OWNER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  position: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  department: {
    id: number;
    name: string;
    description?: string;
    color: string;
  };
  shifts: ShiftByDay[];
  // Deprecated fields for backward compatibility
  weekShifts?: ShiftByDay[];
  role_id?: number;      // @deprecated Use department_id instead
  role?: {               // @deprecated Use department instead
    id: number;
    company_id?: number;
    name: string;
    description?: string;
    color: string;
    created_at?: string;
    updated_at?: string;
  };
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
