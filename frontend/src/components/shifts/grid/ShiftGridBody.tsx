'use client';

import { WeekViewData, EmployeeWithShifts } from '@/types/shifts/shift';
import { ShiftCell } from './ShiftCell';
import { EmptyShiftCell } from './EmptyShiftCell';

interface ShiftGridBodyProps {
  employees: EmployeeWithShifts[];
  weekData: WeekViewData;
}

export function ShiftGridBody({ employees, weekData }: ShiftGridBodyProps) {
  return (
    <div className="divide-y">
      {employees.map((employee) => (
        <div key={employee.id} className="grid grid-cols-8 min-h-[80px]">
          {/* Información del empleado */}
          <div className="p-4 border-r bg-gray-50 flex items-center">
            <div className="flex items-center space-x-3">
              {/* Avatar */}
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm"
                style={{ backgroundColor: employee.role.color }}
              >
                {employee.user.first_name[0]}{employee.user.last_name[0]}
              </div>
              
              {/* Información */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {employee.user.first_name} {employee.user.last_name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {employee.role.name}
                </p>
              </div>
            </div>
          </div>
          
          {/* Celdas de turnos por día */}
          {weekData.days.map((day) => {
            const dayShifts = employee.shifts.find(
              ws => ws.date === day.date
            )?.shifts || [];
            
            return (
              <div key={day.date} className="p-2 border-r last:border-r-0">
                {dayShifts.length > 0 ? (
                  <div className="space-y-1">
                    {dayShifts.map((shift) => (
                      <ShiftCell
                        key={shift.id}
                        shift={shift}
                        employee={employee}
                        day={day}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyShiftCell
                    employeeId={employee.id}
                    date={day.date}
                    roleColor={employee.role.color}
                  />
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
