/**
 * Template Shift API Module
 * Handles template shift operations (shifts within day templates)
 */

import { apiClient } from '@/lib/api';
import { createApiError } from '@/lib/errors';
import {
  TemplateShift,
  CreateTemplateShiftInput,
  UpdateTemplateShiftInput,
} from '@/lib/validation';

// API endpoint base
const BASE_PATH = '/api/v1/template-shift';

// Response types
interface GetAllResponse {
  data: TemplateShift[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface TemplateShiftFilters {
  page?: string;
  limit?: string;
  search?: string;
  day_template_id?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
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
 * Template Shift API
 */
export const templateShiftApi = {
  /**
   * Get all template shifts with optional filters
   */
  async getAll(filters?: TemplateShiftFilters): Promise<GetAllResponse> {
    try {
      const params: Record<string, string> = {};

      if (filters) {
        if (filters.page) params.page = filters.page;
        if (filters.limit) params.limit = filters.limit;
        if (filters.search) params.search = filters.search;
        if (filters.day_template_id) params.day_template_id = filters.day_template_id;
        if (filters.sort_by) params.sort_by = filters.sort_by;
        if (filters.sort_order) params.sort_order = filters.sort_order;
      }

      const response = await apiClient.get<GetAllResponse>(BASE_PATH, { params });

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch template shifts');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Get template shift by ID
   */
  async getById(id: number): Promise<TemplateShift> {
    try {
      const response = await apiClient.get<TemplateShift>(`${BASE_PATH}/${id}`);

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch template shift');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Create new template shift
   */
  async create(data: CreateTemplateShiftInput): Promise<TemplateShift> {
    try {
      const response = await apiClient.post<TemplateShift>(BASE_PATH, data);

      if (!response.success || !response.data) {
        throw new Error('Failed to create template shift');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Update template shift
   */
  async update(id: number, data: UpdateTemplateShiftInput): Promise<TemplateShift> {
    try {
      const response = await apiClient.put<TemplateShift>(`${BASE_PATH}/${id}`, data);

      if (!response.success || !response.data) {
        throw new Error('Failed to update template shift');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Delete template shift (soft delete)
   */
  async delete(id: number): Promise<void> {
    try {
      const response = await apiClient.delete<void>(`${BASE_PATH}/${id}`);

      if (!response.success) {
        throw new Error('Failed to delete template shift');
      }
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Get all template shifts for a specific day template
   */
  async getTemplateShifts(dayTemplateId: number): Promise<TemplateShift[]> {
    try {
      const response = await apiClient.get<GetAllResponse>(BASE_PATH, {
        params: {
          day_template_id: String(dayTemplateId),
        },
      });

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch template shifts for day template');
      }

      return response.data.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Bulk create template shifts
   */
  async bulkCreate(items: CreateTemplateShiftInput[]): Promise<BulkOperationResult<TemplateShift>> {
    try {
      const response = await apiClient.post<BulkOperationResult<TemplateShift>>(
        `${BASE_PATH}/bulk/create`,
        { items }
      );

      if (!response.success || !response.data) {
        throw new Error('Failed to bulk create template shifts');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Bulk update template shifts
   */
  async bulkUpdate(
    ids: number[],
    data: UpdateTemplateShiftInput
  ): Promise<BulkOperationResult<TemplateShift>> {
    try {
      const response = await apiClient.put<BulkOperationResult<TemplateShift>>(
        `${BASE_PATH}/bulk/update`,
        { ids, data }
      );

      if (!response.success || !response.data) {
        throw new Error('Failed to bulk update template shifts');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Bulk delete template shifts
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
        throw new Error('Failed to bulk delete template shifts');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Clone template shift to another day template
   */
  async clone(id: number, targetDayTemplateId: number, newName?: string): Promise<TemplateShift> {
    try {
      const original = await this.getById(id);

      // Create new template shift with same properties but different day_template_id
      const clonedData: CreateTemplateShiftInput = {
        day_template_id: targetDayTemplateId,
        name: newName || original.name,
        start_time: original.start_time,
        end_time: original.end_time,
        color: original.color,
        sort_order: original.sort_order,
      };

      return await this.create(clonedData);
    } catch (error) {
      throw createApiError(error);
    }
  },
};
