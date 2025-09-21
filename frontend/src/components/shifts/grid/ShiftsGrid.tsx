'use client';

import { WeekViewData, EmployeeWithShifts } from '@/types/shifts/shift';
import { ShiftGridHeader } from './ShiftGridHeader';
import { ShiftGridBody } from './ShiftGridBody';
import { ShiftGridFooter } from './ShiftGridFooter';
import { Loading } from '@/components/ui/loading';

interface ShiftsGridProps {
  weekData: WeekViewData | null;
  employees: EmployeeWithShifts[];
  isLoading: boolean;
  onEditShift?: (shift: any) => void;
  onCreateShift?: (employeeId: number, date: string) => void;
  onRightClick?: (event: React.MouseEvent, shift: any) => void;
}

export function ShiftsGrid({ weekData, employees, isLoading, onEditShift, onCreateShift, onRightClick }: ShiftsGridProps) {
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
      {/* Header con días de la semana - Fijo */}
      <div className="sticky top-0 z-10">
        <ShiftGridHeader days={weekData.days} />
      </div>
      
      {/* Contenedor con scroll para el cuerpo */}
      <div className="max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 scrollbar-thumb-rounded">
        {/* Cuerpo con empleados y turnos */}
        <ShiftGridBody 
          employees={employees} 
          weekData={weekData}
          onEditShift={onEditShift}
          onCreateShift={onCreateShift}
          onRightClick={onRightClick}
        />
      </div>
      
      {/* Footer con suma de horas - Fijo */}
      <div className="sticky bottom-0 z-10">
        <ShiftGridFooter 
          days={weekData.days} 
          employees={employees}
        />
      </div>
    </div>
  );
}
