'use client';

import { DayData } from '@/types/shifts/calendar';
import { formatDate } from '@/lib/dateUtils';

interface ShiftGridHeaderProps {
  days: DayData[];
}

export function ShiftGridHeader({ days }: ShiftGridHeaderProps) {
  return (
    <div className="grid grid-cols-8 bg-gray-50 border-b">
      {/* Columna de empleados */}
      <div className="p-4 font-medium text-gray-700 border-r">
        Empleados
      </div>
      
      {/* Días de la semana */}
      {days.map((day) => (
        <div 
          key={day.date}
          className={`p-4 text-center border-r last:border-r-0 ${
            day.isToday ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
          }`}
        >
          <div className="text-sm font-medium">{day.dayName}</div>
          <div className="text-xs text-gray-500 mt-1">
            {formatDate(new Date(day.date), 'dd/MM')}
          </div>
        </div>
      ))}
    </div>
  );
}
