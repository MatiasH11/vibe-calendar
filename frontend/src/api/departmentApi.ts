/**
 * Department API Module
 * Handles department operations (CRUD, bulk operations)
 */

import { apiClient } from '@/lib/api';
import { createApiError } from '@/lib/errors';

// Department type based on Prisma schema
export interface Department {
  id: number;
  location_id: number;
  company_id: number;
  name: string;
  description: string | null;
  color: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  // Relations (when included)
  location?: {
    id: number;
    name: string;
  };
  employees?: Array<{
    id: number;
    user_id: number;
    position: string | null;
    is_active: boolean;
    user?: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
    };
  }>;
  job_positions?: Array<{
    id: number;
    name: string;
    description: string | null;
  }>;
}

// Input types based on backend validation schemas
export interface CreateDepartmentInput {
  location_id: number;
  name: string;
  description?: string;
  color?: string;
  is_active?: boolean;
}

export interface UpdateDepartmentInput {
  name?: string;
  description?: string;
  color?: string;
  is_active?: boolean;
}

export interface DepartmentFilters {
  page?: string;
  limit?: string;
  search?: string;
  is_active?: 'true' | 'false';
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface BulkCreateDepartmentInput {
  items: CreateDepartmentInput[];
}

// Response types
interface GetAllResponse {
  items: Department[];
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
const BASE_PATH = '/api/v1/department';

/**
 * Department API
 */
export const departmentApi = {
  /**
   * Get all departments with optional filters
   */
  async getAll(filters?: DepartmentFilters): Promise<GetAllResponse> {
    try {
      const params: Record<string, string> = {};

      if (filters) {
        if (filters.page) params.page = filters.page;
        if (filters.limit) params.limit = filters.limit;
        if (filters.search) params.search = filters.search;
        if (filters.is_active) params.is_active = filters.is_active;
        if (filters.sort_by) params.sort_by = filters.sort_by;
        if (filters.sort_order) params.sort_order = filters.sort_order;
      }

      const response = await apiClient.get<{ data: GetAllResponse }>(BASE_PATH, { params });

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch departments');
      }

      return response.data.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Get department by ID
   */
  async getById(id: number): Promise<Department> {
    try {
      const response = await apiClient.get<Department>(`${BASE_PATH}/${id}`);

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch department');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Create new department
   */
  async create(data: CreateDepartmentInput): Promise<Department> {
    try {
      const response = await apiClient.post<Department>(BASE_PATH, data);

      if (!response.success || !response.data) {
        throw new Error('Failed to create department');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Update department
   */
  async update(id: number, data: UpdateDepartmentInput): Promise<Department> {
    try {
      const response = await apiClient.put<Department>(`${BASE_PATH}/${id}`, data);

      if (!response.success || !response.data) {
        throw new Error('Failed to update department');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Delete department (soft delete)
   */
  async delete(id: number): Promise<void> {
    try {
      const response = await apiClient.delete<void>(`${BASE_PATH}/${id}`);

      if (!response.success) {
        throw new Error('Failed to delete department');
      }
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Bulk create departments
   */
  async bulkCreate(data: BulkCreateDepartmentInput): Promise<BulkOperationResult<Department>> {
    try {
      const response = await apiClient.post<BulkOperationResult<Department>>(
        `${BASE_PATH}/bulk/create`,
        data
      );

      if (!response.success || !response.data) {
        throw new Error('Failed to bulk create departments');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Bulk update departments
   */
  async bulkUpdate(
    ids: number[],
    data: UpdateDepartmentInput
  ): Promise<BulkOperationResult<Department>> {
    try {
      const response = await apiClient.put<BulkOperationResult<Department>>(
        `${BASE_PATH}/bulk/update`,
        { ids, data }
      );

      if (!response.success || !response.data) {
        throw new Error('Failed to bulk update departments');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Bulk delete departments
   */
  async bulkDelete(ids: number[]): Promise<BulkOperationResult<void>> {
    try {
      const response = await apiClient.delete<BulkOperationResult<void>>(
        `${BASE_PATH}/bulk/delete`,
        {
          body: JSON.stringify({ ids }),
        }
      );

      if (!response.success || !response.data) {
        throw new Error('Failed to bulk delete departments');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Get department with employees
   * Note: This assumes the backend supports include=employees query parameter
   * If not implemented yet, this would need backend support
   */
  async getWithEmployees(id: number): Promise<Department> {
    try {
      // For now, just get the department by ID
      // In the future, this could be enhanced with include=employees parameter
      const department = await this.getById(id);
      return department;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Get active departments only
   */
  async getActive(filters?: Omit<DepartmentFilters, 'is_active'>): Promise<Department[]> {
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

  /**
   * Search departments by name
   */
  async search(query: string, filters?: Omit<DepartmentFilters, 'search'>): Promise<Department[]> {
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
   * Get departments by location
   */
  async getByLocation(locationId: number, filters?: DepartmentFilters): Promise<Department[]> {
    try {
      // Get all departments and filter client-side by location_id
      // In the future, this could be a backend filter
      const response = await this.getAll(filters);
      return response.items.filter((dept) => dept.location_id === locationId);
    } catch (error) {
      throw createApiError(error);
    }
  },
};
