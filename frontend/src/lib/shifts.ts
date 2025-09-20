import { apiClient } from './api';
import { 
  Shift, 
  CreateShiftRequest, 
  UpdateShiftRequest, 
  ShiftFilters,
  ShiftListResponse 
} from '@/types/shifts/shift';
import { EmployeeWithShifts } from '@/types/shifts/employee';

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

  // Método optimizado para obtener empleados para vista de turnos (MEJORADO)
  async getEmployeesForShifts(startDate?: string, endDate?: string, weekStart?: string, weekEnd?: string): Promise<EmployeeWithShifts[]> {
    const queryParams = new URLSearchParams();
    
    // Priorizar nuevos parámetros, mantener compatibilidad con los antiguos
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);
    if (weekStart) queryParams.append('week_start', weekStart);
    if (weekEnd) queryParams.append('week_end', weekEnd);
    
    const query = queryParams.toString();
    const endpoint = `/api/v1/employees/with-shifts${query ? `?${query}` : ''}`;
    
    try {
      const response = await apiClient.request<EmployeeWithShifts[]>(endpoint, {
        method: 'GET',
      });
      

      return response.data || [];
    } catch (error) {
      console.error('❌ Error fetching employees for shifts:', error);
      
      // Fallback: intentar con el endpoint legacy
      try {
        const fallbackEndpoint = `/api/v1/employees/for-shifts${query ? `?${query}` : ''}`;
        const fallbackResponse = await apiClient.request<EmployeeWithShifts[]>(fallbackEndpoint, {
          method: 'GET',
        });
        
        return fallbackResponse.data || [];
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        return [];
      }
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
}

export const shiftsApiService = new ShiftsApiService();
