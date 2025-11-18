/**
 * Location API Module
 * Handles location operations (CRUD, bulk operations)
 */

import { apiClient } from '@/lib/api';
import { createApiError } from '@/lib/errors';

// Location type based on Prisma schema
export interface Location {
  id: number;
  company_id: number;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  // Relations (when included)
  departments?: Array<{
    id: number;
    name: string;
    color: string;
    is_active: boolean;
  }>;
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
export interface CreateLocationInput {
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  is_active?: boolean;
}

export interface UpdateLocationInput {
  name?: string;
  address?: string;
  city?: string;
  phone?: string;
  is_active?: boolean;
}

export interface LocationFilters {
  page?: string;
  limit?: string;
  search?: string;
  is_active?: 'true' | 'false';
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface BulkCreateLocationInput {
  items: CreateLocationInput[];
}

// Response types
interface GetAllResponse {
  items: Location[];
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
const BASE_PATH = '/api/v1/location';

/**
 * Location API
 */
export const locationApi = {
  /**
   * Get all locations with optional filters
   */
  async getAll(filters?: LocationFilters): Promise<GetAllResponse> {
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
        throw new Error('Failed to fetch locations');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Get location by ID
   */
  async getById(id: number): Promise<Location> {
    try {
      const response = await apiClient.get<Location>(`${BASE_PATH}/${id}`);

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch location');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Create new location
   */
  async create(data: CreateLocationInput): Promise<Location> {
    try {
      const response = await apiClient.post<Location>(BASE_PATH, data);

      if (!response.success || !response.data) {
        throw new Error('Failed to create location');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Update location
   */
  async update(id: number, data: UpdateLocationInput): Promise<Location> {
    try {
      const response = await apiClient.put<Location>(`${BASE_PATH}/${id}`, data);

      if (!response.success || !response.data) {
        throw new Error('Failed to update location');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Delete location (soft delete)
   */
  async delete(id: number): Promise<void> {
    try {
      const response = await apiClient.delete<void>(`${BASE_PATH}/${id}`);

      if (!response.success) {
        throw new Error('Failed to delete location');
      }
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Bulk create locations
   */
  async bulkCreate(data: BulkCreateLocationInput): Promise<BulkOperationResult<Location>> {
    try {
      const response = await apiClient.post<BulkOperationResult<Location>>(
        `${BASE_PATH}/bulk/create`,
        data
      );

      if (!response.success || !response.data) {
        throw new Error('Failed to bulk create locations');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Bulk update locations
   */
  async bulkUpdate(
    ids: number[],
    data: UpdateLocationInput
  ): Promise<BulkOperationResult<Location>> {
    try {
      const response = await apiClient.put<BulkOperationResult<Location>>(
        `${BASE_PATH}/bulk/update`,
        { ids, data }
      );

      if (!response.success || !response.data) {
        throw new Error('Failed to bulk update locations');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Bulk delete locations
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
        throw new Error('Failed to bulk delete locations');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Get location with departments
   * Note: This assumes the backend supports include=departments query parameter
   * If not implemented yet, this would need backend support
   */
  async getWithDepartments(id: number): Promise<Location> {
    try {
      // For now, just get the location by ID
      // In the future, this could be enhanced with include=departments parameter
      const location = await this.getById(id);
      return location;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Get active locations only
   */
  async getActive(filters?: Omit<LocationFilters, 'is_active'>): Promise<Location[]> {
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
   * Search locations by name
   */
  async search(query: string, filters?: Omit<LocationFilters, 'search'>): Promise<Location[]> {
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
};
