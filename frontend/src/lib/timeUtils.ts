/**
 * Utilidades para el cálculo de tiempo y duración de turnos
 */

/**
 * Convierte una hora en formato HH:mm a minutos desde medianoche
 * @param timeString - Hora en formato "HH:mm" o ISO string con fecha 1970-01-01 (ej: "14:30" o "1970-01-01T14:30:00.000Z")
 * @returns Número de minutos desde medianoche
 */
export function timeToMinutes(timeString: string): number {
  console.log(`🕐 Convirtiendo tiempo: "${timeString}"`);
  
  if (!timeString || typeof timeString !== 'string') {
    console.error(`❌ Tiempo inválido: "${timeString}"`);
    return 0;
  }
  
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
  if (parts.length !== 2) {
    console.error(`❌ Formato de tiempo inválido: "${timeToProcess}"`);
    return 0;
  }
  
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  
  if (isNaN(hours) || isNaN(minutes)) {
    console.error(`❌ Números inválidos en tiempo: "${timeToProcess}"`);
    return 0;
  }
  
  const totalMinutes = hours * 60 + minutes;
  console.log(`📊 Minutos calculados: ${totalMinutes}`);
  
  return totalMinutes;
}

/**
 * Convierte minutos desde medianoche a formato HH:mm
 * @param minutes - Número de minutos desde medianoche
 * @returns Hora en formato "HH:mm"
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Calcula la duración de un turno en horas
 * @param startTime - Hora de inicio en formato "HH:mm"
 * @param endTime - Hora de fin en formato "HH:mm"
 * @returns Duración en horas (puede ser decimal)
 */
export function calculateShiftDuration(startTime: string, endTime: string): number {
  if (!startTime || !endTime) {
    console.warn('⚠️ calculateShiftDuration: Tiempos inválidos', { startTime, endTime });
    return 0;
  }
  
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  
  if (startMinutes === 0 && endMinutes === 0) {
    console.warn('⚠️ calculateShiftDuration: No se pudieron convertir los tiempos', { startTime, endTime });
    return 0;
  }
  
  // Manejar turnos que cruzan medianoche
  let durationMinutes = endMinutes - startMinutes;
  if (durationMinutes < 0) {
    durationMinutes += 24 * 60; // Agregar 24 horas en minutos
  }
  
  const hours = durationMinutes / 60; // Convertir a horas
  console.log(`⏱️ ${startTime}-${endTime} = ${hours}h`);
  
  return hours;
}

/**
 * Calcula las horas totales de una lista de turnos
 * @param shifts - Array de turnos con start_time y end_time
 * @returns Total de horas
 */
export function calculateTotalHours(shifts: Array<{ start_time: string; end_time: string }>): number {
  return shifts.reduce((total, shift) => {
    return total + calculateShiftDuration(shift.start_time, shift.end_time);
  }, 0);
}

/**
 * Formatea horas para mostrar en el footer
 * @param hours - Número de horas (puede ser decimal)
 * @returns String formateado (ej: "8.5h", "24h")
 */
export function formatHours(hours: number): string {
  if (hours === 0) return '0h';
  
  // Redondear a 1 decimal si es necesario
  const rounded = Math.round(hours * 10) / 10;
  
  // Si es un número entero, no mostrar decimales
  if (rounded % 1 === 0) {
    return `${Math.round(rounded)}h`;
  }
  
  return `${rounded}h`;
}

/**
 * Calcula las horas totales por día para una lista de empleados
 * @param employees - Array de empleados con sus turnos
 * @param days - Array de días de la semana
 * @returns Array con las horas totales por día
 */
export function calculateDailyHours(
  employees: Array<{
    shifts: Array<{
      date: string;
      shifts: Array<{ start_time: string | Date; end_time: string | Date }>;
    }>;
  }>,
  days: Array<{ date: string }>
): Array<{ date: string; totalHours: number }> {
  console.log('🚀 calculateDailyHours INICIANDO');
  console.log('🚀 employees:', employees);
  console.log('🚀 days:', days);
  
  // Verificar que tenemos datos válidos
  if (!employees || !Array.isArray(employees) || employees.length === 0) {
    console.warn('⚠️ calculateDailyHours: No hay empleados o datos inválidos');
    return days.map(day => ({ date: day.date, totalHours: 0 }));
  }

  if (!days || !Array.isArray(days) || days.length === 0) {
    console.warn('⚠️ calculateDailyHours: No hay días o datos inválidos');
    return [];
  }

  console.log('🔍 calculateDailyHours - Empleados:', employees.length);
  console.log('🔍 calculateDailyHours - Días:', days.length);

  // Debug: Mostrar todas las fechas disponibles
  console.log('📅 Fechas de días:', days.map(d => d.date));
  console.log('📅 Total empleados:', employees.length);
  
  employees.forEach((emp, empIndex) => {
    console.log(`👤 Empleado ${empIndex + 1} (${emp.user?.first_name} ${emp.user?.last_name}):`);
    console.log('📅 Fechas de turnos:', emp.shifts.map(ws => ws.date));
    console.log('📅 Total shifts por empleado:', emp.shifts.length);
    
    emp.shifts.forEach((ws, wsIndex) => {
      console.log(`  📅 Shift ${wsIndex + 1} (${ws.date}): ${ws.shifts.length} turnos`);
      if (ws.shifts && ws.shifts.length > 0) {
        ws.shifts.forEach((shift, shiftIndex) => {
          console.log(`    🕐 Turno ${shiftIndex + 1}: ${shift.start_time} - ${shift.end_time}`);
        });
      } else {
        console.log(`    ⚠️ No hay turnos en este shift`);
      }
    });
  });

  const result = days.map(day => {
    console.log(`\n🔍 Procesando día: ${day.date}`);
    
    // Obtener todos los turnos para este día
    const dayShifts = employees.flatMap((employee, empIndex) => {
      if (!employee || !employee.shifts || !Array.isArray(employee.shifts)) {
        console.log(`  ⚠️ Empleado ${empIndex + 1}: No tiene shifts o no es array`);
        return [];
      }
      
      console.log(`  👤 Empleado ${empIndex + 1} (${employee.user?.first_name} ${employee.user?.last_name}): Buscando fecha ${day.date}`);
      
      // Buscar turnos para este día específico
      const employeeDayShifts = employee.shifts.find(ws => {
        if (!ws || !ws.date) {
          console.log(`    ⚠️ Shift inválido:`, ws);
          return false;
        }
        const match = ws.date === day.date;
        console.log(`    🔍 Comparando: "${ws.date}" === "${day.date}" ? ${match}`);
        return match;
      });
      
      if (employeeDayShifts && employeeDayShifts.shifts && Array.isArray(employeeDayShifts.shifts)) {
        console.log(`    ✅ Encontrado: ${employeeDayShifts.shifts.length} turnos`);
        if (day.date === '2025-09-07') {
          console.log(`    🔍 DEBUG DOMINGO - Turnos encontrados:`, employeeDayShifts.shifts);
        }
        return employeeDayShifts.shifts;
      } else {
        console.log(`    ❌ No encontrado o estructura inválida`);
        return [];
      }
    });
    
    console.log(`📊 Total turnos encontrados para ${day.date}: ${dayShifts.length}`);
    
    if (day.date === '2025-09-07') {
      console.log(`🔍 DEBUG DOMINGO - dayShifts:`, dayShifts);
    }
    
    // Convertir start_time y end_time a string si son Date objects
    const normalizedShifts = dayShifts.map((shift, shiftIndex) => {
      if (!shift) {
        console.warn(`⚠️ Turno ${shiftIndex + 1} es null/undefined`);
        return null;
      }
      
      let startTime: string;
      let endTime: string;
      
      // Manejar start_time
      if (typeof shift.start_time === 'string') {
        startTime = shift.start_time;
      } else if (shift.start_time instanceof Date) {
        startTime = shift.start_time.toTimeString().slice(0, 5);
      } else {
        console.warn(`⚠️ Turno ${shiftIndex + 1}: start_time inválido:`, shift.start_time);
        return null;
      }
      
      // Manejar end_time
      if (typeof shift.end_time === 'string') {
        endTime = shift.end_time;
      } else if (shift.end_time instanceof Date) {
        endTime = shift.end_time.toTimeString().slice(0, 5);
      } else {
        console.warn(`⚠️ Turno ${shiftIndex + 1}: end_time inválido:`, shift.end_time);
        return null;
      }
      
      console.log(`🕐 Turno ${shiftIndex + 1}: ${startTime} - ${endTime}`);
      
      return {
        start_time: startTime,
        end_time: endTime
      };
    }).filter(Boolean); // Filtrar valores null
    
    const totalHours = calculateTotalHours(normalizedShifts);
    
    console.log(`📊 Total horas para ${day.date}: ${totalHours} (${normalizedShifts.length} turnos válidos)\n`);
    
    if (day.date === '2025-09-07') {
      console.log(`🔍 DEBUG DOMINGO - normalizedShifts:`, normalizedShifts);
      console.log(`🔍 DEBUG DOMINGO - totalHours:`, totalHours);
    }
    
    return {
      date: day.date,
      totalHours
    };
  });
  
  console.log('🏁 calculateDailyHours TERMINANDO - Resultado:', result);
  return result;
}
