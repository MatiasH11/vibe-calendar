# 🔧 FASE 4: Servicios y Hooks para Turnos

## 🎯 Objetivo
Crear servicios API, hooks y store para gestión de turnos. **Solo lógica de datos**, no componentes.

## 🌐 PASO 1: Servicios API

### `lib/api/shifts.ts`
```typescript
import { apiClient } from '../api';
import { 
  Shift, 
  CreateShiftRequest, 
  UpdateShiftRequest, 
  ShiftFilters,
  ShiftListResponse 
} from '@/types/shifts/shift';

export class ShiftsApiService {
  async getShifts(filters: ShiftFilters = {}): Promise<Shift[]> {
    const queryParams = new URLSearchParams();
    
    if (filters.start_date) queryParams.append('start_date', filters.start_date);
    if (filters.end_date) queryParams.append('end_date', filters.end_date);
    
    const query = queryParams.toString();
    const endpoint = `/api/v1/shifts${query ? `?${query}` : ''}`;
    
    const response = await apiClient.request<{ success: boolean; data: Shift[] }>(endpoint, {
      method: 'GET',
    });
    
    return response.data || [];
  }

  async createShift(data: CreateShiftRequest): Promise<Shift> {
    const response = await apiClient.request<{ success: boolean; data: Shift }>('/api/v1/shifts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data!;
  }

  async updateShift(id: number, data: UpdateShiftRequest): Promise<Shift> {
    const response = await apiClient.request<{ success: boolean; data: Shift }>(`/api/v1/shifts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data!;
  }

  async deleteShift(id: number): Promise<void> {
    await apiClient.request<{ success: boolean }>(`/api/v1/shifts/${id}`, {
      method: 'DELETE',
    });
  }

  async getWeekShifts(weekStart: string, weekEnd: string): Promise<Shift[]> {
    return this.getShifts({
      start_date: weekStart,
      end_date: weekEnd,
    });
  }

  // Nuevo método para obtener empleados con filtros
  async getEmployees(filters: { search?: string; role_id?: number; is_active?: boolean } = {}): Promise<EmployeeWithShifts[]> {
    const queryParams = new URLSearchParams();
    
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.role_id) queryParams.append('role_id', filters.role_id.toString());
    if (filters.is_active !== undefined) queryParams.append('is_active', filters.is_active.toString());
    
    const query = queryParams.toString();
    const endpoint = `/api/v1/employees/advanced${query ? `?${query}` : ''}`;
    
    const response = await apiClient.request<{ success: boolean; data: EmployeeWithShifts[] }>(endpoint, {
      method: 'GET',
    });
    
    return response.data || [];
  }
}

export const shiftsApiService = new ShiftsApiService();
```

## 🎣 PASO 2: Hooks de Turnos

### `hooks/shifts/useShifts.ts`
```typescript
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shiftsApiService } from '@/lib/api/shifts';
import { WeekViewData, EmployeeWithShifts, Shift } from '@/types/shifts/shift';
import { getWeekRange, navigateWeek, formatDate, getWeekDays } from '@/lib/dateUtils';
import { es } from 'date-fns/locale';

export function useShifts() {
  const [currentWeek, setCurrentWeek] = useState(() => {
    const today = new Date();
    const { start } = getWeekRange(today);
    return formatDate(start, 'yyyy-MM-dd');
  });

  const queryClient = useQueryClient();

  // Obtener rango de la semana actual
  const { start: weekStart, end: weekEnd } = getWeekRange(new Date(currentWeek));

  // Query para obtener turnos de la semana
  const {
    data: shiftsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['shifts', currentWeek],
    queryFn: () => shiftsApiService.getWeekShifts(
      formatDate(weekStart, 'yyyy-MM-dd'),
      formatDate(weekEnd, 'yyyy-MM-dd')
    ),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Query para obtener empleados
  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: () => shiftsApiService.getEmployees({ is_active: true }),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });

  // Procesar datos para la vista semanal
  const weekData: WeekViewData | null = useMemo(() => {
    if (!shiftsData || !employeesData) return null;

    // Procesar días de la semana
    const days = getWeekDays(new Date(currentWeek)).map(date => {
      const dateStr = formatDate(date, 'yyyy-MM-dd');
      const dayShifts = shiftsData.filter(shift => shift.shift_date === dateStr);
      
      return {
        date: dateStr,
        dayName: formatDate(date, 'EEE', { locale: es }),
        dayNumber: date.getDate(),
        isToday: dateStr === formatDate(new Date(), 'yyyy-MM-dd'),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        shifts: dayShifts,
        employeeCount: new Set(dayShifts.map(s => s.company_employee_id)).size,
      };
    });

    // Procesar empleados con sus turnos
    const employees = employeesData.map(emp => {
      const employeeShifts = shiftsData.filter(shift => shift.company_employee_id === emp.id);
      const weekShifts = days.map(day => ({
        date: day.date,
        shifts: employeeShifts.filter(shift => shift.shift_date === day.date),
      }));

      return {
        ...emp,
        shifts: weekShifts,
      };
    });

    return {
      weekStart: formatDate(weekStart, 'yyyy-MM-dd'),
      weekEnd: formatDate(weekEnd, 'yyyy-MM-dd'),
      days,
      employees,
    };
  }, [shiftsData, employeesData, currentWeek, weekStart, weekEnd]);

  // Navegación de semana
  const navigateWeekCallback = useCallback((direction: 'prev' | 'next') => {
    const newWeek = navigateWeek(new Date(currentWeek), direction);
    setCurrentWeek(formatDate(newWeek, 'yyyy-MM-dd'));
  }, [currentWeek]);

  const goToToday = useCallback(() => {
    const today = new Date();
    const { start } = getWeekRange(today);
    setCurrentWeek(formatDate(start, 'yyyy-MM-dd'));
  }, []);

  const goToWeek = useCallback((date: string) => {
    setCurrentWeek(date);
  }, []);

  const refreshData = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    weekData,
    employees: employeesData || [],
    currentWeek,
    isLoading,
    error: error?.message || null,
    navigateWeek: navigateWeekCallback,
    goToToday,
    goToWeek,
    refreshData,
  };
}
```

### `hooks/shifts/useShiftForm.ts`
```typescript
'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { shiftsApiService } from '@/lib/api/shifts';
import { ShiftFormData, ShiftFormErrors, CreateShiftRequest } from '@/types/shifts/forms';

export function useShiftForm(initialData?: Partial<ShiftFormData>) {
  const [formData, setFormData] = useState<ShiftFormData>({
    company_employee_id: initialData?.company_employee_id || 0,
    shift_date: initialData?.shift_date || '',
    start_time: initialData?.start_time || '',
    end_time: initialData?.end_time || '',
    notes: initialData?.notes || '',
  });

  const [errors, setErrors] = useState<ShiftFormErrors>({});
  const queryClient = useQueryClient();

  // Mutación para crear turno
  const createMutation = useMutation({
    mutationFn: (data: CreateShiftRequest) => shiftsApiService.createShift(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });

  // Mutación para actualizar turno
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateShiftRequest }) => 
      shiftsApiService.updateShift(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });

  const setField = useCallback((field: keyof ShiftFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const setError = useCallback((field: keyof ShiftFormErrors, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: ShiftFormErrors = {};

    if (!formData.company_employee_id) {
      newErrors.company_employee_id = 'Selecciona un empleado';
    }

    if (!formData.shift_date) {
      newErrors.shift_date = 'Selecciona una fecha';
    }

    if (!formData.start_time) {
      newErrors.start_time = 'Selecciona hora de inicio';
    }

    if (!formData.end_time) {
      newErrors.end_time = 'Selecciona hora de fin';
    }

    if (formData.start_time && formData.end_time) {
      if (formData.start_time >= formData.end_time) {
        newErrors.end_time = 'La hora de fin debe ser posterior a la de inicio';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const submit = useCallback(async () => {
    if (!validate()) return;

    try {
      await createMutation.mutateAsync(formData);
      // Reset form on success
      setFormData({
        company_employee_id: 0,
        shift_date: '',
        start_time: '',
        end_time: '',
        notes: '',
      });
    } catch (error) {
      setError('general', 'Error al crear el turno');
    }
  }, [formData, validate, createMutation, setError]);

  const reset = useCallback(() => {
    setFormData({
      company_employee_id: initialData?.company_employee_id || 0,
      shift_date: initialData?.shift_date || '',
      start_time: initialData?.start_time || '',
      end_time: initialData?.end_time || '',
      notes: initialData?.notes || '',
    });
    setErrors({});
  }, [initialData]);

  return {
    formData,
    errors,
    isLoading: createMutation.isPending || updateMutation.isPending,
    setFormData: setField,
    setError,
    clearErrors,
    validate,
    submit,
    reset,
  };
}
```

## 🏪 PASO 3: Store de Turnos

### `stores/shiftsStore.ts`
```typescript
import { create } from 'zustand';
import { ShiftsState, WeekViewData, EmployeeWithShifts, Shift } from '@/types/shifts/store';

export const useShiftsStore = create<ShiftsState>((set, get) => ({
  // Estado inicial
  weekData: null,
  employees: [],
  currentWeek: new Date().toISOString().split('T')[0],
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  filters: {},
  selectedShift: null,
  selectedEmployee: null,
  selectedDate: null,
  showCreateModal: false,
  showEditModal: false,
  showDeleteModal: false,

  // Setters básicos
  setWeekData: (data) => set({ weekData: data }),
  setEmployees: (employees) => set({ employees }),
  setCurrentWeek: (week) => set({ currentWeek: week }),
  setLoading: (loading) => set({ isLoading: loading }),
  setCreating: (creating) => set({ isCreating: creating }),
  setUpdating: (updating) => set({ isUpdating: updating }),
  setDeleting: (deleting) => set({ isDeleting: deleting }),
  setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),
  setSelectedShift: (shift) => set({ selectedShift: shift }),
  setSelectedEmployee: (employeeId) => set({ selectedEmployee: employeeId }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setShowCreateModal: (show) => set({ showCreateModal: show }),
  setShowEditModal: (show) => set({ showEditModal: show }),
  setShowDeleteModal: (show) => set({ showDeleteModal: show }),

  // Acciones de datos
  addShift: (shift) => {
    const state = get();
    if (state.weekData) {
      // TODO: Implementar lógica para agregar turno a weekData
      set({ weekData: { ...state.weekData } });
    }
  },

  updateShift: (shift) => {
    const state = get();
    if (state.weekData) {
      // TODO: Implementar lógica para actualizar turno en weekData
      set({ weekData: { ...state.weekData } });
    }
  },

  removeShift: (shiftId) => {
    const state = get();
    if (state.weekData) {
      // TODO: Implementar lógica para remover turno de weekData
      set({ weekData: { ...state.weekData } });
    }
  },

  refreshWeekData: async () => {
    set({ isLoading: true });
    try {
      // TODO: Implementar refresh de datos
      console.log('Refreshing week data...');
    } finally {
      set({ isLoading: false });
    }
  },

  navigateWeek: (direction) => {
    const state = get();
    const currentDate = new Date(state.currentWeek);
    const newDate = direction === 'next' 
      ? new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000)
      : new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    set({ currentWeek: newDate.toISOString().split('T')[0] });
  },
}));
```

## ✅ Validación

```bash
# Verificar servicios (Windows)
dir lib\api
dir hooks\shifts
dir stores

# Verificar compilación
npx tsc --noEmit

# Verificar que no hay errores
npm run build
```

## 🎯 Resultado

- **Servicios API** para comunicación con backend
- **Hooks personalizados** para lógica de componentes
- **Store Zustand** para estado global
- **Integración React Query** para cache y sincronización
- **Manejo de errores** y estados de carga

**Los servicios están listos** para integrar con componentes.
