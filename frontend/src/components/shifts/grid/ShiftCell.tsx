'use client';

import { Shift, EmployeeWithShifts } from '@/types/shifts/shift';
import { DayData } from '@/types/shifts/calendar';
import { formatTime } from '@/lib/dateUtils';
import { formatTimeSafe } from '@/lib/timezone-client';
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


  // Obtener los tiempos formateados usando la nueva función segura
  const startTime = formatTimeSafe(shift.start_time);
  const endTime = formatTimeSafe(shift.end_time);

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
