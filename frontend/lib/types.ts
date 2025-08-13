export type Role = {
  id: number;
  company_id: number;
  name: string;
  description?: string | null;
  color?: string | null;
};

export type UserPublic = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
};

export type Employee = {
  id: number;
  company_id: number;
  user_id: number;
  role_id: number;
  position?: string | null;
  is_active: boolean;
  user: UserPublic;
  role: Role;
};

export type Shift = {
  id: number;
  company_employee_id: number;
  shift_date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string;   // HH:mm
  notes?: string | null;
  status?: 'draft' | 'confirmed' | 'cancelled';
};

export type StandardResponse<T> = {
  success: boolean;
  data?: T;
  error?: { error_code: string; message: string; details?: unknown };
  meta?: unknown;
};


