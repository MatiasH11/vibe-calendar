/**
 * Job Position API Module
 * Handles job position operations (CRUD, bulk operations)
 */

import { apiClient } from '@/lib/api';
import { createApiError } from '@/lib/errors';

// Job Position type based on Prisma schema
export interface JobPosition {
  id: number;
  company_id: number;
  department_id: number;
  name: string;
  description: string | null;
  color: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  // Relations (when included)
  department?: {
    id: number;
    name: string;
    color: string;
    location_id: number;
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
}

// Input types based on backend validation schemas
export interface CreateJobPositionInput {
  name: string;
  department_id: number;
  description?: string;
  color?: string;
  is_active?: boolean;
}

export interface UpdateJobPositionInput {
  name?: string;
  description?: string;
  color?: string;
  is_active?: boolean;
}

export interface JobPositionFilters {
  page?: string;
  limit?: string;
  search?: string;
  is_active?: 'true' | 'false';
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface BulkCreateJobPositionInput {
  items: CreateJobPositionInput[];
}

// Response types
interface GetAllResponse {
  items: JobPosition[];
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
const BASE_PATH = '/api/v1/job_position';

/**
 * Job Position API
 */
export const jobPositionApi = {
  /**
   * Get all job positions with optional filters
   */
  async getAll(filters?: JobPositionFilters): Promise<GetAllResponse> {
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

      const response = await apiClient.get<GetAllResponse>(BASE_PATH, { params });

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch job positions');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Get job position by ID
   */
  async getById(id: number): Promise<JobPosition> {
    try {
      const response = await apiClient.get<JobPosition>(`${BASE_PATH}/${id}`);

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch job position');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Create new job position
   */
  async create(data: CreateJobPositionInput): Promise<JobPosition> {
    try {
      const response = await apiClient.post<JobPosition>(BASE_PATH, data);

      if (!response.success || !response.data) {
        throw new Error('Failed to create job position');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Update job position
   */
  async update(id: number, data: UpdateJobPositionInput): Promise<JobPosition> {
    try {
      const response = await apiClient.put<JobPosition>(`${BASE_PATH}/${id}`, data);

      if (!response.success || !response.data) {
        throw new Error('Failed to update job position');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Delete job position (soft delete)
   */
  async delete(id: number): Promise<void> {
    try {
      const response = await apiClient.delete<void>(`${BASE_PATH}/${id}`);

      if (!response.success) {
        throw new Error('Failed to delete job position');
      }
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Bulk create job positions
   */
  async bulkCreate(data: BulkCreateJobPositionInput): Promise<BulkOperationResult<JobPosition>> {
    try {
      const response = await apiClient.post<BulkOperationResult<JobPosition>>(
        `${BASE_PATH}/bulk/create`,
        data
      );

      if (!response.success || !response.data) {
        throw new Error('Failed to bulk create job positions');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Bulk update job positions
   */
  async bulkUpdate(
    ids: number[],
    data: UpdateJobPositionInput
  ): Promise<BulkOperationResult<JobPosition>> {
    try {
      const response = await apiClient.put<BulkOperationResult<JobPosition>>(
        `${BASE_PATH}/bulk/update`,
        { ids, data }
      );

      if (!response.success || !response.data) {
        throw new Error('Failed to bulk update job positions');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Bulk delete job positions
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
        throw new Error('Failed to bulk delete job positions');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Get job position with employees
   * Note: This assumes the backend supports include=employees query parameter
   * If not implemented yet, this would need backend support
   */
  async getWithEmployees(id: number): Promise<JobPosition> {
    try {
      // For now, just get the job position by ID
      // In the future, this could be enhanced with include=employees parameter
      const jobPosition = await this.getById(id);
      return jobPosition;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Get active job positions only
   */
  async getActive(filters?: Omit<JobPositionFilters, 'is_active'>): Promise<JobPosition[]> {
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
   * Search job positions by name
   */
  async search(query: string, filters?: Omit<JobPositionFilters, 'search'>): Promise<JobPosition[]> {
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
   * Get job positions by department
   */
  async getByDepartment(departmentId: number, filters?: JobPositionFilters): Promise<JobPosition[]> {
    try {
      // Get all job positions and filter client-side by department_id
      // In the future, this could be a backend filter
      const response = await this.getAll(filters);
      return response.items.filter((position) => position.department_id === departmentId);
    } catch (error) {
      throw createApiError(error);
    }
  },
};
