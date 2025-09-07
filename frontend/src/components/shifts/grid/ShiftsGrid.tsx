'use client';

import { WeekViewData, EmployeeWithShifts } from '@/types/shifts/shift';
import { ShiftGridHeader } from './ShiftGridHeader';
import { ShiftGridBody } from './ShiftGridBody';
import { Loading } from '@/components/ui/loading';

interface ShiftsGridProps {
  weekData: WeekViewData | null;
  employees: EmployeeWithShifts[];
  isLoading: boolean;
}

export function ShiftsGrid({ weekData, employees, isLoading }: ShiftsGridProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-8">
        <div className="flex items-center justify-center">
          <Loading size="lg" />
          <span className="ml-3 text-gray-600">Cargando turnos...</span>
        </div>
      </div>
    );
  }

  if (!weekData) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-8 text-center">
        <p className="text-gray-500">No hay datos de turnos disponibles</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      {/* Header con días de la semana */}
      <ShiftGridHeader days={weekData.days} />
      
      {/* Cuerpo con empleados y turnos */}
      <ShiftGridBody 
        employees={employees} 
        weekData={weekData}
      />
    </div>
  );
}
