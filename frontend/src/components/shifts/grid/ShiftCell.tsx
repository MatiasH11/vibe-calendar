'use client';

import { Shift, EmployeeWithShifts } from '@/types/shifts/shift';
import { DayData } from '@/types/shifts/calendar';
import { formatTime } from '@/lib/dateUtils';
import { ROLE_COLORS } from '@/lib/constants';

interface ShiftCellProps {
  shift: Shift;
  employee: EmployeeWithShifts;
  day: DayData;
}

export function ShiftCell({ shift, employee, day }: ShiftCellProps) {
  const roleColorClass = ROLE_COLORS[employee.role.name as keyof typeof ROLE_COLORS] || ROLE_COLORS.default;
  
  const handleClick = () => {
    // TODO: Implementar click handler
    console.log('Shift clicked:', shift);
  };

  return (
    <div
      className={`${roleColorClass} text-white text-xs p-2 rounded cursor-pointer hover:opacity-80 transition-opacity`}
      onClick={handleClick}
      title={`${employee.user.first_name} ${employee.user.last_name} - ${shift.start_time} a ${shift.end_time}`}
    >
      <div className="font-medium">
        {formatTime(new Date(`1970-01-01T${shift.start_time}:00`))} - 
        {formatTime(new Date(`1970-01-01T${shift.end_time}:00`))}
      </div>
      <div className="text-xs opacity-90 mt-1">
        {employee.role.name}
      </div>
      {shift.notes && (
        <div className="text-xs opacity-75 mt-1 truncate">
          {shift.notes}
        </div>
      )}
    </div>
  );
}
