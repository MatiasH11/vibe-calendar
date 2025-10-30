import { LoginRequest, RegisterRequest } from '@/types/auth';
import { ApiResponse, Role } from '@/types/api';
import { 
  Employee, 
  CreateEmployeeRequest, 
  UpdateEmployeeRequest, 
  EmployeeFilters, 
  EmployeeListResponse,
  Cargo, 
  CreateCargoRequest, 
  UpdateCargoRequest, 
  CargoWithEmployees 
} from '@/types/employee';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }


    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
      });

      // Verificar si la respuesta es JSON antes de intentar parsearla
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        // Si no es JSON pero está OK, devolver respuesta por defecto
        return { success: true } as ApiResponse<T>;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      // Solo loggear errores que no sean 404 (para evitar spam en consola)
      if (error instanceof Error && !error.message.includes('404')) {
        console.error('❌ API Request failed:', error);
      }
      throw error;
    }
  }

  // Métodos básicos - implementación específica se hará después
  async login(data: LoginRequest) {
    return this.request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async register(data: RegisterRequest) {
    return this.request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Métodos de empleados
  async getEmployees(filters?: EmployeeFilters): Promise<ApiResponse<EmployeeListResponse>> {
    const params = new URLSearchParams();

    // Add all supported filters
    if (filters?.page) params.append('page', filters.page);
    if (filters?.limit) params.append('limit', filters.limit);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.is_active !== undefined) params.append('is_active', filters.is_active);
    if (filters?.sort_by) params.append('sort_by', filters.sort_by);
    if (filters?.sort_order) params.append('sort_order', filters.sort_order);
    if (filters?.include) params.append('include', filters.include);
    if (filters?.shift_start_date) params.append('shift_start_date', filters.shift_start_date);
    if (filters?.shift_end_date) params.append('shift_end_date', filters.shift_end_date);
    if (filters?.created_after) params.append('created_after', filters.created_after);
    if (filters?.created_before) params.append('created_before', filters.created_before);
    if (filters?.updated_after) params.append('updated_after', filters.updated_after);
    if (filters?.updated_before) params.append('updated_before', filters.updated_before);

    const queryString = params.toString();
    const endpoint = `/api/v1/employee${queryString ? `?${queryString}` : ''}`;

    return this.request<EmployeeListResponse>(endpoint);
  }

  async getEmployee(id: number): Promise<ApiResponse<Employee>> {
    return this.request(`/api/v1/employee/${id}`);
  }

  async createEmployee(data: CreateEmployeeRequest): Promise<ApiResponse<Employee>> {
    return this.request('/api/v1/employee', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEmployee(id: number, data: UpdateEmployeeRequest): Promise<ApiResponse<Employee>> {
    return this.request(`/api/v1/employee/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEmployee(id: number): Promise<ApiResponse<void>> {
    return this.request(`/api/v1/employee/${id}`, {
      method: 'DELETE',
    });
  }

  // User methods (for creating users before linking them as employees)
  async createUser(data: {
    email: string;
    first_name: string;
    last_name: string;
    password: string;
    user_type?: 'SUPER_ADMIN' | 'USER';
  }): Promise<ApiResponse<{ id: number; email: string; first_name: string; last_name: string }>> {
    return this.request('/api/v1/user', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Combined method to create user and employee in one operation
   * This handles the two-step process: create user, then create employee
   */
  async createUserAndEmployee(data: {
    email: string;
    first_name: string;
    last_name: string;
    password: string;
    department_id: number;
    company_role?: 'OWNER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
    position?: string;
    is_active?: boolean;
  }): Promise<ApiResponse<Employee>> {
    // Step 1: Create user
    const userResponse = await this.createUser({
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      password: data.password,
      user_type: 'USER',
    });

    if (!userResponse.success || !userResponse.data) {
      return {
        success: false,
        error: userResponse.error || { message: 'Failed to create user' },
      };
    }

    // Step 2: Create employee with the new user_id
    const employeeResponse = await this.createEmployee({
      user_id: userResponse.data.id,
      department_id: data.department_id,
      company_role: data.company_role,
      position: data.position,
      is_active: data.is_active,
    });

    return employeeResponse;
  }

  async getRoles(): Promise<ApiResponse<Role[]>> {
    return this.request('/api/v1/roles');
  }

  // Métodos para departamentos
  async getDepartments(): Promise<ApiResponse<Cargo[]>> {
    return this.request<Cargo[]>('/api/v1/department');
  }

  async getDepartmentsWithStats(): Promise<ApiResponse<Cargo[]>> {
    return this.request<Cargo[]>('/api/v1/department');
  }

  async getDepartment(id: number): Promise<ApiResponse<Cargo>> {
    return this.request(`/api/v1/department/${id}`);
  }

  // Métodos CRUD para departamentos
  async createDepartment(data: CreateCargoRequest): Promise<ApiResponse<Cargo>> {
    return this.request('/api/v1/department', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDepartment(id: number, data: UpdateCargoRequest): Promise<ApiResponse<Cargo>> {
    return this.request(`/api/v1/department/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDepartment(id: number): Promise<ApiResponse<void>> {
    return this.request(`/api/v1/department/${id}`, {
      method: 'DELETE',
    });
  }

  async searchDepartments(term: string): Promise<ApiResponse<Cargo[]>> {
    const params = new URLSearchParams({ search: term });
    return this.request<Cargo[]>(`/api/v1/department?${params}`);
  }

  // Método genérico para requests (usado por servicios específicos)
  async requestGeneric<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await this.request<{ success: boolean; data: T }>(endpoint, options);
      return (response as any).data!;
    } catch (error) {
      console.error('❌ ApiClient.requestGeneric error:', error);
      throw error;
    }
  }
}

export const apiClient = new ApiClient();
