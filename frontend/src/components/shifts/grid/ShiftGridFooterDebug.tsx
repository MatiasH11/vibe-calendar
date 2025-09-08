'use client';

import { DayData } from '@/types/shifts/calendar';
import { EmployeeWithShifts } from '@/types/shifts/shift';
import { calculateDailyHours, formatHours } from '@/lib/timeUtils';

interface ShiftGridFooterDebugProps {
  days: DayData[];
  employees: EmployeeWithShifts[];
}

export function ShiftGridFooterDebug({ days, employees }: ShiftGridFooterDebugProps) {
  console.log('🔍 ShiftGridFooterDebug - Datos recibidos:', {
    days: days?.length || 0,
    employees: employees?.length || 0,
    employeesData: employees,
    daysData: days
  });

  // Verificar estructura de datos
  if (employees && employees.length > 0) {
    console.log('🔍 Primer empleado:', employees[0]);
    if (employees[0].shifts) {
      console.log('🔍 Shifts del primer empleado:', employees[0].shifts);
      if (employees[0].shifts.length > 0) {
        console.log('🔍 Primer shift:', employees[0].shifts[0]);
        if (employees[0].shifts[0].shifts) {
          console.log('🔍 Turnos del primer shift:', employees[0].shifts[0].shifts);
          if (employees[0].shifts[0].shifts.length > 0) {
            console.log('🔍 Primer turno:', employees[0].shifts[0].shifts[0]);
          }
        }
      }
    }
  }

  // Calcular las horas directamente desde los datos mostrados
  const calculateHoursFromDisplayedData = () => {
    const dailyHours = days.map(day => {
      console.log(`\n🔍 Calculando horas para día: ${day.date}`);
      
      // Obtener todos los turnos para este día específico
      const dayShifts = employees.flatMap(employee => {
        const employeeDayShifts = employee.shifts.find(ws => ws.date === day.date);
        return employeeDayShifts?.shifts || [];
      });
      
      console.log(`📊 Turnos encontrados para ${day.date}: ${dayShifts.length}`);
      
      // Calcular horas para este día
      let totalHours = 0;
      dayShifts.forEach(shift => {
        console.log('🔍 Shift original:', shift);
        
        let startTime: string;
        let endTime: string;
        
        // Manejar start_time
        if (typeof shift.start_time === 'string') {
          startTime = shift.start_time;
        } else if (shift.start_time instanceof Date) {
          startTime = shift.start_time.toTimeString().slice(0, 5);
        } else {
          console.warn('⚠️ start_time inválido:', shift.start_time);
          return;
        }
        
        // Manejar end_time
        if (typeof shift.end_time === 'string') {
          endTime = shift.end_time;
        } else if (shift.end_time instanceof Date) {
          endTime = shift.end_time.toTimeString().slice(0, 5);
        } else {
          console.warn('⚠️ end_time inválido:', shift.end_time);
          return;
        }
        
        console.log(`🕐 Tiempos extraídos: ${startTime} - ${endTime}`);
        
        // Calcular duración manualmente
        const startMinutes = timeToMinutes(startTime);
        const endMinutes = timeToMinutes(endTime);
        
        if (startMinutes === 0 && endMinutes === 0) {
          console.warn('⚠️ No se pudieron convertir los tiempos:', { startTime, endTime });
          return;
        }
        
        let durationMinutes = endMinutes - startMinutes;
        if (durationMinutes < 0) {
          durationMinutes += 24 * 60;
        }
        const hours = durationMinutes / 60;
        
        console.log(`🕐 ${startTime}-${endTime} = ${hours}h (${startMinutes}-${endMinutes} min)`);
        totalHours += hours;
      });
      
      console.log(`📊 Total para ${day.date}: ${totalHours}h`);
      return { date: day.date, totalHours };
    });
    
    return dailyHours;
  };

  // Función auxiliar para convertir tiempo a minutos
  const timeToMinutes = (timeString: string): number => {
    if (!timeString || typeof timeString !== 'string') return 0;
    
    let timeToProcess = timeString;
    
    // Si es un ISO string con fecha 1970-01-01, extraer solo la parte de la hora
    if (timeString.includes('1970-01-01T') && timeString.includes('Z')) {
      try {
        const date = new Date(timeString);
        timeToProcess = date.toTimeString().slice(0, 5); // HH:mm
        console.log(`🕐 Tiempo ISO convertido a: "${timeToProcess}"`);
      } catch (error) {
        console.error(`❌ Error al convertir tiempo ISO: "${timeString}"`, error);
        return 0;
      }
    }
    
    const parts = timeToProcess.split(':');
    if (parts.length !== 2) return 0;
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (isNaN(hours) || isNaN(minutes)) return 0;
    return hours * 60 + minutes;
  };

  // Calcular las horas totales por día
  const dailyHours = calculateHoursFromDisplayedData();
  
  // Calcular el total general
  const totalGeneral = dailyHours.reduce((sum, day) => sum + day.totalHours, 0);

  console.log('📊 Resultados del cálculo:', {
    dailyHours,
    totalGeneral
  });

  return (
    <div className="grid grid-cols-8 bg-gray-100 border-t border-gray-200">
      {/* Columna de total general */}
      <div className="p-4 font-semibold text-gray-800 border-r bg-gray-50">
        <div className="text-sm text-gray-600 mb-1">Total General</div>
        <div className="text-lg font-bold text-blue-600">
          {formatHours(totalGeneral)}
        </div>
        <div className="text-xs text-gray-500">
          Debug: {totalGeneral}
        </div>
      </div>
      
      {/* Totales por día */}
      {dailyHours.map((dayData, index) => {
        const day = days[index];
        const isToday = day?.isToday || false;
        
        return (
          <div 
            key={dayData.date}
            className={`p-4 text-center border-r last:border-r-0 ${
              isToday ? 'bg-blue-50' : 'bg-gray-50'
            }`}
          >
            <div className={`text-lg font-bold ${
              isToday ? 'text-blue-700' : 'text-gray-800'
            }`}>
              {formatHours(dayData.totalHours)}
            </div>
            <div className={`text-xs mt-1 ${
              isToday ? 'text-blue-600' : 'text-gray-500'
            }`}>
              {dayData.totalHours > 0 ? 'horas' : 'sin turnos'}
            </div>
            <div className="text-xs text-gray-400">
              Debug: {dayData.totalHours}
            </div>
          </div>
        );
      })}
    </div>
  );
}
