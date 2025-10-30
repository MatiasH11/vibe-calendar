export interface Employee {
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
  // Deprecated fields for backward compatibility
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

export interface CreateEmployeeRequest {
  user_id: number;
  department_id: number;
  company_role?: 'OWNER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  position?: string;
  is_active?: boolean;
}

export interface UpdateEmployeeRequest {
  department_id?: number;
  company_role?: 'OWNER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  position?: string;
  is_active?: boolean;
}

export interface EmployeeFilters {
  page?: string;
  limit?: string;
  search?: string;
  is_active?: 'true' | 'false';
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  include?: 'shifts';
  shift_start_date?: string; // ISO format YYYY-MM-DD
  shift_end_date?: string;   // ISO format YYYY-MM-DD
  created_after?: string;    // ISO format YYYY-MM-DD
  created_before?: string;   // ISO format YYYY-MM-DD
  updated_after?: string;    // ISO format YYYY-MM-DD
  updated_before?: string;   // ISO format YYYY-MM-DD
}

export interface EmployeeListResponse {
  items: Employee[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// Tipos específicos para el sidebar contextual de cargos
export interface Cargo {
  id: number;
  name: string;
  description?: string;
  color: string;
  company_id: number;
  created_at: string;
  updated_at: string;
  _count?: {
    employees: number;
  };
}

export interface CreateCargoRequest {
  name: string;
  description?: string;
  color: string;
}

export interface UpdateCargoRequest {
  name?: string;
  description?: string;
  color?: string;
}

export interface CargoWithEmployees extends Cargo {
  employees: Employee[];
  isActive: boolean; // Si tiene empleados activos
}

// Estados del sidebar
export interface SidebarState {
  isCollapsed: boolean;
  selectedCargoId: number | null;
  searchTerm: string;
  isCreating: boolean;
  isEditing: boolean;
}