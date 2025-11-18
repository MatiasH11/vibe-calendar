/**
 * Shift API Module
 *
 * Handles all shift-related API operations using the modular pattern
 * from Phase 1. Provides CRUD operations, conflict detection, bulk operations,
 * and specialized queries for week views and employee schedules.
 */

import { apiClient } from '@/lib/api';
import type { ApiResponse } from '@/types/api';

// ============================================================================
// Types
// ============================================================================

export interface Shift {
  shift_id: number;
  company_id: number;
  employee_id: number | null;
  location_id: number | null;
  department_id: number | null;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm (UTC)
  end_time: string; // HH:mm (UTC)
  status: 'scheduled' | 'completed' | 'cancelled';
  notes: string | null;
  assigned_by: number | null;
  confirmed_by: number | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  // Relations (optional, depends on query)
  employee?: {
    employee_id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  location?: {
    location_id: number;
    name: string;
  };
  department?: {
    department_id: number;
    name: string;
  };
}

export interface CreateShiftInput {
  employee_id?: number;
  location_id?: number;
  department_id?: number;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm (UTC)
  end_time: string; // HH:mm (UTC)
  status?: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

export interface UpdateShiftInput {
  employee_id?: number;
  location_id?: number;
  department_id?: number;
  date?: string;
  start_time?: string;
  end_time?: string;
  status?: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

export interface ShiftFilter {
  employee_id?: number;
  location_id?: number;
  department_id?: number;
  start_date?: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  status?: 'scheduled' | 'completed' | 'cancelled';
  page?: number;
  limit?: number;
}

export interface WeekViewParams {
  location_id?: number;
  department_id?: number;
  start_date: string; // YYYY-MM-DD (Monday of the week)
}

export interface WeekViewResponse {
  week_start: string;
  week_end: string;
  shifts: Shift[];
  employees: Array<{
    employee_id: number;
    first_name: string;
    last_name: string;
    shifts: Shift[];
  }>;
  summary: {
    total_shifts: number;
    total_hours: number;
    employees_scheduled: number;
  };
}

export interface EmployeeScheduleParams {
  employee_id: number;
  start_date?: string;
  end_date?: string;
}

export interface ConflictInfo {
  type: 'overlap' | 'adjacent' | 'duplicate';
  existing_shift: Shift;
  message: string;
}

export interface RuleViolation {
  rule: string;
  message: string;
  severity: 'error' | 'warning';
  metadata?: Record<string, any>;
}

export interface ValidationResult {
  valid: boolean;
  conflicts: ConflictInfo[];
  rule_violations: RuleViolation[];
}

export interface DuplicateShiftParams {
  shift_id: number;
  target_dates?: string[]; // Duplicate to specific dates
  target_employee_ids?: number[]; // Duplicate to specific employees
  conflict_strategy?: 'fail' | 'skip' | 'overwrite';
}

export interface DuplicateShiftResult {
  succeeded: Shift[];
  failed: Array<{
    date?: string;
    employee_id?: number;
    reason: string;
  }>;
  summary: {
    total_requested: number;
    total_succeeded: number;
    total_failed: number;
  };
}

export interface BulkCreateInput {
  shifts: CreateShiftInput[];
  conflict_strategy?: 'fail' | 'skip' | 'overwrite';
}

export interface BulkUpdateInput {
  updates: Array<{
    shift_id: number;
    data: UpdateShiftInput;
  }>;
}

export interface BulkDeleteInput {
  shift_ids: number[];
}

export interface BulkOperationResult<T = Shift> {
  succeeded: T[];
  failed: Array<{
    index?: number;
    shift_id?: number;
    reason: string;
    error?: string;
  }>;
  summary: {
    total_requested: number;
    total_succeeded: number;
    total_failed: number;
  };
}

// ============================================================================
// API Methods
// ============================================================================

export const shiftApi = {
  /**
   * Get all shifts with optional filtering
   */
  async getAll(filters?: ShiftFilter): Promise<ApiResponse<Shift[]>> {
    const params = new URLSearchParams();

    if (filters?.employee_id) params.append('employee_id', filters.employee_id.toString());
    if (filters?.location_id) params.append('location_id', filters.location_id.toString());
    if (filters?.department_id) params.append('department_id', filters.department_id.toString());
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const query = params.toString();
    return apiClient.get<Shift[]>(`/api/v1/shift${query ? `?${query}` : ''}`);
  },

  /**
   * Get a single shift by ID
   */
  async getById(shiftId: number): Promise<ApiResponse<Shift>> {
    return apiClient.get<Shift>(`/api/v1/shift/${shiftId}`);
  },

  /**
   * Create a new shift
   */
  async create(data: CreateShiftInput): Promise<ApiResponse<Shift>> {
    return apiClient.post<Shift>('/api/v1/shift', data);
  },

  /**
   * Update an existing shift
   */
  async update(shiftId: number, data: UpdateShiftInput): Promise<ApiResponse<Shift>> {
    return apiClient.put<Shift>(`/api/v1/shift/${shiftId}`, data);
  },

  /**
   * Delete a shift (soft delete)
   */
  async delete(shiftId: number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/api/v1/shift/${shiftId}`);
  },

  /**
   * Get week view of shifts (calendar view)
   */
  async getWeekView(params: WeekViewParams): Promise<ApiResponse<WeekViewResponse>> {
    const queryParams = new URLSearchParams();
    queryParams.append('start_date', params.start_date);
    if (params.location_id) queryParams.append('location_id', params.location_id.toString());
    if (params.department_id) queryParams.append('department_id', params.department_id.toString());

    return apiClient.get<WeekViewResponse>(`/api/v1/shift/week-view?${queryParams.toString()}`);
  },

  /**
   * Get an employee's schedule
   */
  async getEmployeeSchedule(params: EmployeeScheduleParams): Promise<ApiResponse<Shift[]>> {
    const queryParams = new URLSearchParams();
    queryParams.append('employee_id', params.employee_id.toString());
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);

    return apiClient.get<Shift[]>(`/api/v1/shift/employee-schedule?${queryParams.toString()}`);
  },

  /**
   * Validate a shift for conflicts
   */
  async validateConflicts(shift: CreateShiftInput | UpdateShiftInput, shiftId?: number): Promise<ApiResponse<ConflictInfo[]>> {
    const endpoint = shiftId
      ? `/api/v1/shift/${shiftId}/validate-conflicts`
      : '/api/v1/shift/validate-conflicts';

    return apiClient.post<ConflictInfo[]>(endpoint, shift);
  },

  /**
   * Validate a shift against business rules
   */
  async validateBusinessRules(shift: CreateShiftInput | UpdateShiftInput, shiftId?: number): Promise<ApiResponse<RuleViolation[]>> {
    const endpoint = shiftId
      ? `/api/v1/shift/${shiftId}/validate-rules`
      : '/api/v1/shift/validate-rules';

    return apiClient.post<RuleViolation[]>(endpoint, shift);
  },

  /**
   * Validate a shift for both conflicts and business rules
   */
  async validate(shift: CreateShiftInput | UpdateShiftInput, shiftId?: number): Promise<ApiResponse<ValidationResult>> {
    const endpoint = shiftId
      ? `/api/v1/shift/${shiftId}/validate`
      : '/api/v1/shift/validate';

    return apiClient.post<ValidationResult>(endpoint, shift);
  },

  /**
   * Duplicate a shift to other dates or employees
   */
  async duplicateShift(params: DuplicateShiftParams): Promise<ApiResponse<DuplicateShiftResult>> {
    return apiClient.post<DuplicateShiftResult>(`/api/v1/shift/${params.shift_id}/duplicate`, {
      target_dates: params.target_dates,
      target_employee_ids: params.target_employee_ids,
      conflict_strategy: params.conflict_strategy || 'fail',
    });
  },

  /**
   * Bulk create shifts
   */
  async bulkCreate(input: BulkCreateInput): Promise<ApiResponse<BulkOperationResult>> {
    return apiClient.post<BulkOperationResult>('/api/v1/shift/bulk', {
      shifts: input.shifts,
      conflict_strategy: input.conflict_strategy || 'fail',
    });
  },

  /**
   * Bulk update shifts
   */
  async bulkUpdate(input: BulkUpdateInput): Promise<ApiResponse<BulkOperationResult>> {
    return apiClient.put<BulkOperationResult>('/api/v1/shift/bulk', input);
  },

  /**
   * Bulk delete shifts
   */
  async bulkDelete(input: BulkDeleteInput): Promise<ApiResponse<BulkOperationResult<{ shift_id: number }>>> {
    return apiClient.delete<BulkOperationResult<{ shift_id: number }>>('/api/v1/shift/bulk', {
      body: JSON.stringify(input),
    } as any);
  },

  /**
   * Get shift patterns for an employee (AI suggestions)
   */
  async getEmployeePatterns(employeeId: number): Promise<ApiResponse<any>> {
    return apiClient.get(`/api/v1/shift/employee/${employeeId}/patterns`);
  },

  /**
   * Get shift suggestions based on patterns and templates
   */
  async getSuggestions(params: {
    employee_id?: number;
    date?: string;
    location_id?: number;
    department_id?: number;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params.employee_id) queryParams.append('employee_id', params.employee_id.toString());
    if (params.date) queryParams.append('date', params.date);
    if (params.location_id) queryParams.append('location_id', params.location_id.toString());
    if (params.department_id) queryParams.append('department_id', params.department_id.toString());

    return apiClient.get(`/api/v1/shift/suggestions?${queryParams.toString()}`);
  },
};

export default shiftApi;
