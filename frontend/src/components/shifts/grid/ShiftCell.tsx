'use client';

import { Shift, EmployeeWithShifts } from '@/types/shifts/shift';
import { DayData } from '@/types/shifts/calendar';
import { formatTime } from '@/lib/dateUtils';
import { ROLE_COLORS } from '@/lib/constants';

interface ShiftCellProps {
  shift: Shift;
  employee: EmployeeWithShifts;
  day: DayData;
  onEdit?: (shift: Shift) => void;
}

export function ShiftCell({ shift, employee, day, onEdit }: ShiftCellProps) {
  const roleColorClass = ROLE_COLORS[employee.role.name as keyof typeof ROLE_COLORS] || ROLE_COLORS.default;
  
  const handleClick = () => {
    if (onEdit) {
      onEdit(shift);
    }
  };

  // Función para formatear el tiempo de manera segura
  const formatShiftTime = (time: string | Date) => {
    try {
      if (typeof time === 'string') {
        // Si es string, verificar si es formato ISO o HH:mm
        if (time.includes('T') && time.includes('Z')) {
          // Es formato ISO, extraer solo la parte de tiempo
          const date = new Date(time);
          return formatTime(date);
        } else {
          // Es formato HH:mm directo
          return time;
        }
      } else if (time instanceof Date) {
        // Si es Date, extraer la parte de tiempo
        return formatTime(time);
      }
      return '--:--';
    } catch (error) {
      console.error('Error formatting time:', error, time);
      return '--:--';
    }
  };

  // Debug: ver qué está llegando del backend
  console.log('🔍 ShiftCell Debug:', {
    shiftId: shift.id,
    start_time: shift.start_time,
    end_time: shift.end_time,
    start_time_type: typeof shift.start_time,
    end_time_type: typeof shift.end_time,
  });

  // Obtener los tiempos formateados
  const startTime = formatShiftTime(shift.start_time);
  const endTime = formatShiftTime(shift.end_time);

  return (
    <div
      className={`${roleColorClass} text-white text-xs p-2 rounded cursor-pointer hover:opacity-80 transition-opacity min-h-[60px] flex flex-col justify-center`}
      onClick={handleClick}
      title={`${employee.user.first_name} ${employee.user.last_name} - ${startTime} a ${endTime}`}
    >
      <div className="font-medium text-center leading-tight">
        {startTime} - {endTime}
      </div>
      <div className="text-xs opacity-90 mt-1 text-center">
        {employee.role.name}
      </div>
      {shift.notes && (
        <div className="text-xs opacity-75 mt-1 truncate text-center">
          {shift.notes}
        </div>
      )}
    </div>
  );
}
