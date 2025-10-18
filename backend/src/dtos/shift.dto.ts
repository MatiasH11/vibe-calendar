import { shift, company_employee, user, role } from '@prisma/client';
import { dateTimeToUtcTime } from '../utils/time-conversion.utils';
import { EmployeeResponseDTO, EmployeeMapper } from './employee.dto';

export interface ShiftResponseDTO {
  id: number;
  company_employee_id: number;
  shift_date: string;
  start_time: string; // HH:mm UTC format
  end_time: string;   // HH:mm UTC format
  notes?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
  company_employee?: EmployeeResponseDTO;
}

export const ShiftMapper = {
  fromPrisma(
    shift: shift & {
      company_employee?: company_employee & {
        user?: user;
        role?: role;
      };
    }
  ): ShiftResponseDTO {
    return {
      id: shift.id,
      company_employee_id: shift.company_employee_id,
      shift_date: shift.shift_date.toISOString().split('T')[0],
      start_time: dateTimeToUtcTime(shift.start_time as Date),
      end_time: dateTimeToUtcTime(shift.end_time as Date),
      notes: shift.notes || undefined,
      status: shift.status as 'pending' | 'confirmed' | 'completed' | 'cancelled',
      created_at: shift.created_at.toISOString(),
      company_employee: shift.company_employee
        ? EmployeeMapper.fromPrisma(shift.company_employee)
        : undefined,
    };
  },

  fromPrismaList(
    shifts: Array<
      shift & {
        company_employee?: company_employee & {
          user?: user;
          role?: role;
        };
      }
    >
  ): ShiftResponseDTO[] {
    return shifts.map(shift => ShiftMapper.fromPrisma(shift));
  },
};
