/**
 * Day Template API Module
 * Handles day template operations (reusable daily shift schedules)
 */

import { apiClient } from '@/lib/api';
import { createApiError } from '@/lib/errors';
import {
  DayTemplate,
  CreateDayTemplateInput,
  UpdateDayTemplateInput,
  DayTemplateFilters,
  BulkCreateDayTemplateInput,
} from '@/lib/validation';

// API endpoint base
const BASE_PATH = '/api/v1/day_template';

// Response types
interface GetAllResponse {
  data: DayTemplate[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
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

/**
 * Day Template API
 */
export const dayTemplateApi = {
  /**
   * Get all day templates with optional filters
   */
  async getAll(filters?: DayTemplateFilters): Promise<GetAllResponse> {
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
        throw new Error('Failed to fetch day templates');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Get day template by ID
   */
  async getById(id: number): Promise<DayTemplate> {
    try {
      const response = await apiClient.get<DayTemplate>(`${BASE_PATH}/${id}`);

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch day template');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Create new day template
   */
  async create(data: CreateDayTemplateInput): Promise<DayTemplate> {
    try {
      const response = await apiClient.post<DayTemplate>(BASE_PATH, data);

      if (!response.success || !response.data) {
        throw new Error('Failed to create day template');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Update day template
   */
  async update(id: number, data: UpdateDayTemplateInput): Promise<DayTemplate> {
    try {
      const response = await apiClient.put<DayTemplate>(`${BASE_PATH}/${id}`, data);

      if (!response.success || !response.data) {
        throw new Error('Failed to update day template');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Delete day template (soft delete)
   */
  async delete(id: number): Promise<void> {
    try {
      const response = await apiClient.delete<void>(`${BASE_PATH}/${id}`);

      if (!response.success) {
        throw new Error('Failed to delete day template');
      }
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Bulk create day templates
   */
  async bulkCreate(data: BulkCreateDayTemplateInput): Promise<BulkOperationResult<DayTemplate>> {
    try {
      const response = await apiClient.post<BulkOperationResult<DayTemplate>>(
        `${BASE_PATH}/bulk/create`,
        data
      );

      if (!response.success || !response.data) {
        throw new Error('Failed to bulk create day templates');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Bulk update day templates
   */
  async bulkUpdate(
    ids: number[],
    data: UpdateDayTemplateInput
  ): Promise<BulkOperationResult<DayTemplate>> {
    try {
      const response = await apiClient.put<BulkOperationResult<DayTemplate>>(
        `${BASE_PATH}/bulk/update`,
        { ids, data }
      );

      if (!response.success || !response.data) {
        throw new Error('Failed to bulk update day templates');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Bulk delete day templates
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
        throw new Error('Failed to bulk delete day templates');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Get active day templates only
   */
  async getActive(): Promise<DayTemplate[]> {
    try {
      const response = await this.getAll({ is_active: 'true' });
      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Clone day template with a new name
   */
  async clone(id: number, newName: string): Promise<DayTemplate> {
    try {
      const original = await this.getById(id);

      // Create new template with same properties but different name
      const clonedData: CreateDayTemplateInput = {
        company_id: original.company_id,
        name: newName,
        description: original.description,
        is_active: original.is_active,
      };

      return await this.create(clonedData);
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Toggle active status
   */
  async toggleActive(id: number): Promise<DayTemplate> {
    try {
      const template = await this.getById(id);

      return await this.update(id, {
        is_active: !template.is_active,
      });
    } catch (error) {
      throw createApiError(error);
    }
  },
};
