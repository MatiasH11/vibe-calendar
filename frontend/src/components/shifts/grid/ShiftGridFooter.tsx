'use client';

import { DayData } from '@/types/shifts/calendar';
import { EmployeeWithShifts } from '@/types/shifts/shift';
import { calculateDailyHours, formatHours } from '@/lib/timeUtils';

interface ShiftGridFooterProps {
  days: DayData[];
  employees: EmployeeWithShifts[];
}

export function ShiftGridFooter({ days, employees }: ShiftGridFooterProps) {
  console.log('🔍 ShiftGridFooter recibió:', {
    days,
    employees: employees.map(emp => ({
      id: emp.id,
      name: emp.user?.first_name + ' ' + emp.user?.last_name,
      shifts: emp.shifts
    }))
  });

  // Calcular las horas totales por día
  const dailyHours = calculateDailyHours(employees, days);
  
  console.log('📊 dailyHours calculado:', dailyHours);
  
  // Calcular el total general
  const totalGeneral = dailyHours.reduce((sum, day) => sum + day.totalHours, 0);
  
  console.log('📊 totalGeneral:', totalGeneral);

  return (
    <div className="grid grid-cols-8 bg-gray-100 border-t border-gray-200">
      {/* Columna de total general */}
      <div className="p-4 font-semibold text-gray-800 border-r bg-gray-50">
        <div className="text-sm text-gray-600 mb-1">Total General</div>
        <div className="text-lg font-bold text-blue-600">
          {formatHours(totalGeneral)}
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
          </div>
        );
      })}
    </div>
  );
}
