import { Shift } from './shift';
import { EmployeeWithShifts } from './employee';

export interface WeekViewData {
  weekStart: string; // YYYY-MM-DD
  weekEnd: string;   // YYYY-MM-DD
  days: DayData[];
  employees: EmployeeWithShifts[];
}

export interface DayData {
  date: string; // YYYY-MM-DD
  dayName: string; // Lun, Mar, etc.
  dayNumber: number;
  isToday: boolean;
  isWeekend: boolean;
  shifts: Shift[];
  employeeCount: number;
}

export interface ShiftCell {
  shift: Shift;
  employee: EmployeeWithShifts;
  day: DayData;
  position: {
    row: number;
    column: number;
  };
  style: {
    backgroundColor: string;
    color: string;
    borderColor: string;
  };
}

export interface ShiftGridProps {
  weekData: WeekViewData;
  onShiftClick: (shift: Shift) => void;
  onShiftCreate: (employeeId: number, date: string) => void;
  onShiftUpdate: (shift: Shift) => void;
  onShiftDelete: (shiftId: number) => void;
}
