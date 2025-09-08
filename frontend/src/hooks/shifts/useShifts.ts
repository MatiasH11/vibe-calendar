'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shiftsApiService } from '@/lib/shifts';
import { WeekViewData, EmployeeWithShifts, Shift } from '@/types/shifts/shift';
import { getWeekRange, navigateWeek, formatDate, getWeekDays } from '@/lib/dateUtils';
import { es } from 'date-fns/locale';

export function useShifts() {
  const [currentWeek, setCurrentWeek] = useState(() => {
    // Crear fecha actual de forma más explícita
    const now = new Date();
    console.log('🔍 Fecha actual del sistema:', now.toISOString());
    console.log('🔍 Fecha local:', now.toLocaleDateString());
    console.log('🔍 Zona horaria:', Intl.DateTimeFormat().resolvedOptions().timeZone);
    
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    console.log('🔍 Fecha normalizada:', today.toISOString());
    
    const { start } = getWeekRange(today);
    const weekStart = start.toISOString().split('T')[0]; // YYYY-MM-DD
    
    console.log('🔍 Inicializando currentWeek:', {
      now: now.toISOString(),
      today: today.toISOString(),
      weekStart,
      dayOfWeek: today.getDay(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
    
    // Verificar que la semana calculada sea correcta
    const expectedWeekStart = '2025-09-01'; // Lunes 1 de septiembre
    if (weekStart !== expectedWeekStart) {
      console.error('❌ ERROR: currentWeek no se inicializó correctamente');
      console.error('❌ Esperado:', expectedWeekStart);
      console.error('❌ Obtenido:', weekStart);
    } else {
      console.log('✅ currentWeek inicializado correctamente');
    }
    
    return weekStart;
  });

  const queryClient = useQueryClient();

  // Obtener rango de la semana actual
  // Crear la fecha de forma explícita para evitar problemas de zona horaria
  const currentWeekDate = new Date(currentWeek + 'T00:00:00');
  const { start: weekStart, end: weekEnd } = getWeekRange(currentWeekDate);
  
  console.log('🔍 Cálculo de semana:', {
    currentWeek,
    currentWeekDate: currentWeekDate.toISOString(),
    weekStart: weekStart.toISOString().split('T')[0],
    weekEnd: weekEnd.toISOString().split('T')[0]
  });

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
      
      console.log('🔍 Llamando al backend con fechas:', {
        currentWeek,
        weekStart: startDate,
        weekEnd: endDate,
        weekStartObj: weekStart.toISOString(),
        weekEndObj: weekEnd.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
      
      return shiftsApiService.getEmployeesForShifts(
        startDate,
        endDate,
        startDate, // weekStart para compatibilidad
        endDate    // weekEnd para compatibilidad
      );
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Debug logs
  console.log('🔍 Debug useShifts:', {
    currentWeek,
    weekStart: formatDate(weekStart, 'yyyy-MM-dd'),
    weekEnd: formatDate(weekEnd, 'yyyy-MM-dd'),
    employeesData,
    employeesLoading,
    employeesError,
    shiftsData,
    isLoading,
    error
  });

  // Log cuando currentWeek cambie
  useEffect(() => {
    console.log('🔍 currentWeek cambió a:', currentWeek);
    console.log('🔍 Rango de semana calculado:', {
      start: formatDate(weekStart, 'yyyy-MM-dd'),
      end: formatDate(weekEnd, 'yyyy-MM-dd')
    });
  }, [currentWeek, weekStart, weekEnd]);

  console.log('🔍 employeesData length:', employeesData?.length);
  console.log('🔍 employeesData content:', employeesData);
  console.log('🔍 employeesData type:', typeof employeesData);
  console.log('🔍 employeesData is array:', Array.isArray(employeesData));

  // Procesar datos para la vista semanal
  const weekData: WeekViewData | null = useMemo(() => {
    if (!employeesData) return null;

    console.log('🔍 Generando weekData para currentWeek:', currentWeek);
    console.log('🔍 employeesData recibido:', employeesData.length, 'empleados');
    
    // Usar la misma lógica de zona horaria que usamos para weekStart/weekEnd
    const weekDays = getWeekDays(currentWeekDate);
    console.log('🔍 Días de la semana generados:', weekDays.map(d => d.toISOString().split('T')[0]));
    
    // Verificar si los datos de empleados tienen turnos para la semana correcta
    employeesData.forEach((emp, index) => {
      console.log(`🔍 Empleado ${index + 1} (${emp.user?.first_name} ${emp.user?.last_name}):`);
      if (emp.shifts && emp.shifts.length > 0) {
        console.log('  📅 Fechas de turnos:', emp.shifts.map(ws => ws.date));
      } else {
        console.log('  📅 Sin turnos');
      }
    });

    // Los datos ya vienen procesados del backend, solo necesitamos crear los días
    const days = weekDays.map(date => {
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Contar empleados con turnos en este día
      const employeesWithShifts = employeesData.filter(emp => 
        emp.shifts.some(ws => ws.date === dateStr && ws.shifts.length > 0)
      );
      
      console.log(`🔍 Día ${dateStr}: ${employeesWithShifts.length} empleados con turnos`);
      
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
    const currentWeekDate = new Date(currentWeek + 'T00:00:00');
    const newWeek = navigateWeek(currentWeekDate, direction);
    const newWeekStart = newWeek.toISOString().split('T')[0];
    
    console.log('🔍 navigateWeek ejecutado:', {
      direction,
      currentWeek,
      newWeekStart,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
    
    setCurrentWeek(newWeekStart);
  }, [currentWeek]);

  const goToToday = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const { start } = getWeekRange(today);
    const weekStart = start.toISOString().split('T')[0];
    
    console.log('🔍 goToToday ejecutado:', {
      now: now.toISOString(),
      today: today.toISOString(),
      weekStart,
      dayOfWeek: today.getDay(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
    
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
