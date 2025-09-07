export interface Employee {
  id: number;
  company_id: number;
  user_id: number;
  role_id: number;
  position: string;               // Posición/cargo del empleado
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
    name: string;                 // Nombre del rol de negocio: "Admin", "Vendedor", etc.
    description?: string;
    color: string;
    created_at: string;
    updated_at: string;
  };
}

export interface CreateEmployeeRequest {
  email: string;
  first_name: string;
  last_name: string;
  role_id: number;
}

export interface UpdateEmployeeRequest {
  role_id?: number;
  is_active?: boolean;
}

export interface EmployeeFilters {
  search?: string;
  role_id?: number;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

export interface EmployeeListResponse {
  employees: Employee[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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