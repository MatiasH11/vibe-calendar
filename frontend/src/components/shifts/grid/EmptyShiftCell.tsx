'use client';

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
      className="w-full h-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"
      onClick={handleClick}
      title="Hacer clic para crear turno"
    >
      <div className="text-gray-400 text-xs">+</div>
    </div>
  );
}
