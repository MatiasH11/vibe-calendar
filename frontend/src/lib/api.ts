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
        // Si no es JSON pero está OK, devolver un objeto vacío
        return {};
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
  async getEmployees(filters?: EmployeeFilters): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.role_id) params.append('role_id', filters.role_id.toString());
    if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const queryString = params.toString();
    const endpoint = `/api/v1/employees${queryString ? `?${queryString}` : ''}`;
    
    return this.request<any>(endpoint);
  }

  async getEmployee(id: number): Promise<ApiResponse<Employee>> {
    return this.request(`/api/v1/employees/${id}`);
  }

  async createEmployee(data: CreateEmployeeRequest): Promise<ApiResponse<Employee>> {
    return this.request('/api/v1/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEmployee(id: number, data: UpdateEmployeeRequest): Promise<ApiResponse<Employee>> {
    return this.request(`/api/v1/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEmployee(id: number): Promise<ApiResponse<void>> {
    return this.request(`/api/v1/employees/${id}`, {
      method: 'DELETE',
    });
  }

  async getRoles(): Promise<ApiResponse<Role[]>> {
    return this.request('/api/v1/roles');
  }

  // Métodos específicos para sidebar contextual de cargos
  async getCargosWithStats(): Promise<ApiResponse<Cargo[]>> {
    return this.request<Cargo[]>('/api/v1/roles/advanced?include=stats');
  }

  async getCargo(id: number): Promise<ApiResponse<Cargo>> {
    return this.request(`/api/v1/roles/${id}`);
  }

  async getCargoWithEmployees(id: number): Promise<ApiResponse<CargoWithEmployees>> {
    return this.request(`/api/v1/roles/${id}?include=employees`);
  }

  async createCargo(data: CreateCargoRequest): Promise<ApiResponse<Cargo>> {
    return this.request('/api/v1/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCargo(id: number, data: UpdateCargoRequest): Promise<ApiResponse<Cargo>> {
    return this.request(`/api/v1/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCargo(id: number): Promise<ApiResponse<void>> {
    return this.request(`/api/v1/roles/${id}`, {
      method: 'DELETE',
    });
  }

  // Método para buscar cargos
  async searchCargos(term: string): Promise<ApiResponse<Cargo[]>> {
    const params = new URLSearchParams({ search: term });
    return this.request<Cargo[]>(`/api/v1/roles/advanced?${params}`);
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
