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

// Request options interface
export interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined>;
  retries?: number;
  retryDelay?: number;
  timeout?: number;
  signal?: AbortSignal;
}

// Batch request interface
export interface BatchRequest {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: unknown;
  options?: RequestOptions;
}

// Batch response interface
export interface BatchResponse<T> {
  results: Array<{
    success: boolean;
    data?: T;
    error?: Error;
  }>;
  successCount: number;
  failureCount: number;
}

// Upload result interface
export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export class ApiClient {
  private baseURL: string;
  private token: string | null = null;
  private requestLog: boolean = process.env.NODE_ENV === 'development';

  constructor() {
    this.baseURL = API_BASE_URL;
    this.loadTokenFromStorage();
  }

  // Token management methods
  setToken(token: string): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  clearToken(): void {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return this.token !== null;
  }

  private loadTokenFromStorage(): void {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        this.token = storedToken;
      }
    }
  }

  // Logging helpers
  private log(method: string, endpoint: string, data?: unknown): void {
    if (this.requestLog) {
      console.log(`[API] ${method} ${endpoint}`, data ? { data } : '');
    }
  }

  private logResponse(method: string, endpoint: string, response: unknown): void {
    if (this.requestLog) {
      console.log(`[API] ${method} ${endpoint} ✅`, response);
    }
  }

  private logError(method: string, endpoint: string, error: unknown): void {
    if (error instanceof Error && !error.message.includes('404')) {
      console.error(`[API] ${method} ${endpoint} ❌`, error);
    }
  }

  // Core HTTP method with retry logic
  private async requestWithRetry<T>(
    endpoint: string,
    options: RequestOptions = {},
    retryCount = 0
  ): Promise<ApiResponse<T>> {
    const {
      params,
      retries = 2,
      retryDelay = 1000,
      timeout = 30000,
      signal,
      ...fetchOptions
    } = options;

    // Build URL with query params
    let url = `${this.baseURL}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    // Setup headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: signal || controller.signal,
      });

      clearTimeout(timeoutId);

      // Check content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return { success: true } as ApiResponse<T>;
      }

      const data = await response.json();

      if (!response.ok) {
        // Retry on server errors (5xx) and specific client errors
        const shouldRetry =
          (response.status >= 500 || response.status === 429) &&
          retryCount < retries;

        if (shouldRetry) {
          const delay = retryDelay * Math.pow(2, retryCount); // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.requestWithRetry<T>(endpoint, options, retryCount + 1);
        }

        throw new Error(data.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      // Retry on network errors
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }

      if (retryCount < retries && !(error instanceof Error && error.message.includes('HTTP'))) {
        const delay = retryDelay * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.requestWithRetry<T>(endpoint, options, retryCount + 1);
      }

      throw error;
    }
  }

  // Core HTTP methods with generics
  async get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    this.log('GET', endpoint);
    try {
      const response = await this.requestWithRetry<T>(endpoint, {
        ...options,
        method: 'GET',
      });
      this.logResponse('GET', endpoint, response);
      return response;
    } catch (error) {
      this.logError('GET', endpoint, error);
      throw error;
    }
  }

  async post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    this.log('POST', endpoint, data);
    try {
      const response = await this.requestWithRetry<T>(endpoint, {
        ...options,
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      });
      this.logResponse('POST', endpoint, response);
      return response;
    } catch (error) {
      this.logError('POST', endpoint, error);
      throw error;
    }
  }

  async put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    this.log('PUT', endpoint, data);
    try {
      const response = await this.requestWithRetry<T>(endpoint, {
        ...options,
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      });
      this.logResponse('PUT', endpoint, response);
      return response;
    } catch (error) {
      this.logError('PUT', endpoint, error);
      throw error;
    }
  }

  async patch<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    this.log('PATCH', endpoint, data);
    try {
      const response = await this.requestWithRetry<T>(endpoint, {
        ...options,
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined,
      });
      this.logResponse('PATCH', endpoint, response);
      return response;
    } catch (error) {
      this.logError('PATCH', endpoint, error);
      throw error;
    }
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    this.log('DELETE', endpoint);
    try {
      const response = await this.requestWithRetry<T>(endpoint, {
        ...options,
        method: 'DELETE',
      });
      this.logResponse('DELETE', endpoint, response);
      return response;
    } catch (error) {
      this.logError('DELETE', endpoint, error);
      throw error;
    }
  }

  // Batch operations support
  async batch<T>(requests: BatchRequest[]): Promise<BatchResponse<T>> {
    const results = await Promise.allSettled(
      requests.map(({ endpoint, method = 'GET', data, options }) => {
        switch (method) {
          case 'GET':
            return this.get<T>(endpoint, options);
          case 'POST':
            return this.post<T>(endpoint, data, options);
          case 'PUT':
            return this.put<T>(endpoint, data, options);
          case 'PATCH':
            return this.patch<T>(endpoint, data, options);
          case 'DELETE':
            return this.delete<T>(endpoint, options);
          default:
            throw new Error(`Unsupported method: ${method}`);
        }
      })
    );

    let successCount = 0;
    let failureCount = 0;

    const processedResults = results.map(result => {
      if (result.status === 'fulfilled') {
        successCount++;
        return {
          success: true,
          data: result.value.data as T,
        };
      } else {
        failureCount++;
        return {
          success: false,
          error: result.reason as Error,
        };
      }
    });

    return {
      results: processedResults,
      successCount,
      failureCount,
    };
  }

  // File upload support
  async uploadFile(
    endpoint: string,
    file: File,
    metadata?: Record<string, unknown>
  ): Promise<ApiResponse<UploadResult>> {
    this.log('UPLOAD', endpoint, { filename: file.name, size: file.size });

    const formData = new FormData();
    formData.append('file', file);

    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    const headers: Record<string, string> = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return { success: true } as ApiResponse<UploadResult>;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `Upload failed: ${response.status}`);
      }

      this.logResponse('UPLOAD', endpoint, data);
      return data;
    } catch (error) {
      this.logError('UPLOAD', endpoint, error);
      throw error;
    }
  }

  // Legacy request method for backward compatibility
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

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return { success: true } as ApiResponse<T>;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
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
