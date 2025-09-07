'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shiftsApiService } from '@/lib/shifts';
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

  // Query para obtener empleados con turnos de la semana
  const { data: employeesData, isLoading: employeesLoading, error: employeesError } = useQuery({
    queryKey: ['employees-for-shifts', currentWeek],
    queryFn: () => shiftsApiService.getEmployeesForShifts(
      formatDate(weekStart, 'yyyy-MM-dd'),
      formatDate(weekEnd, 'yyyy-MM-dd'),
      formatDate(weekStart, 'yyyy-MM-dd'), // weekStart para compatibilidad
      formatDate(weekEnd, 'yyyy-MM-dd')    // weekEnd para compatibilidad
    ),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Debug logs
  console.log('🔍 Debug useShifts:', {
    employeesData,
    employeesLoading,
    employeesError,
    shiftsData,
    isLoading,
    error
  });

  console.log('🔍 employeesData length:', employeesData?.length);
  console.log('🔍 employeesData content:', employeesData);
  console.log('🔍 employeesData type:', typeof employeesData);
  console.log('🔍 employeesData is array:', Array.isArray(employeesData));

  // Procesar datos para la vista semanal
  const weekData: WeekViewData | null = useMemo(() => {
    if (!employeesData) return null;

    // Los datos ya vienen procesados del backend, solo necesitamos crear los días
    const days = getWeekDays(new Date(currentWeek)).map(date => {
      const dateStr = formatDate(date, 'yyyy-MM-dd');
      
      // Contar empleados con turnos en este día
      const employeesWithShifts = employeesData.filter(emp => 
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
      employees: employeesData,
    };
  }, [employeesData, currentWeek, weekStart, weekEnd]);

  // Debug log después de que weekData esté definido
  console.log('🔍 weekData processed:', weekData ? 'yes' : 'no');

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
    // Invalidar todas las queries relacionadas con turnos
    queryClient.invalidateQueries({ queryKey: ['shifts'] });
    queryClient.invalidateQueries({ queryKey: ['employees-for-shifts'] });
    refetch();
  }, [refetch, queryClient]);

  return {
    weekData,
    employees: employeesData || [],
    currentWeek,
    isLoading: isLoading || employeesLoading,
    error: error?.message || employeesError?.message || null,
    navigateWeek: navigateWeekCallback,
    goToToday,
    goToWeek,
    refreshData,
    // Debug info
    employeesData,
    employeesLoading,
    employeesError,
  };
}
