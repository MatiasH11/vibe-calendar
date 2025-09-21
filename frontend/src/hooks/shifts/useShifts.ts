'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shiftsApiService } from '@/lib/shifts';
import { WeekViewData, EmployeeWithShifts, Shift } from '@/types/shifts/shift';
import { getWeekRange, navigateWeek, formatDate, getWeekDays } from '@/lib/dateUtils';
import { es } from 'date-fns/locale';

export interface ShiftFilters {
  employeeName: string;
  role: string;
}

export function useShifts() {
  const [filters, setFilters] = useState<ShiftFilters>({
    employeeName: '',
    role: 'all'
  });

  const [currentWeek, setCurrentWeek] = useState(() => {
    // Crear fecha actual de forma más explícita
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const { start } = getWeekRange(today);
    const weekStart = start.toISOString().split('T')[0]; // YYYY-MM-DD
    
    return weekStart;
  });

  const queryClient = useQueryClient();

  // Obtener rango de la semana actual
  // Crear la fecha de forma explícita para evitar problemas de zona horaria
  const currentWeekDate = useMemo(() => new Date(currentWeek + 'T00:00:00'), [currentWeek]);
  const { start: weekStart, end: weekEnd } = getWeekRange(currentWeekDate);

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

  // Query para obtener empleados con turnos de la semana
  const { data: employeesData, isLoading: employeesLoading, error: employeesError } = useQuery({
    queryKey: ['employees-for-shifts', currentWeek],
    queryFn: () => {
      const startDate = formatDate(weekStart, 'yyyy-MM-dd');
      const endDate = formatDate(weekEnd, 'yyyy-MM-dd');
      
      return shiftsApiService.getEmployeesForShifts(
        startDate,
        endDate,
        startDate, // weekStart para compatibilidad
        endDate    // weekEnd para compatibilidad
      );
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });


  // Filtrar empleados según los criterios
  const filteredEmployees = useMemo(() => {
    if (!employeesData) return [];

    return employeesData.filter(employee => {
      // Filtro por nombre
      if (filters.employeeName) {
        const fullName = `${employee.user?.first_name || ''} ${employee.user?.last_name || ''}`.toLowerCase();
        if (!fullName.includes(filters.employeeName.toLowerCase())) {
          return false;
        }
      }

      // Filtro por rol
      if (filters.role && filters.role !== 'all') {
        const employeeRole = employee.role?.name?.toLowerCase() || '';
        if (employeeRole !== filters.role.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [employeesData, filters]);

  // Procesar datos para la vista semanal
  const weekData: WeekViewData | null = useMemo(() => {
    if (!filteredEmployees) return null;

    // Usar la misma lógica de zona horaria que usamos para weekStart/weekEnd
    const weekDays = getWeekDays(currentWeekDate);

    // Los datos ya vienen procesados del backend, solo necesitamos crear los días
    const days = weekDays.map(date => {
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Contar empleados con turnos en este día (usando empleados filtrados)
      const employeesWithShifts = filteredEmployees.filter(emp => 
        emp.shifts.some(ws => ws.date === dateStr && ws.shifts.length > 0)
      );
      
      return {
        date: dateStr,
        dayName: formatDate(date, 'EEE'),
        dayNumber: date.getDate(),
        isToday: dateStr === formatDate(new Date(), 'yyyy-MM-dd'),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        shifts: [], // No necesitamos esto ya que está en shifts
        employeeCount: employeesWithShifts.length,
      };
    });

    return {
      weekStart: formatDate(weekStart, 'yyyy-MM-dd'),
      weekEnd: formatDate(weekEnd, 'yyyy-MM-dd'),
      days,
      employees: filteredEmployees,
    };
  }, [filteredEmployees, weekStart, weekEnd, currentWeekDate]);

  // Navegación de semana
  const navigateWeekCallback = useCallback((direction: 'prev' | 'next') => {
    const currentWeekDate = new Date(currentWeek + 'T00:00:00');
    const newWeek = navigateWeek(currentWeekDate, direction);
    const newWeekStart = newWeek.toISOString().split('T')[0];
    
    setCurrentWeek(newWeekStart);
  }, [currentWeek]);

  const goToToday = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const { start } = getWeekRange(today);
    const weekStart = start.toISOString().split('T')[0];
    
    setCurrentWeek(weekStart);
  }, []);

  const goToWeek = useCallback((date: string) => {
    setCurrentWeek(date);
  }, []);

  const refreshData = useCallback(() => {
    // Invalidar todas las queries relacionadas con turnos
    queryClient.invalidateQueries({ queryKey: ['shifts'] });
    queryClient.invalidateQueries({ queryKey: ['employees-for-shifts'] });
    refetch();
  }, [refetch, queryClient]);

  // Funciones para manejar filtros
  const updateFilters = useCallback((newFilters: Partial<ShiftFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      employeeName: '',
      role: 'all'
    });
  }, []);

  return {
    weekData,
    employees: filteredEmployees || [],
    allEmployees: employeesData || [],
    currentWeek,
    isLoading: isLoading || employeesLoading,
    error: error?.message || employeesError?.message || null,
    navigateWeek: navigateWeekCallback,
    goToToday,
    goToWeek,
    refreshData,
    // Filtros
    filters,
    updateFilters,
    clearFilters,
    // Debug info
    employeesData,
    employeesLoading,
    employeesError,
  };
}
