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
    const response = await apiClient.requestGeneric<{ success: boolean; data: Shift }>('/api/v1/shifts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data!;
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
    
    console.log('🔍 getEmployeesForShifts called with:', { startDate, endDate, weekStart, weekEnd });
    console.log('🔍 Final endpoint:', endpoint);
    
    try {
      console.log('🔍 Making request to:', endpoint);
      const response = await apiClient.request<{ success: boolean; data: EmployeeWithShifts[]; meta: any }>(endpoint, {
        method: 'GET',
      });
      
      console.log('🔍 API Response employees for shifts:', response);
      console.log('📊 Metadata:', response.meta);
      console.log('📊 Response data type:', typeof response.data);
      console.log('📊 Response data is array:', Array.isArray(response.data));
      console.log('📊 Response data length:', response.data?.length);
      
      return response.data || [];
    } catch (error) {
      console.error('❌ Error fetching employees for shifts:', error);
      
      // Fallback: intentar con el endpoint legacy
      console.log('🔄 Fallback: trying legacy endpoint');
      try {
        const fallbackEndpoint = `/api/v1/employees/for-shifts${query ? `?${query}` : ''}`;
        const fallbackResponse = await apiClient.request<{ success: boolean; data: EmployeeWithShifts[]; meta: any }>(fallbackEndpoint, {
          method: 'GET',
        });
        
        console.log('🔍 Fallback response:', fallbackResponse);
        console.log('📊 Fallback data type:', typeof fallbackResponse.data);
        console.log('📊 Fallback data is array:', Array.isArray(fallbackResponse.data));
        console.log('📊 Fallback data length:', fallbackResponse.data?.length);
        
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
      
      console.log('🔍 API Response employees:', response);
      
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
