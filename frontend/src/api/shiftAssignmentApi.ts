/**
 * Shift Assignment API Module
 * Handles all shift assignment operations with type safety
 */

import { apiClient } from '@/lib/api';
import { createApiError } from '@/lib/errors';
import {
  ShiftAssignment,
  CreateShiftAssignmentInput,
  UpdateShiftAssignmentInput,
  ShiftAssignmentFilters,
  BulkCreateShiftAssignmentInput,
  BulkUpdateShiftAssignmentInput,
  BulkDeleteShiftAssignmentInput,
  BulkOperationResult,
  ConflictInfo,
  RuleViolation,
  ValidationResult,
  CoverageAnalysis,
} from '@/lib/validation';

// API endpoint base
const BASE_PATH = '/api/v1/shift-assignment';

// Response types
interface GetAllResponse {
  data: ShiftAssignment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ConflictCheckResponse {
  hasConflict: boolean;
  conflicts?: ConflictInfo[];
}

interface BusinessRulesResponse {
  isValid: boolean;
  violations?: RuleViolation[];
}

interface CoverageAnalysisResponse {
  analysis: CoverageAnalysis[];
  summary: {
    totalRequired: number;
    totalAssigned: number;
    totalConfirmed: number;
    averageCoverage: number;
  };
}

/**
 * Shift Assignment API
 */
export const shiftAssignmentApi = {
  /**
   * Get all shift assignments with optional filters
   */
  async getAll(filters?: ShiftAssignmentFilters): Promise<GetAllResponse> {
    try {
      const params: Record<string, string> = {};

      if (filters) {
        if (filters.page) params.page = filters.page;
        if (filters.limit) params.limit = filters.limit;
        if (filters.search) params.search = filters.search;
        if (filters.status) params.status = filters.status;
        if (filters.employee_id) params.employee_id = filters.employee_id;
        if (filters.location_id) params.location_id = filters.location_id;
        if (filters.shift_date) params.shift_date = filters.shift_date;
        if (filters.sort_by) params.sort_by = filters.sort_by;
        if (filters.sort_order) params.sort_order = filters.sort_order;
      }

      const response = await apiClient.get<GetAllResponse>(BASE_PATH, { params });

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch shift assignments');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Get shift assignment by ID
   */
  async getById(id: number): Promise<ShiftAssignment> {
    try {
      const response = await apiClient.get<ShiftAssignment>(`${BASE_PATH}/${id}`);

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch shift assignment');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Create new shift assignment
   */
  async create(data: CreateShiftAssignmentInput): Promise<ShiftAssignment> {
    try {
      const response = await apiClient.post<ShiftAssignment>(BASE_PATH, data);

      if (!response.success || !response.data) {
        throw new Error('Failed to create shift assignment');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Update shift assignment
   */
  async update(id: number, data: UpdateShiftAssignmentInput): Promise<ShiftAssignment> {
    try {
      const response = await apiClient.put<ShiftAssignment>(`${BASE_PATH}/${id}`, data);

      if (!response.success || !response.data) {
        throw new Error('Failed to update shift assignment');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Delete shift assignment (soft delete)
   */
  async delete(id: number): Promise<void> {
    try {
      const response = await apiClient.delete<void>(`${BASE_PATH}/${id}`);

      if (!response.success) {
        throw new Error('Failed to delete shift assignment');
      }
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Confirm shift assignment
   * Changes status from pending to confirmed
   */
  async confirmShift(id: number): Promise<ShiftAssignment> {
    try {
      const response = await apiClient.patch<ShiftAssignment>(`${BASE_PATH}/${id}/confirm`);

      if (!response.success || !response.data) {
        throw new Error('Failed to confirm shift assignment');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Validate shift assignment for conflicts
   * Checks for overlapping shifts with the same employee
   */
  async validateConflicts(assignment: {
    employee_id: number;
    shift_date: string;
    start_time: string;
    end_time: string;
    excludeShiftId?: number;
  }): Promise<ValidationResult> {
    try {
      const response = await apiClient.post<ConflictCheckResponse>(
        `${BASE_PATH}/validate/conflicts`,
        assignment
      );

      if (!response.success || !response.data) {
        throw new Error('Failed to validate conflicts');
      }

      return {
        isValid: !response.data.hasConflict,
        conflicts: response.data.conflicts,
      };
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Validate shift assignment against business rules
   * Checks: max daily/weekly hours, minimum break time, etc.
   */
  async validateBusinessRules(assignment: {
    employee_id: number;
    company_id: number;
    shift_date: string;
    start_time: string;
    end_time: string;
    excludeShiftId?: number;
  }): Promise<ValidationResult> {
    try {
      const response = await apiClient.post<BusinessRulesResponse>(
        `${BASE_PATH}/validate/business-rules`,
        assignment
      );

      if (!response.success || !response.data) {
        throw new Error('Failed to validate business rules');
      }

      return {
        isValid: response.data.isValid,
        violations: response.data.violations,
      };
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Bulk create shift assignments
   */
  async bulkCreate(data: BulkCreateShiftAssignmentInput): Promise<BulkOperationResult<ShiftAssignment>> {
    try {
      const response = await apiClient.post<BulkOperationResult<ShiftAssignment>>(
        `${BASE_PATH}/bulk/create`,
        data
      );

      if (!response.success || !response.data) {
        throw new Error('Failed to bulk create shift assignments');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Bulk update shift assignments
   */
  async bulkUpdate(data: BulkUpdateShiftAssignmentInput): Promise<BulkOperationResult<ShiftAssignment>> {
    try {
      const response = await apiClient.put<BulkOperationResult<ShiftAssignment>>(
        `${BASE_PATH}/bulk/update`,
        data
      );

      if (!response.success || !response.data) {
        throw new Error('Failed to bulk update shift assignments');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Bulk delete shift assignments
   */
  async bulkDelete(data: BulkDeleteShiftAssignmentInput): Promise<BulkOperationResult<void>> {
    try {
      const response = await apiClient.delete<BulkOperationResult<void>>(
        `${BASE_PATH}/bulk/delete`,
        {
          body: JSON.stringify(data),
        }
      );

      if (!response.success || !response.data) {
        throw new Error('Failed to bulk delete shift assignments');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Get coverage analysis for a date range
   * Shows staffing coverage by position and date
   */
  async getCoverageAnalysis(
    startDate: string,
    endDate: string,
    locationId?: number
  ): Promise<CoverageAnalysisResponse> {
    try {
      const params: Record<string, string> = {
        start_date: startDate,
        end_date: endDate,
      };

      if (locationId) {
        params.location_id = String(locationId);
      }

      const response = await apiClient.get<CoverageAnalysisResponse>(
        `${BASE_PATH}/coverage/analysis`,
        { params }
      );

      if (!response.success || !response.data) {
        throw new Error('Failed to get coverage analysis');
      }

      return response.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Get shift assignments by employee
   */
  async getByEmployee(
    employeeId: number,
    filters?: {
      startDate?: string;
      endDate?: string;
      status?: 'pending' | 'confirmed' | 'cancelled';
    }
  ): Promise<ShiftAssignment[]> {
    try {
      const params: Record<string, string> = {
        employee_id: String(employeeId),
      };

      if (filters?.startDate) params.start_date = filters.startDate;
      if (filters?.endDate) params.end_date = filters.endDate;
      if (filters?.status) params.status = filters.status;

      const response = await apiClient.get<GetAllResponse>(BASE_PATH, { params });

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch employee shift assignments');
      }

      return response.data.data;
    } catch (error) {
      throw createApiError(error);
    }
  },

  /**
   * Get shift assignments by location
   */
  async getByLocation(
    locationId: number,
    filters?: {
      startDate?: string;
      endDate?: string;
      status?: 'pending' | 'confirmed' | 'cancelled';
    }
  ): Promise<ShiftAssignment[]> {
    try {
      const params: Record<string, string> = {
        location_id: String(locationId),
      };

      if (filters?.startDate) params.start_date = filters.startDate;
      if (filters?.endDate) params.end_date = filters.endDate;
      if (filters?.status) params.status = filters.status;

      const response = await apiClient.get<GetAllResponse>(BASE_PATH, { params });

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch location shift assignments');
      }

      return response.data.data;
    } catch (error) {
      throw createApiError(error);
    }
  },
};
