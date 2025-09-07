'use client';

import { Plus } from 'lucide-react';

interface EmptyShiftCellProps {
  employeeId: number;
  date: string;
  roleColor: string;
}

export function EmptyShiftCell({ employeeId, date, roleColor }: EmptyShiftCellProps) {
  const handleClick = () => {
    // TODO: Implementar creación de turno
    console.log('Create shift for employee:', employeeId, 'date:', date);
  };

  return (
    <div
      className="w-full h-16 bg-gray-50/30 rounded-lg flex items-center justify-center cursor-pointer group transition-all duration-200 hover:bg-gray-100/50 hover:shadow-sm"
      onClick={handleClick}
      title="Hacer clic para crear turno"
    >
      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <Plus className="w-4 h-4 text-gray-400 group-hover:text-gray-500" />
      </div>
    </div>
  );
}
