import { apiClient } from './api';
import { 
  Shift, 
  CreateShiftRequest, 
  UpdateShiftRequest, 
  ShiftFilters,
  ShiftListResponse 
} from '@/types/shifts/shift';
import { EmployeeWithShifts } from '@/types/shifts/employee';
import {
  ShiftDuplicationRequest,
  BulkShiftCreationRequest,
  BulkOperationPreview,
  ConflictValidationRequest,
  ConflictValidationResponse,
  EmployeeShiftPattern,
  TimeSuggestion,
  EmployeePatternResponse,
  SuggestionRequest
} from '@/types/shifts/templates';

export class ShiftsApiService {
  async getShifts(filters: ShiftFilters = {}): Promise<Shift[]> {
    const queryParams = new URLSearchParams();
    
    if (filters.start_date) queryParams.append('start_date', filters.start_date);
    if (filters.end_date) queryParams.append('end_date', filters.end_date);
    
    const query = queryParams.toString();
    const endpoint = `/api/v1/shifts${query ? `?${query}` : ''}`;
    
    const response = await apiClient.requestGeneric<{ success: boolean; data: Shift[] }>(endpoint, {
      method: 'GET',
    });
    
    return response.data || [];
  }

  async createShift(data: CreateShiftRequest): Promise<Shift> {
    try {
      const response = await apiClient.requestGeneric<{ success: boolean; data: Shift }>('/api/v1/shifts', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      return response.data!;
    } catch (error) {
      console.error('❌ ShiftsApiService.createShift error:', error);
      throw error;
    }
  }

  async updateShift(id: number, data: UpdateShiftRequest): Promise<Shift> {
    const response = await apiClient.requestGeneric<{ success: boolean; data: Shift }>(`/api/v1/shifts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data!;
  }

  async deleteShift(id: number): Promise<void> {
    await apiClient.requestGeneric<{ success: boolean }>(`/api/v1/shifts/${id}`, {
      method: 'DELETE',
    });
  }

  async getWeekShifts(weekStart: string, weekEnd: string): Promise<Shift[]> {
    return this.getShifts({
      start_date: weekStart,
      end_date: weekEnd,
    });
  }

  // Method to get employees with their shifts using include pattern
  async getEmployeesForShifts(startDate?: string, endDate?: string, weekStart?: string, weekEnd?: string): Promise<EmployeeWithShifts[]> {
    const queryParams = new URLSearchParams();

    // Use include pattern to fetch employees with their shifts
    queryParams.append('include', 'shifts');

    // Use startDate/endDate (prioritize them), fallback to weekStart/weekEnd for compatibility
    const shiftStartDate = startDate || weekStart;
    const shiftEndDate = endDate || weekEnd;

    if (shiftStartDate) queryParams.append('shift_start_date', shiftStartDate);
    if (shiftEndDate) queryParams.append('shift_end_date', shiftEndDate);

    // Set higher limit for shift grid (default is 50, max is 100)
    queryParams.append('limit', '100');

    const query = queryParams.toString();
    const endpoint = `/api/v1/employee${query ? `?${query}` : ''}`;

    try {
      // Backend returns employees with flat shifts array
      type BackendEmployee = Omit<EmployeeWithShifts, 'shifts' | 'role' | 'role_id' | 'weekShifts'> & {
        shifts?: Shift[];
      };

      const response = await apiClient.requestGeneric<{
        success: boolean;
        data: {
          items: BackendEmployee[];
          pagination: { page: number; limit: number; total: number; total_pages: number }
        }
      }>(endpoint, {
        method: 'GET',
      });

      const backendEmployees = response.data?.items || [];

      // Transform backend response: group flat shifts array into ShiftByDay structure
      const transformedEmployees: EmployeeWithShifts[] = backendEmployees.map(emp => {
        // Group shifts by date
        const shiftsByDate = new Map<string, Shift[]>();

        if (emp.shifts && emp.shifts.length > 0) {
          emp.shifts.forEach(shift => {
            const date = shift.shift_date; // Already in YYYY-MM-DD format
            if (!shiftsByDate.has(date)) {
              shiftsByDate.set(date, []);
            }
            shiftsByDate.get(date)!.push(shift);
          });
        }

        // Convert Map to ShiftByDay array
        const groupedShifts = Array.from(shiftsByDate.entries()).map(([date, shifts]) => ({
          date,
          shifts
        }));

        // Sort by date
        groupedShifts.sort((a, b) => a.date.localeCompare(b.date));

        // Return employee with grouped shifts + backward compatibility fields
        return {
          ...emp,
          shifts: groupedShifts,
          // Backward compatibility (deprecated)
          role_id: emp.department_id,
          role: emp.department
        };
      });

      return transformedEmployees;
    } catch (error) {
      console.error('❌ Error fetching employees for shifts:', error);
      return [];
    }
  }

  // Método legacy mantenido para compatibilidad
  async getEmployeesForShiftsLegacy(weekStart?: string, weekEnd?: string): Promise<EmployeeWithShifts[]> {
    return this.getEmployeesForShifts(undefined, undefined, weekStart, weekEnd);
  }

  // Método legacy mantenido para compatibilidad
  async getEmployees(filters: { search?: string; role_id?: number; is_active?: boolean } = {}): Promise<EmployeeWithShifts[]> {
    const queryParams = new URLSearchParams();
    
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.role_id) queryParams.append('role_id', filters.role_id.toString());
    if (filters.is_active !== undefined) queryParams.append('is_active', filters.is_active.toString());
    
    const query = queryParams.toString();
    const endpoint = `/api/v1/employees${query ? `?${query}` : ''}`;
    
    try {
      const response = await apiClient.requestGeneric<{ success: boolean; data: any[] }>(endpoint, {
        method: 'GET',
      });
      
      
      // Transformar los datos del API al formato esperado
      const employees = (response.data || []).map(emp => ({
        ...emp,
        shifts: []
      }));
      
      return employees;
    } catch (error) {
      console.error('❌ Error fetching employees:', error);
      return [];
    }
  }

  // ========================================
  // ENHANCED SHIFT OPERATIONS
  // ========================================

  /**
   * Duplicate shifts to other dates or employees
   */
  async duplicateShifts(data: ShiftDuplicationRequest): Promise<Shift[]> {
    try {
      const response = await apiClient.requestGeneric<{ success: boolean; data: Shift[] }>('/api/v1/shifts/duplicate', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      return response.data || [];
    } catch (error) {
      console.error('❌ ShiftsApiService.duplicateShifts error:', error);
      throw error;
    }
  }

  /**
   * Create multiple shifts in bulk
   */
  async createBulkShifts(data: BulkShiftCreationRequest): Promise<Shift[]> {
    try {
      const response = await apiClient.requestGeneric<{ success: boolean; data: Shift[] }>('/api/v1/shifts/bulk-create', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      return response.data || [];
    } catch (error) {
      console.error('❌ ShiftsApiService.createBulkShifts error:', error);
      throw error;
    }
  }

  /**
   * Preview bulk shift creation (shows what would be created and conflicts)
   */
  async previewBulkShifts(data: BulkShiftCreationRequest): Promise<BulkOperationPreview> {
    try {
      const response = await apiClient.requestGeneric<{ success: boolean; data: BulkOperationPreview }>('/api/v1/shifts/bulk-preview', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      return response.data!;
    } catch (error) {
      console.error('❌ ShiftsApiService.previewBulkShifts error:', error);
      throw error;
    }
  }

  /**
   * Validate shifts for conflicts before creation
   */
  async validateConflicts(data: ConflictValidationRequest): Promise<ConflictValidationResponse> {
    try {
      const response = await apiClient.requestGeneric<{ success: boolean; data: ConflictValidationResponse }>('/api/v1/shifts/validate-conflicts', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      // Asegurar que response.data existe, si no devolver respuesta por defecto
      if (!response.data) {
        return {
          has_conflicts: false,
          conflicts: [],
          total_conflicts: 0
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ ShiftsApiService.validateConflicts error:', error);
      // En caso de error, devolver respuesta por defecto en lugar de lanzar error
      return {
        has_conflicts: false,
        conflicts: [],
        total_conflicts: 0
      };
    }
  }

  // ========================================
  // PATTERNS AND SUGGESTIONS
  // ========================================

  /**
   * Get shift patterns for a specific employee
   */
  async getEmployeePatterns(employeeId: number): Promise<EmployeePatternResponse> {
    try {
      const response = await apiClient.requestGeneric<{ success: boolean; data: EmployeePatternResponse }>(`/api/v1/shifts/patterns/${employeeId}`, {
        method: 'GET',
      });
      
      return response.data!;
    } catch (error) {
      console.error('❌ ShiftsApiService.getEmployeePatterns error:', error);
      throw error;
    }
  }

  /**
   * Get time suggestions for an employee based on patterns and templates
   */
  async getTimeSuggestions(request: SuggestionRequest): Promise<TimeSuggestion[]> {
    const queryParams = new URLSearchParams();
    
    if (request.employee_id) queryParams.append('employee_id', request.employee_id.toString());
    if (request.date) queryParams.append('date', request.date);
    if (request.limit) queryParams.append('limit', request.limit.toString());
    
    const query = queryParams.toString();
    const endpoint = `/api/v1/shifts/suggestions${query ? `?${query}` : ''}`;
    
    try {
      const response = await apiClient.requestGeneric<{ success: boolean; data: TimeSuggestion[] }>(endpoint, {
        method: 'GET',
      });
      
      return response.data || [];
    } catch (error) {
      console.error('❌ ShiftsApiService.getTimeSuggestions error:', error);
      throw error;
    }
  }

  /**
   * Get all patterns for multiple employees (useful for bulk operations)
   */
  async getMultipleEmployeePatterns(employeeIds: number[]): Promise<Record<number, EmployeePatternResponse>> {
    try {
      const response = await apiClient.requestGeneric<{ success: boolean; data: Record<number, EmployeePatternResponse> }>('/api/v1/shifts/patterns/bulk', {
        method: 'POST',
        body: JSON.stringify({ employee_ids: employeeIds }),
      });
      
      return response.data || {};
    } catch (error) {
      console.error('❌ ShiftsApiService.getMultipleEmployeePatterns error:', error);
      throw error;
    }
  }
}

export const shiftsApiService = new ShiftsApiService();
