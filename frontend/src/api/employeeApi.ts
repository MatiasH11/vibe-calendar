/**
 * Employee API Module
 * Handles employee operations (CRUD, bulk operations, search)
 */

import { apiClient } from '@/lib/api';
import { createApiError } from '@/lib/errors';

// Employee type based on Prisma schema
export interface Employee {
  id: number;
  company_id: number;
  location_id: number;
  user_id: number;
  department_id: number;
  job_position_id: number | null;
  company_role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  position: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  // Relations (when included)
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  location?: {
    id: number;
    name: string;
  };
  department?: {
    id: number;
    name: string;
  };
  job_position?: {
    id: number;
    name: string;
  };
  shifts?: any[]; // Shifts when include=shifts
}

// Input types based on backend validation schemas
export interface CreateEmployeeInput {
  user_id: number;
  location_id: number;
  department_id: number;
  job_position_id?: number;
  company_role?: 'OWNER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  position?: string;
  is_active?: boolean;
}

export interface UpdateEmployeeInput {
  department_id?: number;
  job_position_id?: number;
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
  location_id?: string;
  include?: 'shifts';
  shift_start_date?: string;
  shift_end_date?: string;
  created_after?: string;
  created_before?: string;
  updated_after?: string;
  updated_before?: string;
}

export interface BulkCreateEmployeeInput {
  items: CreateEmployeeInput[];
}

// Response types
interface GetAllResponse {
  items: Employee[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

interface BulkOperationResult<T = unknown> {
  succeeded: T[];
  failed: Array<{
    index: number;
    item: unknown;
    error: string;
  }>;
  successCount: number;
  failureCount: number;
}

// API endpoint base
const BASE_PATH = '/api/v1/employee';

/**
 * Employee API
 */
export const employeeApi = {
  /**
   * Get all employees with optional filters
   */
  async getAll(filters?: EmployeeFilters): Promise<GetAllResponse> {
    try {
      const params: Record<string, string> = {};

      if (filters) {
        if (filters.page) params.page = filters.page;
        if (filters.limit) params.limit = filters.limit;
        if (filters.search) params.search = filters.search;
        if (filters.is_active) params.is_active = filters.is_active;
        if (filters.sort_by) params.sort_by = filters.sort_by;
        if (filters.sort_order) params.sort_order = filters.sort_order;
        if (filters.location_id) params.location_id = filters.location_id;
        if (filters.include) params.include = filters.include;
        if (filters.shift_start_date) params.shift_start_date = filters.shift_start_date;
        if (filters.shift_end_date) params.shift_end_date = filters.shift_end_date;
        if (filters.created_after) params.created_after = filters.created_after;
        if (filters.created_before) params.created_before = filters.created_before;
        if (filters.updated_after) params.updated_after = filters.updated_after;
        if (filters.updated_before) params.updated_before = filters.updated_before;
      }

      const response = await apiClient.get<GetAllResponse>(BASE_PATH, { params });

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch employees');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Get employee by ID
   */
  async getById(id: number): Promise<Employee> {
    try {
      const response = await apiClient.get<Employee>(`${BASE_PATH}/${id}`);

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch employee');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Search employees by name or position
   */
  async search(query: string, filters?: Omit<EmployeeFilters, 'search'>): Promise<Employee[]> {
    try {
      const response = await this.getAll({
        ...filters,
        search: query,
      });

      return response.items;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Create new employee
   */
  async create(data: CreateEmployeeInput): Promise<Employee> {
    try {
      const response = await apiClient.post<Employee>(BASE_PATH, data);

      if (!response.success || !response.data) {
        throw new Error('Failed to create employee');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Update employee
   */
  async update(id: number, data: UpdateEmployeeInput): Promise<Employee> {
    try {
      const response = await apiClient.put<Employee>(`${BASE_PATH}/${id}`, data);

      if (!response.success || !response.data) {
        throw new Error('Failed to update employee');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Delete employee (soft delete)
   */
  async delete(id: number): Promise<void> {
    try {
      const response = await apiClient.delete<void>(`${BASE_PATH}/${id}`);

      if (!response.success) {
        throw new Error('Failed to delete employee');
      }
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Bulk create employees
   */
  async bulkCreate(data: BulkCreateEmployeeInput): Promise<BulkOperationResult<Employee>> {
    try {
      const response = await apiClient.post<BulkOperationResult<Employee>>(
        `${BASE_PATH}/bulk/create`,
        data
      );

      if (!response.success || !response.data) {
        throw new Error('Failed to bulk create employees');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Bulk update employees
   */
  async bulkUpdate(
    ids: number[],
    data: UpdateEmployeeInput
  ): Promise<BulkOperationResult<Employee>> {
    try {
      const response = await apiClient.put<BulkOperationResult<Employee>>(
        `${BASE_PATH}/bulk/update`,
        { ids, data }
      );

      if (!response.success || !response.data) {
        throw new Error('Failed to bulk update employees');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Bulk delete employees
   */
  async bulkDelete(ids: number[]): Promise<BulkOperationResult<void>> {
    try {
      const response = await apiClient.delete<BulkOperationResult<void>>(
        `${BASE_PATH}/bulk/delete`,
        {
          body: JSON.stringify({ ids }),
        } as any
      );

      if (!response.success || !response.data) {
        throw new Error('Failed to bulk delete employees');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Assign employee to department
   * Convenience method for updating department_id
   */
  async assignDepartment(employeeId: number, departmentId: number): Promise<Employee> {
    try {
      return await this.update(employeeId, { department_id: departmentId });
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Remove employee from department
   * Note: Backend requires department_id, so this is a no-op placeholder
   * In practice, you would assign to a default/null department
   */
  async removeDepartment(employeeId: number): Promise<Employee> {
    try {
      // Note: Backend schema requires department_id, so this might need
      // to assign to a default department instead of removing
      throw new Error('Cannot remove department - department_id is required by backend schema');
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Get employees by location
   */
  async getByLocation(locationId: number, filters?: Omit<EmployeeFilters, 'location_id'>): Promise<Employee[]> {
    try {
      const response = await this.getAll({
        ...filters,
        location_id: String(locationId),
      });

      return response.items;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Get employees with their shifts for a date range
   */
  async getWithShifts(
    startDate: string,
    endDate: string,
    filters?: Omit<EmployeeFilters, 'include' | 'shift_start_date' | 'shift_end_date'>
  ): Promise<Employee[]> {
    try {
      const response = await this.getAll({
        ...filters,
        include: 'shifts',
        shift_start_date: startDate,
        shift_end_date: endDate,
      });

      return response.items;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Get active employees only
   */
  async getActive(filters?: Omit<EmployeeFilters, 'is_active'>): Promise<Employee[]> {
    try {
      const response = await this.getAll({
        ...filters,
        is_active: 'true',
      });

      return response.items;
    } catch (error) {
      throw createApiError(error);
    }
  },
};
